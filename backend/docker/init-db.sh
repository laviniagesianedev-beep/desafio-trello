#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE boardy_test;
    GRANT ALL PRIVILEGES ON DATABASE boardy_test TO $POSTGRES_USER;
EOSQL