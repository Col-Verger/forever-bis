#!/usr/bin/env python3
"""Informational check: can the simulator run any healer spec yet?

A healer needs a defaults file or a build/APL in the simulator repo before our
driver can sim it. Until then the site keeps the Wowhead set. This prints what
is available so a new upstream rotation does not go unnoticed.

    python tools/check_healers.py --forever forever
"""

import argparse, glob, os, sys

HEALERS = ['priest/healer', 'shaman/restoration', 'druid/restoration', 'paladin/holy']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--forever', required=True)
    a = ap.parse_args()
    ready = []
    for spec in HEALERS:
        folder = os.path.join(a.forever, 'ui', 'specs', spec)
        defaults = os.path.exists(os.path.join(folder, 'defaults.siml'))
        builds = glob.glob(os.path.join(folder, 'builds', '*.siml')) + \
                 glob.glob(os.path.join(folder, 'builds', '*.build.json'))
        apls = glob.glob(os.path.join(folder, 'apls', '*.siml')) + \
               glob.glob(os.path.join(folder, 'apls', '*.apl.json'))
        if defaults or builds:
            ready.append(spec)
        print(f'{spec}: defaults={"yes" if defaults else "no"}, '
              f'builds={len(builds)}, apls={len(apls)}')
    print('sim-ready healers:', ', '.join(ready) if ready else 'none yet')
    return 0


if __name__ == '__main__':
    sys.exit(main())
