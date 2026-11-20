#!/usr/bin/env python3
"""Builds data.js from the sim runs (tools/run_sims.py) and the sim's item database.

    python tools/build_data.py --forever ../forever --runs runs --configs configs --out data.js [--commit abc123]

Honest data policy: a spec with no run files gets status 'pending' (or 'no-preset' when its
config is disabled) and the site shows its empty state. Nothing is estimated or invented;
the footer pins the sim commit and the date of the runs.
"""
import argparse, datetime, hashlib, json, os, re, urllib.request

STAT = ['Strength', 'Agility', 'Stamina', 'Intellect', 'Healing Power', 'Spell Damage', 'Arcane Damage',
        'Fire Damage', 'Frost Damage', 'Holy Damage', 'Nature Damage', 'Shadow Damage', 'Spell Piercing',
        'Spirit', 'Attack Power', 'Ranged Attack Power', 'Feral Attack Power', '', 'Hit Rating', 'Crit Rating',
        'Haste Rating', 'Armor Penetration', 'Expertise Rating', 'Defense Rating', 'Block Rating', 'Block Value',
        'Dodge Rating', 'Parry Rating', 'Armor', 'Bonus Armor', 'Health', 'Mana', 'Mana per 5 sec.',
        'Arcane Resistance', 'Fire Resistance', 'Frost Resistance', 'Nature Resistance', 'Shadow Resistance',
        'Physical Damage']
TYPE = {1: 'Head', 2: 'Neck', 3: 'Shoulder', 4: 'Back', 5: 'Chest', 6: 'Wrist', 7: 'Hands', 8: 'Waist', 9: 'Legs',
        10: 'Feet', 11: 'Finger', 12: 'Trinket', 13: 'Weapon', 14: 'Ranged'}
ARMOR = {1: 'Cloth', 2: 'Leather', 3: 'Mail', 4: 'Plate'}
WEAPON = {1: 'Axe', 2: 'Dagger', 3: 'Fist Weapon', 4: 'Mace', 5: 'Off Hand', 6: 'Polearm', 7: 'Shield', 8: 'Staff', 9: 'Sword'}
HAND = {1: 'Main Hand', 2: 'One-Hand', 3: 'Off Hand', 4: 'Two-Hand'}
RANGED = {1: 'Bow', 2: 'Crossbow', 3: 'Gun', 4: 'Thrown', 5: 'Wand', 6: 'Idol', 7: 'Libram', 8: 'Totem', 9: 'Sigil'}
SLOT_TYPE = {'head': 1, 'neck': 2, 'shoulder': 3, 'back': 4, 'chest': 5, 'wrist': 6, 'hands': 7, 'waist': 8, 'legs': 9,
             'feet': 10, 'finger1': 11, 'finger2': 11, 'trinket1': 12, 'trinket2': 12, 'main_hand': 13, 'off_hand': 13, 'ranged': 14}
SLOT_ORDER = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet',
              'finger1', 'finger2', 'trinket1', 'trinket2', 'main_hand', 'off_hand', 'ranged']
PROF = {1: 'Alchemy', 2: 'Blacksmithing', 3: 'Enchanting', 4: 'Engineering', 8: 'Leatherworking', 11: 'Tailoring'}
REP = {4: 'Neutral', 5: 'Friendly', 6: 'Honored', 7: 'Revered', 8: 'Exalted'}
DUNGEONS = {1584, 1583, 2017, 2057, 2557, 2100, 1477, 1176, 1337, 722, 491, 796, 209, 719, 721, 1581, 717, 2437, 718,
            16620, 16554, 16842, 17191, 16550, 16919, 16651}
BG_VENDORS = {'Samuel Hawke', 'Rutherford Twing', 'Kelm Hargunth', 'Illiyana Moonblaze', 'Grunnda Wolfheart',
              'Jekyll Flandring', 'Gaelden Hammersmith', 'Thanthaldis Snowgleam'}
BG_REP = {509, 510}
BG_QUESTS = ('Korrak', 'Hero of the Frostwolf', 'Hero of the Stormpike')


def pct(v, per):
    return f'{v / per:g}%'


