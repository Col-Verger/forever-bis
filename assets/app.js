// Pre-raid BiS · Mage & Paladin · WoW Forever. Renders window.GUIDE (data.js, generated).
// Every number on the page comes from a real sim run; nothing is invented here.
'use strict';
const G = window.GUIDE;
const ICON = (n, size = 'medium') => `https://wow.zamimg.com/images/wow/icons/${size}/${n || 'inv_misc_questionmark'}.jpg`;
const WH = id => `https://www.wowhead.com/forever/item=${id}`;
const WH_TALENTS = (cls, t) => `https://www.wowhead.com/forever/talent-calc/${cls}/${t}`;
const SIM_HOME = 'https://www.wowsims.com/forever/';
const CLASS_ICON = id => `https://wow.zamimg.com/images/wow/icons/medium/classicon_${id}.jpg`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const $ = id => document.getElementById(id);

// ---------- i18n ----------
const STR = {
  tab_gear: { ru: 'Экипировка по слотам', en: 'Gear by slot' },
  tab_all: { ru: 'Все сеты', en: 'All loadouts' },
  tab_howto: { ru: 'Как одеваться', en: 'How to gear' },
  tab_method: { ru: 'Методика', en: 'Method' },
  slot_importance: { ru: 'Сколько важен каждый слот', en: 'How much each slot matters' },
  tab_refresh: { ru: 'Данные и обновление', en: 'Data & refresh' },
  chip_no_data: { ru: 'Симы не прогнаны', en: 'No sim runs yet' },
  chip_ok: { ru: 'Симы', en: 'Simmed' },
  chip_stale: { ru: 'данные старше N дней — обнови', en: 'stale — consider a re-run' },
  ref_status: { ru: 'Статус данных', en: 'Data status' },
  ref_ok_line: { ru: 'Прогон', en: 'Last run' },
  ref_commit_line: { ru: 'Симулятор', en: 'Simulator' },
  ref_auto: { ru: 'Как числа попадают на сайт', en: 'How numbers get here' },
  ref_auto_body: { ru: 'Сайт — статическая страница: сам он симы не считает (у wowsims.com нет живого API). Числа приносит пайплайн: он собирает свежий WoWSims Forever из GitHub, прогоняет каждый спек и пересобирает страницу. Запускается автоматически раз в неделю или вручную.', en: 'This site is static: it cannot run sims itself (wowsims.com has no live API). A pipeline brings the numbers: it builds fresh WoWSims Forever from GitHub, sims every spec, rebuilds the page. It runs weekly or manually.' },
  ref_owner_title: { ru: 'Есть права на репозиторий? Обнови одной кнопкой', en: 'Own the repo? One-click refresh' },
  ref_owner_body: { ru: 'Кнопка ведёт на GitHub Action «Re-sim and deploy» — нажми Run workflow (вход в GitHub обязателен: анонимные посетители запускать не могут).', en: 'The button opens the “Re-sim and deploy” GitHub Action — press Run workflow (a GitHub login with repo access is required; anonymous visitors cannot trigger it).' },
  ref_owner_btn: { ru: 'Открыть Action ↗', en: 'Open the Action ↗' },
  ref_no_repo: { ru: 'Ссылка появится, когда репозиторий будет создан и в data.js прошит --repo владелец/репозиторий.', en: 'The link appears once the repo exists and build_data.py runs with --repo owner/name.' },
  ref_local_title: { ru: 'Локальный прогон (полный контроль)', en: 'Local run (full control)' },
  ref_new_title: { ru: 'Новый пользователь? Прочти это', en: 'New here? Read this' },
  ref_new_body: { ru: 'Каждое число на странице — реальный прогон симулятора, с погрешностью ± на полосах. Данные обновляются сами по расписанию; если штамп в шапке старый — напиши владельцу или запусти Action, если есть права. Проверить любое число можно самостоятельно: скачай runs/<спек>.settings.json из репозитория и импортируй его на wowsims.com — увидишь тот же сет и тот же босс.', en: 'Every number on this page is a real simulator run, with a ± margin on the bars. Data refreshes on a schedule; if the stamp in the header is old, ping the owner or run the Action if you can. Any number can be checked: grab runs/<spec>.settings.json from the repo and import it on wowsims.com — same set, same boss.' },
  ref_copy: { ru: 'Копировать', en: 'Copy' },
  ref_copied: { ru: 'Скопировано', en: 'Copied' },
  copy_set: { ru: 'Скопировать сет', en: 'Copy the set' },
  cls: { ru: 'Класс', en: 'Class' },
  spec: { ru: 'Спек', en: 'Spec' },
  budget: { ru: 'Бюджет', en: 'Budget' },
  budget_max: { ru: 'Максимум', en: 'Max' },
  budget_cheap: { ru: 'Дёшево', en: 'Cheap' },
  vs_other: { ru: 'Другой бюджет', en: 'Other budget' },
  topn: { ru: 'Опций на слот', en: 'Options per slot' },
  filter: { ru: 'Фильтр', en: 'Filter' },
  search_ph: { ru: 'Предмет, босс, зона, квест', en: 'Item, boss, zone, quest' },
  every_slot: { ru: 'Каждая опция, слот за слотом', en: 'Every option, slot by slot' },
  matrix_sub: { ru: 'Все сеты бок о бок. Ряды без подсветки одинаковы во всех сетах; подсвеченная ячейка отличается от самого частого выбора.', en: 'Every loadout side by side. Faded rows are the same in every loadout; a shaded cell differs from the most common pick.' },
  best: { ru: 'Лучший', en: 'Best' },
  all_sources: { ru: 'Все источники', en: 'All sources' },
  n_of_sources: { ru: 'источников', en: 'sources' },
  show_all: { ru: 'Показать все', en: 'Show all' },
  empty_slot: { ru: 'В этом слоте фильтрам ничего не подходит.', en: 'Nothing in this slot passes your filters.' },
  hidden_best: { ru: 'Лучший предмет слота скрыт вашими фильтрами.', en: 'The best item for this slot is hidden by your filters.' },
  no_source: { ru: 'Источника в файлах игры нет', en: 'No source in the game files' },
  empty_title: { ru: 'Симы для этого спека ещё не прогнаны', en: 'Not simmed yet' },
  empty_body: { ru: 'На странице нет придуманных чисел: карточки появятся после реального прогона WoWSims Forever.', en: 'No invented numbers here: the cards fill in after a real WoWSims Forever run.' },
  empty_run: { ru: 'Запустить пайплайн: README → «Запуск локально» или GitHub Action «Re-sim and deploy».', en: 'Run the pipeline: README → local run, or the “Re-sim and deploy” GitHub Action.' },
  no_preset_title: { ru: 'Спек ждёт пресет в симуляторе', en: 'Waiting for the sim to ship a preset' },
  metric_dps: { ru: 'DPS в симе', en: 'DPS in the sim' },
  metric_hps: { ru: 'HPS в симе', en: 'HPS in the sim' },
  build: { ru: 'Билд', en: 'Build' },
  talents: { ru: 'Таланты', en: 'Talents' },
  rotation: { ru: 'Ротация', en: 'Rotation' },
  open_sim: { ru: 'Открыть сет в WoWSims ↗', en: 'Open this set in WoWSims ↗' },
  key_best: { ru: 'Лучший предмет', en: 'Best item' },
  key_same: { ru: 'То же значение: погрешность достаёт до лучшего', en: 'Same value: the margin reaches the best' },
  key_lower: { ru: 'Хуже', en: 'Lower' },
  key_higher: { ru: 'Выше, чем выбранное в сете', en: 'Higher than the set’s pick' },
  key_text: { ru: 'Полоса — насколько предмет проигрывает лучшему, ус — погрешность сима (±). Всё внутри заливки вокруг лучшей линии — то же значение.', en: 'The bar is how much an item loses against the best, the whisker the sim’s ± margin. Anything inside the shading around the best line is the same value.' },
  stamp_notrun: { ru: 'Симы не прогнаны', en: 'No sim runs yet' },
  stamp_run: { ru: 'Симы прогнаны', en: 'Simmed' },
  vs_best: { ru: 'к лучшему', en: 'vs best' },
  slot: {
    head: { ru: 'Голова', en: 'Head' }, neck: { ru: 'Шея', en: 'Neck' }, shoulder: { ru: 'Плечи', en: 'Shoulder' },
    back: { ru: 'Спина', en: 'Back' }, chest: { ru: 'Грудь', en: 'Chest' }, wrist: { ru: 'Запястья', en: 'Wrist' },
    hands: { ru: 'Кисти', en: 'Hands' }, waist: { ru: 'Пояс', en: 'Waist' }, legs: { ru: 'Ноги', en: 'Legs' },
    feet: { ru: 'Ступни', en: 'Feet' }, finger1: { ru: 'Кольцо 1', en: 'Ring 1' }, finger2: { ru: 'Кольцо 2', en: 'Ring 2' },
    trinket1: { ru: 'Тринкет 1', en: 'Trinket 1' }, trinket2: { ru: 'Тринкет 2', en: 'Trinket 2' },
    main_hand: { ru: 'Правая рука', en: 'Main hand' }, off_hand: { ru: 'Левая рука', en: 'Off hand' },
    ranged: { ru: 'Дальний бой', en: 'Ranged' }, two_hand: { ru: 'Двуручное', en: 'Two-hander' },
    weapons: { ru: 'Оружие', en: 'Weapons' }
  },
  srcnames: { dungeon: { ru: 'Подземелья', en: 'Dungeons' }, quest: { ru: 'Квесты', en: 'Quests' }, craft: { ru: 'Крафт', en: 'Crafted' }, vendor: { ru: 'Продавцы', en: 'Vendor' }, rep: { ru: 'Репутация', en: 'Reputation' }, bg: { ru: 'PvP', en: 'Battleground' }, world: { ru: 'Мировой дроп', en: 'World drop' }, unknown: { ru: 'Неизвестно', en: 'Unknown' } }
};
const T = (path, l) => {
  const walk = (o, keys) => keys.length ? walk(o && o[keys[0]], keys.slice(1)) : o;
  const v = walk(STR, path.split('.'));
  const lg = l || state.lang;
  return v && typeof v === 'object' ? (v[lg] || v.en || v.ru) : (v || path);
};

