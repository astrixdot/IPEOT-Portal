-- Run once against the shared Postgres instance (digi_postgres_db).
-- Example:
--   docker exec -i digi_postgres_db psql -U digi_user -d postgres -f - < migrations/000_create_database.sql
-- Or: psql -h localhost -p 5490 -U digi_user -d postgres -f migrations/000_create_database.sql

SELECT 'CREATE DATABASE ipeot OWNER digi_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ipeot')\gexec
