# IOMAD (multi-tenant Moodle) — built from the official source; there is no
# maintained upstream image. IOMAD_405_STABLE tracks Moodle 4.5 LTS.
FROM php:8.3.33-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
      git libpng-dev libjpeg-dev libfreetype6-dev libzip-dev libicu-dev libxml2-dev \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" gd intl zip soap mysqli opcache exif

COPY php.ini /usr/local/etc/php/conf.d/iomad.ini
# don't announce Apache's version or OS in headers / error pages
RUN printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-enabled/zz-budu-hide.conf

ARG IOMAD_BRANCH=IOMAD_405_STABLE
RUN cd / && rm -rf /var/www/html \
    && git clone --depth 1 --branch "$IOMAD_BRANCH" https://github.com/iomad/iomad.git /var/www/html \
    && rm -rf /var/www/html/.git

# config.php reads everything from env vars, so the image holds no secrets
COPY config.php /var/www/html/config.php
COPY entrypoint.sh /usr/local/bin/iomad-entrypoint
COPY ws-setup.php /usr/local/share/budu/ws-setup.php
COPY local_budu /var/www/html/local/budu
RUN chown -R www-data:www-data /var/www/html && chmod +x /usr/local/bin/iomad-entrypoint

ENTRYPOINT ["iomad-entrypoint"]
CMD ["apache2-foreground"]
