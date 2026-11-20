#!/usr/bin/env python3
"""Materializes candidate pools from the sim's item database into configs/pools/*.json.

    python tools/make_pools.py --forever ../forever --configs configs

The pool files are REVIEWABLE: every candidate carries its name, quality, item level and
source, so a human can prune the pool by editing configs/<class>.json (excludeIds /
includeIds) and re-running. The per-slot search only ever ranks what the pool holds.

Pool rules are editor decisions in the same spirit as the hunter guide's pools: rules of
thumb (armor type, weapon types, quality, "no raid drops") rather than ground truth.
"""
import argparse, json, os, re, sys

ITEM_TYPE = {'head': 1, 'neck': 2, 'shoulder': 3, 'back': 4, 'chest': 5, 'wrist': 6, 'hands': 7,
             'waist': 8, 'legs': 9, 'feet': 10, 'finger': 11, 'trinket': 12, 'weapon': 13, 'ranged': 14}


def slot_type(slot):
    """The db ItemType for a gear slot name ('finger1'→11, 'main_hand'→13, ...)."""
    if slot.startswith('finger'):
        return 11
    if slot.startswith('trinket'):
        return 12
    if slot in ('main_hand', 'off_hand'):
        return 13
    return ITEM_TYPE.get(slot)


def sources_line(it, zones):
    parts = []
    for s in it.get('sources') or []:
        k, v = next(iter(s.items()))
        if k == 'drop':
            zid = v.get('zoneId')
            parts.append(f"drop: {zones.get(zid, zid)}")
        elif k == 'quest':
            parts.append(f"quest: {v.get('name')}")
        elif k == 'soldBy':
            parts.append(f"vendor: {v.get('npcName')}")
        elif k == 'rep':
            parts.append(f"rep: {v.get('repFactionId')} lvl {v.get('repLevel')}")
        elif k == 'crafted':
            parts.append(f"crafted: {v.get('profession')}")
        elif k == 'pvp':
            parts.append('pvp')
    return ' | '.join(parts[:2]) or '?'


def item_tier(it):
    """Budget tier: 'max' items need a grind (PvP Premier, exalted/revered rep, epic crafts);
    everything else is 'cheap'. Editor-decidable via the config's includeIds/excludeIds."""
    for s in it.get('sources') or []:
        k, v = next(iter(s.items()))
        if k == 'pvp':
            return 'max'
        if k == 'rep' and (v.get('repLevel') or 0) >= 7:
            return 'max'
        if k == 'crafted' and (it.get('quality') or 0) >= 4:
            return 'max'
    return 'cheap'


def matches(item, rule):
    """One anyOf clause (or the rule itself if it has no anyOf)."""
    armor = rule.get('armorType')
    if armor is not None and item.get('armorType') != armor:
        return False
    if 'weaponTypes' in rule and item.get('weaponType') not in rule['weaponTypes']:
        return False
    if 'handTypes' in rule and item.get('handType') not in rule['handTypes']:
        return False
    if 'rangedTypes' in rule and item.get('rangedWeaponType') not in rule['rangedTypes']:
        return False
    return True


def item_matches(item, rule):
    if rule is None:
        return False
    if 'anyOf' in rule:
        return any(matches(item, r) for r in rule['anyOf'])
    return matches(item, rule)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--forever', required=True, help='wowsims/forever checkout')
    ap.add_argument('--configs', default='configs')
    a = ap.parse_args()

    db = json.load(open(os.path.join(a.forever, 'assets/database/db.json'), encoding='utf-8'))
    items = db['items']
    zones = {z['id']: z['name'] for z in db['zones']}

    cfg_files = [f for f in os.listdir(a.configs) if f.endswith('.json') and not f.startswith('_')]
    out_dir = os.path.join(a.configs, 'pools')
    os.makedirs(out_dir, exist_ok=True)

    raid_re = None
    for cf in cfg_files:
        cfg = json.load(open(os.path.join(a.configs, cf), encoding='utf-8'))
        for pool_name, pool in (cfg.get('pools') or {}).items():
            raid_re = re.compile(pool['excludeZoneNamePattern'], re.I)
            raid_zones = {zid for zid, name in zones.items() if raid_re.search(name or '')}
            exclude = set(pool.get('excludeIds') or [])
            include = pool.get('includeIds') or []
            result = {}
            for slot, rule in pool['slots'].items():
                slots = ([slot] if not (slot.startswith('finger') or slot.startswith('trinket'))
                         else [slot.replace('1', '1'), slot.replace('1', '2')])
                t = slot_type(slot)
                cands = []
                for it in items:
                    if it.get('type') != t:
                        continue
                    if not item_matches(it, rule):
                        continue
                    if it.get('quality', 1) < pool.get('qualityMin', 2):
                        continue
                    # Phase 1 only: classic raid items are phase 2 in the sim's database,
                    # so the phase filter is the pre-raid line itself.
                    if it.get('phase', 1) > pool.get('phaseMax', 1):
                        continue
                    # Class-restricted items must allow this class.
                    if pool.get('classId') and (it.get('classAllowlist') or []) and pool['classId'] not in it['classAllowlist']:
                        continue
                    so = it.get('scalingOptions', {}).get('0', {})
                    if so.get('ilvl', 0) < pool.get('ilvlMin', 0):
                        continue
                    if it['id'] in exclude:
                        continue
                    # Raid drops only => out; any non-raid source (or no source at all,
                    # left for human review) => in the pool.
                    srcs = it.get('sources') or []
                    if srcs:
                        raid_only = True
                        for s in srcs:
                            k, v = next(iter(s.items()))
                            if k == 'drop' and v.get('zoneId') in raid_zones:
                                continue
                            raid_only = False
                            break
                        if raid_only:
                            continue
                    cands.append(it)
                cands.sort(key=lambda x: (-(x.get('quality') or 0), -x.get('scalingOptions', {}).get('0', {}).get('ilvl', 0), x['id']))
                cands = cands[:pool.get('maxPerSlot', 14)]
                if include:
                    for iid in include:
                        it = next((x for x in items if x['id'] == iid), None)
                        if it and it not in cands:
                            cands.append(it)
                for s in slots:
                    result[s] = [{'id': it['id'], 'name': it['name'], 'q': it.get('quality', 1),
                                  'ilvl': it.get('scalingOptions', {}).get('0', {}).get('ilvl', 0),
                                  'twoHand': it.get('handType') == 4,
                                  'tier': item_tier(it),
                                  'src': sources_line(it, zones)} for it in cands]
            out = os.path.join(out_dir, f'{pool_name}.pools.json')
            meta = {'generated': 'tools/make_pools.py', 'reviewable': True,
                    'note': 'Pool content is an editor decision; prune via excludeIds in the config and re-run.'}
            json.dump({'_meta': meta, **result}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            total = sum(len(v) for k, v in result.items() if not k.startswith('_'))
            print(f'{out}: {total} candidates over {len(result)} slots')


if __name__ == '__main__':
    sys.exit(main())