// ---------- state ----------
const SOURCE_KINDS = ['dungeon', 'quest', 'craft', 'vendor', 'rep', 'bg', 'world', 'unknown'];
const state = {
  lang: localStorage.getItem('bislang') || 'ru',
  cls: G.classes[0].id, spec: G.classes[0].specs[0].id,
  budget: 'max', topn: 4, q: '', srcs: new Set(SOURCE_KINDS), tab: 'gear'
};
const fromHash = () => {
  const p = new URLSearchParams(location.hash.slice(1));
  if (['ru', 'en'].includes(p.get('lang'))) state.lang = p.get('lang');
  if (G.classes.some(c => c.id === p.get('cls'))) { state.cls = p.get('cls'); }
  const C = curClass();
  if (C && C.specs.some(s => s.id === p.get('spec'))) state.spec = p.get('spec');
  else if (C) state.spec = C.specs[0].id;
  if (['max', 'cheap'].includes(p.get('budget'))) state.budget = p.get('budget');
  if (['gear', 'all', 'howto', 'method', 'refresh'].includes(p.get('tab'))) state.tab = p.get('tab');
  if (['3', '4', '6'].includes(p.get('topn'))) state.topn = +p.get('topn');
};
const toHash = () => history.replaceState(null, '', `#tab=${state.tab}&lang=${state.lang}&cls=${state.cls}&spec=${state.spec}${budgetOf(curSpec()) ? `&budget=${state.budget}` : ''}&topn=${state.topn}`);

