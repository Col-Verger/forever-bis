# Pre-Raid BiS · WoW Forever — все классы

Симмированный пререйд-BiS гайд **по всем классам и спекам** для **WoW Forever, Фаза 1** —
по образцу [Forever Hunter guide](https://toxickevinferm.github.io/hunter-guide/prebis-new/).

**Сайт: https://col-verger.github.io/forever-bis/** · репозиторий: [Col-Verger/forever-bis](https://github.com/Col-Verger/forever-bis)

Страница показывает для каждого спека: лучший сет (**Максимум** и **Дёшево** — бюджетный
переключатель), каждую опцию каждого слота с её отставанием от лучшей (± погрешность сима),
источник каждого предмета, и сравнение всех сетов бок о бок.

**Честная политика данных:** на странице нет ни одного придуманного числа. Каждая цифра —
результат реального прогона WoWSims Forever; в футере прошиты дата прогона и хеш коммита
симулятора. Хил-спеки (Holy-пал, рестор-дру, хил-прист, рестор-шаман) показаны с честной
пометкой «ждёт пресет» — в репозитории сима для них пока нет ротаций; как только появятся,
включаются одной строкой в конфиге.

## Как это устроено (архитектура)

Сайт **не** гоняет симы сам: у wowsims.com нет живого API, это WASM-приложение в браузере.
Вместо этого — автоматический пайплайн, который можно запускать по расписанию:

```
wowsims/forever (master)                 этот репозиторий
────────────────────────                 ─────────────────
ui/specs/…        пресеты билдов    ┌─────────────────────────────────────┐
assets/database/db.json             │ GitHub Action (.github/workflows/    │
      │            база предметов   │          resim.yml)                  │
      └──────────►│ 1. go build ./cmd/wowsimcli                          │
                   │ 2. tools/make_pools.py   → configs/pools/*.json     │
                   │ 3. tools/run_sims.py     → runs/*.json               │
                   │ 4. tools/build_data.py   → data.js                   │
                   └───────────────┬─────────────────────────────────────┘
                                   ▼
                     index.html + assets/app.js (статика, GitHub Pages)
                     каждая цифра = сим из шага 3, версия сима = шаг 1
```

- **Маг** — 6 билдов сима (Arcane, Arcane Fire, FFB, Fire, Frost Incin, Frost Med); билды
  берутся из `ui/specs/mage/dps` (таленты/буфы/расходники — из `presets.ts`, APL — из
  `apls/*.apl.json`, базовый сет — из `gear_sets/preraid*.gear.json`). Запросы собираются
  в protojson и гоняются через `wowsimcli sim`.
- **Паладин Ret/Prot** — через `.siml`: драйвер генерирует «preset build» поверх
  `ui/specs/paladin/<spec>/defaults.siml` и меняет только секцию `gear`.
- **Holy** — код Holy-сима в репозитории есть (HPS, Time-to-OOM, FoL/HL/Holy Shock), но
  пресета и ротации для него в `ui/specs/paladin/holy` пока нет. Спек присутствует на сайте
  с честной пометкой; как только пресет появится — одна строка в `configs/paladin.json`
  и перезапуск пайплайна заполнят его.

## Запуск локально (Windows/Linux)

Требуется: Go 1.24+, Python 3.10+, git, protoc (генератор protobuf).

```powershell
git clone --depth 1 https://github.com/wowsims/forever ../forever

# proto-пакеты сима — генерируемый код (один раз после клона/обновления)
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
cd ../forever
protoc -I=./proto `
  --go_opt=Mgoogle/protobuf/descriptor.proto=google.golang.org/protobuf/types/descriptorpb `
  --go_out=./sim/core ./proto/*.proto

# CLI с встроенной базой предметов (--tags=with_db обязателен)
go build --tags=with_db -o ../wowsimcli.exe ./cmd/wowsimcli
cd ..

# 1. сгенерировать пулы кандидатов (пересматриваемый configs/pools/*.json)
python tools/make_pools.py --forever forever --configs configs

# 2. прогнать пер-слотовые поиски по каждому спеку → runs/
python tools/run_sims.py --forever forever --wowsimcli wowsimcli.exe --configs configs --out runs

# 3. собрать data.js (--repo зашивает ссылку «Обновить» на вкладке «Данные»)
python tools/build_data.py --forever forever --runs runs --configs configs --out data.js `
  --commit $(git -C forever rev-parse --short HEAD) --repo ВЛАДЕЛЕЦ/РЕПОЗИТОРИЙ

# 4. открыть сайт
python -m http.server 8000   # → http://localhost:8000
```

Первый запуск — самый долгий (все симы, ~30–60 минут на 6 спеков с 3 потоками).
Быстрее: `--only mage-arcane`, `--search-iterations 1500`, `--jobs 3`.
Проверка форматов без симов: `--dry-run`; одиночный базовый сим: `--validate`.

## Как обновлять данные

Кнопка и инструкции живут на вкладке **«Данные и обновление»** самого сайта:
- **владельцу репозитория** — кнопка на GitHub Action «Re-sim and deploy» (или `gh workflow run resim.yml --repo Col-Verger/forever-bis`);
- **локально** — команды выше с копированием в один клик;
- **новому посетителю** — что значат числа, как проверить любое из них
  (импорт `runs/<спек>.settings.json` на wowsims.com) и когда ждать автообновления.

Action гоняет классы **параллельной матрицей** (одна джоба на класс) и публикует
результат отдельной джобой: полный пересчёт всех классов ≈ 40–80 минут.

Статус всегда виден в шапке: дата прогона и хеш коммита сима; если данных нет или
они старше недели — чип в шапке загорается и ведёт на вкладку «Данные».

## Бюджеты «Максимум» и «Дёшево»

- **Максимум** — весь пул кандидатов, включая PvP Premier, репутацию Ревered/Экзальтед
  и дорогие эпик-крафты.
- **Дёшево** — только свободнодоступное: без PvP-гринда, без высокой репутации, без
  дорогих крафтов. База такого сета автоматически освобождается от «дорогих» предметов,
  и поиск заново заполняет слоты из дешёвого пула.

Разметка «дорогого» — правило в `tools/make_pools.py` (`item_tier`); спорный предмет
переносится в конфиге спека через `excludeIds`/`includeIds`.

## Добавить класс / спек / билд

1. В `configs/<класс>.json` — секция `builds` (готовые примеры: три режима:
   полный buildJson-файл репозитория как у варлока/шамана; транскрипция presets.ts
   как у мага/друида; `.siml`-setup как у хантера/паладинов).
2. Правила пула в `pools` того же файла (тип брони, типы оружия, фильтры).
3. `python tools/make_pools.py ...`, затем `--validate` для нового билда —
   и либо локальный полный прогон, либо просто запусти Action (пересчитает всё).

## Пулы кандидатов (важно!)

`tools/make_pools.py` предлагает кандидатов по правилам из `configs/*.json`
(ткань/плиты, типы оружия, качество, «не из рейдовых зон») и пишет их в
`configs/pools/<prefix>.pools.json` — файл с именами и источниками для просмотра.
**Пул — это редакторское решение**, как и у автора хантер-гайда: посмотри сгенерированный
файл, поправь `includeIds`/`excludeIds` в конфиге спека и закоммить. Симы ранжируют только
то, что в пуле.

## Автоматическое обновление

`.github/workflows/resim.yml`: собирает сим из свежего master `wowsims/forever`, гоняет
все спеки, пересобирает `data.js`, коммитит и деплоит на GitHub Pages. Запускается
кнопкой (workflow_dispatch) и по расписанию (раз в неделю по умолчанию — поправь cron).
В футере сайта всегда видно, на каком коммите сима и когда гоняли последние прогоны.

## Структура

```
index.html            страница (RU/EN переключатель в шапке)
assets/app.js         рендер: кукла, карточки слотов с Δ и ±, матрица сетов, тултипы
assets/style.css      тема в цветах класса (маг/паладин)
data.js               ГЕНЕРИРУЕТСЯ tools/build_data.py — руками не править
configs/mage.json     билды мага: таленты/буфы/расходники/базовые сеты + правила пулов
configs/paladin.json  билды паладина (siml-путь) + правила пулов
configs/pools/        материализованные пулы (make_pools.py, просматриваемые)
tools/run_sims.py     драйвер: per-slot поиск через wowsimcli → runs/*.json
tools/make_pools.py   генератор пулов из assets/database/db.json
tools/build_data.py   склейка runs + db.json → data.js
runs/                 результаты прогонов (коммитится для прозрачности)
.github/workflows/resim.yml   автопайплайн
```

## Лицензия и атрибуция

Симуляция — [WoWSims Forever](https://github.com/wowsims/forever) (MIT). Иконки и ссылки —
Wowhead. Идея и UX-образец — Forever Hunter guide. Этот проект — статическая страница
поверх прогона того же симулятора.
