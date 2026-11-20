#!/usr/bin/env python3
"""Data sanity audit over runs/ + configs/pools: finds slots that should have been
filled but are empty (candidates existed), duplicated specials, missing talents and
zero values. Exits 1 when a real problem is found.

    python tools/audit_data.py [--runs runs] [--configs configs] [--forever forever]
"""
import argparse, glob, json, os, re, sys

SLOTS = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet',
         'finger1', 'finger2', 'trinket1', 'trinket2', 'main_hand', 'off_hand', 'ranged']

# WoW quality ids and the colour each must have. The page colours an item name with
# var(--q<quality>), so a shifted palette makes epics look rare.
QUALITY_COLOURS = {0: '#9d9d9d', 1: '#ffffff', 2: '#1eff00', 3: '#0070dd', 4: '#a335ee', 5: '#ff8000'}


def load_json(path):
    return json.load(open(path, encoding='utf-8'))


def run_audit(runs, configs, forever='forever', data=None, css=None):
    """Returns (problems, notes)."""
    pools = {}
    for p in glob.glob(os.path.join(configs, 'pools', '*.pools.json')):
        pools[os.path.basename(p).replace('.pools.json', '')] = load_json(p)

    build_pool = {}
    for cf in glob.glob(os.path.join(configs, '*.json')):
        if os.path.isdir(cf):
            continue
        try:
            cfg = load_json(cf)
        except Exception:
            continue
        for b in cfg.get('builds') or []:
            build_pool[b['id']] = b.get('pool')

    hand_type = {}
    db_items = {}
    try:
        db = load_json(os.path.join(forever, 'assets/database/db.json'))
        hand_type = {it['id']: it.get('handType') for it in db['items']}
        db_items = {it['id']: it for it in db['items']}
    except Exception:
        pass

    problems, notes = [], []
    for gf in sorted(glob.glob(os.path.join(runs, '*.gear.json'))):
        lid = os.path.basename(gf).replace('.gear.json', '')
        budget = 'cheap' if lid.endswith('-cheap') else 'max' if lid.endswith('-max') else None
        if not budget:
            continue
        base = lid[: -len('-' + budget)]
        gear = load_json(gf)
        pool = pools.get(build_pool.get(base) or '') or {}

        for slot in SLOTS:
            v = gear.get(slot)
            if v and v[0]:
                continue
            # An empty off-hand beside a two-hander is the weapon-class rule, not a defect.
            if slot == 'off_hand':
                mh = gear.get('main_hand') or [0]
                if mh[0] and hand_type.get(mh[0]) == 4:
                    notes.append(f'{lid}: off_hand empty by design (two-hander in main hand)')
                    continue
            rows = pool.get(slot) or []
            cands = rows if budget == 'max' else [c for c in rows if c.get('tier') != 'max']
            if cands:
                problems.append(f'{lid}: slot {slot} is EMPTY but {len(cands)} candidates existed '
                                f'(e.g. {", ".join(c["name"] for c in cands[:3])})')
            else:
                notes.append(f'{lid}: slot {slot} empty, pool empty for this budget')

        # Unique items cannot sit in both special slots.
        for pair in (('finger1', 'finger2'), ('trinket1', 'trinket2')):
            ids = [gear.get(s, [0])[0] for s in pair]
            if ids[0] and ids[0] == ids[1]:
                problems.append(f'{lid}: same item id {ids[0]} in {pair[0]} and {pair[1]}')

        mp = os.path.join(runs, f'{lid}.meta.json')
        if os.path.exists(mp):
            meta = load_json(mp)
            if not (meta.get('value') or 0) > 0:
                problems.append(f'{lid}: headline value is {meta.get("value")!r}')
            if not meta.get('talents'):
                notes.append(f'{lid}: no talents in meta')

    if data or css:
        problems += colour_problems(data, css, db_items)

    return problems, notes


def colour_problems(data_path, css_path, db_items):
    """Every item's quality must match the simulator's database and have a palette entry."""
    problems = []

    def hexnorm(h):
        h = (h or '').lower()
        return '#' + ''.join(c * 2 for c in h[1:]) if len(h) == 4 else h

    if not data_path or not os.path.exists(data_path):
        return problems
    m = re.search(r'window\.GUIDE = (\{.*\});', open(data_path, encoding='utf-8').read(), re.S)
    if not m:
        return [f'{data_path}: window.GUIDE not found, item colours cannot be checked']
    items = json.loads(m.group(1)).get('items') or {}

    css = ''
    if css_path and os.path.exists(css_path):
        css = open(css_path, encoding='utf-8').read()
    palette = {}
    for q in QUALITY_COLOURS:
        hit = re.search(rf'--q{q}\s*:\s*(#[0-9a-fA-F]{{3,8}})', css)
        palette[q] = hit.group(1).lower() if hit else None

    missing = set()
    for iid, it in items.items():
        q = it.get('q')
        want = db_items.get(int(iid)) if db_items else None
        if db_items and want is None:
            problems.append(f'item {iid} ({it.get("name")}): not in the simulator database')
        elif want is not None and q != want.get('quality'):
            problems.append(f'item {iid} ({it.get("name")}): quality {q} in data.js, '
                            f'{want.get("quality")} in the simulator database')
        if not isinstance(q, int) or q not in QUALITY_COLOURS:
            problems.append(f'item {iid} ({it.get("name")}): quality {q!r} is not 0..5 — no colour for it')
            continue
        if palette.get(q) is None:
            missing.add(q)
        elif hexnorm(palette[q]) != QUALITY_COLOURS[q]:
            problems.append(f'style.css: --q{q} is {palette[q]}, expected {QUALITY_COLOURS[q]}')
    for q in sorted(missing):
        problems.append(f'style.css: no --q{q} colour for quality {q} (items of that quality are on the page)')
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--runs', default='runs')
    ap.add_argument('--configs', default='configs')
    ap.add_argument('--forever', default='forever')
    ap.add_argument('--data', default='data.js', help='generated data.js: checks every item colour against the sim database')
    ap.add_argument('--css', default='assets/style.css', help='stylesheet: checks the quality palette')
    a = ap.parse_args()

    problems, notes = run_audit(a.runs, a.configs, a.forever, a.data, a.css)
    print(f'audited {len(glob.glob(os.path.join(a.runs, "*.gear.json")))} gear files')
    for n in notes:
        print('  note:', n)
    for p in problems:
        print('  PROBLEM:', p)
    print(f'\nproblems: {len(problems)}, notes: {len(notes)}')
    json.dump({'problems': problems, 'notes': notes},
              open(os.path.join(a.runs, '_audit.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
