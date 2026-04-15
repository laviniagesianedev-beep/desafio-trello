#!/bin/bash
set -e

echo "=== Boardy Backend ==="

DB_SOURCE="/var/www/database/database.sqlite"
DB_SHM="/dev/shm/boardy.sqlite"

echo "[1/6] Verificando banco de dados..."
if [ ! -f "$DB_SOURCE" ]; then
    mkdir -p /var/www/database
    touch "$DB_SOURCE"
    echo "Banco criado: $DB_SOURCE"
fi

echo "[2/6] Instalando dependencias PHP..."
composer install --no-interaction --optimize-autoloader 2>/dev/null || composer install --no-interaction

echo "[3/6] Gerando chave da aplicacao..."
if grep -q "APP_KEY=base64:" /var/www/.env; then
    echo "Chave ja existe, pulando..."
else
    php artisan key:generate --force
fi

echo "[4/6] Executando migrations no banco persistente..."
php artisan migrate --force

echo "[5/6] Copiando banco para memoria (performance)..."
cp "$DB_SOURCE" "$DB_SHM"
sed -i "s|DB_DATABASE=.*|DB_DATABASE=$DB_SHM|" /var/www/.env

echo "[6/6] Criando link de storage..."
php artisan storage:link 2>/dev/null || true

echo "Iniciando servidor..."
exec php artisan serve --host=0.0.0.0 --port=8000
