#!/usr/bin/env python3
"""Static pages for search engines: one real URL per spec, with the BiS set inside.

The app is a single page with hash routes, which crawlers see as one URL with no
content of its own. This tool turns data.js into plain HTML pages under spec/,
plus a spec index and sitemap.xml, so every spec has a title, a description and
the actual set in the markup. The pages link back to the interactive app.

    python tools/make_pages.py --data data.js --out . --base https://col-verger.github.io/forever-bis
"""

import argparse, datetime, html, json, os, sys

SLOT_RU = {
    'head': 'Голова', 'neck': 'Шея', 'shoulder': 'Плечи', 'back': 'Спина', 'chest': 'Грудь',
    'wrist': 'Запястья', 'hands': 'Кисти', 'waist': 'Пояс', 'legs': 'Ноги', 'feet': 'Ступни',
    'finger1': 'Кольцо 1', 'finger2': 'Кольцо 2', 'trinket1': 'Аксессуар 1', 'trinket2': 'Аксессуар 2',
    'main_hand': 'Правая рука', 'off_hand': 'Левая рука', 'ranged': 'Дальний бой',
}
SLOT_ORDER = list(SLOT_RU)
QCOL = {0: '#9d9d9d', 1: '#ffffff', 2: '#1eff00', 3: '#0070dd', 4: '#a335ee', 5: '#ff8000'}

esc = lambda s: html.escape(str(s if s is not None else ''), quote=True)


def fmt_num(v):
    try:
        return f'{round(float(v)):,}'.replace(',', '\u202f')
    except (TypeError, ValueError):
        return '—'


def fmt_date(iso):
    if not iso:
        return ''
    try:
        d = datetime.date.fromisoformat(iso[:10])
        return f'{d.day:02d}.{d.month:02d}.{d.year}'
    except ValueError:
        return iso[:10]


def load_data(path):
    s = open(path, encoding='utf-8').read()
    marker = 'window.GUIDE = '
    i = s.index(marker)
    return json.loads(s[i + len(marker):].rstrip().rstrip(';'))


def pick_loadout(G, sp):
    for suffix in ('-max', '-cheap', '-wowhead'):
        L = G['loadouts'].get(sp['prefix'] + suffix)
        if L:
            return L
    return G['loadouts'].get(sp['prefix'])


def stat_value(s):
    v = s.get('v')
    if s.get('pct'):
        return f'{float(v):.1f}%'
    return fmt_num(v)


CSS = """
:root{--bg:#10131a;--bg2:#171b24;--bg3:#1f242f;--line:#2a3040;--fg:#e8eaf0;--mut:#a6adbd;--mut2:#7c8496;--acc:#ff7d0a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 Inter,system-ui,Segoe UI,Roboto,sans-serif}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:980px;margin:0 auto;padding:0 18px}
header.top{border-bottom:1px solid var(--line);background:var(--bg2)}
header.top .wrap{display:flex;gap:14px;align-items:center;padding:12px 18px;flex-wrap:wrap}
.brand{font:700 15px/1 Oswald,Inter,sans-serif;letter-spacing:.6px;text-transform:uppercase}
.brand a{color:var(--fg)}
.tag{font-size:11px;color:var(--mut2);border:1px solid var(--line);border-radius:999px;padding:2px 8px}
main{padding:26px 0 10px}
h1{font:600 30px/1.2 Oswald,Inter,sans-serif;margin:0 0 8px}
h2{font:600 20px/1.3 Oswald,Inter,sans-serif;margin:26px 0 4px;color:var(--acc)}
.lede{color:var(--mut);margin:0 0 16px;max-width:70ch}
.crumb{font-size:12.5px;color:var(--mut2);margin:0 0 12px}
.stats{display:flex;flex-wrap:wrap;gap:8px 20px;margin:0 0 20px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--bg2)}
.stats span{white-space:nowrap;color:var(--mut)}
.stats b{color:var(--fg)}
table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:11px;letter-spacing:.6px;text-transform:uppercase;color:var(--mut2);background:var(--bg3)}
td.slot{color:var(--mut2);font-size:11px;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
td .en{display:block;color:var(--mut2);font-size:11.5px}
td .src{display:block;color:var(--mut);font-size:12px}
.btn{display:inline-block;margin:18px 8px 0 0;padding:9px 14px;border:1px solid var(--line);border-radius:9px;background:var(--bg3);color:var(--fg);font-weight:600}
.btn.primary{background:var(--acc);border-color:var(--acc);color:#10131a}
.note{color:var(--mut2);font-size:12.5px;margin:20px 0 0;max-width:80ch}
footer{border-top:1px solid var(--line);margin-top:34px;padding:16px 0 30px;color:var(--mut2);font-size:12.5px}
.badge{display:inline-block;font-size:11px;color:#10131a;background:#ffd100;border-radius:999px;padding:2px 8px;font-weight:700;vertical-align:middle}
.gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin:14px 0}
.gr a{display:block;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg2);color:var(--fg)}
.gr a span{display:block;color:var(--mut2);font-size:12px}
@media(max-width:640px){h1{font-size:24px}th,td{padding:6px 7px}}
"""


