# Deployment

- **Frontend:** static React build hosted on Netlify (config in `netlify.toml`).
- **Backend:** FastAPI + MongoDB on a VPS, run with Docker Compose. Caddy terminates HTTPS automatically.

## 1. Backend on the VPS

Prerequisites: a Linux VPS with Docker + the Compose plugin, ports 80/443 open, and a DNS **A record** (e.g. `api.yourdomain.com`) pointing at the VPS IP.

```bash
git clone <repo-url> casnaggi && cd casnaggi

cp .env.example .env                  # set API_DOMAIN=api.yourdomain.com
cp backend/.env.example backend/.env  # set CORS_ORIGINS to your Netlify/custom domain

docker compose up -d --build
```

Verify: `curl https://api.yourdomain.com/api/` should return `{"message":"Hello World"}`.

`backend/.env`:

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | `mongodb://mongo:27017` for the bundled container, or an Atlas URL |
| `DB_NAME` | Database name |
| `CORS_ORIGINS` | Comma-separated frontend origins, e.g. `https://casnaggi.netlify.app,https://www.yourdomain.com` |

MongoDB is not exposed to the internet; only Caddy publishes ports.

### Updating

```bash
git pull && docker compose up -d --build
```

Logs: `docker compose logs -f api`

### Backups

```bash
docker compose exec mongo mongodump --archive --db casnaggi > casnaggi-$(date +%F).archive
```

## 2. Frontend on Netlify

In Netlify → Site settings → Environment variables, set:

```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

Then trigger a redeploy (the value is baked in at build time).

## Troubleshooting

- **CORS errors:** `CORS_ORIGINS` must exactly match the browser origin (scheme + host, no trailing slash). Restart with `docker compose up -d` after editing.
- **No HTTPS certificate:** confirm the DNS record has propagated and ports 80/443 are open in the VPS firewall.
- **API can't reach Mongo:** check `docker compose ps` and that `MONGO_URL` uses the `mongo` hostname.