const curClass = () => G.classes.find(c => c.id === state.cls);
const curSpec = () => (curClass() || G.classes[0]).specs.find(s => s.id === state.spec) || (curClass() || G.classes[0]).specs[0];
const loadoutKey = sp => {
  const P = sp.prefix, L = G.loadouts;
  if ((L[`${P}-max`] && L[`${P}-cheap`])) return `${P}-${state.budget}`;
  return L[`${P}-max`] ? `${P}-max` : P;
};
const loadout = sp => G.loadouts[loadoutKey(sp || curSpec())];
const budgetOf = sp => !!(G.loadouts[`${sp.prefix}-max`] && G.loadouts[`${sp.prefix}-cheap`]);
const budgetLabel = b => T(b === 'cheap' ? 'budget_cheap' : 'budget_max');
const lang = () => state.lang;
const L2 = o => (o && typeof o === 'object') ? (o[lang()] || o.en || o.ru || '') : (o == null ? '' : o);
const item = id => G.items[id];
const qc = it => `color:var(--q${it ? it.q : 1})`;
const itemName = spec => { const it = item(spec[0]); return it ? it.name + (spec[2] && G.suffixes[spec[2]] ? ' ' + G.suffixes[spec[2]] : '') : '—'; };
const enchantName = spec => spec[3] || (spec[1] ? 'Enchant ' + spec[1] : '');
const fmt = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`;
const fmtMetric = v => (v == null ? '—' : v >= 10000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v).toString());
const pluralRu = (n, forms) => { const d10 = n % 10, d100 = n % 100; return d10 === 1 && d100 !== 11 ? forms[0] : (d10 >= 2 && d10 <= 4 && (d100 < 12 || d100 > 14)) ? forms[1] : forms[2]; };
const metricName = m => T(m === 'hps' ? 'metric_hps' : 'metric_dps');
const SLOT_ORDER = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2', 'main_hand', 'off_hand', 'ranged'];
const LEFT = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands'];
const RIGHT = ['waist', 'legs', 'feet', 'finger1', 'finger2', 'trinket1', 'trinket2'];
const slotLabel = s => T('slot.' + s);

// ---------- static text ----------
function applyStatic() {
  document.documentElement.lang = lang();
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = T(el.dataset.i18nPh); });
  document.title = lang() === 'ru' ? 'Пререйд-BiS · WoW Forever' : 'Pre-raid BiS · WoW Forever';
  $('pagetitle').textContent = lang() === 'ru' ? 'Пререйд-BiS · все классы' : 'Pre-raid best in slot — every class';
  $('lede').textContent = L2(G.meta.lede);
  $('howto').innerHTML = L2(G.howto);
  $('method').innerHTML = L2(G.method);
  const stamp = $('stamp');
  stamp.hidden = false;
  if (!G.meta.hasData) {
    stamp.innerHTML = `<b class="stale">⚠ ${esc(T('stamp_notrun'))}</b> — ${esc(L2(G.meta.footer))}`;
  } else {
    stamp.innerHTML = `<b>✓ ${esc(T('stamp_run'))} WoWSims Forever ${esc(G.meta.simmed)} (${esc(G.meta.simCommit)})</b> — ${esc(L2(G.meta.footer))}`;
  }
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang()));
}

// ---------- sources picker ----------
function renderSources() {
  $('srcs').innerHTML = SOURCE_KINDS.map(k => `<label><input type="checkbox" data-src="${k}"${state.srcs.has(k) ? ' checked' : ''}> ${esc(T('srcnames.' + k))}</label>`).join('')
    + `<button class="srcall" type="button">${esc(T('show_all'))}</button>`;
  const on = SOURCE_KINDS.filter(k => state.srcs.has(k)).length;
  $('srcsum').textContent = on === SOURCE_KINDS.length ? T('all_sources')
    : (lang() === 'ru' ? `${on} ${pluralRu(on, ['источник', 'источника', 'источников'])}` : `${on} ${T('n_of_sources')}`);
  $('srcsum').classList.toggle('on', on !== SOURCE_KINDS.length);
}

// ---------- filters ----------
function rowPasses(specs, r) {
  const q = state.q.trim().toLowerCase();
  return specs.every(([, spec]) => {
    const it = item(spec[0]);
    if (!it) return true;
    if (!(it.kinds || []).some(k => state.srcs.has(k))) return false;
    return true;
  }) && (!q || specs.some(([, spec]) => {
    const it = item(spec[0]);
    return it && (itemName(spec).toLowerCase().includes(q) || (it.sources || []).join(' ').toLowerCase().includes(q));
  }));
}

// ---------- the character window ----------
function renderDoll() {
  const sp = curSpec(), L = loadout(sp);
  const slotHTML = s => {
    if (!L) return `<div class="slot empty"><span class="icon"></span><span class="meta"><span class="lbl">${esc(slotLabel(s))}</span><span class="nm">—</span></span></div>`;
    const spec = L.gear[s];
    if (!spec || !spec[0]) return `<div class="slot empty"><span class="icon"></span><span class="meta"><span class="lbl">${esc(slotLabel(s))}</span><span class="nm">—</span></span></div>`;
    const it = item(spec[0]);
    const q = it && it.q >= 3 ? ` q${it.q}` : '';
    return `<div class="slot" data-go="${s}" data-tip="${spec[0]}" data-sfx="${spec[2] || 0}">
      <img class="icon${q}" src="${ICON(it.icon, 'large')}" alt="" loading="lazy"><span class="meta"><span class="lbl">${esc(slotLabel(s))}</span>
      <span class="nm" style="${qc(it)}">${esc(itemName(spec))}</span>
      <span class="en">${esc(enchantName(spec)) || '&nbsp;'}</span></span></div>`;
  };
  const center = () => {
    if (!L) {
      const waiting = sp.status === 'no-preset';
      return `<div>
        <span class="small">${esc(L2(sp.name))}</span><h2>${esc(L2(sp.name))}</h2>
        ${waiting ? `<span class="status-badge">${esc(T('no_preset_title'))}</span>` : ''}
        <p class="target">${esc(L2(G.meta.target))}</p>
        <div class="empty-note">
          <b>${esc(waiting ? T('no_preset_title') : T('empty_title'))}</b><br>
          ${esc(waiting ? L2(sp.note) : T('empty_body'))} ${esc(waiting ? '' : T('empty_run'))}
          ${waiting ? '' : `<br><code>python tools/run_sims.py --only ${esc(sp.prefix)}</code>`}
        </div>
        <dl class="facts">
          <dt>${esc(T('build'))}</dt><dd>${esc(L2(sp.build))}</dd>
          <dt>${esc(T('rotation'))}</dt><dd>${esc(L2(sp.rotation)) || '—'}</dd>
        </dl>
        <p class="blurb">${esc(L2(sp.note))}</p>
      </div>`;
    }
    return `<div>
      <span class="small">${esc(L2(sp.name))}</span><h2>${esc(L2(L.title || sp.name))}</h2>
      <p class="target">${esc(L2(G.meta.target))}</p>
      <div class="dps" ${L.margin ? `title="±${L.margin} (95%)"` : ''}><b>${fmtMetric(L.value)}</b><span>${esc(metricName(L.metric))}</span>
        ${L.hit ? `<span class="hps-n">${esc(L.hit)}</span>` : ''}</div>
      <dl class="facts">
        <dt>${esc(T('build'))}</dt><dd>${esc(L2(L.build))}</dd>
        <dt>${esc(T('talents'))}</dt><dd><a href="${esc(WH_TALENTS(state.cls, L.talents))}" target="_blank" rel="noopener" title="Wowhead"><code>${esc(L.talents)}</code></a></dd>
        <dt>${esc(T('rotation'))}</dt><dd>${esc(L2(L.rotation))}</dd>
        ${L.vsOther ? `<dt>${esc(T('vs_other'))}</dt><dd>${esc(L2(L.vsOther))}</dd>` : ''}
      </dl>
      ${L.simLink ? `<a class="btn primary" href="${esc(L.simLink)}" target="_blank" rel="noopener">${esc(T('open_sim'))}</a>` : ''}
      <div class="center-actions">
        <button class="btn" type="button" data-copyset="1">${esc(T('copy_set'))}</button>
      </div>
      <p class="blurb">${esc(L2(sp.note))}</p>
    </div>`;
  };
  $('doll').innerHTML = `
    <div class="col">${LEFT.map(slotHTML).join('')}</div>
    <div class="center">${center()}</div>
    <div class="col right">${RIGHT.map(slotHTML).join('')}</div>
    <div class="weapons">${['main_hand', 'off_hand', 'ranged'].map(slotHTML).join('')}</div>`;
}

// ---------- gap chart ----------
const kindOf = r => r.best ? 'best' : r.d - r.m <= 0 && r.d + r.m >= 0 ? 'same' : r.d > 0 ? 'up' : 'down';
function scaleFor(rows) {
  let lo = Math.min(0, ...rows.map(r => r.d - r.m)), hi = Math.max(0, ...rows.map(r => r.d + r.m));
  if (hi - lo < 2) lo = hi - 2;
  const pad = (hi - lo) * 0.06;
  lo -= pad; hi += pad;
  return v => (v - lo) / (hi - lo) * 100;
}
function gapChart(r, x) {
  const z = x(0);
  if (r.best) return `<span class="gap best"><i class="dot best" style="left:${z.toFixed(2)}%"></i></span>`;
  const a = x(r.d - r.m), b = x(r.d + r.m), p = x(r.d);
  return `<span class="gap ${kindOf(r)}"><i class="fill" style="left:${Math.min(p, z).toFixed(2)}%;width:${Math.abs(p - z).toFixed(2)}%"></i>
    <i class="err" style="left:${a.toFixed(2)}%;width:${Math.max(0.5, b - a).toFixed(2)}%"></i><i class="dot" style="left:${p.toFixed(2)}%"></i></span>`;
}
const median = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[s.length >> 1] : 0; };
const bandVars = (x, rows) => {
  const m = median(rows.filter(r => !r.best).map(r => r.m));
  return `--z:${x(0).toFixed(2)}%;--b0:${x(-m).toFixed(2)}%;--b1:${x(m).toFixed(2)}%`;
};

// ---------- cards ----------
function itemHTML(spec, withEnchant) {
  const it = item(spec[0]);
  if (!it) return '<span class="small">—</span>';
  const en = withEnchant && enchantName(spec);
  const q = it.q >= 3 ? ` q${it.q}` : '';
  return `<span class="it" data-tip="${spec[0]}" data-sfx="${spec[2] || 0}"><img class="icon xs${q}" loading="lazy" src="${ICON(it.icon)}" alt=""><a class="n" style="${qc(it)}" title="${esc(itemName(spec))}" href="${WH(spec[0])}" target="_blank" rel="noopener">${esc(itemName(spec))}</a>${en ? `<span class="en" title="${esc(en)}">${esc(en)}</span>` : ''}</span>`;
}
function rowHTML(r, x, bestMove) {
  const specs = Object.entries(r.move).sort((a, b) => SLOT_ORDER.indexOf(a[0]) - SLOT_ORDER.indexOf(b[0]));
  const k = kindOf(r);
  const its = specs.map(([, spec]) => item(spec[0])).filter(Boolean);
  const srcs = its.length ? its : [];
  const sourceLine = srcs.map(it => (it.sources || []).join(' | ') || T('no_source')).join(' + ');
  const d = r.best ? `<b>${esc(T('best'))}</b>` : `<b>${fmt(r.d)}</b> <small>±${r.m.toFixed(1)}</small>`;
  return `<tr class="${k}">
    <td class="c-item"><span class="items">${specs.map(([s, spec]) => itemHTML(spec, true)).join('<span class="plus">+</span>')}</span></td>
    <td class="c-where" title="${esc(sourceLine)}">${esc(srcs.map(it => (it.sources || [])[0] || T('no_source')).join(' + '))}</td>
    <td class="c-d" title="${r.best ? '' : fmt(r.d)}">${d}</td>
    <td class="c-chart">${gapChart(r, x)}</td></tr>`;
}
function groupHTML(g, L) {
  const hasBest = g.best && Object.keys(g.best).length > 0;
  const rows = [...(hasBest ? [{ move: g.best, d: 0, m: 0, best: true }] : []), ...(g.rows || [])].sort((a, b) => b.d - a.d);
  const passing = rows.filter(r => rowPasses(Object.entries(r.move), r));
  const shown = passing.slice(0, state.topn);
  const x = scaleFor(shown.length ? shown : rows.slice(0, 1));
  const head = `<tr class="gh"><th colspan="4" scope="rowgroup"><span class="ghn">${esc(glabel(g.id))}</span>${g.note ? `<span class="ghnote">${esc(L2(g.note))}</span>` : ''}</th></tr>`;
  const body = shown.length ? shown.map(r => rowHTML(r, x, g.best)).join('') : `<tr><td colspan="4" class="empty">${esc(T('empty_slot'))}</td></tr>`;
  const hiddenBest = hasBest && shown.length && !rowPasses(Object.entries(g.best)) ? `<tr><td colspan="4" class="empty">${esc(T('hidden_best'))}</td></tr>` : '';
  return `<tbody class="grp" id="card-${g.id}" style="${bandVars(x, shown)}">${head}${body}${hiddenBest}</tbody>`;
}
const glabel = id => slotLabel(id === 'two_hand' ? 'two_hand' : id === 'weapons' ? 'weapons' : id);
function renderCards() {
  const L = loadout();
  if (!L || !L.groups || !L.groups.length) {
    $('cards').innerHTML = `<div class="empty-note">${esc(T('empty_title'))} — ${esc(T('empty_body'))}</div>`;
    $('ovd').hidden = true;
    return;
  }
  $('cards').innerHTML = `<table class="bt">
    <colgroup><col class="w-item"><col class="w-where"><col class="w-d"><col class="w-chart"></colgroup>
    <thead><tr><th class="c-item">${esc(lang() === 'ru' ? 'Предмет' : 'Item')}</th><th class="c-where">${esc(lang() === 'ru' ? 'Где достать' : 'Where')}</th><th class="c-d">Δ ${esc(metricName(L.metric))}</th><th class="c-chart">${esc(T('vs_best'))}</th></tr></thead>
    ${L.groups.map(g => groupHTML(g, L)).join('')}</table>`;
  renderOverview(L);
}
function renderKey() {
  const kx = v => (v + 9) / 18 * 100;
  const ex = [[{ best: true, d: 0, m: 0 }, T('key_best')], [{ d: -1.5, m: 2.5 }, T('key_same')], [{ d: -6, m: 1.5 }, T('key_lower')], [{ d: 6, m: 1.5 }, T('key_higher')]];
  $('key').innerHTML = ex.map(([r, l]) => `<span class="k"><span class="kchart" style="--z:${kx(0).toFixed(2)}%">${gapChart(r, kx)}</span>${esc(l)}</span>`).join('')
    + `<span class="ktext">${esc(T('key_text'))}</span>`;
}

// ---------- how much each slot matters ----------
const OV_LABEL = { two_hand: 'Двуручное', weapons: 'Оружие' };
function renderOverview(L) {
  const lines = L.groups.map(g => {
    const rows = [...(g.rows || [])].sort((a, b) => b.d - a.d).slice(0, 6);
    return rows.length || true ? { g, rows } : null;
  }).filter(Boolean);
  const ds = lines.flatMap(o => o.rows.map(r => r.d));
  if (!ds.length) { $('overview').innerHTML = ''; $('ovd').hidden = true; return; }
  const lo = Math.max(-40, Math.min(-10, ...ds)), hi = Math.max(5, Math.max(...ds, 0));
  const pad = (hi - lo) * 0.04;
  const x = v => (Math.min(hi, Math.max(lo, v)) - lo + pad) / (hi - lo + 2 * pad) * 100;
  const ticks = [];
  for (let t = Math.ceil(lo / 10) * 10; t <= hi; t += 10) ticks.push(t);
  const same = lines.reduce((n, o) => n + o.rows.filter(r => kindOf(r) === 'same').length, 0);
  $('ovteaser').textContent = same ? `${same} ${lang() === 'ru' ? 'опций равны лучшим (в пределах погрешности)' : 'options tie the best (within the margin)'}` : (lang() === 'ru' ? 'все опции хуже лучших' : 'no option ties the best');
  const rowsHTML = lines.map(({ g, rows }) => {
    const m = median(rows.map(r => r.m));
    const dots = rows.map(r => {
      const spec = Object.values(r.move).find(v => v && v[0]) || [0];
      return `<i class="od ${kindOf(r)}" style="left:${x(r.d).toFixed(2)}%" data-tip="${spec[0]}" data-sfx="${spec[2] || 0}" data-d="${r.d}" data-m="${r.m}"></i>`;
    }).join('');
    return `<button class="ov-row" type="button" data-grp="${g.id}"><span class="ov-l">${esc(slotLabel(g.id))}</span>
      <span class="ov-s" style="--z:${x(0).toFixed(2)}%;--b0:${x(-m).toFixed(2)}%;--b1:${x(m).toFixed(2)}%">${dots}</span>
      <span class="ov-n">${rows.filter(r => kindOf(r) === 'same').length || ''}</span></button>`;
  }).join('');
  $('ovd').hidden = false;
  $('overview').innerHTML = `
    <p class="small ov-p">${esc(lang() === 'ru'
      ? 'Топ-6 опций каждого слота против лучшего, на одной шкале. Точки в светлой полосе — то же значение: носи, что уже есть. Разброс — слот, за который стоит гнаться.'
      : 'Every slot’s top six options against its best, on one scale. Dots inside the shading are the same value: wear what you have. Spread out — a slot worth chasing.')}</p>
    ${ticks.map(t => `<i class="tk" style="left:${x(t).toFixed(2)}%"></i>`).join('')}
    ${rowsHTML}`;
}


// ---------- all loadouts ----------
function renderMatrix() {
  const ids = Object.keys(G.loadouts);
  if (!ids.length) { $('matrix').innerHTML = `<div class="empty-note">${esc(T('empty_title'))}</div>`; return; }
  const head = ids.map(id => {
    const sp = specOfPrefix(id);
    const bl = /-cheap$/.test(id) ? ' · ' + T('budget_cheap') : /-max$/.test(id) ? ' · ' + T('budget_max') : '';
    return `<th class="${id === loadoutKey(curSpec()) ? 'on' : ''}">${esc(sp ? L2(sp.name) : id) + esc(bl)}<small>${fmtMetric(G.loadouts[id].value)} ${G.loadouts[id].metric === 'hps' ? 'HPS' : 'DPS'}</small></th>`;
  }).join('');
  const rows = SLOT_ORDER.map(s => {
    const cells = ids.map(id => G.loadouts[id].gear[s] || [0, 0, 0]);
    if (cells.every(c => !c[0])) return '';
    const same = cells.every(c => c[0] === cells[0][0]);
    const counts = {};
    cells.forEach(c => counts[c[0]] = (counts[c[0]] || 0) + 1);
    const common = +Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    return `<tr class="${same ? 'same' : ''}"><td class="sl">${esc(slotLabel(s))}</td>${cells.map(c =>
      c[0] ? `<td class="${!same && c[0] !== common ? 'odd' : ''}">${itemHTML(c, true)}</td>` : '<td>—</td>').join('')}</tr>`;
  }).join('');
  $('matrix').innerHTML = `<table><thead><tr><th class="sl">${esc(lang() === 'ru' ? 'Слот' : 'Slot')}</th>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}
