#!/bin/bash
set -e

echo "=== Boardy Backend ==="

echo "[1/5] Verificando dependencias PHP..."
if [ ! -f "/var/www/vendor/autoload.php" ]; then
    composer install --no-interaction --optimize-autoloader 2>/dev/null || composer install --no-interaction
else
    echo "Dependencias ja instaladas, pulando..."
fi

echo "[2/5] Gerando chave da aplicacao..."
if grep -q "APP_KEY=base64:" /var/www/.env; then
    echo "Chave ja existe, pulando..."
else
    php artisan key:generate --force
fi

echo "[3/5] Aguardando PostgreSQL..."
until php -r "new PDO('pgsql:host=${DB_HOST:-boardy-postgres};port=${DB_PORT:-5432};dbname=${DB_DATABASE:-boardy}', '${DB_USERNAME:-boardy}', '${DB_PASSWORD:-boardy_secret}');" > /dev/null 2>&1; do
    echo "PostgreSQL nao pronto, aguardando..."
    sleep 2
done
echo "PostgreSQL pronto!"

echo "[4/5] Executando migrations..."
php artisan migrate --force

echo "[4b/5] Criando banco de testes..."
php -r "try { new PDO('pgsql:host=${DB_HOST:-boardy-postgres};port=${DB_PORT:-5432};dbname=boardy_test', '${DB_USERNAME:-boardy}', '${DB_PASSWORD:-boardy_secret}'); echo 'OK'; } catch(Exception \$e) { echo 'NOT_FOUND'; }" | grep -q "NOT_FOUND" && php -r "new PDO('pgsql:host=${DB_HOST:-boardy-postgres};port=${DB_PORT:-5432};dbname=postgres', '${DB_USERNAME:-boardy}', '${DB_PASSWORD:-boardy_secret}')->exec('CREATE DATABASE boardy_test');" 2>/dev/null || true
php artisan migrate --database=pgsql_test --force 2>/dev/null || true

echo "[5/5] Criando link de storage..."
php artisan storage:link 2>/dev/null || true

echo "Iniciando servidor..."
exec php artisan serve --host=0.0.0.0 --port=8000