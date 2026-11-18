# IPEOT database migrations

Database **`ipeot`** lives on the existing **`digi_postgres_db`** container (not a separate Postgres service in IPEOT compose).

1. Create the database (once):

```bash
docker exec -i digi_postgres_db psql -U digi_user -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'ipeot'" | grep -q 1 || \
  docker exec -i digi_postgres_db psql -U digi_user -d postgres -c "CREATE DATABASE ipeot OWNER digi_user;"
```

2. Apply schema migrations in numeric order:

```bash
docker exec -i digi_postgres_db psql -U digi_user -d ipeot -v ON_ERROR_STOP=1 -f - < migrations/001_ipeot_core.sql
```

Or from the host, if Postgres is published on port 5490:

```bash
psql -h localhost -p 5490 -U digi_user -d ipeot -v ON_ERROR_STOP=1 -f migrations/001_ipeot_core.sql
```

Development sign-in (only when `LDAP_URL` is empty): CPF `100001` through `100009`, password `Ipeot@123`. `100001` is the administrator. `100008` is TAC and `100009` is Director. Replace these users before a shared deployment.