const specOfPrefix = p => G.classes.flatMap(c => c.specs).find(s => s.prefix === p || s.prefix + '-max' === p || s.prefix + '-cheap' === p);

// ---------- data status & refresh ----------
const REFRESH_CMDS = [
  ['1', 'git clone --depth 1 https://github.com/wowsims/forever forever'],
  ['2', 'cd forever && go install google.golang.org/protobuf/cmd/protoc-gen-go@latest'],
  ['3', 'cd forever && protoc -I=./proto --go_opt=Mgoogle/protobuf/descriptor.proto=google.golang.org/protobuf/types/descriptorpb --go_out=./sim/core ./proto/*.proto'],
  ['4', 'cd forever && go build --tags=with_db -o ../wowsimcli.exe ./cmd/wowsimcli'],
  ['5', 'python tools/make_pools.py --forever forever --configs configs'],
  ['6', 'python tools/run_sims.py --forever forever --wowsimcli wowsimcli.exe --configs configs --out runs'],
  ['7', 'python tools/build_data.py --forever forever --runs runs --configs configs --out data.js --commit $(git -C forever rev-parse --short HEAD)']
];
function chipState() {
  const m = G.meta;
  if (!m.hasData) return { cls: 'none', text: T('chip_no_data') };
  const staleDays = m.staleAfterDays || 7;
  const age = (Date.now() - new Date(m.simmed)) / 86400000;
  if (age > staleDays) return { cls: 'stale', text: `${T('chip_ok')} ${m.simmed} · ${T('chip_stale')}`.replace('N', staleDays) };
  return { cls: 'ok', text: `${T('chip_ok')}: ${m.simmed}` };
}
function renderChip() {
  const chip = $('statuschip');
  if (!chip) return;
  const st = chipState();
  chip.hidden = false;
  chip.className = `statuschip ${st.cls}`;
  chip.textContent = st.text;
  chip.title = G.meta.simCommit ? `WoWSims Forever commit ${G.meta.simCommit}` : '';
}
function cmdBlock([n, cmd]) {
  return `<div class="cmdrow"><code>${esc(cmd)}</code><button class="copybtn" type="button" data-copy="${esc(cmd)}">${esc(T('ref_copy'))}</button></div>`;
}
function renderRefresh() {
  const m = G.meta;
  const st = chipState();
  const status = `<div class="panel ${st.cls}"><b>${esc(st.text)}</b>
      <span>${esc(T('ref_ok_line'))}: <b>${esc(m.simmed || '—')}</b></span>
      <span>${esc(T('ref_commit_line'))}: <code>${esc(m.simCommit || '—')}</code></span></div>`;
  const owner = m.workflowUrl
    ? `<div class="panel"><b>${esc(T('ref_owner_title'))}</b><span>${esc(T('ref_owner_body'))}</span>
        <a class="btn primary" href="${esc(m.workflowUrl)}" target="_blank" rel="noopener">${esc(T('ref_owner_btn'))}</a>
        ${cmdBlock(['gh', `gh workflow run resim.yml --repo ${m.repoUrl ? m.repoUrl.replace('https://github.com/', '') : 'OWNER/REPO'}`])}</div>`
    : `<div class="panel"><b>${esc(T('ref_owner_title'))}</b><span>${esc(T('ref_no_repo'))}</span></div>`;
  const local = `<div class="panel"><b>${esc(T('ref_local_title'))}</b>${REFRESH_CMDS.map(cmdBlock).join('')}</div>`;
  const newbie = `<div class="panel"><b>${esc(T('ref_new_title'))}</b><span>${esc(T('ref_new_body'))}</span></div>`;
  $('refresh').innerHTML = `
    <h2>${esc(T('ref_status'))}</h2>
    <div class="panels">${status}
      <div class="panel"><b>${esc(T('ref_auto'))}</b><span>${esc(T('ref_auto_body'))}</span></div>
    </div>
    <div class="panels">${owner}${local}${newbie}</div>`;
}

