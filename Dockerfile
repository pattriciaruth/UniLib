# Use PHP 8.2 with Apache
FROM php:8.2-apache

# Enable mysqli and SSL support
RUN apt-get update && apt-get install -y libssl-dev \
    && docker-php-ext-install mysqli \
    && docker-php-ext-enable mysqli

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Copy project files
COPY public/ /var/www/html/
COPY api/ /var/www/html/api/
COPY Config/ /var/www/html/Config/

# Copy sample config as actual config
COPY Config/config.sample.php /var/www/html/config/config.php

# Set working directory
WORKDIR /var/www/html

# Expose HTTP port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]