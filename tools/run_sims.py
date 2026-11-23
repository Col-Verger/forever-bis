#!/usr/bin/env python3
"""Per-slot BiS search driver over wowsimcli (WoWSims Forever).

    python tools/run_sims.py --forever ../forever --wowsimcli wowsimcli.exe \
        --configs configs --out runs [--only mage-arcane] [--dry-run | --validate]

For every enabled build in configs/*.json the driver:
  1. resolves the base gear set (mage: protojson gear_sets/*.gear.json; paladin: parses
     the spec's gear_sets/*.gear.siml, resolving name refs against the sim's db.json);
  2. sweeps every slot's candidate pool (configs/pools/<pool>.pools.json, made by
     tools/make_pools.py): a swap is kept only when it beats the sim's margin of error;
     passes repeat until the set stops moving;
  3. re-runs the finished set and each slot's top options at full iterations and writes
     runs/<id>.gear.json / .guide.json / .meta.json (+ .settings.json for verification).

Every number written here comes from a real `wowsimcli sim` run; nothing is estimated.
Mage builds go through protojson RaidSimRequests; paladin builds through generated
.siml "preset build" files loaded over the spec's defaults.siml (so the spec's own
encounter, rotation and settings stay in charge; only `sim:` iterations/seed and the
`gear:` section are ours).

Weapon rule (v1, stated on the site's Method page): a set keeps one weapon class —
a two-hand base only considers two-handers, a one-hand base only one-handers.
"""
import argparse, datetime, json, os, re, subprocess, sys, tempfile, time
from concurrent.futures import ThreadPoolExecutor

from spec_routes import SPEC_ROUTES


def sim_commit(forever):
    """The simulator commit these numbers came from, read from the clone itself."""
    try:
        return subprocess.run(['git', '-C', forever, 'rev-parse', '--short', 'HEAD'],
                              capture_output=True, text=True, timeout=15).stdout.strip()
    except Exception:
        return ''

SLOTS = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet',
         'finger1', 'finger2', 'trinket1', 'trinket2', 'main_hand', 'off_hand', 'ranged']
STAT_IDX = {'strength': 0, 'agility': 1, 'stamina': 2, 'intellect': 3, 'attackPower': 14,
            'hitRating': 17, 'critRating': 18, 'hasteRating': 19, 'blockValue': 24, 'armor': 27,
            'health': 29, 'mana': 30, 'mp5': 31}
CONS_FIELDS = {'flask': ('flaskId', False), 'food': ('foodId', False), 'conjured': ('conjuredId', False),
               'explosive': ('explosiveId', False),
               'mhImbue': ('mhImbueId', False), 'ohImbue': ('ohImbueId', False),
               'mhWeaponImbue': ('mhWeaponImbueId', False), 'ohWeaponImbue': ('ohWeaponImbueId', False),
               'resourcePot': ('resourcePotId', False), 'defensivePot': ('defensivePotId', False),
               'offensivePot': ('offensivePotId', False),
               'elixirs': ('elixirIds', True), 'extras': ('extraIds', True)}


def slug(s):
    return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')


class Db:
    """Name lookups against the sim's assets/database/db.json."""

    def __init__(self, forever):
        db = json.load(open(os.path.join(forever, 'assets/database/db.json'), encoding='utf-8'))
        self.items = db['items']
        self.raw = db
        self.items_by_slug = {}
        for it in db['items']:
            self.items_by_slug.setdefault(slug(it['name']), it)
        self.ench_by_slug = {}
        for e in db['enchants']:
            for key in (slug(e['name']), slug(re.sub(r'^Enchant\s+', '', e['name']))):
                self.ench_by_slug.setdefault(key, e)
        self.suffix_by_slug = {slug(s['name']): s['id'] for s in db['randomSuffixes']}
        self.cons_by_slug = {}
        for c in db.get('consumables') or []:
            self.cons_by_slug.setdefault(slug(c['name']), c)
        # The SIML name table (sim/siml/names.json) is the authoritative slug -> id mapping.
        names = json.load(open(os.path.join(forever, 'sim/siml/names.json'), encoding='utf-8'))
        self.names_items = names.get('items') or {}
        self.names_enchants = names.get('enchants') or {}

    def item(self, iid):
        return next((x for x in self.items if x['id'] == iid), None)

    def resolve_item_name(self, name):
        it = self.items_by_slug.get(slug(name)) or self.cons_by_slug.get(slug(name))
        if not it:
            raise SystemExit(f'cannot resolve item {name!r} in db.json — check configs')
        return it['id']

    def item_by_siml_name(self, s):
        """A SIML item name: the committed name table first, then a plain db slug."""
        if s in self.names_items:
            return self.item(self.names_items[s])
        return self.items_by_slug.get(s)

    def enchant_by_siml_name(self, s):
        e = self.names_enchants.get(s)
        if e:
            return e['effectId']
        e = self.ench_by_slug.get(s)
        return e['effectId'] if e else None

    def is_max_item(self, it):
        """Budget rule, mirroring tools/make_pools.py item_tier: PvP, revered+ rep, epic crafts."""
        if not it:
            return False
        for s in it.get('sources') or []:
            k, v = next(iter(s.items()))
            if k == 'pvp':
                return True
            if k == 'rep' and (v.get('repLevel') or 0) >= 7:
                return True
            if k == 'crafted' and (it.get('quality') or 0) >= 4:
                return True
        return False


