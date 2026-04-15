#!/bin/bash
set -e

echo "=== Boardy Backend ==="

echo "[1/5] Copiando banco para memoria (performance)..."
DB_SOURCE="/var/www/database/database.sqlite"
DB_SHM="/dev/shm/boardy.sqlite"
if [ -f "$DB_SOURCE" ] && [ ! -f "$DB_SHM" ]; then
    cp "$DB_SOURCE" "$DB_SHM"
fi
export DB_DATABASE="$DB_SHM"
sed -i "s|DB_DATABASE=.*|DB_DATABASE=$DB_SHM|" /var/www/.env

echo "[2/5] Instalando dependencias PHP..."
composer install --no-interaction --optimize-autoloader 2>/dev/null || composer install --no-interaction

echo "[3/5] Gerando chave da aplicacao..."
if grep -q "APP_KEY=base64:" /var/www/.env; then
    echo "Chave ja existe, pulando..."
else
    php artisan key:generate --force
fi

echo "[4/5] Executando migrations..."
php artisan migrate --force

echo "[5/5] Criando link de storage..."
php artisan storage:link 2>/dev/null || true

echo "Iniciando servidor..."
exec php artisan serve --host=0.0.0.0 --port=8000