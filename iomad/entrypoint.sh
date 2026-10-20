#!/bin/sh
# First boot: install IOMAD into the empty DB. Later boots: apply any upgrade
# from a rebuilt image. Then run Moodle cron every minute and start Apache.
set -e
cd /var/www/html
chown -R www-data:www-data /var/www/moodledata
as_www() { su www-data -s /bin/sh -c "$*"; }

if [ ! -f /var/www/moodledata/.budu-installed ]; then
  # single quotes: the inner shell expands the env vars (su keeps the environment)
  as_www 'php admin/cli/install_database.php --agree-license \
    --fullname="Budu" --shortname="Budu" \
    --adminuser="$IOMAD_ADMIN_USER" --adminpass="$IOMAD_ADMIN_PASSWORD" \
    --adminemail="$IOMAD_ADMIN_EMAIL"'
  touch /var/www/moodledata/.budu-installed
else
  as_www "php admin/cli/upgrade.php --non-interactive"
fi

(while true; do as_www "php admin/cli/cron.php" >/dev/null 2>&1; sleep 60; done) &

exec docker-php-entrypoint "$@"