def siml_parts(text):
    """Split a .siml into its header lines and named sections, keeping order."""
    header, order, sections = [], [], {}
    cur = None
    for line in text.splitlines():
        m = re.match(r'^([a-z_]+):\s*(?://.*)?$', line)
        if not m:
            m = re.match(r'^([a-z_]+):\s+(\S.*)$', line)  # a section written as one line
        if m:
            cur = m.group(1)
            if cur not in sections:
                sections[cur] = []
                order.append(cur)
            if m.lastindex and m.lastindex > 1:
                sections[cur].append('  ' + m.group(2).strip())
            continue
        if cur is None:
            header.append(line)
        else:
            sections[cur].append(line)
    return header, order, sections


def section_entries(lines):
    """Group a section's lines into entries: one key line plus its continuation lines."""
    entries = []
    for line in lines:
        if not line.strip() or line.strip().startswith('//'):
            continue
        key = line.strip().split()[0] if line.strip() and not line.strip().startswith('//') else ''
        deeper = entries and len(line) - len(line.lstrip()) > 2
        if entries and (deeper or key == ''):
            entries[-1][1].append(line)
        else:
            entries.append((key, [line]))
    return entries


def merge_section(base_lines, build_lines):
    """The build's entries replace the base's entries with the same key, in place."""
    out = section_entries(base_lines)
    index = {k: i for i, (k, _) in enumerate(out) if k}
    for key, lines in section_entries(build_lines):
        if key and key in index:
            out[index[key]] = (key, lines)
        else:
            out.append((key, lines))
    return [line for _, lines in out for line in lines]


ENCOUNTER_SIML = """encounter:
  duration 180
  duration_variation 5
  execute_proportion_20 0.2
  execute_proportion_35 0.35
  targets(id=31146, name="Raid Target", level=63, mob_type=mechanical,
      stats(attack_power=320, block_value=54, armor=3731, health=1428900),
      min_base_damage=2601, damage_spread=0.5, swing_speed=2, parry_haste, can_crush)"""


def preset_layers(path, seen):
    """.siml layers in the order the sim reads them: the file itself, after every
    plain file it includes. `use` of a gear set or an APL is skipped — this driver
    supplies both — and a cycle or a missing include is ignored.
    """
    path = os.path.normpath(path)
    if path in seen:
        return []
    if not os.path.exists(path):
        raise SystemExit(f'missing simulator file: {path}')  # never silently sim something else
    seen.add(path)
    with open(path, encoding='utf-8') as f:
        header, order, sections = siml_parts(f.read())
    layers = []
    for line in header:
        m = re.match(r'^use\s+"([^"]+)"', line.strip())
        if not m:
            continue
        target = m.group(1)
        if 'gear_sets/' in target or '/apls/' in target or target.endswith(('.gear.siml', '.apl.siml')):
            continue
        layers += preset_layers(os.path.join(os.path.dirname(path), target), seen)
    layers.append((header, order, sections))
    return layers


def compose_preset(forever, cfg):
    """The repo's own preset, made runnable on the CLI.

    A preset build file is only a layer: the spec's defaults.siml carries race,
    professions, buffs, debuffs, consumables and the encounter, the build file adds
    its talents, pet, distance and consumables, and a shared buffs.siml may hold the
    raid buffs. The UI merges them all; here every plain include is expanded and the
    layers merged the same way (a later key replaces an earlier one), the preset's own
    gear and APL includes are dropped, and our APL, iterations, encounter and gear are
    added. Nothing is retyped, so a repo change reaches the next run as is.
    """
    folder = os.path.join(forever, cfg['repoFolder'])
    seen = set()
    layers = preset_layers(os.path.join(folder, cfg.get('defaults') or 'defaults.siml'), seen)
    build_path = os.path.join(folder, cfg['presetBuild'])
    layers += preset_layers(build_path, seen)

    head, talents, spec = [], '', ''
    head_seen = set()
    sections, order = {}, []
    for h, layer_order, layer in layers:
        for line in h:
            s = line.strip()
            if not s or s.startswith('//') or s.startswith('use "'):
                continue
            if re.match(r'^siml\s+1$', s):
                continue
            m = re.match(r'^spec\s+(\S+)$', s)
            if m:
                spec = spec or m.group(1)
                continue
            m = re.match(r'^talents\s+"', s)
            if m:
                talents = s  # the last layer wins: a build overrides its defaults
                continue
            if s not in head_seen:
                head_seen.add(s)
                head.append(line)
        for k in layer_order:
            if k in ('sim', 'encounter', 'simple', 'gear'):
                continue
            if k not in sections:
                sections[k] = []
                order.append(k)
            sections[k] = merge_section(sections[k], layer.get(k, []))

    out = ['siml 1', f'spec {spec or cfg.get("specLine", "")}']
    if talents:
        out.append(talents)
    out += head
    out.append('use "{{APL}}"')

    body = []
    for k in order:
        body.append(f'{k}:')
        body += sections[k]
        body.append('')

    return ('\n'.join(out) + '\n\n' + '\n'.join(body) + '\n'
            'sim:\n  iterations {{ITERS}}\n  fixed_rng_seed {{SEED}}\n\n'
            + ENCOUNTER_SIML + '\n\n'
            'gear:\n{{GEAR}}\n')


