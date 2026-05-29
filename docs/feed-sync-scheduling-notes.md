# Feed Sync Scheduling Notes

These notes capture the current Shoptet/supplier feed context for future CRON
schedule design. They are planning input only; this repository does not yet
define a production feed scheduler.

## Shoptet Automatic Imports

Shoptet automatic imports are queued jobs, not exact CRON executions. A full or
update import is inserted into Shoptet's processing queue in the selected time
window, but the selected window does not guarantee the exact start time.

Observed Shoptet behavior from the import schedule UI:

- Import jobs are processed from a queue by several concurrent workers.
- The number of active workers can vary during the day.
- One Shoptet project cannot run two imports at the same time.
- If a delayed queued import collides with another import for the same project,
  the newly started import is ended with a warning.
- A full import can be scheduled for only one time window.
- Update imports are limited by the Shoptet tariff. The UI notes Enterprise can
  have up to 16 update imports per day.
- The update import limit is shared across all update imports for the project.
- Selecting more update windows than the tariff allows can make imports end with
  a warning.
- The screenshots show hourly windows at minute `:44`, for example `00:44`,
  `01:44`, `02:44`, and so on. Treat these as Shoptet scheduling windows, not
  guaranteed execution times.

## Source Feeds

### SEGO CZ, s. r. o.

Feed URLs:

- `https://segocz.cz/src/Frontend/Files/Feeds/Catalog/zbozi_123456.xml`
- `https://segocz.cz/src/Frontend/Files/Feeds/Catalog/heureka_feed.xml`
- `https://segocz.cz/src/Frontend/Files/Feeds/Catalog/google_feed.xml`

Known feed notes:

- Each model and its variants have an EAN code.
- Heureka feeds support video.
- The feed includes recommended price and availability.
- Products are not on the website yet.

### AUTRONIC, s.r.o.

Only furniture is intended for import from AUTRONIC.

Feed URLs:

- Product feed: `https://autronic.cz/feeds/product-feed.xml`
- Availability feed: `https://autronic.cz/feeds/availability-feed.xml`
- Product feed XML schema: `https://autronic.cz/feeds/product-feed.xsd`

### Hon a.s.

Feed URL:

- `https://www.webshop.officepro-brno.cz/import/HONClientFeed/HONClientFeed.xml`

## CRON Planning Implications

Future jobs should distinguish between our source-feed publishing schedule and
Shoptet's import schedule. Shoptet's time window means "queued for processing",
not "completed at this time".

Use these rules when proposing a CRON plan:

- Do not schedule our source-feed fetch/publish jobs exactly at Shoptet import
  windows.
- Publish transformed source feeds before Shoptet's selected update windows,
  with enough buffer for supplier latency, parsing, validation, and upload.
- If Shoptet windows stay around `HH:44`, a reasonable first planning target is
  to finish our feed publication before `HH:35` and avoid writes during or just
  after the Shoptet window.
- Stagger supplier fetches instead of pulling every supplier at once.
- Keep full imports rare, off-peak, and separate from update imports.
- Avoid concurrent runs for the same Shoptet project on our side too. Use locks
  or idempotent job state if/when feed sync jobs are implemented.
- Model "source feed published", "Shoptet import queued", and "Shoptet import
  completed" as separate states if we add observability later.
- Include retry/backoff and enough slack for Shoptet queue delays in the final
  CRON design.
