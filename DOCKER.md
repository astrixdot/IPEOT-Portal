# IPEOT Docker setup

## Prerequisites

- Running **`digi_postgres_db`** on Docker network **`microservices_digi_network`**
- Database **`ipeot`** created (see `migrations/README.md`)

## Port map (host)

| Service | Host port | Notes |
|---------|-----------|--------|
| **ipeot-haproxy** | **8280** (HTTP), **9643** (HTTPS) | ADB uses 8080 / 9443 |
| ipeot-authservice | 9991 | ADB authservice internal 9990 |
| ipeot-crudservice | 3034 | ADB crud internal 3033 |
| ipeot-uploadservice | 5051 | ADB upload internal 5050 |
| ipeot-notifications | 8011 | digi_business_service uses **8001** |
| ipeot-integration | 3035 | — |
| ipeot-redis (profile `queue`) | 6380 | digi_redis not published on host |

Postgres: host **5490** → shared **`digi_postgres_db`**, database **`ipeot`**.  
Default **`env/ipeot.env`**: `DEV_DB_HOST=host.docker.internal`, `DEV_DB_PORT=5490` (matches ADB `env_test`).  
In-network alternative: `digi_postgres_db` + port **5432**.

**Important:** `DEV_PORT=3034` for IPEOT crud (ADB uses 3033). Compose also sets `PORT=3034`; host URL is http://localhost:**3034**/ping.

## Commands

From repository root:

```bash
# Create DB once
docker exec -i digi_postgres_db psql -U digi_user -d postgres -c "CREATE DATABASE ipeot OWNER digi_user;" 2>/dev/null || true

cd "IPEOT Portal"
docker compose up -d --build

# Optional Redis for queues
docker compose --profile queue up -d ipeot-redis
```

- Portal (via proxy): http://localhost:8280/
- Crud DB check: http://localhost:3034/ping

Apply the migrations in `migrations/` in numeric order before sign-in. With `LDAP_URL` unset, development CPFs `100001`–`100009` use password `Ipeot@123` (`100001` is the administrator, `100008` is TAC, `100009` is Director).

Production-style (no direct service ports):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
