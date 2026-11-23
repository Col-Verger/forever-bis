// Pre-raid BiS · Mage & Paladin · WoW Forever. Renders window.GUIDE (data.js, generated).
// Every number on the page comes from a real sim run; nothing is invented here.
'use strict';
const G = window.GUIDE;
const ICON = (n, size = 'medium') => `https://wow.zamimg.com/images/wow/icons/${size}/${n || 'inv_misc_questionmark'}.jpg`;
const WH = id => (lang() === 'ru' ? `https://www.wowhead.com/forever/ru/item=${id}` : `https://www.wowhead.com/forever/item=${id}`);
const WH_SEARCH = q => (lang() === 'ru' ? 'https://www.wowhead.com/forever/ru/search?q=' : 'https://www.wowhead.com/forever/search?q=') + encodeURIComponent(q);
// The sim stores SpellItemEnchantment ids, which Wowhead does not serve as pages; enchant names
// resolve to their item pages through Wowhead search.
const enchantHref = label => WH_SEARCH(String(label).replace(/\s*\(.*$/, '').trim());
const WH_TALENTS = (cls, t) => (lang() === 'ru' ? `https://www.wowhead.com/forever/ru/talent-calc/${cls}/${t}` : `https://www.wowhead.com/forever/talent-calc/${cls}/${t}`);
const SIM_HOME = 'https://www.wowsims.com/forever/';
const CLASS_ICON = id => `https://wow.zamimg.com/images/wow/icons/medium/classicon_${id}.jpg`;
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const $ = id => document.getElementById(id);
// "Where to get it" lines in the page language; Russian ones come from the data
// build (Wowhead's Russian names) and fall back to English line by line.
const SRC = it => (lang() === 'ru' && (it.sources_ru || []).length ? it.sources_ru : (it.sources || []));
const sideOnly = side => (lang() === 'ru'
  ? ({ Alliance: 'только Альянс', Horde: 'только Орда' }[side] || side)
  : `${side} only`);

// ---------- i18n ----------
const STR = {
  tab_gear: { ru: 'Экипировка по слотам', en: 'Gear by slot' },
  tab_all: { ru: 'Сеты класса', en: 'Class loadouts' },
  matrix_sub: { ru: 'Все сеты выбранного класса бок о бок. Затемнённые ряды одинаковы во всех сетах; подсвеченная ячейка отличается от самого частого выбора. Переключай класс и спек сверху.', en: 'Every loadout of the selected class side by side. Faded rows are the same in every loadout; a shaded cell differs from the most common pick. Switch class and spec above.' },
  tab_howto: { ru: 'Как одеваться', en: 'How to gear' },
  howto_hit_title: { ru: 'Меткость', en: 'Hit' },
  howto_prio_title: { ru: 'Приоритет статов', en: 'Stat priority' },
  howto_best_title: { ru: 'Лучший сет', en: 'Best loadout' },
  howto_best_none: { ru: 'Симы не прогнаны', en: 'Not simmed yet' },
  howto_nums_title: { ru: 'Числа', en: 'The numbers' },
  howto_nums_body: { ru: 'Реальные прогоны WoWSims Forever', en: 'Real WoWSims Forever runs' },
  howto_ench_title: { ru: 'Энчанты лучшего сета (Максимум)', en: 'Best loadout’s enchants (Max)' },
  howto_ench_none: { ru: 'У сетов этого класса пока нет энчантов.', en: 'No enchants on this class’s sets yet.' },
  howto_budgets_title: { ru: 'Бюджеты', en: 'Budgets' },
  howto_budgets_body: { ru: '«Максимум» — весь пул кандидатов: PvP Premier, репутация Revered/Экзальтед, дорогие крафты. «Дёшево» — только свободнодоступное: без PvP-гринда и высокой репутации; «дорогие» слоты пересобираются из дешёвого пула.', en: 'Max — the full candidate pool: PvP Premier, revered+ reputation, expensive crafts. Cheap — freely accessible only: no PvP grind or high reputation; grindy slots rebuild from the cheap pool.' },
  howto_read_title: { ru: 'Как читать карточки', en: 'Reading the cards' },
  howto_read_body: { ru: 'Каждая строка — реальный прогон против лучшего предмета слота: полоса — отставание, ус — погрешность сима (95%). Всё в светлой полосе вокруг нуля — то же значение: носи, что уже есть. Клик по слоту куклы прыгает к его карточке; наведение на предмет показывает полный тултип со статами.', en: 'Every row is a real run against the slot’s best: the bar is the gap, the whisker the sim’s 95% margin. Anything in the shading around zero is the same value — wear what you have. Clicking a doll slot jumps to its card; hovering an item shows its full tooltip.' },
  howto_steps_title: { ru: 'Порядок действий', en: 'The order' },
  howto_steps: { ru: ['1. Добей кап меткости — см. карточку «Меткость» выше.', '2. Собери «Дёшево»-сет: в каждом слоте бери лучшее из доступного по полосам.', '3. Не гнись за «<6 DPS»: всё в пределах погрешности — то же значение.', '4. Апгрейдь слоты с самым большим разбросом — смотри «Сколько важен каждый слот» на вкладке экипировки.', '5. Сверься с «Максимум»-сетом: разница показана у куклы в факте «Другой бюджет».'], en: ['1. Reach the hit cap — see the Hit card above.', '2. Assemble the Cheap set: take each slot’s best affordable option by the bars.', '3. Do not chase sub-margin gaps: within the whisker it is the same value.', '4. Upgrade the widest-spread slots — see “How much each slot matters” on the gear tab.', '5. Compare against the Max set: the gap sits in the doll’s “Other budget” fact.'] },
  notes: {
    mage: { hit: { ru: '16% меткости заклинаний против босса 63 уровня; талант Точность в зачёт.', en: '16% spell hit against a level 63 boss; Precision counts.' },
            stat: { ru: 'Сила заклинаний, меткость до капа, потом крит; скорость и дух — по мане.', en: 'Spell damage, hit to the cap, then crit; haste and spirit for mana.' } },
    warlock: { hit: { ru: '16% меткости заклинаний против босса 63 уровня.', en: '16% spell hit against a level 63 boss.' },
            stat: { ru: 'Сила заклинаний и Shadow-урон, меткость до капа, потом крит.', en: 'Spell/shadow damage, hit to the cap, then crit.' } },
    priest: { hit: { ru: '16% меткости заклинаний против босса 63 уровня.', en: '16% spell hit against a level 63 boss.' },
            stat: { ru: 'Shadow-урон и сила заклинаний, меткость до капа, потом крит.', en: 'Shadow damage and spell power, hit to the cap, then crit.' } },
    druid: { hit: { ru: 'Балансу — 16% меткости заклинаний; фералам — 8% мили; мишке ещё и дефенс-кап 490.', en: 'Balance: 16% spell hit; ferals: 8% melee; bear also wants the 490 defense cap.' },
            stat: { ru: 'Баланс: сила заклинаний и урон природы. Кот: сила/ЛВ и медленное двуручное; мишка: броня и выносливость.', en: 'Balance: spell power and nature damage. Cat: strength/AP and a slow two-hander; bear: armor and stamina.' } },
    hunter: { hit: { ru: '8% дальнего боя против босса 63 уровня (талант +3% из Выживания в зачёт).', en: '8% ranged hit against a level 63 boss (the Survival +3% talent counts).' },
            stat: { ru: 'Ловкость — главный стат; медленное оружие для плетения, быстрый лук — только для турреты.', en: 'Agility leads; a slow melee weapon for weaving, a fast bow only for turret.' } },
    rogue: { hit: { ru: '8% на спец-атаки; белые удары с двумя оружиями мажут заметно чаще — сим это учитывает.', en: '8% on specials; white swings with two weapons miss far more — the sim accounts for it.' },
            stat: { ru: 'Ловкость, крит, скорость и экспертиза; медленный клинок в правую руку.', en: 'Agility, crit, haste and expertise; a slow blade in the main hand.' } },
    shaman: { hit: { ru: 'Элему — 16% меткости заклинаний; энху — 8% мили.', en: 'Elemental: 16% spell hit; Enhancement: 8% melee.' },
            stat: { ru: 'Элем: сила заклинаний. Энх: медленный правый клинок, сила и ЛВ.', en: 'Elemental: spell power. Enhancement: slow main hand, strength and AP.' } },
    warrior: { hit: { ru: 'ДПС-воину — 8% на спец-атаки; проту — дефенс-кап 490 (крит-иммунитет).', en: 'DPS warrior: 8% on specials; Protection: the 490 defense cap.' },
            stat: { ru: 'Фури: сила, крит, скорость, экспертиза. Армс: медленное двуручное. Прот: выносливость и броня.', en: 'Fury: strength, crit, haste, expertise. Arms: a slow two-hander. Prot: stamina and armor.' } },
    paladin: { hit: { ru: 'Ретри — 8% мили; проту — дефенс-кап 490 (крит-иммунитет).', en: 'Ret: 8% melee; Protection: the 490 defense cap.' },
            stat: { ru: 'Ретри: сила и экспертиза, медленное двуручное. Прот: выносливость, броня и ТПС.', en: 'Ret: strength and expertise with a slow two-hander. Prot: stamina, armor and TPS.' } }
  },
  tab_method: { ru: 'Методика', en: 'Method' },
  slot_importance: { ru: 'Сколько важен каждый слот', en: 'How much each slot matters' },
  tab_refresh: { ru: 'Данные и обновление', en: 'Data & refresh' },
  tab_plan: { ru: 'План одевания', en: 'Gearing plan' },
  plan_title: { ru: 'План одевания', en: 'Gearing plan' },
  plan_sub: { ru: 'Весь BiS-сет по источникам: отметь, что уже есть, и видно, сколько осталось. Бюджет и спек переключаются сверху.', en: 'The whole BiS set grouped by where it comes from: tick what you already have and see what is left. Switch budget and spec above.' },
  plan_progress: { ru: 'Собрано {d} из {t}', en: '{d} of {t} collected' },
  plan_budget: { ru: 'План для бюджета «{b}»', en: 'Plan for the “{b}” budget' },
  plan_copy: { ru: 'Скопировать список', en: 'Copy list' },
  plan_copied: { ru: 'Скопировано', en: 'Copied' },
  plan_reset: { ru: 'Сбросить отметки', en: 'Clear ticks' },
  plan_local: { ru: 'Отметки хранятся только в этом браузере и никуда не отправляются.', en: 'Ticks live in this browser only and are never sent anywhere.' },
  plan_ench: { ru: 'Энчанты', en: 'Enchants' },
  plan_ench_hint: { ru: 'Энчант из BiS-сета', en: 'The enchant from the BiS set' },
  plan_dungeons: { ru: 'Подземелья', en: 'Dungeons' },
  plan_quests: { ru: 'Квесты', en: 'Quests' },
  plan_rep: { ru: 'Репутация', en: 'Reputation' },
  plan_craft: { ru: 'Крафт', en: 'Crafted' },
  plan_vendors: { ru: 'Продавцы', en: 'Vendors' },
  plan_pvp: { ru: 'PvP', en: 'PvP' },
  plan_world: { ru: 'Мировой дроп и аукцион', en: 'World drops & auction' },
  plan_other: { ru: 'Прочее', en: 'Other' },
  plan_empty: { ru: 'Для этого сета пока нет данных — план появится вместе с прогоном.', en: 'No data for this set yet — the plan appears with a sim run.' },
  plan_only_left: { ru: 'Только не собранное', en: 'Only what is left' },
  plan_search_ph: { ru: 'Предмет или источник', en: 'Item or source' },
  plan_nothing: { ru: 'Под фильтр ничего не подходит — ослабь его или сбрось.', en: 'Nothing matches the filter — loosen or clear it.' },
  plan_fallback: { ru: 'альтернатива из другого источника', en: 'alternative from another source' },
  plan_open_sim: { ru: 'Открыть сет в WoWSims ↗', en: 'Open the set in WoWSims ↗' },
  chip_no_data: { ru: 'Симы не прогнаны', en: 'No sim runs yet' },
  chip_ok: { ru: 'Симы', en: 'Simmed' },
  chip_stale: { ru: 'данные старше N дней', en: 'data older than N days' },
  ref_status: { ru: 'Статус данных', en: 'Data status' },
  ref_last_update: { ru: 'Последнее обновление', en: 'Last update' },
  ref_owner_only: { ru: 'Данные обновляются автоматически — каждый день. Числа на странице всегда последние; от посетителя ничего не требуется.', en: 'The data refreshes automatically — every day. The numbers on the page are always the latest; visitors never need to do anything.' },
  ref_ok_line: { ru: 'Прогон', en: 'Last run' },
  fresh_title: { ru: 'Обновление по классам', en: 'Refresh by class' },
  fresh_note: { ru: 'Дата — когда сеты этого класса реально посчитаны симулятором. Если класс отстал или что-то не просчиталось, это видно здесь, а не маскируется общей датой.', en: 'The date is when this class’s sets were actually simmed. A class that lags behind, or a set that failed, shows here instead of hiding behind the site-wide date.' },
  fresh_last: { ru: 'Последний прогон', en: 'Last simmed' },
  fresh_sets: { ru: 'Сетов', en: 'Sets' },
  fresh_wait: { ru: 'Ждут прогона', en: 'Waiting' },
  fresh_sum: { ru: 'Обновлено в этот прогон: {n} из {m} классов', en: 'Refreshed in this run: {n} of {m} classes' },
  delta_vs_bis: { ru: 'Статы против BiS', en: 'Stats vs BiS' },
  delta_note: { ru: 'Бонусы комплектов и эффекты не учтены', en: 'Set bonuses and effects are not included' },
  delta_why_title: { ru: 'Сравнение с BiS', en: 'Compared with BiS' },
  delta_why_body: { ru: 'Плюс значит, что у этого варианта такого стата больше, чем у BiS-предмета в этом слоте, минус, меньше. Считаются статы предмета и энчанта. Бонусы комплектов и эффекты не входят.', en: 'A plus means this option has more of that stat than the BiS item in this slot, a minus less. Item and enchant stats only. Set bonuses and effects are not included.' },
  chart_why_title: { ru: 'Как читать полосу', en: 'Reading the bar' },
  chart_why_best: { ru: 'Лучший предмет в слоте: полоса стоит на нуле.', en: 'The best item in the slot: the bar sits at zero.' },
  chart_why_same: { ru: 'Разница с лучшим в пределах погрешности сима.', en: 'The gap to the best is inside the sim margin.' },
  chart_why_row: { ru: '{d} ±{m}: на столько предмет проигрывает лучшему.', en: '{d} ±{m}: how far this item is behind the best.' },
  chart_why_body: { ru: 'Полоса показывает, насколько предмет проигрывает лучшему, ус, погрешность сима (±). Всё внутри заливки вокруг лучшей линии, то же значение.', en: 'The bar shows how far an item is behind the best, the whisker is the sim margin (±). Anything inside the shading around the best line is the same value.' },
  ref_commit_line: { ru: 'Симулятор', en: 'Simulator' },
  ref_auto: { ru: 'Как числа попадают на сайт', en: 'How numbers get here' },
  ref_auto_body: { ru: 'Сайт не считает симы сам: каждое утро свежая версия WoWSims Forever прогоняет каждый спек, и страница пересобирается с новыми числами. Всё происходит автоматически. Хил-спеки симулятор пока не поддерживает — их сеты взяты из гайдов Wowhead и помечены бейджем; когда поддержка появится, сет заменится симмированными числами сам.', en: 'The site does not run sims itself: every morning a fresh WoWSims Forever build sims every spec and the page is rebuilt with the new numbers. All of it is automatic. Healer specs are not supported by the sim yet — their sets come from Wowhead guides and carry a badge; when support lands, the set is replaced with simmed numbers on its own.' },
  ref_new_title: { ru: 'Как читать числа', en: 'Reading the numbers' },
  ref_new_body: { ru: 'Каждое число на странице — реальный прогон симулятора; на полосах показана погрешность ±. Любое число можно проверить самому: нажми «Открыть сет в WoWSims» над сетом — симулятор откроется с этим же снаряжением, талантами и боссом.', en: 'Every number on this page is a real simulator run; the bars show the ± margin. Any number can be checked: press “Open this set in WoWSims” above the set — the sim opens with the same gear, talents and boss.' },
  no_sim: { ru: 'BiS по гайду Wowhead · сим пока не поддерживает спек', en: 'Wowhead guide BiS · the sim does not support this spec yet' },
  wowhead_badge: { ru: 'Wowhead-гайд', en: 'Wowhead guide' },
  wowhead_note: { ru: 'Этот сет собран по гайду Wowhead: симулятор пока не умеет считать этот спек, поэтому Δ-чисел нет. Когда научится, сет заменится автоматически.', en: 'This set comes from a Wowhead guide: the simulator cannot sim this spec yet, so there are no DPS deltas. When it can, the set is replaced automatically.' },
  open_guide: { ru: 'Открыть гайд Wowhead ↗', en: 'Open the Wowhead guide ↗' },
  cls: { ru: 'Класс', en: 'Class' },
  spec: { ru: 'Спек', en: 'Spec' },
  budget: { ru: 'Бюджет', en: 'Budget' },
  budget_max: { ru: 'Максимум', en: 'Max' },
  budget_cheap: { ru: 'Дёшево', en: 'Cheap' },
  budget_pending: { ru: 'ещё считается — появится после ближайшего обновления', en: 'still simming — lands with the next refresh' },
  vs_other: { ru: 'Другой бюджет', en: 'Other budget' },
  howto_open_set: { ru: 'Открыть сет →', en: 'Open the set →' },
  howto_talents: { ru: 'Таланты на Wowhead ↗', en: 'Talents on Wowhead ↗' },
  topn: { ru: 'Опций на слот', en: 'Options per slot' },
  filter: { ru: 'Фильтр', en: 'Filter' },
  search_ph: { ru: 'Название предмета, босс или зона', en: 'Item, boss or zone name' },
  q_showing: { ru: 'Показано {n} из {m}', en: 'Showing {n} of {m}' },
  q_total: { ru: 'вариантов: {m}', en: 'options: {m}' },
  q_none_short: { ru: 'ничего не найдено', en: 'nothing found' },
  q_none: { ru: 'По этому запросу ничего нет. Попробуй название предмета, босса или зоны — подсказки появляются при вводе.', en: 'Nothing matches. Try an item, boss or zone name — suggestions appear as you type.' },
  q_reset: { ru: 'Сбросить фильтр', en: 'Clear filter' },
  pick_hint: { ru: 'Клик по строке — примерить предмет', en: 'Click a row to try the item on' },
  est_label: { ru: 'оценка сборки', en: 'build estimate' },
  est_reset: { ru: 'Вернуть BiS', en: 'Back to BiS' },
  est_bis: { ru: 'BiS', en: 'BiS' },
  est_note: { ru: 'Оценка — сумма вкладов замен, измеренных по одной. Бонусы комплектов и связи статов могут её сдвинуть; точное число даст только новый прогон.', en: 'The estimate adds up the swaps’ measured contributions, one at a time. Set bonuses and stat interactions can shift it; only a new run gives the exact number.' },
  est_sets: { ru: 'Комплект изменился — оценка особенно грубая.', en: 'A set bonus changed — the estimate is especially rough.' },
  est_dup: { ru: 'Уникальный предмет выбран дважды:', en: 'A unique item is picked twice:' },
  open_sim_bis: { ru: 'Открыть BiS-сет в WoWSims ↗', en: 'Open the BiS set in WoWSims ↗' },
  stats_title: { ru: 'Статы в симуляции', en: 'Stats in the sim' },
  stats_note: { ru: 'с рейд-бафами и расходниками', en: 'with raid buffs and consumables' },
  stats_title_bis: { ru: 'Статы BiS-сета в симуляции', en: 'BiS set stats in the sim' },
  stats_delta: { ru: 'Изменение от примерки', en: 'Change from trying items on' },
  stats_delta_note: { ru: 'по предметам и энчантам; бонусы комплектов и эффекты не учтены', en: 'from item stats and enchants; set bonuses and effects are not counted' },
  stats_same: { ru: 'Статы предметов не изменились', en: 'Item stats are unchanged' },
  to_top: { ru: 'Наверх', en: 'Back to top' },
  open_current: { ru: 'Открыть текущий сет в WoWSims ↗', en: 'Open the current set in WoWSims ↗' },
  view_slider: { ru: 'Слайдер', en: 'Slider' },
  view_table: { ru: 'Таблица', en: 'Table' },
  scroll_hint: { ru: 'Прокрутите таблицу вбок, чтобы увидеть все сеты.', en: 'Scroll the table sideways to see every set.' },
  set_counter: { ru: '{i} из {n}', en: '{i} of {n}' },
  prev_set: { ru: 'Предыдущий сет', en: 'Previous set' },
  next_set: { ru: 'Следующий сет', en: 'Next set' },
  every_slot: { ru: 'Каждая опция, слот за слотом', en: 'Every option, slot by slot' },
  matrix_sub: { ru: 'Все сеты бок о бок. Ряды без подсветки одинаковы во всех сетах; подсвеченная ячейка отличается от самого частого выбора.', en: 'Every loadout side by side. Faded rows are the same in every loadout; a shaded cell differs from the most common pick.' },
  best: { ru: 'Лучший', en: 'Best' },
  all_sources: { ru: 'Все источники', en: 'All sources' },
  n_of_sources: { ru: 'источников', en: 'sources' },
  show_all: { ru: 'Показать все', en: 'Show all' },
  empty_slot: { ru: 'В этом слоте фильтрам ничего не подходит.', en: 'Nothing in this slot passes your filters.' },
  hidden_best: { ru: 'Лучший предмет слота скрыт вашими фильтрами.', en: 'The best item for this slot is hidden by your filters.' },
  no_source: { ru: 'Источник неизвестен', en: 'Source unknown' },
  empty_title: { ru: 'Симы для этого спека ещё не прогнаны', en: 'Not simmed yet' },
  empty_body: { ru: 'На странице нет придуманных чисел: карточки появятся после ближайшего автоматического обновления (ежедневно).', en: 'No invented numbers here: the cards appear after the next automatic refresh (daily).' },
  failed_title: { ru: 'Билд не просчитался в последнем обновлении', en: 'This loadout failed in the last refresh' },
  simmed_on: { ru: 'Прогон этого сета', en: 'Simmed on' },
  empty_run: { ru: '', en: '' },
  no_preset_title: { ru: 'Симулятор пока не умеет считать этот спек', en: 'The simulator cannot sim this spec yet' },
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
  budget: 'max', topn: 4, q: '', srcs: new Set(SOURCE_KINDS), tab: 'gear',
  pick: {}, pickLid: '', matrixView: 'table',
  planKinds: new Set(['dungeon', 'quest', 'rep', 'craft', 'vendor', 'pvp', 'world', 'other', 'ench']),
  planHideDone: false, planQ: ''
};
const fromHash = () => {
  const p = new URLSearchParams(location.hash.slice(1));
  if (['ru', 'en'].includes(p.get('lang'))) state.lang = p.get('lang');
  if (G.classes.some(c => c.id === p.get('cls'))) { state.cls = p.get('cls'); }
  const C = curClass();
  if (C && C.specs.some(s => s.id === p.get('spec'))) state.spec = p.get('spec');
  else if (C) state.spec = C.specs[0].id;
  if (['max', 'cheap'].includes(p.get('budget'))) state.budget = p.get('budget');
  if (['gear', 'all', 'howto', 'method', 'refresh', 'plan'].includes(p.get('tab'))) state.tab = p.get('tab');
  if (['3', '4', '6'].includes(p.get('topn'))) state.topn = +p.get('topn');
};
const toHash = () => history.replaceState(null, '', `#tab=${state.tab}&lang=${state.lang}&cls=${state.cls}&spec=${state.spec}${budgetOf(curSpec()) ? `&budget=${state.budget}` : ''}&topn=${state.topn}`);

const curClass = () => G.classes.find(c => c.id === state.cls);
const curSpec = () => (curClass() || G.classes[0]).specs.find(s => s.id === state.spec) || (curClass() || G.classes[0]).specs[0];
const loadoutKey = sp => {
  const P = sp.prefix, L = G.loadouts;
  if (L[`${P}-${state.budget}`]) return `${P}-${state.budget}`;
  if (L[`${P}-max`]) return `${P}-max`;
  if (L[`${P}-wowhead`]) return `${P}-wowhead`;
  return P;
};
const loadout = sp => G.loadouts[loadoutKey(sp || curSpec())];
const budgetOf = sp => !!(G.loadouts[`${sp.prefix}-max`] && G.loadouts[`${sp.prefix}-cheap`]);
const hasMaxOf = sp => !!(G.loadouts[`${sp.prefix}-max`] || G.loadouts[sp.prefix]);
const hasCheapOf = sp => !!G.loadouts[`${sp.prefix}-cheap`];
const budgetLabel = b => T(b === 'cheap' ? 'budget_cheap' : 'budget_max');
const lang = () => state.lang;
const L2 = o => (o && typeof o === 'object') ? (o[lang()] || o.en || o.ru || '') : (o == null ? '' : o);
const item = id => G.items[id];
const qc = it => `color:var(--q${it ? it.q : 1})`;
const itemName = spec => {
  const it = item(spec[0]);
  if (!it) return '—';
  const sfx = spec[2] && G.suffixes[spec[2]] ? ' ' + G.suffixes[spec[2]] : '';
  const ru = lang() === 'ru' && it.name_ru;
  return (ru ? it.name_ru : it.name) + sfx;
};
const enchantName = spec => spec[3] || (spec[1] ? 'Enchant ' + spec[1] : '');
const fmt = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}`;
const fmtStamp = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = n => String(n).padStart(2, '0');
  const date = lang() === 'ru'
    ? `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`
    : `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  return `${date} · ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
};
const fmtSimmed = () => {
  const m = G.meta;
  if (!m.hasData) return '';
  return fmtStamp(m.simmedAt) || m.simmed || '';
};
const fmtMetric = v => (v == null ? '-' : v >= 10000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v).toString());
const fmtStat = s => s.pct ? Number(s.v).toFixed(1) + '%' : Number(s.v).toLocaleString(lang() === 'ru' ? 'ru-RU' : 'en-US');
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
  $('method').innerHTML = L2(G.method);
  const stamp = $('stamp');
  stamp.hidden = false;
  if (!G.meta.hasData) {
    stamp.innerHTML = `<b class="stale">${esc(T('stamp_notrun'))}</b> — ${esc(L2(G.meta.footer))}`;
  } else {
    stamp.innerHTML = `<b>${esc(T('stamp_run'))}: WoWSims Forever · ${esc(fmtSimmed())}</b> — ${esc(L2(G.meta.footer))}`;
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
const norm = s => String(s == null ? '' : s).toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
const qTokens = () => norm(state.q).split(' ').filter(Boolean);

// Everything a row can be found by: both item names, source strings, slot, type, set.
function rowText(specs) {
  const parts = [];
  for (const [slot, spec] of specs) {
    const it = item(spec[0]);
    if (!it) continue;
    parts.push(itemName(spec), it.name, it.name_ru || '', it.kind || '', it.set || '', slotLabel(slot));
    parts.push((it.sources || []).join(' '), (it.sources_ru || []).join(' '));
  }
  return norm(parts.join(' '));
}
function rowPasses(specs) {
  const toks = qTokens();
  const okSource = specs.every(([, spec]) => {
    const it = item(spec[0]);
    if (!it) return true;
    return (it.kinds || []).some(k => state.srcs.has(k));
  });
  if (!okSource) return false;
  if (!toks.length) return true;
  const hay = rowText(specs);
  return toks.every(t => hay.includes(t));
}

// Suggestions built from what the page actually lists: names, sources, slots, types.
function fillSearchSuggestions(L) {
  const list = $('qlist');
  if (!list || !L) return;
  const seen = new Set(), out = [];
  const add = v => {
    const s = String(v || '').trim();
    const k = norm(s);
    if (k.length < 2 || seen.has(k)) return;
    seen.add(k);
    out.push(s);
  };
  for (const g of L.groups || []) {
    add(slotLabel(g.id));
    for (const row of [g.best, ...(g.rows || [])]) {
      if (!row || !row.move) continue;
      for (const [slot, spec] of Object.entries(row.move)) {
        const it = item(spec[0]);
        if (!it) continue;
        add(itemName(spec));
        add(it.name);
        add(it.kind);
        add(it.set);
        for (const src of [...(it.sources || []), ...(it.sources_ru || [])]) add(src);
      }
    }
  }
  out.sort((a, b) => a.localeCompare(b, lang()));
  list.innerHTML = out.slice(0, 500).map(v => `<option value="${esc(v)}"></option>`).join('');
}

// How many candidate variants pass the current filters, out of all listed.
function countRows(L) {
  let shown = 0, all = 0;
  for (const g of L.groups || []) {
    const hasBest = g.best && Object.keys(g.best).length > 0;
    const rows = [...(hasBest ? [{ move: g.best }] : []), ...(g.rows || [])];
    all += rows.length;
    shown += rows.filter(r => rowPasses(Object.entries(r.move))).length;
  }
  return { shown, all };
}

// ---------- trying items on ----------
const sigOf = move => Object.entries(move || {})
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([s, v]) => `${s}:${v[0]}:${v[2] || 0}`).join('|');

// What the visitor picked, group by group; an empty map means the BiS set.
function pickState(L) {
  let delta = 0, count = 0;
  for (const [gid, p] of Object.entries(state.pick)) {
    const g = (L.groups || []).find(x => x.id === gid);
    if (!g || !p || p.sig === 'best') continue;
    delta += p.d;
    count++;
  }
  return { delta, count };
}

function effectiveGear(L) {
  const gear = { ...L.gear };
  for (const [gid, p] of Object.entries(state.pick)) {
    const g = (L.groups || []).find(x => x.id === gid);
    if (!g || !p || p.sig === 'best') continue;
    for (const s of Object.keys(g.best || {})) delete gear[s];
    Object.assign(gear, p.move);
  }
  return gear;
}

// A unique item (a ring, a trinket) cannot be worn twice, even after picks.
function duplicateUnique(gear) {
  const seen = new Set();
  for (const v of Object.values(gear)) {
    if (!v || !v[0]) continue;
    const it = item(v[0]);
    if (!it || !it.unique) continue;
    if (seen.has(v[0])) return it;
    seen.add(v[0]);
  }
  return null;
}

// Picking pieces can take the set count up or down, which the per-slot sums miss.
function setChanged(bis, gear) {
  const counts = g => {
    const m = {};
    for (const v of Object.values(g || {})) {
      if (!v || !v[0]) continue;
      const it = item(v[0]);
      if (it && it.set) m[it.set] = (m[it.set] || 0) + 1;
    }
    return m;
  };
  const a = counts(bis), b = counts(gear);
  return Object.keys({ ...a, ...b }).some(k => (a[k] || 0) !== (b[k] || 0));
}

// ---------- stat change from the picks ----------
// Item stats are additive and known per item (build_data stores them in display
// units: percentages for ratings, points otherwise). Set bonuses and procs are
// not part of a single item's stats, so the change is labelled as item-only.
const PCT_KEYS = new Set(['hit', 'crit', 'haste', 'exp', 'block', 'dodge', 'parry']);
const SUFFIX_KEY = {
  Strength: 'str', Agility: 'agi', Stamina: 'sta', Intellect: 'int', Spirit: 'spirit',
  'Healing Power': 'heal', 'Spell Damage': 'sp', 'Mana per 5 sec.': 'mp5',
  'Arcane Damage': 'arcane', 'Fire Damage': 'fire', 'Frost Damage': 'frost',
  'Holy Damage': 'holy', 'Nature Damage': 'nature', 'Shadow Damage': 'shadow',
  'Attack Power': 'ap', 'Ranged Attack Power': 'rap',
};
const MOD_LABEL = {
  str: ['Сила', 'Strength'], agi: ['Ловкость', 'Agility'], sta: ['Выносливость', 'Stamina'],
  int: ['Интеллект', 'Intellect'], spirit: ['Дух', 'Spirit'], mp5: ['Мана в 5 сек', 'MP5'],
  hp: ['Здоровье', 'Health'], mana: ['Мана', 'Mana'], armor: ['Броня', 'Armor'],
  sp: ['Сила заклинаний', 'Spell power'], heal: ['Сила исцеления', 'Healing power'],
  ap: ['Сила атаки', 'Attack power'], rap: ['Сила атаки (дальний бой)', 'Ranged attack power'],
  arcane: ['Урон тайной магии', 'Arcane damage'], fire: ['Урон огня', 'Fire damage'],
  frost: ['Урон льда', 'Frost damage'], holy: ['Урон света', 'Holy damage'],
  nature: ['Урон природы', 'Nature damage'], shadow: ['Урон тьмы', 'Shadow damage'],
  hit: ['Меткость', 'Hit'], crit: ['Крит', 'Crit'], haste: ['Скорость', 'Haste'],
  exp: ['Мастерство', 'Expertise'], block: ['Блок', 'Block'],
  dodge: ['Уклонение', 'Dodge'], parry: ['Парирование', 'Parry'],
  def: ['Защита', 'Defense'], bv: ['Ценность блока', 'Block value'],
};
const MOD_ORDER = ['armor', 'sta', 'int', 'str', 'agi', 'spirit', 'sp', 'heal', 'arcane', 'fire', 'frost',
  'holy', 'nature', 'shadow', 'ap', 'rap', 'hit', 'crit', 'haste', 'exp', 'def', 'dodge', 'parry', 'block', 'bv',
  'mp5', 'hp', 'mana'];
// Gear slot → the item type an enchant is keyed by (same numbers the game data uses).
const SLOT_TYPE = {
  head: 1, neck: 2, shoulder: 3, back: 4, chest: 5, wrist: 6, hands: 7, waist: 8, legs: 9, feet: 10,
  finger1: 11, finger2: 11, trinket1: 12, trinket2: 12, main_hand: 13, off_hand: 13, ranged: 14,
};

function accumulate(acc, spec, sign, slot) {
  if (!spec || !spec[0]) return;
  const it = item(spec[0]);
  if (!it) return;
  for (const [k, v] of it.mods || []) acc.set(k, (acc.get(k) || 0) + sign * v);
  const sfx = spec[2] && it.suffixStats && it.suffixStats[spec[2]];
  if (sfx) for (const [name, v] of sfx) {
    const k = SUFFIX_KEY[name];
    if (k) acc.set(k, (acc.get(k) || 0) + sign * v);
  }
  const em = spec[1] && G.enchants && G.enchants[String(spec[1])];
  if (em) {
    const keys = Object.keys(em);
    const md = em[SLOT_TYPE[slot]] || (keys.length === 1 ? em[keys[0]] : null);
    if (md) for (const [k, v] of md) acc.set(k, (acc.get(k) || 0) + sign * v);
  }
}

function gearDelta(bis, gear, metric) {
  const acc = new Map();
  for (const s of SLOT_ORDER) { accumulate(acc, bis[s], -1, s); accumulate(acc, gear[s], 1, s); }
  const rows = [];
  for (const k of MOD_ORDER) {
    if (k === 'heal' && metric !== 'hps') continue;  // healing power cannot move a DPS number
    const v = acc.get(k);
    const label = MOD_LABEL[k];
    if (!v || !label) continue;
    const pct = PCT_KEYS.has(k);
    if (Math.abs(v) < (pct ? 0.05 : 0.5)) continue;
    rows.push({ ru: label[0], en: label[1], v: pct ? Math.round(v * 10) / 10 : Math.round(v), pct });
  }
  return rows;
}

// What one swapped slot changes in item stats, as a short line ("+13 Меткость · −8 Ловкость").
// Enchants and suffixes count, set bonuses and procs do not — the same rule as the stats delta.
function slotDeltaText(bisSpec, candSpec, slot, metric) {
  const acc = new Map();
  accumulate(acc, bisSpec, -1, slot);
  accumulate(acc, candSpec, 1, slot);
  const out = [];
  for (const k of MOD_ORDER) {
    if (k === 'heal' && metric !== 'hps') continue;
    const v = acc.get(k) || 0;
    const label = MOD_LABEL[k];
    if (!v || !label || Math.abs(v) < 0.5) continue;
    out.push(`${v > 0 ? '+' : '−'}${Math.abs(Math.round(v))} ${label[lang() === 'ru' ? 0 : 1]}`);
    if (out.length === 5) break;
  }
  return out.join(' · ');
}
const fmtDelta = d => `${d.v > 0 ? '+' : '−'}${Math.abs(d.v)}${d.pct ? '%' : ''}`;

// ---------- a WoWSims link for the set on the doll ----------
// The share link is the settings as binary protobuf, zlib-deflated, base64. We keep
// the BiS link's bytes (buffs, encounter, rotation, talents untouched) and replace
// only player.equipment (IndividualSimSettings.player = 3, Player.equipment = 3,
// EquipmentSpec.items = 1, ItemSpec id/enchant/randomSuffix = 1/3/2).
const SIM_SLOTS = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist', 'hands', 'waist', 'legs', 'feet',
  'finger1', 'finger2', 'trinket1', 'trinket2', 'main_hand', 'off_hand', 'ranged'];

function varint(n) {
  const out = [];
  n = Math.max(0, n | 0);
  while (n > 127) { out.push((n & 127) | 128); n >>>= 7; }
  out.push(n);
  return out;
}
const tagOf = (f, w) => varint((f << 3) | w);
const fieldVarint = (f, v) => (v ? [...tagOf(f, 0), ...varint(v)] : []);
const fieldBytes = (f, bytes) => [...tagOf(f, 2), ...varint(bytes.length), ...bytes];

function parseFields(bytes) {
  const out = [];
  let i = 0;
  const readVarint = () => {
    let shift = 0, val = 0;
    for (;;) {
      const b = bytes[i++];
      val += (b & 0x7f) * 2 ** shift;
      if (!(b & 0x80)) return val;
      shift += 7;
    }
  };
  while (i < bytes.length) {
    const start = i, key = readVarint(), field = Math.floor(key / 8), wire = key & 7;
    let data = null;
    if (wire === 0) readVarint();
    else if (wire === 2) { const len = readVarint(); data = bytes.subarray(i, i + len); i += len; }
    else if (wire === 5) i += 4;
    else if (wire === 1) i += 8;
    else throw new Error('protobuf wire type ' + wire);
    out.push({ field, wire, data, start, end: i });
  }
  return out;
}

// The message bytes with one field's payload replaced; every other byte is kept as is.
function replacePayload(bytes, field, make) {
  const chunks = [];
  let hit = 0;
  for (const f of parseFields(bytes)) {
    if (f.field === field && f.wire === 2) {
      chunks.push(new Uint8Array(fieldBytes(field, make(f.data))));
      hit++;
    } else {
      chunks.push(bytes.subarray(f.start, f.end));
    }
  }
  if (!hit) throw new Error('field ' + field + ' not found');
  return new Uint8Array(chunks.flatMap(c => Array.from(c)));
}

function equipmentBytes(gear) {
  const out = [];
  for (const s of SIM_SLOTS) {
    const v = gear[s] || [];
    out.push(...fieldBytes(1, [
      ...fieldVarint(1, v[0] | 0),
      ...fieldVarint(2, v[2] | 0),
      ...fieldVarint(3, v[1] | 0),
    ]));
  }
  return new Uint8Array(out);
}

const inflateBytes = async bytes => new Uint8Array(await new Response(
  new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
const deflateBytes = async bytes => new Uint8Array(await new Response(
  new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
const b64encode = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

async function currentSimLink(L, gear) {
  if (!L || !L.simLink) return null;
  const [base, hash] = L.simLink.split('#');
  if (!hash) return null;
  const bin = await inflateBytes(Uint8Array.from(atob(hash), c => c.charCodeAt(0)));
  const patched = replacePayload(bin, 3, player => replacePayload(player, 3, () => equipmentBytes(gear)));
  return base + '#' + b64encode(await deflateBytes(patched));
}

// ---------- the character window ----------
function renderDoll() {
  const sp = curSpec(), L = loadout(sp);
  const lid = L ? loadoutKey(sp) : '';
  if (state.pickLid !== lid) { state.pickLid = lid; state.pick = {}; }
  const gear = L ? effectiveGear(L) : null;
  const slotHTML = s => {
    if (!L) return `<div class="slot empty"><span class="icon"></span><span class="meta"><span class="lbl">${esc(slotLabel(s))}</span><span class="nm">—</span></span></div>`;
    const spec = gear[s];
    if (!spec || !spec[0]) return `<div class="slot empty"><span class="icon"></span><span class="meta"><span class="lbl">${esc(slotLabel(s))}</span><span class="nm">—</span></span></div>`;
    const it = item(spec[0]);
    const q = it && it.q >= 3 ? ` q${it.q}` : '';
    const enLabel = enchantName(spec);
    const enHTML = enLabel
      ? (spec[1] ? `<a class="en" href="${esc(enchantHref(enLabel))}" target="_blank" rel="noopener" title="${esc(enLabel)} — Wowhead">${esc(enLabel)}</a>` : `<span class="en">${esc(enLabel)}</span>`)
      : '<span class="en">&nbsp;</span>';
    return `<div class="slot" data-go="${s}" data-tip="${spec[0]}" data-sfx="${spec[2] || 0}">
      <img class="icon${q}" src="${ICON(it.icon, 'large')}" alt="" loading="lazy"><span class="meta"><span class="lbl">${esc(slotLabel(s))}</span>
      <span class="nm" style="${qc(it)}">${esc(itemName(spec))}</span>
      ${enHTML}${itemStats(it, 6) ? `<span class="st">${esc(itemStats(it, 6))}</span>` : ''}</span></div>`;
  };
  const center = () => {
    if (!L) {
      const waiting = sp.status === 'no-preset';
      const failed = sp.status === 'failed';
      return `<div>
        <span class="small">${esc(L2(curClass().name))}</span><h2>${esc(L2(sp.name))}</h2>
        <p class="target">${esc(L2(G.meta.target))}</p>
        <div class="empty-note">
          <b>${esc(waiting ? T('no_preset_title') : failed ? T('failed_title') : T('empty_title'))}</b><br>
          ${esc(waiting || failed ? L2(sp.note) : T('empty_body'))}
        </div>
      </div>`;
    }
    const wh = L.source === 'wowhead';
    const ps = pickState(L);
    const est = L.value == null ? null : L.value + ps.delta;
    const dup = ps.count ? duplicateUnique(gear) : null;
    const setsChanged = ps.count ? setChanged(L.gear, gear) : false;
    const delta = ps.count ? gearDelta(L.gear, gear, L.metric) : [];
    return `<div>
      <span class="small">${esc(L2(curClass().name))}</span><h2>${esc(L2(L.title || sp.name))}${wh ? ` <span class="status-badge wow">${esc(T('wowhead_badge'))}</span>` : ''}</h2>
      <p class="target">${esc(L2(G.meta.target))}</p>
      ${wh
        ? `<div class="dps wowsource"><b>—</b><span>${esc(T('no_sim'))}</span></div>`
        : `<div class="dps${ps.count ? ' est' : ''}" ${L.margin && !ps.count ? `title="±${L.margin} (95%)"` : ''}><b>${ps.count ? '≈ ' : ''}${fmtMetric(est)}</b><span>${ps.count ? esc(T('est_label')) + ' · ' : ''}${esc(metricName(L.metric))}</span>
        ${L.hit ? `<span class="hps-n">${esc(L.hit)}</span>` : ''}</div>
        ${ps.count ? `<div class="estline"><span>${esc(T('est_bis'))} ${fmtMetric(L.value)}</span><b class="${ps.delta >= 0 ? 'up' : 'down'}">${ps.delta >= 0 ? '+' : ''}${ps.delta.toFixed(1)}</b><button class="linkbtn" type="button" data-pickreset="1">${esc(T('est_reset'))}</button></div>` : ''}`}
      <dl class="facts">
        <dt>${esc(T('build'))}</dt><dd>${esc(L2(L.build))}</dd>
        ${!wh && L.talents ? `<dt>${esc(T('talents'))}</dt><dd><a href="${esc(WH_TALENTS(state.cls, L.talents))}" target="_blank" rel="noopener" title="Wowhead"><code>${esc(L.talents)}</code></a></dd>` : ''}
        ${!wh && L.rotation ? `<dt>${esc(T('rotation'))}</dt><dd>${esc(L2(L.rotation))}</dd>` : ''}
        ${L.vsOther ? `<dt>${esc(T('vs_other'))}</dt><dd>${esc(L2(L.vsOther))}</dd>` : ''}
        ${L.simmedAt ? `<dt>${esc(T('simmed_on'))}</dt><dd>${esc(fmtStamp(L.simmedAt))}</dd>` : ''}
      </dl>
      ${wh && L.wowheadUrl ? `<a class="btn primary" href="${esc(L.wowheadUrl)}" target="_blank" rel="noopener">${esc(T('open_guide'))}</a>` : ''}
      <div class="center-actions">
        ${L.simLink && ps.count ? `<button class="btn primary" type="button" data-opencur="1">${esc(T('open_current'))}</button>` : ''}
        ${L.simLink ? `<a class="btn${ps.count ? '' : ' primary'}" href="${esc(L.simLink)}" target="_blank" rel="noopener">${esc(T(ps.count ? 'open_sim_bis' : 'open_sim'))}</a>` : ''}
      </div>
      ${L.stats && L.stats.length ? `<div class="statsbox">
        <div class="statstitle">${esc(T(ps.count ? 'stats_title_bis' : 'stats_title'))} <span class="statsnote">${esc(T('stats_note'))}</span></div>
        <div class="statsgrid">${L.stats.map(s => `<span><b>${esc(fmtStat(s))}</b> ${esc(lang() === 'ru' ? s.ru : s.en)}</span>`).join('')}</div>
        ${ps.count ? `<div class="estats">
          <div class="estats-t">${esc(T('stats_delta'))} <span>${esc(T('stats_delta_note'))}</span></div>
          ${delta.length
            ? `<div class="estats-l">${delta.map(x => `<span class="ed ${x.v > 0 ? 'up' : 'down'}">${esc(fmtDelta(x))}</span> ${esc(lang() === 'ru' ? x.ru : x.en)}`).join(' · ')}</div>`
            : `<div class="estats-l same">${esc(T('stats_same'))}</div>`}
        </div>` : ''}
      </div>` : ''}
      ${ps.count ? `<p class="estnote">${esc(T('est_note'))}${setsChanged ? ' ' + esc(T('est_sets')) : ''}${dup ? ' ' + esc(T('est_dup')) + ' ' + esc(itemName([dup.id])) : ''}</p>` : ''}
      <p class="blurb">${esc(wh ? T('wowhead_note') : L2(sp.note))}</p>
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
  const q = it.q >= 3 ? ` q${it.q}` : '';
  const enLabel = withEnchant && enchantName(spec);
  const en = enLabel
    ? (spec[1] ? `<a class="en" href="${esc(enchantHref(enLabel))}" target="_blank" rel="noopener" title="${esc(enLabel)} — Wowhead">${esc(enLabel)}</a>` : `<span class="en">${esc(enLabel)}</span>`)
    : '';
  return `<span class="it" data-tip="${spec[0]}" data-sfx="${spec[2] || 0}"><img class="icon xs${q}" loading="lazy" src="${ICON(it.icon)}" alt=""><a class="n" style="${qc(it)}" title="${esc(itemName(spec))}" href="${WH(spec[0])}" target="_blank" rel="noopener">${esc(itemName(spec))}</a>${en}</span>`;
}
const STAT_PRIORITY = ['agi', 'str', 'int', 'sp', 'heal', 'ap', 'rap', 'hit', 'crit', 'haste', 'exp',
  'def', 'dodge', 'parry', 'block', 'bv', 'sta', 'spirit', 'mp5', 'hp', 'mana', 'armor'];