def loadout_talents(meta, bc, forever):
    """Talents for a loadout: the meta's own, else the .siml template's line, else the
    build JSON's player. Older runs wrote empty talents for .siml/buildJson builds."""
    tal = meta.get('talents', '')
    if not tal:
        tm = re.search(r'talents "([^"]+)"', bc.get('template') or '')
        if tm:
            return tm.group(1)
    if not tal and bc.get('buildJson'):
        try:
            bj = json.load(open(os.path.join(forever, bc['repoFolder'], bc['buildJson']), encoding='utf-8'))
            return bj['player'].get('talentsString', '')
        except Exception:
            return ''
    return tal


def side_of(it):
    if it.get('factionRestriction'):
        return it['factionRestriction']
    fs = {v.get('faction') or v.get('factionId') or 0 for src in it.get('sources') or []
          for v in src.values() if v}
    return fs.pop() if len(fs) == 1 else 0


def sources(it, zones, npcs):
    out, kinds = [], set()
    for s in it.get('sources') or []:
        k, v = next(iter(s.items()))
        if k == 'drop':
            n = npcs.get(v.get('npcId'), {})
            zid = v.get('zoneId') or n.get('zoneId')
            who = n.get('name') or v.get('otherName') or ''
            if any(c in who for c in '"[]()%'):
                who = ''
            if v.get('otherName') == 'World Drop':
                out.append('World drop'); kinds.add('world')
            else:
                where = f' ({zones[zid]})' if zid in zones else ''
                out.append(f'Drop: {who.strip()}{where}' if who.strip() else f'Drop{where}')
                kinds.add('dungeon' if zid in DUNGEONS else 'world')
        elif k == 'quest':
            if v.get('faction') == 1:
                continue
            out.append(f'Quest: {v.get("name")}')
            kinds.add('bg' if any(q in v.get('name', '') for q in BG_QUESTS) else 'quest')
        elif k == 'soldBy':
            if v.get('faction') == 1:
                continue
            out.append(f'Vendor: {v.get("npcName")}' + (f' ({zones[v["zoneId"]]})' if v.get('zoneId') in zones else ''))
            kinds.add('bg' if v.get('npcName') in BG_VENDORS else 'vendor')
        elif k == 'rep':
            out.append(f'Reputation: {v.get("repFactionId")} {REP.get(v.get("repLevel"), "")}'.strip())
            kinds.add('bg' if v.get('repFactionId') in BG_REP else 'rep')
        elif k == 'crafted':
            out.append(f'Crafted: {PROF.get(v.get("profession"), "Profession")}')
            kinds.add('craft')
        elif k == 'pvp':
            kinds.add('bg')
    out = list(dict.fromkeys(out))
    if not out:
        if it.get('randomSuffixOptions'):
            out, kinds = ['World drop (random suffix, Auction House)'], {'world'}
        elif it.get('id', 0) < 200000:
            out, kinds = ['World drop (Auction House)'], {'world'}
        else:
            out, kinds = ['New Forever item: no source in the game files yet'], {'unknown'}
    return out[:4], sorted(kinds)