def page_head(title, desc, canonical, date_iso, extra=''):
    ld = {
        '@context': 'https://schema.org', '@type': 'WebPage',
        'name': title, 'description': desc, 'url': canonical, 'inLanguage': 'ru',
        'isPartOf': {'@type': 'WebSite', 'name': 'Pre-raid BiS · WoW Forever', 'url': BASE + '/'},
    }
    if date_iso:
        ld['dateModified'] = date_iso
    return f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Pre-raid BiS · WoW Forever">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:locale" content="ru_RU">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<style>{CSS}</style>
</head>
<body>
<header class="top"><div class="wrap">
  <span class="brand"><a href="{BASE}/">Pre-raid BiS</a></span><span class="tag">WoW Forever · Фаза 1</span>
  <span class="tag">симуляции WoWSims Forever</span>
</div></header>
<main class="wrap">
"""


def render_spec(G, ci, cls, sp, L, spec_dir):
    cname = cls['name']['ru']
    sname = sp['name']['ru']
    title = f'Пререйд-BiS · {cname} · {sname} — WoW Forever, Фаза 1'
    metric = 'HPS' if (L.get('metric') == 'hps') else 'DPS'
    date = fmt_date(L.get('simmedAt'))
    wh = L.get('source') == 'wowhead'
    value = L.get('value')
    bits = []
    if wh:
        bits.append('сет по гайду Wowhead (сим пока не считает этот спек)')
    elif value is not None:
        bits.append(f'{fmt_num(value)} {metric} в симуляции')
    if date:
        bits.append(f'прогон {date}')
    desc = f'Пререйд-BiS ({cname}, {sname}): ' + ', '.join(bits) + \
           '. Список предметов по слотам с источниками, статы сета и ссылка на симуляцию.'
    canonical = f'{BASE}/spec/{cls["id"]}/{sp["id"]}/'
    gear = L.get('gear') or {}
    items = G['items']

    rows = []
    for slot in SLOT_ORDER:
        spec = gear.get(slot)
        if not spec or not spec[0]:
            continue
        it = items.get(str(spec[0])) or {}
        name = it.get('name_ru') or it.get('name') or str(spec[0])
        q = it.get('q', 1)
        src = (it.get('sources_ru') or it.get('sources') or [''])[0]
        ench = spec[3] or ''
        rows.append(
            f'<tr><td class="slot">{esc(SLOT_RU[slot])}</td>'
            f'<td><span style="color:{QCOL.get(q, "#fff")}">{esc(name)}</span>'
            f'{"<span class=\"en\">" + esc(ench) + "</span>" if ench else ""}'
            f'<span class="src">{esc(src)}</span></td></tr>'
        )
    table = ('<table><thead><tr><th>Слот</th><th>Предмет и где достать</th></tr></thead><tbody>'
             + ''.join(rows) + '</tbody></table>') if rows else '<p>Сет пока не собран.</p>'

    stats = L.get('stats') or []
    stats_html = ''
    if stats:
        stats_html = '<div class="stats">' + ''.join(
            f'<span><b>{esc(stat_value(s))}</b> {esc(s.get("ru") or s.get("en") or "")}</span>' for s in stats
        ) + '</div>'

    badge = ' <span class="badge">Wowhead-гайд</span>' if wh else ''
    app_url = f'{BASE}/#tab=gear&lang=ru&cls={cls["id"]}&spec={sp["id"]}&budget=max&topn=4'
    sim = L.get('simLink')
    sim_btn = f'<a class="btn" href="{esc(sim)}" target="_blank" rel="noopener">Открыть сет в WoWSims ↗</a>' if sim else ''
    guide = f'<a class="btn" href="{esc(L.get("wowheadUrl"))}" target="_blank" rel="noopener">Гайд Wowhead ↗</a>' if L.get('wowheadUrl') else ''
    build = sp.get('build')
    build_name = (build or {}).get('ru', '') if isinstance(build, dict) else ''
    if build_name and build_name.strip().lower() == sname.strip().lower():
        build_name = ''
    lede = ' · '.join(bits)
    lede = (lede[:1].upper() + lede[1:]) if lede else lede
    cheap = G['loadouts'].get(sp['prefix'] + '-cheap')
    cheap_url = f'{BASE}/#tab=gear&lang=ru&cls={cls["id"]}&spec={sp["id"]}&budget=cheap&topn=4'
    cheap_btn = f'<a class="btn" href="{esc(cheap_url)}">Дёшево</a>' if cheap else ''
    note = ('Каждое число — реальный прогон WoWSims Forever, а не оценка. '
            'На интерактивной странице есть все варианты каждого слота с отставанием и погрешностью, '
            'примерка и план одевания по источникам.')
    if wh:
        note = ('Этот сет собран по гайду Wowhead: симулятор пока не считает этот спек. '
                'Когда научится, сет заменится симмированным автоматически.')

    html_out = page_head(title, desc, canonical, L.get('simmedAt'), '')
    html_out += f"""
