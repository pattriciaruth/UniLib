# Use PHP 8.2 with Apache
FROM php:8.2-apache

# Enable mysqli
RUN docker-php-ext-install mysqli

# Copy all files from your project
COPY public/ /var/www/html/
COPY api/ /var/www/html/api/
COPY Config/ /var/www/html/Config/

# Optional: Enable mod_rewrite (for clean URLs)
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Expose port 80
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]

