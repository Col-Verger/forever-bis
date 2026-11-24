#!/usr/bin/env python3
"""Tell Bing and Yandex that the published pages changed.

Google has no public ping endpoint any more, so it needs Search Console;
IndexNow covers the search engines that still accept a push. The key file
served at the site root proves we own the host. Never fails the deploy: the
site is already live, and a search-engine hiccup must not mark it broken.

    python tools/indexnow.py [--dry-run]
"""

import argparse
import json
import re
import sys
import urllib.request

HOST = 'col-verger.github.io'
SITE = f'https://{HOST}/forever-bis/'
KEY = '4042d4ecf9b43060cde68b83d8e1f2b4'
KEY_URL = f'{SITE}{KEY}.txt'
SITEMAP = f'{SITE}sitemap.xml'
ENDPOINT = 'https://api.indexnow.org/indexnow'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'forever-bis-indexnow/1.0'})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.status, r.read().decode('utf-8', 'replace')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()

    try:
        status, body = get(KEY_URL)
        if status != 200 or KEY not in body:
            print(f'IndexNow: key file is not live at {KEY_URL} (status {status}); skipped')
            return 0
        status, xml = get(SITEMAP)
        urls = re.findall(r'<loc>([^<]+)</loc>', xml)
        if not urls:
            print('IndexNow: sitemap has no URLs; skipped')
            return 0
        print(f'IndexNow: submitting {len(urls)} URLs from {SITEMAP}')
        if args.dry_run:
            for u in urls:
                print('  ', u)
            return 0
        payload = json.dumps({
            'host': HOST,
            'key': KEY,
            'keyLocation': KEY_URL,
            'urlList': urls,
        }).encode('utf-8')
        req = urllib.request.Request(
            ENDPOINT, data=payload,
            headers={'Content-Type': 'application/json; charset=utf-8',
                     'User-Agent': 'forever-bis-indexnow/1.0'})
        with urllib.request.urlopen(req, timeout=25) as r:
            print(f'IndexNow: {r.status} {r.read().decode("utf-8", "replace")[:200]}')
    except Exception as exc:  # noqa: BLE001 - the deploy must not fail because of this
        print(f'IndexNow: skipped ({exc})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