<p class="crumb"><a href="{BASE}/">Все классы</a> / <a href="{BASE}/spec/">Спеки</a> / {esc(cname)} / {esc(sname)}</p>
<h1>{esc(cname)} · {esc(sname)}{badge}</h1>
<p class="lede">{esc(lede)}{(' · ' + esc(build_name)) if build_name else ''}.</p>
{stats_html}
{table}
<p>
  <a class="btn primary" href="{esc(app_url)}">Интерактивная версия: все варианты и примерка →</a>
  {cheap_btn}
  {sim_btn}
  {guide}
</p>
<p class="note">{esc(note)}</p>
"""
    html_out += f"""</main>
<footer><div class="wrap">
  <a href="{BASE}/">Pre-raid BiS · все классы</a> · <a href="{BASE}/spec/">все спеки</a> ·
  симуляции <a href="https://github.com/wowsims/forever" target="_blank" rel="noopener">WoWSims Forever</a>.
  Страница обновляется автоматически вместе с прогонами.
</div></footer>
</body></html>
"""
    os.makedirs(spec_dir, exist_ok=True)
    open(os.path.join(spec_dir, 'index.html'), 'w', encoding='utf-8', newline='\n').write(html_out)
    return canonical


def render_index(G, entries):
    title = 'Пререйд-BiS по всем классам — WoW Forever, Фаза 1'
    desc = ('Симмированные пререйд-BiS-сеты для всех классов и спеков WoW Forever: '
            'статы, источники предметов, два бюджета и проверка в WoWSims Forever.')
    canonical = f'{BASE}/spec/'
    html_out = page_head(title, desc, canonical, G['meta'].get('simmedAt'), '')
    html_out += f'<p class="crumb"><a href="{BASE}/">Все классы</a> / Спеки</p>\n<h1>Спеки</h1>\n'
    html_out += f'<p class="lede">{esc(desc)}</p>\n'
    for cls in G['classes']:
        links = [e for e in entries if e[0] == cls['id']]
        if not links:
            continue
        html_out += f'<h2>{esc(cls["name"]["ru"])}</h2><div class="gr">'
        for _, sp, L, url in links:
            metric = 'HPS' if L.get('metric') == 'hps' else 'DPS'
            val = 'по гайду' if L.get('source') == 'wowhead' else f'{fmt_num(L.get("value"))} {metric}'
            html_out += (f'<a href="{esc(url)}">{esc(sp["name"]["ru"])}<span>{esc(val)}</span></a>')
        html_out += '</div>'
    html_out += f"""</main>
<footer><div class="wrap"><a href="{BASE}/">Pre-raid BiS · интерактивная версия</a></div></footer>
</body></html>
"""
    os.makedirs(os.path.join(OUT, 'spec'), exist_ok=True)
    open(os.path.join(OUT, 'spec', 'index.html'), 'w', encoding='utf-8', newline='\n').write(html_out)
    return canonical


def main():
    global BASE, OUT
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', default='data.js')
    ap.add_argument('--out', default='.')
    ap.add_argument('--base', default='https://col-verger.github.io/forever-bis')
    a = ap.parse_args()
    BASE = a.base.rstrip('/')
    OUT = a.out
    G = load_data(a.data)

    entries, urls = [], []
    for cls in G['classes']:
        for sp in cls['specs']:
            L = pick_loadout(G, sp)
            if not L:
                continue
            spec_dir = os.path.join(OUT, 'spec', cls['id'], sp['id'])
            url = render_spec(G, None, cls, sp, L, spec_dir)
            entries.append((cls['id'], sp, L, url))
            urls.append((url, L))
    idx = render_index(G, entries)

    sim_day = (G['meta'].get('simmedAt') or '')[:10] or datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          f'<url><loc>{BASE}/</loc><lastmod>{sim_day}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>',
          f'<url><loc>{idx}</loc><lastmod>{sim_day}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>']
    for u, L in urls:
        day = (L.get('simmedAt') or sim_day)[:10]
        sm.append(f'<url><loc>{u}</loc><lastmod>{day}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>')
    sm.append('</urlset>')
    open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n').write('\n'.join(sm) + '\n')
    print(f'spec pages: {len(urls)} · sitemap: {len(urls) + 2} urls')


if __name__ == '__main__':
    main()