// ---------- tooltip ----------
function tipHTML(id, sfx) {
  const it = item(id);
  if (!it) return '';
  const sx = sfx && it.suffixStats && it.suffixStats[sfx];
  const lines = [];
  if (it.weapon) {
    lines.push(`<div class="row"><span class="w">${it.weapon.min}–${it.weapon.max} ${lang() === 'ru' ? 'урона' : 'Damage'}</span><span class="w">${lang() === 'ru' ? 'скорость' : 'Speed'} ${it.weapon.speed.toFixed(2)}</span></div>`);
    lines.push(`<div class="w">(${it.weapon.dps.toFixed(1)} ${lang() === 'ru' ? 'урона в секунду' : 'damage per second'})</div>`);
  }
  if (it.armor) lines.push(`<div class="w">${it.armor} ${lang() === 'ru' ? 'брони' : 'Armor'}</div>`);
  (it.white || []).forEach(([k, v]) => lines.push(`<div class="w">+${v} ${esc(k)}</div>`));
  if (sx) sx.forEach(([k, v]) => lines.push(`<div class="w">+${v} ${esc(k)}</div>`));
  (it.green || []).forEach(l => lines.push(`<div class="g">${esc(l)}</div>`));
  return `<div class="t" style="${qc(it)}">${esc(it.name)}${sfx && G.suffixes[sfx] ? ' ' + esc(G.suffixes[sfx]) : ''}</div>
    ${it.unique ? '<div class="w">Unique</div>' : ''}
    <div class="row"><span class="w">${esc(it.slot)}</span><span class="w">${esc(it.kind || '')}</span></div>
    ${lines.join('')}
    ${it.set ? `<div class="y">${esc(it.set)}</div>` : ''}
    <div class="m">Item level ${it.ilvl}${it.side ? ' · ' + esc(it.side) + ' only' : ''}</div>
    <div class="src">${(it.sources || []).map(s => `<div class="y">${esc(s)}</div>`).join('') || `<div class="m">${esc(T('no_source'))}</div>`}</div>`;
}
const tip = $('tip');
document.addEventListener('mousemove', e => {
  const t = e.target.closest('[data-tip]');
  if (!t || !matchMedia('(hover: hover)').matches || innerWidth < 720) { tip.hidden = true; return; }
  tip.innerHTML = tipHTML(+t.dataset.tip, +t.dataset.sfx);
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = e.clientX + 16, y = e.clientY + 16;
  if (x + w > innerWidth - 8) x = e.clientX - w - 16;
  if (y + h > innerHeight - 8) y = Math.max(8, innerHeight - h - 8);
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
});

