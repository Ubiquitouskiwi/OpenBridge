# Host it for others

This page helps an organization put OpenBridge on its own web address so clients and staff can use
it in a browser. It is for whoever runs your website or IT, working with program staff. The
detailed, step-by-step sources are the
[hosting guide]({{repo}}/blob/HEAD/packaging/hosted/README.md) (also inside the download) and
[deployment notes]({{repo}}/blob/HEAD/docs/DEPLOYMENT.md).

> **OpenBridge is a prototype.** The rules are drafts that experts have not verified, and no legal
> review has happened yet. Do not present it as an official or verified tool. Tell your users that
> results are estimates.

## What you are hosting

OpenBridge is a set of static files: a web page, scripts, and rule data. There is no database and
no backend. All screening happens in each person's browser, so no personal data ever reaches your
server.

## Before you start

- Download `openbridge-hosted-v<version>.tar.gz` from the repository's **Releases** page. It holds
  the app in `site/`, plus `Dockerfile`, `compose.yaml`, `nginx.conf`, `Caddyfile`, `serve.mjs`,
  and `BUILD-INFO.json`. Container users can instead download
  `openbridge-image-v<version>-linux-amd64.tar.gz` or `-linux-arm64.tar.gz`.
- If no release is published yet, you can build the same files from source. See
  [[Developer setup|Developer-Setup]] and [releasing]({{repo}}/blob/HEAD/docs/RELEASING.md).
- Optional: check your download against `SHA256SUMS.txt` from the same release.
- A domain name and a way to serve it over HTTPS.

## Steps

1. **Try it on one computer.** In the unpacked folder, run `node serve.mjs` (needs Node.js 20 or
   newer) and open http://127.0.0.1:8080. Only that computer can reach it.
2. **Choose how to serve it.** Pick one option from the table below.
3. **Set your defaults** in `site/deployment-config.json` (see below).
4. **Turn on HTTPS.** Always serve the public site over HTTPS. Offline use and installing the app on
   a phone both need it.
5. **Go through the privacy checklist** below before you share the address.

| Option             | Good for                         | How                                                                                                        |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Static host or CDN | Most organizations               | Upload the contents of `site/`. Turn on single-page app fallback so unknown paths serve `index.html`.      |
| Docker or Compose  | Teams that use containers        | `docker compose up -d`. It listens on `127.0.0.1:8080`; put an HTTPS reverse proxy in front.               |
| Caddy              | Easiest HTTPS on your own server | Copy `site/` to `/var/www/openbridge`, set your domain in `Caddyfile`, run `caddy run --config Caddyfile`. |
| nginx              | Servers that already run nginx   | Copy `site/` to `/var/www/openbridge`, adapt `nginx.conf`, and add your certificates.                      |
| `serve.mjs`        | Simple setups behind a proxy     | `HOST=127.0.0.1 PORT=8080 node serve.mjs`, then point your HTTPS reverse proxy at it.                      |

The container runs nginx as a non-root user on port 8080, keeps no access log, and answers health
checks at `/healthz`. Only set `HOST=0.0.0.0` for `serve.mjs` if you understand that other machines
can then reach it directly, without HTTPS.

## Customize for your organization

Edit `site/deployment-config.json`. The app reads it each time it starts. With Compose you can mount
the file instead of rebuilding (see the comment in `compose.yaml`).

```json
{
  "defaultMode": "navigator",
  "autoClearTimeoutSeconds": 300
}
```

- `defaultMode`: `individual` for public kiosks and personal use, or `navigator` for staff who
  screen several clients. See [[Guide for navigators|Navigator-Guide]].
- `autoClearTimeoutSeconds`: seconds of no activity before the screen clears itself, in individual
  mode. The default is 180 (3 minutes). Use a short time on public computers.

Include **both** fields. If either is missing, the app ignores the file and uses its defaults. The
file also accepts `orgName`, `contact`, and `localResources`, but the app does not show them yet.

## Privacy checklist for hosts

- Do not add analytics, tracking pixels, chat widgets, or any third-party scripts.
- Turn off access logs, or keep them small and short-lived. The app never puts personal details in
  web addresses, but logs are still data you must protect.
- Keep the security headers from the example configurations. They block outside scripts.
- Do not put a login or form in front of the app that collects personal details.
- On public computers, keep `defaultMode` as `individual` so the auto-clear stays on.

## Updating

There are no automatic updates. When a new release comes out:

1. Download the new hosted file.
2. Replace the contents of `site/`, keeping your own `deployment-config.json`.
3. Check `BUILD-INFO.json` for the version, the rules data version, and each state's review status.

People get the new version the next time they open the app. Rule values change every year, so plan
to update at least once a year. Watch the repository's releases to hear about new versions.

## License

OpenBridge uses the GNU Affero General Public License v3.0. If you change it and offer it to others
over a network, you must share your changes.

## Related pages

- [[Guide for navigators|Navigator-Guide]]
- [[Privacy and your data|Privacy-and-Your-Data]]
- [[Run it on your computer|Run-OpenBridge-on-Your-Computer]]
- [[Making a release|Making-a-Release]]
