# Hosting OpenBridge

This download is the OpenBridge web app, ready to put on a server so people can use it from a
web address. It is a set of static files: there is no database, no backend, and no personal data
on the server. Everything a person types stays in their own browser.

> **Prototype.** The eligibility rules are drafts that experts have not verified yet. Results
> are estimates, not decisions. Please do not present this as an official or verified tool.

## What is inside

| Path                                    | What it is                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `site/`                                 | The app. Serve this folder.                                                          |
| `site/deployment-config.json`           | Optional settings for your organization (see below).                                 |
| `serve.mjs`                             | A small start script for quick testing or simple hosting. Needs Node.js 22 or newer. |
| `Dockerfile`, `compose.yaml`, `docker/` | Run it as a container (non-root nginx, port 8080).                                   |
| `nginx.conf`, `Caddyfile`               | Example configurations for common web servers.                                       |
| `BUILD-INFO.json`                       | Version, rules data version, and build details.                                      |

## Fastest start (try it on this computer)

```bash
node serve.mjs
```

Open http://127.0.0.1:8080 in a browser. By default only this computer can reach it.

## Run it with Docker

From this folder:

```bash
docker compose up -d          # http://127.0.0.1:8080
```

Or without Compose:

```bash
docker build -t openbridge .
docker run -d --name openbridge --restart unless-stopped -p 127.0.0.1:8080:8080 openbridge
```

Each GitHub Release also includes ready-made images (`openbridge-image-v*-linux-amd64.tar.gz` and
`-linux-arm64.tar.gz`). Load one with `docker load -i <file>`, then run it the same way using the
tag it prints.

The container runs nginx as a non-root user on port 8080, keeps no access log, and exposes
`/healthz` for health checks. It is published to `127.0.0.1` on purpose: for a public site, point an
HTTPS reverse proxy (Caddy, nginx, Traefik, or your cloud load balancer) at it instead of
publishing the port to the internet.

## Put it on a real server

Pick one:

- **Any static host or CDN** (for example a storage bucket with a CDN, or Netlify, or GitHub
  Pages). Upload the contents of `site/`. Configure "single-page app" fallback so unknown paths
  serve `index.html`.
- **Caddy** (easiest HTTPS). Copy `site/` to `/var/www/openbridge`, edit the domain in
  `Caddyfile`, and run `caddy run --config Caddyfile`.
- **nginx.** Copy `site/` to `/var/www/openbridge`, adapt `nginx.conf`, and add HTTPS certificates.
- **The included script behind a reverse proxy.** Run `HOST=127.0.0.1 PORT=8080 node serve.mjs`
  and point your HTTPS reverse proxy at it. Only use `HOST=0.0.0.0` when you understand that
  other machines can then reach it directly.

Always serve the public site over **HTTPS**. Offline support and installing the app on a phone
both require it.

## Customize for your organization

Edit `site/deployment-config.json`:

```json
{
  "orgName": "Example Food Bank",
  "defaultMode": "navigator",
  "autoClearTimeoutSeconds": 300,
  "localResources": [{ "label": "Our benefits desk", "url": "https://example.org/help" }]
}
```

- `defaultMode`: `individual` (public kiosks and personal use) or `navigator` (staff screening
  several clients).
- `autoClearTimeoutSeconds`: how long before an idle screen clears itself in individual mode.

> Only `defaultMode` and `autoClearTimeoutSeconds` change behavior today, and the file is applied
> only when **both** are present. `orgName`, `contact`, and `localResources` are accepted but not
> shown in the app yet (tracked in `ROADMAP.md`).

## Privacy checklist for hosts

- Do not add analytics, tracking pixels, chat widgets, or third-party scripts to the pages.
- Turn off or minimize access logs. The app never puts personal details in web addresses, but
  logs are still data you would have to protect.
- Keep the security headers from the examples (they block outside scripts).

## Updating

Download the newer release and replace the files in `site/`. Users get the update the next time
they open the app. Check `BUILD-INFO.json` for the rules data version.

## Help

Project home, documentation, and issues: see the OpenBridge repository on GitHub.
Contact: openbridge@starlingtek.com.

OpenBridge is licensed under the GNU Affero General Public License v3.0. If you change it and
offer it to others over a network, you must share your changes.