// The item's own stats, in one quiet line. Primary stats lead, then the
// secondary ones (hit, crit, haste, defense and so on). This is what the card
// shows; the comparison against the BiS pick is what the hover explains.
function itemStats(it, max = 6) {
  const out = [];
  if (!it) return '';
  const mods = new Map(it.mods || []);
  for (const k of [...STAT_PRIORITY, ...MOD_ORDER]) {
    if (out.length >= max) break;
    const raw = mods.get(k);
    if (!raw) continue;
    const label = MOD_LABEL[k];
    if (!label) continue;
    const pct = PCT_KEYS.has(k);
    const v = pct ? Math.round(raw * 10) / 10 : Math.round(raw);
    out.push(`${v > 0 ? '+' : ''}${v}${pct ? '%' : ''} ${label[lang() === 'ru' ? 0 : 1]}`);
    mods.delete(k);
  }
  return out.join(' · ');
}

function rowHTML(r, x, gid, picked, bisMap, metric) {
  const specs = Object.entries(r.move).sort((a, b) => SLOT_ORDER.indexOf(a[0]) - SLOT_ORDER.indexOf(b[0]));
  const k = kindOf(r);
  const its = specs.map(([, spec]) => item(spec[0])).filter(Boolean);
  const srcs = its.length ? its : [];
  const sourceLine = srcs.map(it => SRC(it).join(' | ') || T('no_source')).join(' + ');
  const d = r.best ? `<b>${esc(T('best'))}</b>` : `<b>${fmt(r.d)}</b> <small>±${r.m.toFixed(1)}</small>`;
  const sig = r.best ? 'best' : sigOf(r.move);
  const st = specs.map(([, spec]) => itemStats(item(spec[0]))).filter(Boolean).join(' · ');
  const delta = r.best ? '' : specs.map(([s, spec]) => slotDeltaText(bisMap && bisMap[s], spec, s, metric)).filter(Boolean).join(' · ');
  const why = r.best ? T('chart_why_best') : (delta || T('chart_why_same'));
  return `<tr class="${k}${picked ? ' picked' : ''}" data-pick="1" data-g="${esc(gid)}" data-sig="${esc(sig)}" data-d="${r.best ? 0 : r.d}">
    <td class="c-item"><span class="pickmark" aria-hidden="true"></span><span class="items">${specs.map(([s, spec]) => itemHTML(spec, true)).join('<span class="plus">+</span>')}</span>${st ? `<span class="sdelta" data-why="${esc(why)}">${esc(st)}</span>` : ''}</td>
    <td class="c-where" title="${esc(sourceLine)}">${esc(srcs.map(it => SRC(it)[0] || T('no_source')).join(' + '))}</td>
    <td class="c-d" title="${r.best ? '' : fmt(r.d)}">${d}</td>
    <td class="c-chart" data-chart="1" data-d="${r.best ? 0 : r.d}" data-m="${r.m}" data-best="${r.best ? 1 : 0}">${gapChart(r, x)}</td></tr>`;
}
function groupHTML(g, L) {
  const hasBest = g.best && Object.keys(g.best).length > 0;
  const rows = [...(hasBest ? [{ move: g.best, d: 0, m: 0, best: true }] : []), ...(g.rows || [])].sort((a, b) => b.d - a.d);
  const passing = rows.filter(r => rowPasses(Object.entries(r.move)));
  if (!passing.length && qTokens().length) return '';
  const shown = passing.slice(0, state.topn);
  const x = scaleFor(shown.length ? shown : rows.slice(0, 1));
  const cur = state.pick[g.id];
  const head = `<tr class="gh"><th colspan="4" scope="rowgroup"><span class="ghn">${esc(glabel(g.id))}</span>${g.note ? `<span class="ghnote">${esc(L2(g.note))}</span>` : ''}</th></tr>`;
  const body = shown.length ? shown.map(r => {
    const sig = r.best ? 'best' : sigOf(r.move);
    const picked = cur ? cur.sig === sig : !!r.best;
    return rowHTML(r, x, g.id, picked, g.best, L.metric);
  }).join('') : `<tr><td colspan="4" class="empty">${esc(T('empty_slot'))}</td></tr>`;
  const hiddenBest = hasBest && shown.length && !rowPasses(Object.entries(g.best)) ? `<tr><td colspan="4" class="empty">${esc(T('hidden_best'))}</td></tr>` : '';
  return `<tbody class="grp" id="card-${g.id}" style="${bandVars(x, shown)}">${head}${body}${hiddenBest}</tbody>`;
}
const glabel = id => slotLabel(id === 'two_hand' ? 'two_hand' : id === 'weapons' ? 'weapons' : id);
function renderCards() {
  const L = loadout();
  if (!L || !L.groups || !L.groups.length) {
    if (L && L.source === 'wowhead') {
      $('cards').innerHTML = `<div class="empty-note">${esc(T('wowhead_note'))}${L.wowheadUrl ? ` <a href="${esc(L.wowheadUrl)}" target="_blank" rel="noopener">${esc(T('open_guide'))}</a>` : ''}</div>`;
    } else {
      $('cards').innerHTML = `<div class="empty-note">${esc(T('empty_title'))} — ${esc(T('empty_body'))}</div>`;
    }
    $('ovd').hidden = true;
    if ($('qcount')) $('qcount').textContent = '';
    if ($('pickhint')) $('pickhint').hidden = true;
    return;
  }
  fillSearchSuggestions(L);
  const { shown, all } = countRows(L);
  const q = state.q.trim();
  const cnt = $('qcount');
  if (cnt) {
    cnt.textContent = q ? (shown ? T('q_showing').replace('{n}', shown).replace('{m}', all) : T('q_none_short'))
      : T('q_total').replace('{m}', all);
    cnt.classList.toggle('none', !!q && !shown);
  }
  const qclear = $('qclear');
  if (qclear) qclear.hidden = !q;
  if ($('pickhint')) $('pickhint').hidden = false;
  const none = q && !shown
    ? `<div class="empty-note">${esc(T('q_none'))} <button class="linkbtn" type="button" data-qclear="1">${esc(T('q_reset'))}</button></div>`
    : '';
  $('cards').innerHTML = none + (q && !shown ? '' : `<table class="bt">
    <colgroup><col class="w-item"><col class="w-where"><col class="w-d"><col class="w-chart"></colgroup>
    <thead><tr><th class="c-item">${esc(lang() === 'ru' ? 'Предмет' : 'Item')}</th><th class="c-where">${esc(lang() === 'ru' ? 'Где достать' : 'Where')}</th><th class="c-d">Δ ${esc(metricName(L.metric))}</th><th class="c-chart">${esc(T('vs_best'))}</th></tr></thead>
    ${L.groups.map(g => groupHTML(g, L)).join('')}</table>`);
  if (q && !shown) $('ovd').hidden = true;
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
function matrixIds() {
  const C = curClass();
  const prefixes = new Set(C.specs.map(s => s.prefix));
  const order = new Map(C.specs.map((s, i) => [s.prefix, i]));
  return Object.keys(G.loadouts).filter(id => {
    const sp = specOfPrefix(id);
    return sp && prefixes.has(sp.prefix);
  }).sort((a, b) => {
    const sa = specOfPrefix(a), sb = specOfPrefix(b);
    const oa = order.has(sa.prefix) ? order.get(sa.prefix) : 99;
    const ob = order.has(sb.prefix) ? order.get(sb.prefix) : 99;
    if (oa !== ob) return oa - ob;                       // specs in sim order (best first)
    const ba = /-cheap$/.test(a) ? 1 : 0;                // then max before cheap
    const bb = /-cheap$/.test(b) ? 1 : 0;
    return ba - bb || a.localeCompare(b);
  });
}

const matrixBar = slider => `<div class="slbar">
  <div class="slviews">
    <button data-matrixview="table" class="${slider ? '' : 'on'}">${esc(T('view_table'))}</button>
    <button data-matrixview="slider" class="${slider ? 'on' : ''}">${esc(T('view_slider'))}</button>
  </div>
  ${slider ? `<div class="slnav"><button data-slide="-1" aria-label="${esc(T('prev_set'))}">‹</button><span id="slcount"></span><button data-slide="1" aria-label="${esc(T('next_set'))}">›</button></div>` : ''}
</div>`;

function renderMatrix() {
  const ids = matrixIds();
  if (!ids.length) { $('matrix').innerHTML = `<div class="empty-note">${esc(T('empty_title'))}</div>`; return; }
  if (state.matrixView === 'table') renderMatrixTable(ids);
  else renderMatrixSlider(ids);
}

function renderMatrixTable(ids) {
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
  $('matrix').innerHTML = matrixBar(false) +
    `<div class="mhint">${esc(T('scroll_hint'))}</div>` +
    `<div class="matrix-table"><table><thead><tr><th class="sl">${esc(lang() === 'ru' ? 'Слот' : 'Slot')}</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const box = $('matrix'), hint = box.querySelector('.mhint');
  if (hint) hint.classList.toggle('on', box.scrollWidth > box.clientWidth + 4);
}

function renderMatrixSlider(ids) {
  const cards = ids.map(id => {
    const L = G.loadouts[id], sp = specOfPrefix(id);
    const bl = /-cheap$/.test(id) ? ' · ' + T('budget_cheap') : /-max$/.test(id) ? ' · ' + T('budget_max') : '';
    const gearRows = SLOT_ORDER.filter(s => L.gear[s] && L.gear[s][0]).map(s =>
      `<div class="srow"><span class="lbl">${esc(slotLabel(s))}</span>${itemHTML(L.gear[s], true)}</div>`).join('');
    return `<article class="slcard">
      <div class="slchead">
        <div><span class="small">${esc(sp ? L2(sp.name) : '')}${esc(bl)}</span>
          <h3>${fmtMetric(L.value)} <span>${L.metric === 'hps' ? 'HPS' : 'DPS'}</span></h3></div>
        ${L.source === 'wowhead' ? `<span class="status-badge wow">${esc(T('wowhead_badge'))}</span>` : ''}
      </div>
      <div class="slgear">${gearRows}</div>
    </article>`;
  });
  $('matrix').innerHTML = matrixBar(true) + `<div class="slrack" id="slrack">${cards.join('')}</div>`;

  const rack = $('slrack'), n = ids.length;
  const width = () => (rack.firstElementChild ? rack.firstElementChild.getBoundingClientRect().width + 14 : rack.clientWidth);
  const count = () => {
    const i = Math.min(n - 1, Math.max(0, Math.round(rack.scrollLeft / Math.max(1, width()))));
    if ($('slcount')) $('slcount').textContent = T('set_counter').replace('{i}', i + 1).replace('{n}', n);
  };
  const cur = Math.max(0, ids.indexOf(loadoutKey(curSpec())));
  if (cur > 0) rack.scrollLeft = Math.round(cur * width());
  count();
  rack.addEventListener('scroll', count, { passive: true });
}
const specOfPrefix = p => G.classes.flatMap(c => c.specs).find(s => s.prefix === p || s.prefix + '-max' === p || s.prefix + '-cheap' === p);

// ---------- how to gear ----------
function renderHowto() {
  const C = curClass();
  const notes = (STR.notes[C.id] || {});
  const sp = curSpec();
  const L = G.loadouts[`${sp.prefix}-max`] || G.loadouts[`${sp.prefix}-cheap`] || G.loadouts[sp.prefix];
  const enchRows = [];
  if (L) for (const s of SLOT_ORDER) {
    const v = L.gear[s];
    if (v && v[0] && v[3]) {
      const it = item(v[0]);
      const enh = v[1]
        ? `<a href="${esc(enchantHref(v[3]))}" target="_blank" rel="noopener" title="${esc(v[3])} — Wowhead" style="color:var(--fg)">${esc(v[3])}</a>`
        : `<span style="color:var(--fg)">${esc(v[3])}</span>`;
      enchRows.push(`<tr><td>${esc(slotLabel(s))}</td><td>${enh}</td><td><a class="n" style="${qc(it)}" href="${WH(v[0])}" target="_blank" rel="noopener">${esc(itemName(v))}</a></td></tr>`);
    }
  }
  const steps = T('howto_steps');
  $('howto').innerHTML = `
    <div class="kpis">
      <div class="kpi"><b>${esc(T('howto_hit_title'))}</b><span>${esc(L2(notes.hit) || '—')}</span></div>
      <div class="kpi"><b>${esc(T('howto_prio_title'))}</b><span>${esc(L2(notes.stat) || '—')}</span></div>
      <div class="kpi"><b>${esc(T('howto_best_title'))}</b><span>${L ? (L.source === 'wowhead' ? esc(T('wowhead_badge')) : `${fmtMetric(L.value)} ${esc(metricName(L.metric))}`) : esc(T('howto_best_none'))}</span></div>
      <div class="kpi"><b>${esc(T('howto_nums_title'))}</b><span>${esc(T('howto_nums_body'))}${G.meta.simmed ? ' · ' + esc(fmtSimmed()) : ''}</span></div>
    </div>
    <div class="center-actions">
      <button class="btn" data-tab="gear">${esc(T('howto_open_set'))}</button>
      ${L && L.talents ? `<a class="btn" href="${esc(WH_TALENTS(state.cls, L.talents))}" target="_blank" rel="noopener">${esc(T('howto_talents'))}</a>` : ''}
      ${L && L.simLink ? `<a class="btn primary" href="${esc(L.simLink)}" target="_blank" rel="noopener">${esc(T('open_sim'))}</a>` : ''}
    </div>
    <h2>${esc(T('howto_ench_title'))}</h2>
    ${enchRows.length
      ? `<table><thead><tr><th>${esc(lang() === 'ru' ? 'Слот' : 'Slot')}</th><th>${esc(lang() === 'ru' ? 'Энчант' : 'Enchant')}</th><th>${esc(lang() === 'ru' ? 'Предмет' : 'Item')}</th></tr></thead><tbody>${enchRows.join('')}</tbody></table>`
      : `<p class="small">${esc(T('howto_ench_none'))}</p>`}
    <h2>${esc(T('howto_budgets_title'))}</h2><p>${esc(T('howto_budgets_body'))}</p>
    <h2>${esc(T('howto_read_title'))}</h2><p>${esc(T('howto_read_body'))}</p>
    <h2>${esc(T('howto_steps_title'))}</h2><ol class="steps">${(Array.isArray(steps) ? steps : []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>`;
}

// ---------- data status & refresh ----------
// ---------- gearing plan ----------
// The BiS set as a checklist grouped by where the items come from. Ticks live in
// localStorage only: the page stays static, and nobody's progress leaves the browser.
const planKey = lid => `bisplan:${lid}`;
const planLoad = lid => {
  try { return JSON.parse(localStorage.getItem(planKey(lid)) || '{}'); } catch { return {}; }
};
const planSave = (lid, o) => { try { localStorage.setItem(planKey(lid), JSON.stringify(o)); } catch { /* private mode */ } };

function planGroupFor(it) {
  const src = SRC(it)[0] || '';
  const kinds = it.kinds || [];
  if (kinds.includes('dungeon')) {
    const m = /^(?:Дроп|Drop):/.test(src) ? src.match(/\(([^)]+)\)\s*$/) : null;
    return { key: 'z:' + (m ? m[1] : '?'), label: m ? m[1] : T('plan_dungeons'), order: 10 };
  }
  if (kinds.includes('quest')) return { key: 'quest', label: T('plan_quests'), order: 20 };
  if (kinds.includes('rep')) return { key: 'rep', label: T('plan_rep'), order: 30 };
  if (kinds.includes('craft')) return { key: 'craft', label: T('plan_craft'), order: 40 };
  if (kinds.includes('vendor')) return { key: 'vendor', label: T('plan_vendors'), order: 50 };
  if (kinds.includes('bg')) return { key: 'pvp', label: T('plan_pvp'), order: 60 };
  if (kinds.includes('world')) return { key: 'world', label: T('plan_world'), order: 70 };
  return { key: 'other', label: T('plan_other'), order: 80 };
}

function planRow(key, checked, it, spec, slot) {
  const src = SRC(it)[0] || T('no_source');
  const q = norm([itemName(spec), slotLabel(slot), src, it.name, it.name_ru || ''].join(' '));
  return `<label class="prow${checked ? ' done' : ''}" data-q="${esc(q)}" data-slot="${esc(slot)}" data-bis="1">
    <input type="checkbox" data-plan="${esc(key)}"${checked ? ' checked' : ''}>
    <img class="icon xs${it.q >= 3 ? ' q' + it.q : ''}" src="${ICON(it.icon)}" alt="" loading="lazy">
    <span class="pmeta">
      <span class="n" style="${qc(it)}" data-tip="${spec[0]}" data-sfx="${spec[2] || 0}">${esc(itemName(spec))}</span>
      ${itemStats(it) ? `<span class="pstat">${esc(itemStats(it))}</span>` : ''}
      <span class="pslot">${esc(slotLabel(slot))}</span>
      <span class="psrc">${esc(src)}</span>
      <span class="pfb">${esc(T('plan_fallback'))}</span>
    </span>
    <a class="pext" href="${WH(spec[0])}" target="_blank" rel="noopener" aria-label="Wowhead">↗</a>
  </label>`;
}

function renderPlan() {
  const sp = curSpec(), L = loadout(sp);
  if (!L) {
    $('plan').innerHTML = `<h2>${esc(T('plan_title'))}</h2><div class="empty-note">${esc(T('plan_empty'))}</div>`;
    return;
  }
  const lid = loadoutKey(sp);
  const st = planLoad(lid);
  const groups = new Map();
  const push = (key, label, order, html) => {
    if (!groups.has(key)) groups.set(key, { key, label, order, kind: key.startsWith('z:') ? 'dungeon' : key, rows: [] });
    groups.get(key).rows.push(html);
  };
  let items = 0;
  for (const s of SLOT_ORDER) {
    const spec = L.gear[s];
    if (!spec || !spec[0]) continue;
    const it = item(spec[0]);
    if (!it) continue;
    items++;
    const g = planGroupFor(it);
    const key = String(spec[0]);
    push(g.key, g.label, g.order, planRow(key, !!st[key], it, spec, s));
  }
  let ench = 0;
  for (const s of SLOT_ORDER) {
    const spec = L.gear[s];
    if (!spec || !spec[1] || !spec[3]) continue;
    ench++;
    const key = 'e:' + s;
    const q = norm([spec[3], slotLabel(s), T('plan_ench_hint')].join(' '));
    push('ench', T('plan_ench'), 90, `<label class="prow${st[key] ? ' done' : ''}" data-q="${esc(q)}">
      <input type="checkbox" data-plan="${esc(key)}"${st[key] ? ' checked' : ''}>
      <span class="pmeta"><span class="n" style="color:var(--fg)">${esc(spec[3])}</span>
      <span class="pslot">${esc(slotLabel(s))}</span><span class="psrc">${esc(T('plan_ench_hint'))}</span></span>
    </label>`);
  }
  const list = [...groups.values()].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, 'ru'));
  const total = items + ench;
  const doneN = Object.keys(st).length;
  const budgetLabel = state.budget === 'cheap' ? T('budget_cheap') : T('budget_max');
  const simBtn = L.simLink
    ? `<a class="btn primary" href="${esc(L.simLink)}" target="_blank" rel="noopener">${esc(T('plan_open_sim'))}</a>` : '';
  const wh = L.source === 'wowhead' ? ` <span class="status-badge wow">${esc(T('wowhead_badge'))}</span>` : '';
  $('plan').innerHTML = `
    <h2>${esc(T('plan_title'))}${wh}</h2>
    <p class="sub">${esc(T('plan_sub'))}</p>
    <div class="planhead">
      <div class="planprog"><b id="planprogress">${esc(T('plan_progress').replace('{d}', String(doneN)).replace('{t}', String(total)))}</b>
        <div class="pbar"><i id="planbar" style="width:${total ? Math.round(doneN / total * 100) : 0}%"></i></div><span class="pct" id="planpct">${total ? Math.round(doneN / total * 100) : 0}%</span></div>
      <span class="small">${esc(T('plan_budget').replace('{b}', budgetLabel))}</span>
    </div>
    <div class="planactions">
      ${simBtn}
      <button class="btn" type="button" data-plancopy="1">${esc(T('plan_copy'))}</button>
      <button class="btn" type="button" data-planreset="1">${esc(T('plan_reset'))}</button>
    </div>
    <p class="small planlocal">${esc(T('plan_local'))}</p>
    <div class="planfilter">
      <div class="pchips">${PLAN_KINDS.map(([k, key]) => `<button type="button" data-plan-kind="${k}" class="${state.planKinds.has(k) ? 'on' : ''}">${esc(T(key))}</button>`).join('')}</div>
      <label class="pcheck"><input type="checkbox" data-plan-hidedone${state.planHideDone ? ' checked' : ''}> ${esc(T('plan_only_left'))}</label>
      <input type="search" class="psearch" id="planq" value="${esc(state.planQ)}" placeholder="${esc(T('plan_search_ph'))}" aria-label="${esc(T('plan_search_ph'))}">
    </div>
    <div class="plan">${list.map(g => `<section class="pgroup" data-pgroup="${esc(g.key)}" data-kind="${esc(g.kind)}" data-title="${esc(g.label)}">
      <h3>${esc(g.label)}<span class="pcount">0/${g.rows.length}</span></h3>${g.rows.join('')}</section>`).join('')}</div>
    <div class="empty-note" id="planempty" hidden>${esc(T('plan_nothing'))}</div>`;
  updatePlanProgress();
  applyPlanFilter();
}

const PLAN_KINDS = [['dungeon', 'plan_dungeons'], ['quest', 'plan_quests'], ['rep', 'plan_rep'],
  ['craft', 'plan_craft'], ['vendor', 'plan_vendors'], ['pvp', 'plan_pvp'], ['world', 'plan_world'],
  ['other', 'plan_other'], ['ench', 'plan_ench']];

// Hide groups and rows that the chips, "only what's left" and the search exclude.
// A slot left with no row is filled by its BiS item as an alternative, so a
// source filter never leaves a hole (a ring disappearing entirely).
function applyPlanFilter() {
  const box = $('plan');
  if (!box) return;
  const tokens = norm(state.planQ).split(' ').filter(Boolean);
  const rows = [...box.querySelectorAll('label.prow')];
  rows.forEach(r => {
    const g = r.closest('[data-pgroup]');
    const kindOn = !!g && state.planKinds.has(g.dataset.kind);
    const cb = r.querySelector('input[data-plan]');
    const done = cb && cb.checked;
    const qOk = !tokens.length || tokens.every(t => (r.dataset.q || '').includes(t));
    const doneOk = !(state.planHideDone && done);
    r.dataset.kindOk = kindOn ? '1' : '0';
    r.dataset.qOk = qOk ? '1' : '0';
    r.dataset.doneOk = doneOk ? '1' : '0';
    r.hidden = !(kindOn && qOk && doneOk);
    r.classList.remove('fallback');
  });
  if (state.planKinds.size) {
    const slots = new Map();
    rows.forEach(r => {
      const s = r.dataset.slot;
      if (!s) return;
      if (!slots.has(s)) slots.set(s, []);
      slots.get(s).push(r);
    });
    slots.forEach(list => {
      if (list.some(r => !r.hidden)) return;
      const bis = list.find(r => r.dataset.bis === '1');
      if (bis && bis.dataset.kindOk === '0' && bis.dataset.qOk === '1' && bis.dataset.doneOk === '1') {
        bis.hidden = false;
        bis.classList.add('fallback');
      }
    });
  }
  let shown = 0;
  box.querySelectorAll('[data-pgroup]').forEach(g => {
    const any = [...g.querySelectorAll('label.prow')].some(r => !r.hidden);
    g.hidden = !any;
    if (any) shown++;
  });
  const empty = $('planempty');
  if (empty) empty.hidden = shown > 0;
}

function updatePlanProgress() {
  const boxes = [...document.querySelectorAll('#plan input[data-plan]')];
  const done = boxes.filter(b => b.checked).length;
  const total = boxes.length;
  const bar = $('planbar');
  const pct = total ? Math.round(done / total * 100) : 0;
  if (bar) bar.style.width = pct + '%';
  const pctEl = $('planpct');
  if (pctEl) pctEl.textContent = pct + '%';
  const txt = $('planprogress');
  if (txt) txt.textContent = T('plan_progress').replace('{d}', String(done)).replace('{t}', String(total));
  document.querySelectorAll('#plan [data-pgroup]').forEach(g => {
    const gb = [...g.querySelectorAll('input[data-plan]')];
    const c = g.querySelector('.pcount');
    if (c) c.textContent = `${gb.filter(b => b.checked).length}/${gb.length}`;
    g.querySelectorAll('label.prow').forEach(r => {
      const cb = r.querySelector('input[data-plan]');
      if (cb) r.classList.toggle('done', cb.checked);
    });
  });
}

function planText() {
  const sp = curSpec(), L = loadout(sp);
  const budget = state.budget === 'cheap' ? T('budget_cheap') : T('budget_max');
  const out = [`Pre-raid BiS · ${L2(sp.name)} · ${budget}`];
  document.querySelectorAll('#plan [data-pgroup]').forEach(g => {
    out.push('', g.dataset.title || '');
    g.querySelectorAll('label.prow').forEach(r => {
      const cb = r.querySelector('input[data-plan]');
      const n = r.querySelector('.n');
      const src = r.querySelector('.psrc');
      const slot = r.querySelector('.pslot');
      out.push(`  ${cb && cb.checked ? '[x]' : '[ ]'} ${slot ? slot.textContent.trim() + ': ' : ''}${n ? n.textContent.trim() : ''}${src ? ' — ' + src.textContent.trim() : ''}`);
    });
  });
  return out.join('\n');
}


function chipState() {
  const m = G.meta;
  if (!m.hasData) return { cls: 'none', text: T('chip_no_data') };
  const staleDays = m.staleAfterDays || 7;
  const age = (Date.now() - new Date(m.simmed)) / 86400000;
  if (age > staleDays) return { cls: 'stale', text: `${T('chip_ok')}: ${fmtSimmed()} · ${T('chip_stale')}`.replace('N', staleDays) };
  return { cls: 'ok', text: `${T('chip_ok')}: ${fmtSimmed()}` };
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
// Per class: when its sets were actually simmed, and how many are still waiting.
// Dates come from each run's own meta, so a class that lagged behind shows its
// older date instead of borrowing the site's headline date.
function classFreshness(c) {
  let last = '', sets = 0, waiting = 0, failed = 0;
  for (const sp of c.specs) {
    if (sp.status === 'no-preset') continue;
    if (sp.status === 'failed') failed++;
    let any = false;
    for (const b of ['max', 'cheap']) {
      const l = G.loadouts[`${sp.prefix}-${b}`];
      if (!l) continue;
      any = true;
      sets++;
      if (l.simmedAt && l.simmedAt > last) last = l.simmedAt;
    }
    if (!any) waiting++;
  }
  return { last, sets, waiting, failed };
}
function renderRefresh() {
  const m = G.meta;
  const st = chipState();
  const status = `<div class="panel ${st.cls}"><b>${esc(T('ref_last_update'))}</b>
      <span>${m.hasData
        ? `${esc(T('ref_ok_line'))}: <b>${esc(fmtSimmed())}</b> · WoWSims <code>${esc(m.simCommit || '—')}</code>`
        : esc(T('chip_no_data'))}</span>
      <span>${esc(T('ref_owner_only'))}</span></div>`;
  const auto = `<div class="panel"><b>${esc(T('ref_auto'))}</b><span>${esc(T('ref_auto_body'))}</span></div>`;
  const newbie = `<div class="panel"><b>${esc(T('ref_new_title'))}</b><span>${esc(T('ref_new_body'))}</span></div>`;
  const freshRows = G.classes.map(c => {
    const f = classFreshness(c);
    const date = f.last ? fmtStamp(f.last).split(' · ')[0] : '—';
    const wait = f.waiting + f.failed;
    return `<tr><td>${esc(L2(c.name))}</td><td>${esc(date)}</td><td>${f.sets}</td><td${wait ? ' class="warn"' : ''}>${wait}</td></tr>`;
  }).join('');
  const freshN = G.classes.filter(c => {
    const f = classFreshness(c);
    return f.last && f.sets && f.last.slice(0, 10) === String(m.simmed || '').slice(0, 10);
  }).length;
  const freshSum = m.hasData
    ? `<div class="freshsum">${esc(T('fresh_sum').replace('{n}', freshN).replace('{m}', G.classes.length))}</div>`
    : '';
  const fresh = `<h3>${esc(T('fresh_title'))}</h3>
    <div class="panel">${freshSum}<span>${esc(T('fresh_note'))}</span>
      <table class="fresh"><thead><tr><th>${esc(T('cls'))}</th><th>${esc(T('fresh_last'))}</th><th>${esc(T('fresh_sets'))}</th><th>${esc(T('fresh_wait'))}</th></tr></thead>
      <tbody>${freshRows}</tbody></table></div>`;
  $('refresh').innerHTML = `
    <h2>${esc(T('ref_status'))}</h2>
    <div class="panels">${status}${auto}</div>
    <div class="panels">${newbie}</div>
    ${fresh}`;
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
  return `<div class="t" style="${qc(it)}">${esc(itemName({ 0: id, 1: 0, 2: sfx }))}</div>
    ${it.unique ? `<div class="w">${lang() === 'ru' ? 'Уникальный' : 'Unique'}</div>` : ''}
    <div class="row"><span class="w">${esc(it.slot)}</span><span class="w">${esc(it.kind || '')}</span></div>
    ${lines.join('')}
    ${it.set ? `<div class="y">${esc(it.set)}</div>` : ''}
    <div class="m">${lang() === 'ru' ? `Уровень предмета ${it.ilvl}` : `Item level ${it.ilvl}`}${it.side ? ' · ' + esc(sideOnly(it.side)) : ''}</div>
    <div class="src">${SRC(it).map(s => `<div class="y">${esc(s)}</div>`).join('') || `<div class="m">${esc(T('no_source'))}</div>`}</div>`;
}
const tip = $('tip');
document.addEventListener('mousemove', e => {
  const t = e.target.closest('[data-tip],[data-why],[data-chart]');
  if (!t || !matchMedia('(hover: hover)').matches || innerWidth < 720) { tip.hidden = true; return; }
  if (t.dataset.chart) {
    const best = t.dataset.best === '1';
    const m = Number(t.dataset.m || 0);
    tip.innerHTML = `<div class="t">${esc(T('chart_why_title'))}</div>
      <div class="w">${esc(best ? T('chart_why_best') : T('chart_why_row').replace('{d}', fmt(Number(t.dataset.d || 0))).replace('{m}', m.toFixed(1)))}</div>
      <div class="m">${esc(T('chart_why_body'))}</div>`;
  } else if (t.dataset.why) {
    tip.innerHTML = `<div class="t">${esc(T('delta_why_title'))}</div>
      <div class="w">${esc(t.dataset.why)}</div>
      <div class="m">${esc(T('delta_why_body'))}</div>`;
  } else {
    tip.innerHTML = tipHTML(+t.dataset.tip, +t.dataset.sfx);
  }
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
  $('bar').hidden = !['gear', 'plan'].includes(state.tab);
  // The plan is per spec and budget, not per option count or search: keep those out of its way.
  if ($('topngroup')) $('topngroup').style.display = state.tab === 'gear' ? '' : 'none';
  if ($('filtergroup')) $('filtergroup').style.display = state.tab === 'gear' ? '' : 'none';
  const pressed = (sel, key, v) => document.querySelectorAll(sel).forEach(b => b.setAttribute('aria-pressed', String(b.dataset[key]) === String(v)));
  pressed('[data-cls]', 'cls', state.cls);
  pressed('[data-spec]', 'spec', state.spec);
  pressed('[data-budget]', 'budget', state.budget);
  pressed('[data-topn]', 'topn', state.topn);
  $('cls').innerHTML = G.classes.map(c => `<button data-cls="${c.id}"><img src="${CLASS_ICON(c.id)}" alt="">${esc(L2(c.name))}</button>`).join('');
  const C = curClass();
  $('spec').innerHTML = C.specs.map(s => `<button data-spec="${s.id}" title="${esc(L2(s.name))}">${esc(L2(s.name))}</button>`).join('');
  const spNow = curSpec();
  const hasMax = hasMaxOf(spNow), hasCheap = hasCheapOf(spNow);
  $('budgetgroup').hidden = !(hasMax || hasCheap);
  if (hasMax || hasCheap) {
    $('budget').innerHTML =
      `<button data-budget="max" ${hasMax ? '' : `disabled title="${esc(T('budget_pending'))}"`}>${esc(T('budget_max'))}</button>` +
      `<button data-budget="cheap" ${hasCheap ? '' : `disabled title="${esc(T('budget_pending'))}"`}>${esc(T('budget_cheap'))}</button>`;
  } else {
    $('budget').innerHTML = '';
  }
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
  const top = $('totop');
  if (top) { top.title = T('to_top'); top.setAttribute('aria-label', T('to_top')); }
  if (state.tab === 'gear') { renderDoll(); renderCards(); }
  if (state.tab === 'plan') renderPlan();
  if (state.tab === 'all') renderMatrix();
  if (state.tab === 'howto') renderHowto();
  if (state.tab === 'refresh') renderRefresh();
  toHash();
}

document.addEventListener('click', e => {
  const t = e.target;
  if (!t.closest('#srcpick')) $('srcpick').open = false;
  const pk = t.closest('[data-plan-kind]');
  if (pk) {
    const k = pk.dataset.planKind;
    if (state.planKinds.has(k)) state.planKinds.delete(k); else state.planKinds.add(k);
    pk.classList.toggle('on', state.planKinds.has(k));
    applyPlanFilter();
    return;
  }
  if (t.closest('[data-planreset]')) {
    const lid = loadoutKey(curSpec());
    try { localStorage.removeItem(planKey(lid)); } catch { /* private mode */ }
    renderPlan();
    return;
  }
  const cp = t.closest('[data-plancopy]');
  if (cp) {
    const text = planText();
    const flash = () => {
      const old = cp.textContent;
      cp.textContent = T('plan_copied');
      setTimeout(() => { cp.textContent = old; }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, () => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); flash(); } catch (err) { /* nothing else to do */ }
      ta.remove();
    }
    return;
  }
  const chip = t.closest('#statuschip');
  if (chip) { state.tab = 'refresh'; render(); return; }
  if (t.closest('[data-qclear]')) {
    state.q = '';
    if ($('q')) $('q').value = '';
    if (state.tab === 'gear') renderCards();
    return;
  }
  if (t.closest('[data-pickreset]')) {
    state.pick = {};
    renderDoll(); renderCards();
    return;
  }
  const openCur = t.closest('[data-opencur]');
  if (openCur) {
    const sp = curSpec(), L = loadout(sp);
    if (L) {
      const win = window.open('', '_blank');
      openCur.disabled = true;
      currentSimLink(L, effectiveGear(L))
        .then(url => {
          if (!url) throw new Error('no share link for this set');
          if (win) win.location.replace(url); else location.href = url;
        })
        .catch(err => { console.warn('current set link:', err); if (win) win.close(); })
        .finally(() => { openCur.disabled = false; });
    }
    return;
  }
  const mv = t.closest('[data-matrixview]');
  if (mv) { state.matrixView = mv.dataset.matrixview; renderMatrix(); return; }
  const sl = t.closest('[data-slide]');
  if (sl) {
    const rack = $('slrack');
    if (rack) {
      const card = rack.firstElementChild;
      const w = card ? card.getBoundingClientRect().width + 14 : rack.clientWidth;
      rack.scrollLeft = Math.max(0, rack.scrollLeft + (+sl.dataset.slide) * w);
    }
    return;
  }
  const pickRow = t.closest('tr[data-pick]');
  if (pickRow && !t.closest('a,button')) {
    const sp = curSpec(), L = loadout(sp);
    const gid = pickRow.dataset.g, sig = pickRow.dataset.sig;
    const g = L && (L.groups || []).find(x => x.id === gid);
    if (g) {
      if (sig === 'best') {
        delete state.pick[gid];
      } else {
        const r = (g.rows || []).find(x => sigOf(x.move) === sig);
        if (r) state.pick[gid] = { sig, d: r.d, move: r.move };
      }
      renderDoll(); renderCards();
    }
    return;
  }
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
  const ds = e.target.dataset || {};
  if (ds.plan) {
    const lid = loadoutKey(curSpec());
    const st = planLoad(lid);
    if (e.target.checked) st[ds.plan] = 1; else delete st[ds.plan];
    planSave(lid, st);
    updatePlanProgress();
    applyPlanFilter();
    return;
  }
  if ('planHidedone' in ds) {
    state.planHideDone = e.target.checked;
    applyPlanFilter();
    return;
  }
  const s = ds.src;
  if (!s) return;
  e.target.checked ? state.srcs.add(s) : state.srcs.delete(s);
  renderSources(); if (state.tab === 'gear') renderCards();
  $('srcpick').open = true;
});
$('q').addEventListener('input', e => { state.q = e.target.value; if (state.tab === 'gear') renderCards(); });
$('q').addEventListener('keydown', e => { if (e.key === 'Escape' && state.q) { state.q = ''; e.target.value = ''; if (state.tab === 'gear') renderCards(); } });
document.addEventListener('input', e => {
  if (e.target.id === 'planq') { state.planQ = e.target.value; applyPlanFilter(); }
});
const totop = $('totop');
if (totop) {
  // Always available: it is small, sits in the corner, and needs no scroll wiring.
  totop.title = T('to_top');
  totop.setAttribute('aria-label', T('to_top'));
  totop.addEventListener('click', () => window.scrollTo(0, 0));
}
new ResizeObserver(() => document.documentElement.style.setProperty('--barh', $('bar').offsetHeight + 'px')).observe($('bar'));

// Shared links and back/forward navigation: re-read the hash when it changes from outside
// (toHash uses replaceState, so this never loops).
window.addEventListener('hashchange', () => { fromHash(); render(); });

fromHash();
if (G.meta.hasData) { /* data present: plain render */ }
render();