def parse_gear_siml(path, db):
    """A .gear.siml (or the gear section of an .siml): slot rows as name refs or raw JSON."""
    gear = {}
    in_gear = path.endswith('.gear.siml')
    slot_re = re.compile(r'^(head|neck|shoulder|back|chest|wrist|hands|waist|legs|feet|finger1|finger2|trinket1|trinket2|main_hand|off_hand|ranged)\s+(.+)$')
    for line in open(path, encoding='utf-8'):
        s = line.strip()
        if not s or s.startswith('//') or s == 'siml 1':
            continue
        if s.endswith(':'):
            in_gear = s == 'gear:'
            continue
        if not in_gear:
            continue
        m = slot_re.match(s)
        if not m:
            raise SystemExit(f'{path}: cannot read gear row: {s!r}')
        slot, rest = m.group(1), m.group(2).strip()
        if rest.startswith('`'):
            raw = json.loads(rest.strip('`'))
            gear[slot] = [raw.get('id', 0), raw.get('enchant', 0), raw.get('randomSuffix', 0)]
            continue
        parts = rest.split()
        it = db.item_by_siml_name(parts[0])
        if not it:
            raise SystemExit(f'{path}: no item for name {parts[0]!r} in the name table or db.json')
        spec = [it['id'], 0, 0]
        if '+' in parts:
            eff = db.enchant_by_siml_name(parts[parts.index('+') + 1])
            if eff is None:
                raise SystemExit(f'{path}: no enchant for name {parts[parts.index("+") + 1]!r}')
            spec[1] = eff
        elif len(parts) > 1 and parts[1] in db.suffix_by_slug:
            spec[2] = db.suffix_by_slug[parts[1]]
        gear[slot] = spec
    return gear


def gear_items(gear):
    """EquipmentSpec items array (17 ItemSpecs) from a {slot: [id, ench, sfx]} dict."""
    out = []
    for s in SLOTS:
        v = gear.get(s) or [0, 0, 0]
        out.append({'id': v[0], 'enchant': v[1] or 0, 'randomSuffix': v[2] or 0} if v[0] else {})
    return out


class RunResult:
    def __init__(self, avg, stdev, n, hps=0.0, threat=0.0):
        self.avg, self.stdev, self.n, self.hps, self.threat = avg, stdev, n, hps, threat

    def sem(self):
        return (self.stdev / (self.n ** 0.5)) if self.n else 0.0


def margin(a, b):
    """95% margin of the difference a-b (both real sim runs)."""
    return 1.96 * ((a.sem() ** 2 + b.sem() ** 2) ** 0.5)