// ---------- controls & render ----------
function renderControls() {
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === state.tab));
  document.querySelectorAll('section[data-panel]').forEach(s => { s.hidden = s.dataset.panel !== state.tab; });
  $('bar').hidden = state.tab !== 'gear';
  const pressed = (sel, key, v) => document.querySelectorAll(sel).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[key]) === String(v)));
  pressed('[data-cls]', 'cls', state.cls);
  pressed('[data-spec]', 'spec', state.spec);
  pressed('[data-budget]', 'budget', state.budget);
  pressed('[data-topn]', 'topn', state.topn);
  $('cls').innerHTML = G.classes.map(c => `<button data-cls="${c.id}"><img src="${CLASS_ICON(c.id)}" alt="">${esc(L2(c.name))}</button>`).join('');
  const C = curClass();
  $('spec').innerHTML = C.specs.map(s => `<button data-spec="${s.id}" title="${esc(L2(s.name))}">${esc(L2(s.name))}</button>`).join('');
  const hasBudget = !!budgetOf(curSpec());
  $('budgetgroup').hidden = !hasBudget;
  if (hasBudget) $('budget').innerHTML = `<button data-budget="max">${esc(T('budget_max'))}</button><button data-budget="cheap">${esc(T('budget_cheap'))}</button>`;
  $('topn').innerHTML = [3, 4, 6].map(n => `<button data-topn="${n}">${n}</button>`).join('');
  pressed('[data-cls]', 'cls', state.cls);
  pressed('[data-spec]', 'spec', state.spec);
  pressed('[data-budget]', 'budget', state.budget);
  pressed('[data-topn]', 'topn', state.topn);
}
function render() {
  document.body.dataset.class = state.cls;
  applyStatic();
  renderControls();
  renderSources();
  renderKey();
  renderChip();
  if (state.tab === 'gear') { renderDoll(); renderCards(); }
  if (state.tab === 'all') renderMatrix();
  if (state.tab === 'refresh') renderRefresh();
  toHash();
}

