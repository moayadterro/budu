<?php
// Budu integration: web-service functions the Budu frontend needs that IOMAD
// doesn't provide (e.g. a user's company role flags).
defined('MOODLE_INTERNAL') || die();

$plugin->component = 'local_budu';
$plugin->version = 2026103107;
$plugin->requires = 2024100700; // Moodle 4.5
$plugin->maturity = MATURITY_ALPHA;
$plugin->release = '0.2';
$plugin->dependencies = ['block_iomad_company_admin' => ANY_VERSION];
