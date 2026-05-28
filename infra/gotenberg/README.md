# Start Gotenberg

`infra/gotenberg` is the PDF rendering deployment wrapper for Start.

## Image

The Dockerfile pins `gotenberg/gotenberg:8.32.0-chromium`.

The Chromium-only image is the baseline because Start currently needs HTML-to-PDF rendering for
invoices, reports, and similar application documents. Use the full Gotenberg image only when a
product has a real need to convert Office documents such as `.docx` or `.xlsx`.

Runtime defaults:

- `API_PORT_FROM_ENV=PORT` so Railway can provide the port
- `CHROMIUM_AUTO_START=true`
- `GOTENBERG_BUILD_DEBUG_DATA=false`
- `API_DISABLE_DOWNLOAD_FROM=true`

## Local Development

The repository root `compose.yaml` builds this image. Use the root README for daily stack commands.

Default local URL:

- API: `http://127.0.0.1:3031`
- health: `http://127.0.0.1:3031/health`

The Docker Compose port is bound to `127.0.0.1` only. Local Gotenberg is not exposed on the LAN.

## Railway Deployment

1. Create a Railway service from this repository.
2. Set the Railway service Root Directory to `infra/gotenberg`.
3. Add a public or private service domain, depending on how the web app will reach it.
4. Add production environment variables:
   - `API_ENABLE_BASIC_AUTH=true`
   - `GOTENBERG_API_BASIC_AUTH_USERNAME`
   - `GOTENBERG_API_BASIC_AUTH_PASSWORD`
5. Deploy or redeploy the service.

`Root Directory = infra/gotenberg` is a Railway service setting. The committed `railway.json`
configures the Dockerfile builder and watch patterns, but it does not replace that service setting.

The web deployment must also receive:

- `GOTENBERG_BASE_URL`
- `GOTENBERG_API_BASIC_AUTH_USERNAME`
- `GOTENBERG_API_BASIC_AUTH_PASSWORD`
