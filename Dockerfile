# ==============================
# UniLib Deployment Dockerfile
# ==============================

# 1️⃣ Use PHP 8.2 with Apache
FROM php:8.2-apache

# 2️⃣ Enable mysqli extension (for MySQL / PlanetScale)
RUN docker-php-ext-install mysqli

# 3️⃣ Copy your project files
COPY public/ /var/www/html/
COPY api/ /var/www/html/api/
COPY Config/ /var/www/html/Config/

# 4️⃣ Copy sample config as main config (important fix)
COPY Config/config.sample.php /var/www/html/config/config.php

# 5️⃣ Enable Apache mod_rewrite (optional but useful for clean URLs)
RUN a2enmod rewrite

# 6️⃣ Set working directory
WORKDIR /var/www/html

# 7️⃣ Expose default HTTP port
EXPOSE 80

# 8️⃣ Start Apache server
CMD ["apache2-foreground"]


