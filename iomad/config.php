<?php  // IOMAD config — all values come from the container environment.
unset($CFG);
global $CFG;
$CFG = new stdClass();

$CFG->dbtype    = 'mariadb';
$CFG->dblibrary = 'native';
$CFG->dbhost    = getenv('IOMAD_DB_HOST');
$CFG->dbname    = getenv('IOMAD_DB_NAME');
$CFG->dbuser    = getenv('IOMAD_DB_USER');
$CFG->dbpass    = getenv('IOMAD_DB_PASSWORD');
$CFG->prefix    = 'mdl_';
$CFG->dboptions = ['dbpersist' => 0, 'dbport' => '', 'dbsocket' => '', 'dbcollation' => 'utf8mb4_unicode_ci'];

$CFG->wwwroot   = getenv('IOMAD_URL');
// Server-to-server API calls from the frontend container arrive as http://iomad
// (exact match only, so other Host headers still get the normal redirect).
if (($_SERVER['HTTP_HOST'] ?? '') === 'iomad') {
    $CFG->wwwroot = 'http://iomad';
}
$CFG->dataroot  = '/var/www/moodledata';
$CFG->admin     = 'admin';
$CFG->directorypermissions = 02777;

// Password policy (owner, 2026-10-22): 8+ characters with upper, lower and a digit — symbols
// allowed but not required. Forced here so the admin UI can't drift from the frontend's passwordOk().
$CFG->passwordpolicy          = 1;
$CFG->minpasswordlength       = 8;
$CFG->minpassworddigits       = 1;
$CFG->minpasswordlower        = 1;
$CFG->minpasswordupper        = 1;
$CFG->minpasswordnonalphanum  = 0;

require_once(__DIR__ . '/lib/setup.php');