class Build:
    def __init__(self, cfg, tpl, forever, db, args):
        self.cfg, self.tpl, self.forever, self.db, self.args = cfg, tpl, forever, db, args
        self.id = cfg['id']
        self.mode = cfg.get('mode', 'protojson')
        self.metric = 'dps'
        self.warnings = []
        self.player_base = None
        if self.mode == 'protojson':
            if cfg.get('buildJson'):                # A full preset build JSON (warlock/shaman/priest): the whole Player protojson
                # rides along — race, professions, consumables, buffs, cooldowns, item swap —
                # staying faithful to the repo file; only gear and sim options are ours.
                bj = json.load(open(os.path.join(forever, cfg['repoFolder'], cfg['buildJson']), encoding='utf-8'))
                pl = bj['player']
                self.player_base = pl
                self.talents = cfg.get('talents') or pl.get('talentsString', '')
                self.raid_buffs = bj.get('raidBuffs') or tpl.get('raidBuffs') or {}
                self.party_buffs = bj.get('partyBuffs') or {}
                self.debuffs = bj.get('debuffs') or {}
                self.individual_buffs = pl.get('buffs') or {}
                self.spec_options = cfg.get('specOptions') or {}
                self.base_gear = {s: [it.get('id', 0), it.get('enchant', 0), it.get('randomSuffix', 0)]
                                  for s, it in zip(SLOTS, (pl.get('equipment') or {}).get('items') or [{}] * 17)}
                self.apl = pl.get('rotation')
                if not cfg.get('talents'):
                    cfg = dict(cfg, talents=pl.get('talentsString', ''))
                    self.cfg = cfg
                self.consumables = cfg.get('consumables') and self.resolve_consumables(cfg['consumables']) or pl.get('consumables') or {}
            else:
                base = json.load(open(os.path.join(forever, cfg['repoFolder'], cfg['baseGear']), encoding='utf-8'))
                self.base_gear = {s: [it.get('id', 0), it.get('enchant', 0), it.get('randomSuffix', 0)]
                                  for s, it in zip(SLOTS, base['items'])}
                self.apl = json.load(open(os.path.join(forever, cfg['repoFolder'], cfg['apls']), encoding='utf-8'))
                self.talents = cfg.get('talents', '')
                self.consumables = self.resolve_consumables(cfg.get('consumables') or tpl.get('consumables') or {})
                self.raid_buffs = cfg.get('raidBuffs') or tpl.get('raidBuffs') or {}
                self.party_buffs = cfg.get('partyBuffs') or tpl.get('partyBuffs') or {}
                self.individual_buffs = cfg.get('individualBuffs') or tpl.get('individualBuffs') or {}
                self.debuffs = cfg.get('debuffs') or tpl.get('debuffs') or {}
                self.spec_options = cfg.get('specOptions') or tpl.get('specOptions') or {}
        else:
            if cfg.get('presetBuild'):
                cfg = dict(cfg, template=compose_preset(forever, cfg))
                self.cfg = cfg
            self.base_gear = parse_gear_siml(os.path.join(forever, cfg['repoFolder'], cfg['baseGear']), db)
            self.base_gear = {s: self.base_gear.get(s, [0, 0, 0]) for s in SLOTS}
            self.apl = None
            # .siml setups keep their talents inside the template string.
            tm = re.search(r'talents "([^"]+)"', cfg.get('template') or '')
            self.talents = cfg.get('talents') or (tm.group(1) if tm else '')

    def resolve_consumables(self, cons):
        out = {}
        for key, names in cons.items():
            if key not in CONS_FIELDS:
                raise SystemExit(f'{self.id}: unknown consumable key {key!r} in configs')
            field, is_list = CONS_FIELDS[key]
            out[field] = [self.db.resolve_item_name(n) for n in names] if is_list else self.db.resolve_item_name(names)
        return out

    def base_is_twohand(self, gear):
        it = self.db.item(gear.get('main_hand', [0])[0])
        return bool(it and it.get('handType') == 4)

    def carry_enchant(self, slot, cand_id, gear):
        """Keep the base enchant only when it fits the candidate (same slot kind)."""
        b = gear.get(slot) or [0, 0, 0]
        if not b[1] or b[0] == cand_id:
            return b[1] if b[0] == cand_id else 0
        bi, ci = self.db.item(b[0]), self.db.item(cand_id)
        if not bi or not ci or bi.get('type') != ci.get('type'):
            return 0
        if bi.get('type') == 13 and bi.get('handType') != ci.get('handType'):
            return 0
        return b[1]

    def candidate_gear(self, gear, slot, cand):
        cg = {k: list(v) for k, v in gear.items()}
        cg[slot] = [cand['id'], self.carry_enchant(slot, cand['id'], gear), cand.get('suffix', 0)]
        if slot == 'main_hand' and cand.get('twoHand'):
            cg['off_hand'] = [0, 0, 0]
        return cg

    def request(self, gear, iters, seed):
        """protojson RaidSimRequest (mage-style path)."""
        enc = self.tpl['encounter']
        t = dict(enc['target'])
        encov = self.cfg.get('encounterOverrides') or {}
        if encov.get('minBaseDamage'):
            t['minBaseDamage'] = encov['minBaseDamage']
        stats = [0.0] * 30
        for k, v in t['stats'].items():
            stats[STAT_IDX[k]] = float(v)
        ov = self.cfg.get('playerOverrides') or {}
        if self.player_base:
            player = dict(self.player_base)
            player['name'] = self.id
            player['equipment'] = {'items': gear_items(gear)}
            player.setdefault('consumables', self.consumables)
            if self.spec_options:
                for k, v in self.spec_options.items():
                    player.setdefault(k, v)
        else:
            player = {
                'name': self.id,
                'class': self.tpl.get('classEnum', 'ClassMage'),
                'race': ov.get('race', self.tpl['race']),
                'equipment': {'items': gear_items(gear)},
                'talentsString': self.cfg['talents'],
                'profession1': self.tpl['professions'][0],
                'profession2': self.tpl['professions'][1],
                'reactionTimeMs': ov.get('reactionTimeMs', self.tpl.get('reactionTimeMs', 0)),
                'channelClipDelayMs': self.tpl.get('channelClipDelayMs', 0),
                'distanceFromTarget': ov.get('distanceFromTarget', self.tpl.get('distanceFromTarget', 0)),
                'consumables': self.consumables,
                'buffs': self.individual_buffs,
                'rotation': self.apl,
                **self.spec_options,
            }
            for k in ('healingModel', 'inFrontOfTarget', 'bonusStats', 'enableItemSwap', 'itemSwap'):
                if k in ov:
                    player[k] = ov[k]
        return {
            'raid': {'parties': [{'players': [player], 'buffs': self.party_buffs}],
                     'buffs': self.raid_buffs, 'debuffs': self.debuffs, 'tanks': ov.get('tanks', [])},
            'encounter': {'duration': enc['duration'], 'durationVariation': enc['durationVariation'],
                          'executeProportion20': enc['executeProportion20'], 'executeProportion35': enc['executeProportion35'],
                          'targets': [{'id': t['id'], 'name': t['name'], 'level': t['level'], 'mobType': t['mobType'],
                                       'stats': stats, 'minBaseDamage': t['minBaseDamage'], 'damageSpread': t['damageSpread'],
                                       'swingSpeed': t['swingSpeed'], 'parryHaste': t['parryHaste'], 'canCrush': t['canCrush']}]},
            'simOptions': {'iterations': iters, 'randomSeed': seed},
            'type': 'SimTypeIndividual',
        }

    def settings_export(self, gear):
        """IndividualSimSettings-style protojson for manual verification (import on wowsims.com)."""
        req = self.request(gear, self.args.final_iterations, self.args.seed)
        p = req['raid']['parties'][0]['players'][0]
        return {'player': p, 'partyBuffs': self.party_buffs, 'raidBuffs': self.raid_buffs,
                'debuffs': self.debuffs, 'encounter': req['encounter'],
                'settings': {'iterations': self.args.final_iterations, 'fixedRngSeed': self.args.seed}}

    def share_link(self, settings_path):
        """A WoWSims URL that opens this exact set (gear, talents, buffs, rotation)."""
        exe = getattr(self.args, 'linkhash', '') or ''
        route = SPEC_ROUTES.get(self.id)
        if not (route and exe and os.path.exists(exe)):
            return None
        try:
            proc = subprocess.run([exe, '-in', settings_path, '-route', route, '-url'],
                                  capture_output=True, text=True, timeout=60)
            if proc.returncode == 0 and proc.stdout.strip():
                return proc.stdout.strip()
            print(f'  share link failed: {proc.stderr.strip()[:200]}', flush=True)
        except Exception as e:
            print(f'  share link failed: {e}', flush=True)
        return None

    def write_stats(self, settings_path, lid):
        """The sim's own ComputeStats for this set → runs/<id>.stats.json."""
        exe = getattr(self.args, 'statdump', '') or ''
        if not (exe and os.path.exists(exe)):
            return
        out = os.path.join(self.args.out, f'{lid}.stats.json')
        try:
            proc = subprocess.run([exe, '-in', settings_path, '-out', out],
                                  capture_output=True, text=True, timeout=300)
            if proc.returncode != 0 or not os.path.exists(out):
                print(f'  stats failed: {(proc.stderr or proc.stdout).strip()[:200]}', flush=True)
        except Exception as e:
            print(f'  stats failed: {e}', flush=True)

    def settings_export_siml(self, gear, tmpdir):
        src = os.path.join(tmpdir, f'{self.id}-export.siml')
        with open(src, 'w', encoding='utf-8') as f:
            f.write(self.siml(gear, self.args.final_iterations, self.args.seed))
        proc = subprocess.run([self.args.wowsimcli, 'siml', 'parse', '-json', src],
                              capture_output=True, text=True, timeout=600)
        if proc.returncode != 0 or not proc.stdout.strip():
            raise RuntimeError(f'{self.id}: siml parse failed ({proc.returncode}):\n{proc.stderr[-1500:]}')
        os.remove(src)
        return json.loads(proc.stdout)

    def siml(self, gear, iters, seed):
        """A full-setup .siml from the build's template: repo APL via use + our sim and gear sections."""
        cfg = self.cfg
        apl = os.path.abspath(os.path.join(self.forever, cfg['repoFolder'], cfg['apls'])).replace('\\', '/')
        rows = []
        for s in SLOTS:
            v = gear.get(s) or [0, 0, 0]
            if not v[0]:
                continue
            spec = {'id': v[0]}
            if v[1]:
                spec['enchant'] = v[1]
            if v[2]:
                spec['randomSuffix'] = v[2]
            rows.append(f"  {s} `{json.dumps(spec, separators=(',', ':'))}`")
        tpl = cfg['template']
        return (tpl.replace('{{APL}}', apl)
                   .replace('{{ITERS}}', str(iters))
                   .replace('{{SEED}}', str(seed))
                   .replace('{{GEAR}}', '\n'.join(rows) + '\n'))

    def run(self, gear, iters, tmpdir, tag):
        if self.mode == 'protojson':
            payload, ext = json.dumps(self.request(gear, iters, self.args.seed), separators=(',', ':')), 'json'
        else:
            payload, ext = self.siml(gear, iters, self.args.seed), 'siml'
        inf = os.path.join(tmpdir, f'{self.id}-{tag}.{ext}')
        outf = os.path.join(tmpdir, f'{self.id}-{tag}.result.json')
        with open(inf, 'w', encoding='utf-8') as f:
            f.write(payload)
        t0 = time.time()
        proc = subprocess.run([self.args.wowsimcli, 'sim', '--infile', inf, '--outfile', outf],
                              capture_output=True, text=True, timeout=1800)
        if proc.returncode != 0 or not os.path.exists(outf):
            raise SystemExit(f'{self.id}/{tag}: wowsimcli failed ({proc.returncode}):\n{proc.stderr[-2000:]}\npayload kept: {inf}')
        res = json.load(open(outf, encoding='utf-8'))
        try:
            unit = res['raidMetrics']['parties'][0]['players'][0]
            r = RunResult(unit['dps']['avg'], unit['dps']['stdev'], res.get('iterationsDone', iters),
                          unit.get('hps', {}).get('avg', 0.0), unit.get('threat', {}).get('avg', 0.0))
        except (KeyError, IndexError, TypeError):
            raise SystemExit(f'{self.id}/{tag}: unexpected result shape:\n{str(res)[:800]}\npayload kept: {inf}')
        os.remove(inf)
        os.remove(outf)
        if r.avg <= 0:
            raise SystemExit(f'{self.id}/{tag}: sim returned {r.avg} DPS — bad setup? payload kept: {inf}')
        if self.args.verbose:
            print(f'    {tag}: {r.avg:.1f} ±{1.96 * r.sem():.1f} ({time.time() - t0:.1f}s)', flush=True)
        return r

    def slots_to_search(self, gear):
        twoh = self.base_is_twohand(gear)
        out = []
        for s in SLOTS:
            if s not in self.pool or not self.pool[s]:
                continue
            # finger2/trinket2 are covered by the finger1/trinket1 sweep — unless they started empty.
            if s in ('finger2', 'trinket2') and gear.get(s) and gear.get(s)[0]:
                continue
            if s == 'off_hand' and (twoh or not gear.get('main_hand', [0])[0]):
                continue
            out.append(s)
        return out

    def candidates(self, slot, gear):
        cur = {gear.get(slot, [0])[0]}
        if slot in ('finger1', 'finger2'):
            cur |= {gear.get('finger1', [0])[0], gear.get('finger2', [0])[0]}
        if slot in ('trinket1', 'trinket2'):
            cur |= {gear.get('trinket1', [0])[0], gear.get('trinket2', [0])[0]}
        mh = self.db.item(gear.get('main_hand', [0])[0])
        twoh = (mh.get('handType') == 4) if mh else None  # no weapon worn: either class may win
        out = []
        for c in self.pool[slot]:
            if c['id'] in cur:
                continue
            if slot == 'main_hand' and twoh is not None and bool(c.get('twoHand')) != twoh:
                continue  # one weapon class per set once a class is worn
            out.append(c)
        return out