function setCopyText() {
  const sp = curSpec(), L = loadout();
  const lines = [`${L2(sp.name)} · ${L2(L.build || sp.build)}${budgetOf(sp) ? ' · ' + T('budget_' + state.budget) : ''} — ${fmtMetric(L.value)} ${L.metric === 'hps' ? 'HPS' : 'DPS'}`];
  lines.push(`${lang() === 'ru' ? 'Сим' : 'Sim'}: WoWSims Forever ${G.meta.simmed || ''}${G.meta.simCommit ? ' (' + G.meta.simCommit + ')' : ''}`);
  for (const s of SLOT_ORDER) {
    const v = L.gear[s];
    if (!v || !v[0]) continue;
    lines.push(`${slotLabel(s)}: ${itemName(v)}${v[3] ? ' (+ ' + v[3] + ')' : ''} — wowhead.com/forever/item=${v[0]}`);
  }
  return lines.join('\n');
}

document.addEventListener('click', e => {
  const t = e.target;
  if (!t.closest('#srcpick')) $('srcpick').open = false;
  const cp = t.closest('.copybtn');
  if (cp) {
    const text = cp.dataset.copy || '';
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
      () => { cp.textContent = T('ref_copied'); setTimeout(() => { cp.textContent = T('ref_copy'); }, 1400); },
      () => {});
    return;
  }
  const cs = t.closest('[data-copyset]');
  if (cs) {
    (navigator.clipboard ? navigator.clipboard.writeText(setCopyText()) : Promise.reject()).then(
      () => { const old = cs.textContent; cs.textContent = T('ref_copied'); setTimeout(() => { cs.textContent = old; }, 1400); },
      () => {});
    return;
  }
  const chip = t.closest('#statuschip');
  if (chip) { state.tab = 'refresh'; render(); return; }
  if (t.closest('.srcall')) { SOURCE_KINDS.forEach(k => state.srcs.add(k)); renderSources(); if (state.tab === 'gear') renderCards(); return; }
  const b = t.closest('button');
  if (!b) {
    const go = t.closest('[data-go]');
    if (go && !t.closest('a')) {
      const card = $('card-' + go.dataset.go);
      if (card) { card.scrollIntoView({ block: 'start' }); card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 1400); }
    }
    return;
  }
  if (b.dataset.grp) {
    const body = $('card-' + b.dataset.grp);
    if (body) { body.scrollIntoView({ block: 'start' }); body.classList.add('flash'); setTimeout(() => body.classList.remove('flash'), 1400); }
    return;
  }
  if (b.dataset.lang) { state.lang = b.dataset.lang; localStorage.setItem('bislang', state.lang); render(); return; }
  if (b.dataset.cls) { state.cls = b.dataset.cls; state.spec = curClass().specs[0].id; }
  else if (b.dataset.spec) state.spec = b.dataset.spec;
  else if (b.dataset.budget) state.budget = b.dataset.budget;
  else if (b.dataset.topn) state.topn = +b.dataset.topn;
  else if (b.dataset.tab) state.tab = b.dataset.tab;
  else return;
  render();
});
document.addEventListener('change', e => {
  const s = e.target.dataset && e.target.dataset.src;
  if (!s) return;
  e.target.checked ? state.srcs.add(s) : state.srcs.delete(s);
  renderSources(); if (state.tab === 'gear') renderCards();
  $('srcpick').open = true;
});
$('q').addEventListener('input', e => { state.q = e.target.value; if (state.tab === 'gear') renderCards(); });
new ResizeObserver(() => document.documentElement.style.setProperty('--barh', $('bar').offsetHeight + 'px')).observe($('bar'));

// Shared links and back/forward navigation: re-read the hash when it changes from outside
// (toHash uses replaceState, so this never loops).
window.addEventListener('hashchange', () => { fromHash(); render(); });

fromHash();
if (G.meta.hasData) { /* data present: plain render */ }
render();
