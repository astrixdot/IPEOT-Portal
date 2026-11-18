# Install IPEOT Portal

This installs the portal on a machine that does not already have the `digi_postgres_db` container. Postgres is started here, then `ipeot.sql` loads the schema, catalogue, users, and the data that was in the database when the dump was taken.

You need Docker with Compose, and about 2 GB of free disk for the images.

## 1. Get the project

```bash
git clone https://github.com/astrixdot/IPEOT-Portal.git
cd IPEOT-Portal
```

## 2. Create the Docker network

The compose file joins a network named `microservices_digi_network`. Create it once:

```bash
docker network create microservices_digi_network
```

## 3. Start Postgres

`ipeot.sql` was written by pg_dump 17, so use Postgres 17. The published port is **5490**, which is what `env/ipeot.env.example` expects.

```bash
docker run -d \
  --name ipeot-postgres \
  --network microservices_digi_network \
  --network-alias digi_postgres_db \
  -e POSTGRES_USER=digi_user \
  -e POSTGRES_PASSWORD=digi_password \
  -e POSTGRES_DB=ipeot \
  -p 5490:5432 \
  --restart unless-stopped \
  postgres:17

until docker exec ipeot-postgres pg_isready -U digi_user -d ipeot; do sleep 1; done
```

## 4. Load the database

```bash
docker exec -i ipeot-postgres psql -U digi_user -d ipeot -v ON_ERROR_STOP=1 < ipeot.sql
```

This creates the `ipeot` schema and fills it. Run it once on an empty database. Loading it again fails because the schema already exists.

## 5. Configure the app

```bash
cp env/ipeot.env.example env/ipeot.env
```

The example already points at `host.docker.internal` port `5490`, user `digi_user`, password `digi_password`, database `ipeot`. Change `SESSION_SECRET` before anyone else uses the machine. Leave `LDAP_URL` unset to sign in with the users stored in the dump.

## 6. Start the portal

```bash
docker compose up -d --build
```

The first build takes several minutes. When the containers are healthy, open:

http://localhost:8280/

A database check is available at http://localhost:3034/ping and should report `"db":"ipeot"`.

## Sign in

With `LDAP_URL` empty, use the seeded accounts. The password for each is `Ipeot@123`.

| CPF | Role |
| --- | --- |
| 100001 | Administrator |
| 100002 | PCC |
| 100003 | Coordinator |
| 100004 | L3, department 1 |
| 100005 | In-charge |
| 100006 | HOD, department 1 |
| 100007 | HOI |
| 100008 | TAC |
| 100009 | Director |

Replace these accounts before a shared deployment.

## Ports

| What | Host port |
| --- | --- |
| Portal | 8280 |
| Postgres | 5490 |
| Auth | 9991 |
| API | 3034 |
| Upload | 5051 |
| Notifications | 8011 |
| Integration | 3035 |

Stop the stack with `docker compose down`. That leaves `ipeot-postgres` and its data running. Remove the database container with `docker rm -f ipeot-postgres` only when you intend to discard the data.
