FROM php:8.2-fpm-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    oniguruma-dev \
    postgresql-dev \
    sqlite-dev

# Instalar extensões PHP
RUN docker-php-ext-install pdo pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd xml

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar Working directory
WORKDIR /var/www

# Copiar arquivos do projeto
COPY . .

# Instalar dependências do Composer
RUN composer install --no-interaction --optimize-autoloader

# Configurar permissões
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
RUN chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Expor porta
EXPOSE 8000

# Comando para iniciar o servidor PHP embutido
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]