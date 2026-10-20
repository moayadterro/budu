<?php
defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_budu_get_account' => [
        'classname' => \local_budu\external\get_account::class,
        'description' => 'Look up an account by email, with its IOMAD company memberships (manager type, educator).',
        'type' => 'read',
        'capabilities' => 'moodle/user:viewalldetails',
    ],
    'local_budu_check_password' => [
        'classname' => \local_budu\external\check_password::class,
        'description' => 'Check a password with Moodle authentication (lockout, suspension apply). No session is created.',
        'type' => 'read',
        'capabilities' => 'moodle/user:viewalldetails',
    ],
];
