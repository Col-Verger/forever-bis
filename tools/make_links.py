"""Add a WoWSims share link to every run's meta, built from its settings export.

`runs/<id>.settings.json` holds the full sim setup (player, gear, talents, buffs,
rotation). `tools/linkhash` turns that into the same URL the sim's own Link
exporter produces, so the site's "Открыть этот сет в WoWSims" opens the exact
set. `run_sims.py --linkhash <tool>` does this during a run; this script fills
in runs that finished before the tool existed.

Usage: python tools/make_links.py --runs runs --linkhash linkhash.exe
"""
import argparse, glob, json, os, subprocess

from spec_routes import SPEC_ROUTES


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--runs', default='runs')
    ap.add_argument('--linkhash', default='linkhash.exe')
    a = ap.parse_args()

    updated = skipped = failed = 0
    for mp in sorted(glob.glob(os.path.join(a.runs, '*.meta.json'))):
        lid = os.path.basename(mp)[:-len('.meta.json')]
        bid = lid.rsplit('-', 1)[0]
        route = SPEC_ROUTES.get(bid)
        settings = os.path.join(a.runs, lid + '.settings.json')
        if not (route and os.path.exists(settings)):
            print(f'{lid}: no route or no settings export, skipped')
            skipped += 1
            continue
        proc = subprocess.run([a.linkhash, '-in', settings, '-route', route, '-url'],
                              capture_output=True, text=True, timeout=60)
        url = proc.stdout.strip()
        if proc.returncode != 0 or not url:
            print(f'{lid}: failed: {proc.stderr.strip()[:200]}')
            failed += 1
            continue
        meta = json.load(open(mp, encoding='utf-8'))
        meta['simLink'] = url
        json.dump(meta, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        updated += 1

    print(f'links: {updated} updated, {skipped} skipped, {failed} failed')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
