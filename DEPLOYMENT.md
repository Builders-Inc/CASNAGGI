# Deployment

- **Frontend:** static React build on Netlify (`netlify.toml`), including the `/admin` portal.
- **Backend:** FastAPI + MongoDB on a VPS via Docker Compose, with Caddy terminating HTTPS.

The admin UI ships inside the public Netlify bundle. That is fine — it holds no secrets and every permission check is enforced server-side — but it means **no secret may ever go into a `REACT_APP_*` variable**, since those are inlined into the JavaScript at build time.

## 1. Backend on the VPS

Prerequisites: a Linux VPS with Docker and the Compose plugin, ports 80/443 open, and a DNS **A record** (e.g. `api.yourdomain.com`) pointing at the VPS IP.

```bash
git clone <repo-url> casnaggi && cd casnaggi

cp .env.example .env                  # API_DOMAIN=api.yourdomain.com
cp backend/.env.example backend/.env  # see the table below

docker compose up -d --build
docker compose exec api python -m app.scripts.seed_events   # once, loads the 9 existing events
```

Verify: `curl https://api.yourdomain.com/api/health` returns `{"status":"ok","db":"ok"}`.

### `backend/.env`

| Variable | Purpose |
| --- | --- |
| `MONGO_URL` | `mongodb://mongo:27017` for the bundled container, or an Atlas URL |
| `DB_NAME` | Database name |
| `CORS_ORIGINS` | Comma-separated frontend origins, exact scheme + host, **no trailing slash** |
| `ADMIN_USERNAME` | Admin login name |
| `ADMIN_PASSWORD_HASH` | bcrypt hash — **single-quoted**, see below |
| `JWT_SECRET` | Signing key — **single-quoted**. Rotating it signs everyone out immediately |
| `JWT_EXPIRE_MINUTES` | Session length, default 480 (8 hours) |
| `RESEND_API_KEY` | Contact-form notifications |
| `RESEND_FROM` | Must be on a domain verified in Resend — a `gmail.com` sender is rejected |
| `NOTIFY_TO` | Comma-separated recipients for new messages |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Event image uploads |
| `CLOUDINARY_FOLDER` | Defaults to `casnaggi/events` |

Generate the admin credentials:

```bash
docker compose exec api python -m app.scripts.hash_password
```

> **Single-quote the hash and the secret.** A bcrypt hash contains `$`, and Compose interpolates `env_file` values — unquoted or double-quoted, everything after the second `$` is read as an empty variable and the hash arrives truncated. Login then fails with a generic 401 that looks exactly like a wrong password. Confirm what actually landed:
>
> ```bash
> docker compose exec api printenv ADMIN_PASSWORD_HASH
> ```

Resend and Cloudinary are both optional. Left blank, the app starts and logs a warning: messages still persist (they're just not emailed) and events fall back to pasted image URLs.

MongoDB is not exposed to the internet; only Caddy publishes ports.

### Verifying the Resend sending domain

Resend will not send from an unverified domain. Until `caresupportfortheneedy.com` is verified it returns `403` and refuses every recipient except the Resend account owner's own address — messages still save, and the admin inbox flags each one as "Not emailed" with a retry button.

1. At **resend.com/domains**, add `caresupportfortheneedy.com`.
2. Add the DNS records Resend shows you (an MX and a `TXT` for SPF, plus a `TXT` for DKIM) at whoever hosts the domain's DNS.
3. Wait for Resend to show **Verified** — usually minutes, occasionally a few hours.
4. Nothing to redeploy: `RESEND_FROM` is already `website@caresupportfortheneedy.com`. Open a flagged message in the admin inbox and press **Try sending again** to confirm.

Sending from your own verified domain is also what keeps notifications out of spam, so it's worth doing properly rather than leaving the sandbox sender in place.

### Updating

```bash
git pull && docker compose up -d --build
docker compose logs -f api
```

### Backups

```bash
docker compose exec mongo mongodump --archive --db casnaggi > casnaggi-$(date +%F).archive
```

Events and contact messages live only in MongoDB, so this is the whole backup. Images live in Cloudinary or in the repo.

## 2. Frontend on Netlify

Set in Netlify → Site settings → Environment variables:

```
REACT_APP_API_URL=https://api.yourdomain.com/api
```

`REACT_APP_SITE_URL` is already in `netlify.toml`; change it there if the public domain differs. Both are baked in at build time, so a change needs a redeploy.

## 3. Admin portal

`https://yourdomain.com/admin` — sign in with `ADMIN_USERNAME` and the password you hashed.

- **Events** — create, edit, publish/unpublish and delete. Drafts are invisible to the public API. An event dated in the future is automatically "upcoming" and drives the floating teaser on the homepage; no flag to remember and nothing to flip later.
- **Inbox** — contact form submissions. A message is stored *before* the notification is attempted, so a Resend outage delays the email but never loses the message; failures are flagged in the list with a retry action.

Changing a published event's web address breaks any existing links to it, so the field is locked until you explicitly unlock it.

## Troubleshooting

- **Login fails with the correct password** — almost always the `$` quoting above. Check `printenv`.
- **CORS errors** — `CORS_ORIGINS` must exactly match the browser origin. Restart with `docker compose up -d` after editing.
- **No HTTPS certificate** — confirm DNS has propagated and 80/443 are open.
- **Rate limiting throttles everyone at once** — means uvicorn isn't seeing real client IPs. The `--forwarded-allow-ips` flag in `backend/Dockerfile` is what fixes this; without it every visitor resolves to the Docker bridge gateway.
- **Events pages show an error with a retry button** — the frontend can't reach the API. Check `REACT_APP_API_URL`, the certificate, and `docker compose ps`.