def sweep_slot(b, gear, slot, base_res, iters, tmpdir, rows_out, pool):
    """All candidates for one slot against the current set; the best significant swap or None."""
    cands = b.candidates(slot, gear)
    if not cands:
        return None

    def one(cand):
        cg = b.candidate_gear(gear, slot, cand)
        r = b.run(cg, iters, tmpdir, f's-{slot}-{cand["id"]}')
        d, m = r.avg - base_res.avg, margin(base_res, r)
        return cand, cg, d, m, r

    results = list(pool.map(one, cands)) if pool else [one(c) for c in cands]
    best = None
    for cand, cg, d, m, r in results:
        rows_out.append({'slot': slot, 'id': cand['id'], 'enchant': cg[slot][1], 'suffix': cg[slot][2],
                         'd': round(d, 2), 'm': round(m, 2)})
        if d > m and (best is None or d > best[2]):
            best = (cand, cg, d, m)
    return best


def search(b, tmpdir, pool):
    gear = {k: list(v) for k, v in (getattr(b, 'start_gear', None) or b.base_gear).items()}
    rows_out = []
    base_res = b.run(gear, b.args.search_iterations, tmpdir, 'base-0')
    print(f'  base: {base_res.avg:.1f} DPS ({b.args.search_iterations} iters)', flush=True)
    for pass_i in range(b.args.passes):
        moved = False
        print(f'  pass {pass_i + 1}/{b.args.passes}', flush=True)
        for slot in b.slots_to_search(gear):
            best = sweep_slot(b, gear, slot, base_res, b.args.search_iterations, tmpdir, rows_out, pool)
            if best:
                cand, cg, d, m = best
                print(f'    {slot}: {cand.get("name", cand["id"])} +{d:.1f} ±{m:.1f}', flush=True)
                gear = cg
                base_res = b.run(gear, b.args.search_iterations, tmpdir, f'base-{slot}')
                moved = True
        if not moved:
            break
    return gear, rows_out


