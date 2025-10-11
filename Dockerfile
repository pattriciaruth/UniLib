# Use PHP 8.2 with Apache
FROM php:8.2-apache

# Enable MySQLi extension
RUN docker-php-ext-install mysqli

# Copy all project files to the web root
COPY . /var/www/html/

# Set working directory to public (where index.html is)
WORKDIR /var/www/html/public

# Expose port 80
EXPOSE 80