def green_lines(so):
    st = {int(k): v for k, v in (so.get('stats') or {}).items()}
    green = []
    if st.get(4) or st.get(5):
        green.append(f'Equip: Increases damage and healing done by magical spells and effects by up to {st.get(5, st.get(4, 0))}.')
    for k, name in ((6, 'Arcane'), (7, 'Fire'), (8, 'Frost'), (9, 'Holy'), (10, 'Nature'), (11, 'Shadow')):
        if st.get(k):
            green.append(f'Equip: Increases damage done by {name} spells and effects by up to {st[k]}.')
    if st.get(17):
        green.append(f'Equip: Improves your chance to hit with spells by {pct(st[17], 10)}.')
    if st.get(18):
        green.append(f'Equip: Improves your chance to get a critical strike with spells by {pct(st[18], 14)}.')
    if st.get(19):
        green.append(f'Equip: Decreases the casting time of your spells by {pct(st[19], 10)}.')
    if st.get(14):
        green.append(f'Equip: +{st[14]} Attack Power.')
    if st.get(12):
        green.append(f'Equip: Increases your Spell Piercing by {st[12]}.')
    return green


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--forever', required=True)
    ap.add_argument('--runs', required=True)
    ap.add_argument('--configs', default='configs')
    ap.add_argument('--out', default='data.js')
    ap.add_argument('--commit', default='')
    ap.add_argument('--repo', default='', help='owner/name of this site repo: fills the site\'s Action button link')
    a = ap.parse_args()

    db = json.load(open(os.path.join(a.forever, 'assets/database/db.json'), encoding='utf-8'))
    items = {it['id']: it for it in db['items']}
    zones = {z['id']: z['name'] for z in db['zones']}
    npcs = {n['id']: n for n in db.get('npcs', [])}
    suffixes = {s['id']: s for s in db['randomSuffixes']}
    ench_by_eff = {}
    for e in db['enchants']:
        ench_by_eff.setdefault(e['effectId'], []).append(e)

    icon_cache_path = os.path.join(os.path.dirname(__file__), 'icons.json')
    icon_cache = json.load(open(icon_cache_path, encoding='utf-8')) if os.path.exists(icon_cache_path) else {}

    # Russian item names, fetched once from Wowhead's tooltip API and cached.
    # Custom Forever items stay English (Wowhead returns them untranslated).
    ru_cache_path = os.path.join(os.path.dirname(__file__), 'ru_names.json')
    ru_cache = json.load(open(ru_cache_path, encoding='utf-8')) if os.path.exists(ru_cache_path) else {}

    def ru_name(iid, en_name):
        key = str(iid)
        if key in ru_cache:
            return ru_cache[key]
        try:
            url = f'https://nether.wowhead.com/tooltip/item/{iid}?locale=ru&dataEnv=16'
            req = urllib.request.Request(url, headers={'User-Agent': 'prebis-bis-build'})
            with urllib.request.urlopen(req, timeout=15) as r:
                name = json.load(r).get('name', '')
            ru_cache[key] = name if name and not name.startswith('[') and name != en_name else ''
        except Exception:
            ru_cache[key] = ''
        return ru_cache[key]

    def icon(it):
        if it.get('icon'):
            return it['icon']
        key = str(it['id'])
        if key not in icon_cache:
            try:
                url = f'https://nether.wowhead.com/forever/tooltip/item/{it["id"]}?lvl=60&dataEnv=16'
                req = urllib.request.Request(url, headers={'User-Agent': 'prebis-bis-build'})
                with urllib.request.urlopen(req, timeout=15) as r:
                    icon_cache[key] = json.load(r).get('icon', '')
            except Exception:
                icon_cache[key] = ''
        return icon_cache[key]

    def enchant_label(eid, slot):
        rows = ench_by_eff.get(eid) or []
        t = SLOT_TYPE.get(slot)
        pick = next((e for e in rows if e.get('type') == t), None) or next((e for e in rows if t in (e.get('extraTypes') or [])), None) or (rows[0] if rows else None)
        if not pick:
            return f'Enchant {eid}'
        name = re.sub(r'^Enchant [^-]+ - ', '', pick['name'])
        st = pick.get('stats') or []
        parts = [f'+{v} {n}' for n, v in zip(['Str', 'Agi', 'Sta', 'Int'], st[:4]) if v]
        if len(parts) == 4:
            parts = [f'+{st[1]} all stats']
        for k, lbl in ((5, 'Spell Power'), (4, 'Healing Power'), (31, 'MP5'), (17, 'Hit'), (18, 'Crit')):
            if len(st) > k and st[k]:
                parts.append(f'+{st[k]} {lbl}')
        return name + (f' ({", ".join(parts)})' if parts and not name.startswith('+') else '')

    def spec_l(slot, v):
        return [v[0], v[1] or 0, v[2] or 0, enchant_label(v[1], slot) if v[1] else '']

    def item_data(iid, used_suffixes):
        it = items[iid]
        so = (it.get('scalingOptions') or {}).get('0', {})
        st = {int(k): v for k, v in (so.get('stats') or {}).items()}
        white = [[STAT[k], st[k]] for k in (0, 1, 2, 3) if st.get(k)]
        if st.get(13):
            white.append(['Spirit', st[13]])
        if st.get(31):
            white.append(['Mana per 5 sec.', st[31]])
        green = green_lines(so)
        if it.get('itemEffects'):
            green.append('Has an equip, proc or use effect (see Wowhead).')
        t = it.get('type')
        slot, kind = TYPE.get(t, ''), ''
        if t == 13:
            slot, kind = HAND.get(it.get('handType'), 'Weapon'), WEAPON.get(it.get('weaponType'), '')
        elif t == 14:
            slot, kind = 'Ranged', RANGED.get(it.get('rangedWeaponType'), '')
        elif it.get('armorType') and t not in (2, 11, 12):
            kind = ARMOR.get(it['armorType'], '')
        weapon = None
        if so.get('unroundedDps'):
            weapon = {'min': so.get('weaponDamageMin', 0), 'max': so.get('weaponDamageMax', 0),
                      'speed': it.get('weaponSpeed', 0), 'dps': so.get('unroundedDps', 0)}
        srcs, kinds = sources(it, zones, npcs)
        sfx = {}
        for sid in used_suffixes.get(iid, set()):
            s = suffixes[sid]
            sfx[sid] = [[STAT[i] if i < len(STAT) else f'stat {i}', round(x * so.get('randPropPoints', 0) / 10000)]
                        for i, x in enumerate(s['stats']) if x]
        return {'name': it['name'], 'name_ru': ru_name(iid, it['name']), 'q': it.get('quality', 1), 'ilvl': so.get('ilvl', 0), 'icon': icon(it),
                'slot': slot, 'kind': kind, 'armor': st.get(27, 0), 'white': white, 'green': green, 'weapon': weapon,
                'set': it.get('setName', ''), 'unique': bool(it.get('unique')),
                'side': {1: 'Alliance', 2: 'Horde'}.get(side_of(it), ''), 'sources': srcs, 'kinds': kinds,
                'suffixStats': sfx}

    # ---------- configs & runs ----------
    classes_cfg = []
    used_items, used_suffixes, loadouts = set(), {}, {}
    statuses = {}
    values = {}  # (id, budget) -> headline value, for the "vs other budget" fact
    for cf in sorted(os.listdir(a.configs)):
        if not cf.endswith('.json') or cf.startswith('_'):
            continue
        cfg = json.load(open(os.path.join(a.configs, cf), encoding='utf-8'))
        cls_id = cfg.get('class') or cf[:-5]
        cls_name = cfg.get('className') or {'ru': cls_id.capitalize(), 'en': cls_id.capitalize()}
        cls_specs = []
        for bc in cfg.get('builds') or []:
            bid = bc['id']
            status = 'ok'
            if bc.get('disabled'):
                status = 'no-preset'
            else:
                found_budget = False
                for budget in ('max', 'cheap'):
                    if os.path.exists(os.path.join(a.runs, f'{bid}-{budget}.meta.json')) or \
                       (budget == 'max' and os.path.exists(os.path.join(a.runs, f'{bid}.meta.json'))):
                        found_budget = True
                if not found_budget:
                    status = 'pending'
            statuses[bid] = status
            spec = {
                'id': bc['id'].split('-', 1)[1], 'prefix': bid,
                'metric': bc.get('metric', 'dps'),
                'name': bc.get('title'), 'build': bc.get('buildName'), 'rotation': bc.get('rotation'),
                'note': {'ru': bc.get('disabledReason', '') if bc.get('disabled') else '', 'en': ''},
            }
            if status == 'no-preset':
                spec['status'] = 'no-preset'
            cls_specs.append(spec)
            if status != 'ok':
                continue
            for budget in ('max', 'cheap'):
                lid = f'{bid}-{budget}'
                mp = os.path.join(a.runs, f'{lid}.meta.json')
                legacy = budget == 'max' and not os.path.exists(mp)
                if legacy:
                    mp = os.path.join(a.runs, f'{bid}.meta.json')
                if not os.path.exists(mp):
                    continue
                meta = json.load(open(mp, encoding='utf-8'))
                gp = os.path.join(a.runs, (f'{bid}.gear.json' if legacy else f'{lid}.gear.json'))
                jgp = os.path.join(a.runs, (f'{bid}.guide.json' if legacy else f'{lid}.guide.json'))
                gear = json.load(open(gp, encoding='utf-8'))
                guide = json.load(open(jgp, encoding='utf-8'))
                full = {s: spec_l(s, v) for s, v in gear.items() if v and v[0]}
                groups = []
                for gslot in SLOT_ORDER:
                    if gslot not in guide or gslot not in gear or not gear[gslot][0]:
                        continue
                    rows = []
                    for r in (guide[gslot].get('rows') or []):
                        move = {s: spec_l(s, v) for s, v in r['move'].items() if v and v[0]}
                        if not move:
                            continue
                        rows.append({'move': move, 'd': round(r['d'], 2), 'm': round(r['m'], 2)})
                    groups.append({'id': gslot, 'best': {gslot: spec_l(gslot, gear[gslot])}, 'rows': rows})
                loadouts[lid] = {
                    'title': meta.get('title'), 'build': meta.get('buildName'), 'rotation': meta.get('rotation'),
                    'metric': meta.get('metric', 'dps'), 'budget': budget,
                    'value': meta.get('value'), 'margin': meta.get('margin'),
                    'talents': loadout_talents(meta, bc, a.forever),
                    'simLink': meta.get('simLink'),
                    'gear': full, 'groups': groups,
                }
                values[(bid, budget)] = meta.get('value')
                for s, sp in full.items():
                    used_items.add(sp[0])
                    if sp[2]:
                        used_suffixes.setdefault(sp[0], set()).add(sp[2])
                for gr in groups:
                    for r in gr['rows']:
                        for s, sp in r['move'].items():
                            used_items.add(sp[0])
                            if sp[2]:
                                used_suffixes.setdefault(sp[0], set()).add(sp[2])
        classes_cfg.append({'id': cls_id, 'name': cls_name, 'specs': cls_specs})

    # The "vs other budget" fact: honest both ways.
    for (bid, budget), val in list(values.items()):
        other = 'cheap' if budget == 'max' else 'max'
        oval = values.get((bid, other))
        if oval is None:
            continue
        diff = round((val - oval), 1)
        if budget == 'max':
            loadouts[f'{bid}-max']['vsOther'] = {'ru': f'«Дёшево» отстаёт на {abs(diff)}', 'en': f'Cheap is {abs(diff)} behind'}
        else:
            loadouts[f'{bid}-cheap']['vsOther'] = {'ru': f'«Максимум» даёт +{abs(diff)}', 'en': f'Max adds +{abs(diff)}'}

    has_data = bool(loadouts)
    today = datetime.date.today().isoformat()

    # ---------- prose ----------
    howto = {
        'ru': ('<h2>Как одеваться</h2><p>Симы уже расставили всё за тебя: каждая строка карточек — реальный прогон. '
               'Принципы чтения:</p><ul>'
               '<li>Сначала кап меткости заклинаний (16% против босса 63 уровня; талант Точность считается).</li>'
               '<li>Дальше не смотри на «стат-приоритет из головы» — открой слот: полосы показывают, что реально даёт каждый предмет против лучшего.</li>'
               '<li>Всё внутри светлой полосы вокруг лучшей линии — то же значение с точки зрения сима: бери, что уже есть.</li>'
               '<li>Оружие и палочка/либрам — тоже строки карточек: их вклад измерен, а не угадан.</li></ul>'),
        'en': ('<h2>How to gear</h2><p>The sims did the ranking: every card row is a real run. The honest '
               'principles:</p><ul>'
               '<li>Reach the spell hit cap first (16% against a level 63 boss; Precision counts).</li>'
               '<li>Do not follow a stat priority from memory — open the slot: the bars show what each item is actually worth against the best.</li>'
               '<li>Anything inside the shading around the best line is the same value as the best: wear what you have.</li>'
               '<li>Weapons and wand/libram are card rows too: measured, not guessed.</li></ul>'),
    }
    method = {
        'ru': ('<h2>Откуда числа</h2><p>Каждая цифра — прогон <a href="https://www.wowsims.com/forever/" target="_blank" rel="noopener">WoWSims Forever</a>: '
               '180 секунд, один босс 63 уровня, рейд-буфы, расходники и ротации из пресетов самого симулятора, фиксированное зерно рандома. '
               'Поиск: каждый слот перебирает свой пул кандидатов (configs/pools, порезанный руками); замена принимается, '
               'только если выигрыш больше погрешности сима (95%-й доверительный интервал); проходы повторяются, пока сет не перестаёт меняться. '
               'Затем сет и топ опций каждого слота прогоняются на полном числе итераций, и каждая строка получает Δ ± погрешность против лучшей. '
               'Оружие: сет держит один класс оружия (двуручный сет смотрит только двуручки и наоборот). '
               'Что не прогнано — показано как не прогнанное; выдуманных чисел на странице нет.</p>'),
        'en': ('<h2>Where the numbers come from</h2><p>Every number is a <a href="https://www.wowsims.com/forever/" target="_blank" rel="noopener">WoWSims Forever</a> run: '
               '180 seconds, one level 63 boss, the raid buffs, consumables and rotation of the sim\'s own presets, a fixed random seed. '
               'Search: each slot sweeps its candidate pool (configs/pools, hand-pruned); a swap is kept only when it beats the sim\'s margin (95% confidence); '
               'passes repeat until the set stops moving. The finished set and each slot\'s top options then run at full iterations, '
               'and every row carries Δ ± margin against the best. Weapons: a set keeps one weapon class. '
               'What was not simmed is shown as not simmed — no invented numbers anywhere on this page.</p>'),
    }
    if not has_data:
        method['ru'] += '<p><b>Сейчас на странице нет чисел: прогоны ещё не сделаны.</b></p>'
        method['en'] += '<p><b>There are no numbers on this page yet: the runs have not been made.</b></p>'

    footer = {
        'ru': (f'Числа — прогон WoWSims Forever от {today}' + (f', коммит {a.commit}' if a.commit else '') +
               '. Данные предметов — из базы симулятора; ссылки ведут на Wowhead.'),
        'en': (f'Simmed with WoWSims Forever on {today}' + (f' (commit {a.commit})' if a.commit else '') +
               '. Item data from the sim\'s database; links go to Wowhead.'),
    }
    footer_norun = {
        'ru': 'Каждая цифра появится здесь только после реального прогона WoWSims Forever; дата и хеш коммита сима будут прошиты здесь.',
        'en': 'Every number on this page comes from a real WoWSims Forever run, with the sim\'s commit hash and date stamped here.',
    }

    data = {
        'meta': {
            'hasData': has_data, 'simmed': today if has_data else '', 'simCommit': a.commit,
            'simRepo': 'wowsims/forever',
            'repoUrl': f'https://github.com/{a.repo}' if a.repo else '',
            'workflowUrl': f'https://github.com/{a.repo}/actions/workflows/resim.yml' if a.repo else '',
            'staleAfterDays': 7,
            'lede': {'ru': 'WoW Forever · Фаза 1 · пререйд-BiS по симам для каждого класса и спека',
                     'en': 'WoW Forever · Phase 1 · simmed pre-raid best in slot for every class and spec'},
            'target': {'ru': 'Сим: одиночный босс 63 уровня, 180 секунд, буфы и расходники из пресетов сима.',
                       'en': 'One level 63 boss, 180 seconds, the sim presets\' buffs and consumables.'},
            'footer': footer if has_data else footer_norun,
        },
        'classes': classes_cfg,
        'loadouts': loadouts,
        'items': {str(i): item_data(i, used_suffixes) for i in sorted(used_items)},
        'suffixes': {str(sid): suffixes[sid]['name'] for sid in suffixes},
        'howto': howto,
        'method': method,
    }

    with open(a.out, 'w', encoding='utf-8') as f:
        f.write('// Generated by tools/build_data.py. Do not edit by hand.\n')
        f.write('window.GUIDE = ')
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')

    json.dump(icon_cache, open(icon_cache_path, 'w', encoding='utf-8'), indent=1, sort_keys=True)
    json.dump(ru_cache, open(ru_cache_path, 'w', encoding='utf-8'), indent=1, sort_keys=True)

    # cache-bust the data script tag in index.html
    index = os.path.join(os.path.dirname(os.path.abspath(a.out)), 'index.html')
    if os.path.exists(index):
        digest = hashlib.sha256(open(a.out, 'rb').read()).hexdigest()[:10]
        html = open(index, encoding='utf-8').read()
        html = re.sub(r'data\.js\?v=[0-9a-zA-Z]+', f'data.js?v={digest}', html)
        open(index, 'w', encoding='utf-8').write(html)

    print(f'wrote {a.out}: {len(used_items)} items, {len(loadouts)} loadouts, hasData={has_data}')
    for bid, st in statuses.items():
        print(f'  {bid}: {st}')


if __name__ == '__main__':
    main()
