# Plane VPS deployment

This bundle runs Plane behind your existing edge stack on `127.0.0.1:8090`, so it does not collide with:

- `stronghold-aegis-1` on `0.0.0.0:80` and `0.0.0.0:443`
- `temcotools` on `0.0.0.0:3000`

## Start

```bash
cd /srv/plane/selfhost
docker compose up -d
```

## Check

```bash
docker compose ps
docker compose logs -f proxy api migrator
curl -I http://127.0.0.1:8090
```

## Reverse proxy target

Point your existing ingress for `plane.chronchive.com` to:

`http://127.0.0.1:8090`

Keep TLS termination at the existing edge layer. Plane's bundled proxy is only serving internal HTTP here.

## Notes

- The instance URL is already set to `https://plane.chronchive.com`.
- Until DNS and proxy routing are in place, browser-based testing by raw IP will not behave cleanly because Plane is configured for the final hostname.
- If you want direct temporary testing without edge routing, change `WEB_URL` and `CORS_ALLOWED_ORIGINS` in `.env`, then restart the stack.