def finalize(b, gear, rows_out, tmpdir, pool):
    """The finished set at full iterations + each slot's top options, each Δ±m against the set."""
    base = b.run(gear, b.args.final_iterations, tmpdir, 'final-base')
    guide = {}
    for slot in b.slots_to_search(gear):
        seen, ranked = set(), []
        for r in sorted([r for r in rows_out if r['slot'] == slot], key=lambda x: -x['d']):
            if r['id'] in seen:
                continue
            seen.add(r['id'])
            ranked.append(r)
            if len(ranked) >= b.args.topk:
                break

        def final_one(r):
            cg = b.candidate_gear(gear, slot, r)
            res = b.run(cg, b.args.final_iterations, tmpdir, f'f-{slot}-{r["id"]}')
            d = res.avg - base.avg
            return {'move': {slot: [r['id'], cg[slot][1], cg[slot][2]]}, 'd': round(d, 2),
                    'm': round(margin(base, res), 2)}

        rows = list(pool.map(final_one, ranked)) if ranked else []
        if rows:
            guide[slot] = {'base': round(base.avg, 2), 'rows': rows}
        print(f'    {slot}: {len(rows)} options ranked', flush=True)
    return base, guide


def mark_failed(a, build_id, reason):
    """Record a broken build instead of killing its class and the daily publish."""
    reason = ' '.join(str(reason).split())
    json.dump({'status': 'failed', 'reason': reason[:500]},
              open(os.path.join(a.out, f'{build_id}.status.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print(f'{build_id}: FAILED — {reason[:400]}', flush=True)
    return {'id': build_id, 'status': 'failed', 'reason': reason[:400]}


def run_build(bc, tpl, db, a, budgets, pool):
    """Every sim for one build; returns the summary rows it produced."""
    out = []
    b = Build(bc, tpl, a.forever, db, a)
    pools_path = os.path.join(a.configs, 'pools', f"{bc['pool']}.pools.json")
    if not os.path.exists(pools_path):
        raise SystemExit(f'{b.id}: pool file {pools_path} not found — run tools/make_pools.py first')
    full_pool = {k: v for k, v in json.load(open(pools_path, encoding='utf-8')).items() if not k.startswith('_')}

    if a.settings_only:
        tmp = tempfile.mkdtemp(prefix='bis')
        for budget in budgets:
            lid = f'{b.id}-{budget}'
            gp = os.path.join(a.out, f'{lid}.gear.json')
            if not os.path.exists(gp):
                continue
            gear = json.load(open(gp, encoding='utf-8'))
            settings = b.settings_export(gear) if b.mode == 'protojson' else b.settings_export_siml(gear, tmp)
            json.dump(settings, open(os.path.join(a.out, f'{lid}.settings.json'), 'w', encoding='utf-8'), indent=1)
            print(f'{lid}: settings written')
        out.append({'id': b.id, 'status': 'settings-only'})
        return out

    if a.dry_run:
        payload = (json.dumps(b.request(b.base_gear, a.search_iterations, a.seed), indent=1)
                   if b.mode == 'protojson' else b.siml(b.base_gear, a.search_iterations, a.seed))
        ext = 'json' if b.mode == 'protojson' else 'siml'
        p = os.path.join(a.out, f'{b.id}-sample.{ext}')
        open(p, 'w', encoding='utf-8').write(payload)
        print(f'{b.id}: sample payload → {p}')
        out.append({'id': b.id, 'status': 'dry-run'})
        return out

    tmp = tempfile.mkdtemp(prefix='bis')
    if a.validate:
        b.pool = full_pool
        r = b.run(b.base_gear, a.search_iterations, tmp, 'validate')
        print(f'{b.id}: base sim {r.avg:.1f} DPS, hps {r.hps:.1f}, threat {r.threat:.1f}')
        out.append({'id': b.id, 'status': 'validated', 'value': round(r.avg, 1)})
        return out

    for budget in budgets:
        # Cheap: only freely accessible candidates, and a max-tier incumbent
        # (PvP / revered+ rep / epic craft) does not stay worn.
        b.pool = full_pool if budget == 'max' else \
            {slot: [c for c in rows if c.get('tier') != 'max'] for slot, rows in full_pool.items()}
        start_gear = {k: list(v) for k, v in b.base_gear.items()}
        if budget != 'max':
            for slot, spec in start_gear.items():
                if spec and spec[0] and db.is_max_item(db.item(spec[0])):
                    start_gear[slot] = [0, 0, 0]
        b.start_gear = start_gear
        print(f'{b.id}-{budget}: searching ({b.mode}, pool ' +
              str(sum(len(v) for v in b.pool.values())) + ' candidates)', flush=True)
        gear, rows_out = search(b, tmp, pool)
        base, guide = finalize(b, gear, rows_out, tmp, pool)
        lid = f'{b.id}-{budget}'
        json.dump(gear, open(os.path.join(a.out, f'{lid}.gear.json'), 'w', encoding='utf-8'), indent=1)
        json.dump(guide, open(os.path.join(a.out, f'{lid}.guide.json'), 'w', encoding='utf-8'), indent=1)
        meta = {
            'status': 'ok', 'budget': budget, 'metric': b.metric, 'value': round(base.avg, 2),
            'margin': round(1.96 * base.sem(), 2), 'hps': round(base.hps, 1), 'threat': round(base.threat, 1),
            'title': bc.get('title'), 'buildName': bc.get('buildName'), 'rotation': bc.get('rotation'),
            'talents': b.talents, 'iterations': a.final_iterations, 'seed': a.seed,
            'searchIterations': a.search_iterations, 'warnings': b.warnings,
            'simmedAt': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%MZ'),
            'simCommit': sim_commit(a.forever),
        }
        settings_path = os.path.join(a.out, f'{lid}.settings.json')
        try:
            settings = b.settings_export(gear) if b.mode == 'protojson' else b.settings_export_siml(gear, tmp)
            json.dump(settings, open(settings_path, 'w', encoding='utf-8'), indent=1)
            link = b.share_link(settings_path)
            if link:
                meta['simLink'] = link
            b.write_stats(settings_path, lid)
        except SystemExit:
            raise
        except Exception as e:
            print(f'  settings export failed: {e}', flush=True)
        link_path = os.path.join(a.out, f'{b.id}.link.txt')
        if os.path.exists(link_path):  # optional: a WoWSims share link, saved by hand once
            meta['simLink'] = open(link_path, encoding='utf-8').read().strip()
        json.dump(meta, open(os.path.join(a.out, f'{lid}.meta.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        out.append({'id': lid, 'status': 'ok', 'value': meta['value'], 'metric': b.metric})
        print(f'  done: {meta["value"]} {b.metric.upper()}', flush=True)
    return out


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser()
    ap.add_argument('--forever', required=True)
    ap.add_argument('--wowsimcli', required=True)
    ap.add_argument('--configs', default='configs')
    ap.add_argument('--out', default='runs')
    ap.add_argument('--only', action='append', default=[])
    ap.add_argument('--class', action='append', dest='cls_filter', default=[], help='only builds from these configs (e.g. --class mage)')
    ap.add_argument('--budgets', default='max,cheap', help='which budget sets to sim: max,cheap')
    ap.add_argument('--search-iterations', type=int, default=3000)
    ap.add_argument('--final-iterations', type=int, default=12500)
    ap.add_argument('--passes', type=int, default=3)
    ap.add_argument('--topk', type=int, default=8)
    ap.add_argument('--seed', type=int, default=20261120)
    ap.add_argument('--jobs', type=int, default=1)
    ap.add_argument('--dry-run', action='store_true', help='write one sample payload per build and exit (format smoke test)')
    ap.add_argument('--validate', action='store_true', help='run only the base sim of each build')
    ap.add_argument('--settings-only', action='store_true',
                    help='no sims: rewrite runs/<id>.settings.json from the gear already in runs/ (share links)')
    ap.add_argument('--linkhash', default='', help='linkhash binary: also write a WoWSims share link into each meta')
    ap.add_argument('--statdump', default='', help='statdump binary: also write the sim-computed stats to runs/<id>.stats.json')
    ap.add_argument('--verbose', action='store_true')
    a = ap.parse_args()
    if os.path.exists(a.wowsimcli):
        a.wowsimcli = os.path.abspath(a.wowsimcli)  # Linux subprocess needs a path, not a bare name
    only = set(x for part in a.only for x in part.split(',')) if a.only else None

    db = Db(a.forever)
    os.makedirs(a.out, exist_ok=True)
    pool = ThreadPoolExecutor(max_workers=a.jobs) if a.jobs > 1 else None

    all_builds = []
    for cf in sorted(os.listdir(a.configs)):
        if not cf.endswith('.json') or cf.startswith('_'):
            continue
        cfg = json.load(open(os.path.join(a.configs, cf), encoding='utf-8'))
        tpl = dict(cfg.get('playerTemplate') or {})
        tpl['encounter'] = cfg.get('encounter')
        cls = cfg.get('class') or (cf[:-5] if cf.endswith('.json') else cf)
        for bc in cfg.get('builds') or []:
            all_builds.append((bc, tpl, cls))

    budgets = [x.strip() for x in a.budgets.split(',') if x.strip()]
    summary = []
    for bc, tpl, cls in all_builds:
        if only and bc['id'] not in only:
            continue
        if a.cls_filter and cls not in a.cls_filter:
            continue
        if bc.get('disabled'):
            json.dump({'status': 'disabled', 'reason': bc.get('disabledReason', '')},
                      open(os.path.join(a.out, f"{bc['id']}.status.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            summary.append({'id': bc['id'], 'status': 'disabled'})
            print(f"{bc['id']}: disabled — {bc.get('disabledReason', '')}")
            continue
        try:
            summary += run_build(bc, tpl, db, a, budgets, pool)
            status_path = os.path.join(a.out, f"{bc['id']}.status.json")
            if os.path.exists(status_path):
                os.remove(status_path)  # it was a failure note from an earlier run
        except SystemExit as e:
            summary.append(mark_failed(a, bc['id'], str(e)))
        except Exception as e:  # one broken build must not sink the whole class (and the daily publish)
            summary.append(mark_failed(a, bc['id'], f'{type(e).__name__}: {e}'))

    json.dump({'builds': summary}, open(os.path.join(a.out, '_summary.json'), 'w', encoding='utf-8'), indent=1)
    print('summary →', os.path.join(a.out, '_summary.json'))


if __name__ == '__main__':
    sys.exit(main())
