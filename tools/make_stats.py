"""Write each run's character stats with the sim's own ComputeStats.

Reads runs/<id>.settings.json and writes runs/<id>.stats.json:
the final stats after gear, enchants, talents, buffs and consumables.
`run_sims.py --statdump <tool>` does this during a run; this script fills in
runs made before the tool existed.

Usage: python tools/make_stats.py --runs runs --statdump statdump.exe
"""
import argparse, glob, json, os, subprocess


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--runs', default='runs')
    ap.add_argument('--statdump', default='statdump.exe')
    a = ap.parse_args()

    done = skipped = failed = 0
    for settings in sorted(glob.glob(os.path.join(a.runs, '*.settings.json'))):
        lid = os.path.basename(settings)[:-len('.settings.json')]
        out = os.path.join(a.runs, lid + '.stats.json')
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(settings):
            skipped += 1
            continue
        proc = subprocess.run([a.statdump, '-in', settings, '-out', out],
                              capture_output=True, text=True, timeout=300)
        if proc.returncode != 0 or not os.path.exists(out):
            print(f'{lid}: failed: {(proc.stderr or proc.stdout).strip()[:200]}')
            failed += 1
            continue
        done += 1

    print(f'stats: {done} written, {skipped} up to date, {failed} failed')
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
