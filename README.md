# 007 — Operation January
### Team Zwolle Mission Control

Interne sales-webapp voor de Operation January league (**1 september 2026 – 31 januari 2027**). Het team gebruikt de app om direct te berekenen hoeveel punten een nieuwe plaatsing, verlenging of urenuitbreiding oplevert, om deals via het "2 paar ogen"-principe te controleren (League Check), en om de teamvoortgang te volgen (Mission Control).

## Projectomschrijving

Drie hoofdonderdelen:

- **Mission Calculator** — 4-staps wizard (Mission Type → Mission Details → Select Factor → Mission Value) die live de league-score berekent, inclusief Factor Comparison en Timing Impact.
- **League Check** — checklist volgens het 2-paar-ogen-principe; pas bij een volledig afgevinkte checklist én ingevulde velden verschijnt **MISSION APPROVED**.
- **Mission Control** — dashboard met teamscore, AM- en TM-leaderboards en de Weekly Mission Update, gevoed door mockdata (of een live API wanneer geconfigureerd).

Alle scoreberekeningen staan centraal in `src/services/scoring.ts` — nergens anders in de app wordt een punt berekend.

## Tech stack

- React 18 + TypeScript (strict)
- Vite 6
- Tailwind CSS
- lucide-react
- Recharts (Timing Impact & Weekly Mission Update grafieken)
- Vitest (unit tests voor de scoring-engine)

## Projectstructuur

```
src/
  components/        Herbruikbare UI-componenten (MissionCard, FactorSelector, Leaderboard, ...)
  features/
    calculator/       Mission Calculator wizard + logica-hook
    league-check/      League Check checklist + logica-hook
    mission-control/   Dashboard secties + data-hook
  services/
    scoring.ts         Alle scoreformules — single source of truth
    api.ts              Databron-abstractie (mock ↔ live API)
  data/
    mockLeagueData.ts   Fictieve demo-data (geen echte namen/klanten)
    leagueCheckItems.ts Checklist-items + teamafspraken
    oneLiners.ts        Sales one-liners
  config/
    scoringConfig.ts    League-periode, Factor-ladder, drempels, factorApplicationMode
  types/
    league.ts            Domeinmodellen (Placement, ScoreBreakdown, ...)
  utils/
    dates.ts             Timezone-veilige date-only berekeningen
    format.ts             NL-getalnotatie
pages/
  HomePage.tsx
```

## Installatie

```bash
npm install
```

## Development

```bash
npm run dev
```

## Lint & typecheck

```bash
npm run lint
npm run typecheck
```

## Tests

Dekt onder meer de officiële voorbeeldberekeningen uit de league-regels:

- September-start: 8 maanden × 10 VCDB × 5 league-maanden = **400**
- November-start: 8 maanden × 10 VCDB × 3 league-maanden = **240**
- 400 × 2,5 = **1.000**, 400 × 1,3 = **520**, 240 × 2,5 = **600**
- Urenuitbreiding < 4 u/w = niet scoorbaar, ≥ 4 u/w = wel scoorbaar
- W&S-domein scoort nooit

```bash
npm run test
```

## Build

```bash
npm run build
npm run preview   # lokaal de production build bekijken
```

## GitHub Pages deployment

`.github/workflows/deploy.yml` bouwt de app bij elke push naar `main`, en publiceert `dist/` via de officiële `actions/deploy-pages` flow. `VITE_BASE_PATH` wordt in de workflow automatisch gezet op `/<repository-naam>/` zodat assets op een GitHub Pages *project site* correct resolven.

Navigatie gebruikt bewust **client-side state** in plaats van routes (`src/App.tsx`), zodat er geen server-side rewrite-regels nodig zijn en een refresh op elk scherm nooit een 404 op GitHub Pages oplevert.

Eenmalig instellen: **Settings → Pages → Source: GitHub Actions** in de repository.

## Environment variables

Zie `.env.example`.

| Variabele | Omschrijving |
|---|---|
| `VITE_LEAGUE_API_URL` | URL van de toekomstige JSON-API. Leeg = de app gebruikt automatisch de mockdata uit `src/data/mockLeagueData.ts`. |
| `VITE_BASE_PATH` | Alleen relevant voor GitHub Pages project sites; wordt door de deploy-workflow automatisch gezet. |

Commit nooit een echte `VITE_LEAGUE_API_URL`-waarde of andere secrets — gebruik `.env.local` (staat in `.gitignore`).

## Toekomstige Power Automate-integratie

Geplande productieroute, nog niet actief in V1:

```
SharePoint Excel Productie Dashboard
        ↓
Power Automate
        ↓
JSON API  (VITE_LEAGUE_API_URL)
        ↓
007 App  (src/services/api.ts)
```

`src/services/api.ts` haalt data op via `VITE_LEAGUE_API_URL` zodra die geconfigureerd is, en valt automatisch terug op mockdata wanneer de variabele ontbreekt of de call faalt — de UI heeft dus nooit een harde afhankelijkheid van Excel/SharePoint. Het verwachte JSON-contract staat in `docs/api-contract-example.json` en `src/types/league.ts` (`LeagueDataset`, `Placement`).

De Factor-toepassing op league-niveau is nog een openstaande interpretatievraag (alle VCDB van de vestiging vs. alleen contractant-gebonden VCDB). Dit is als `FACTOR_APPLICATION_MODE` (`ALL_VCDB` / `CONTRACTANT_ONLY`) centraal geconfigureerd in `src/config/scoringConfig.ts`, zodat de uiteindelijke keuze zonder UI-wijzigingen doorgevoerd kan worden.

## Data privacy

Deze repository bevat uitsluitend fictieve demo-data (codenamen als "Agent Aurum", generieke klantnamen). Commit nooit echte klant-, medewerkers- of productiegegevens, API-secrets of SharePoint-credentials — gebruik altijd environment variables via `.env.local`.
