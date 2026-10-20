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
    'local_budu_list_courses' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'list_courses',
        'description' => 'Company courses the acting user can edit.',
        'type' => 'read',
    ],
    'local_budu_create_course' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'create_course',
        'description' => 'Create a draft course in a company; the acting educator becomes its editing teacher.',
        'type' => 'write',
    ],
    'local_budu_update_course' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'update_course',
        'description' => 'Rename, describe, publish or unpublish a course.',
        'type' => 'write',
    ],
    'local_budu_get_course' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'get_course',
        'description' => 'A course with its lessons, materials and tasks, as the acting user may see it.',
        'type' => 'read',
    ],
    'local_budu_save_lesson' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'save_lesson',
        'description' => 'Add or rename a lesson (course section).',
        'type' => 'write',
    ],
    'local_budu_delete_lesson' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'delete_lesson',
        'description' => 'Delete a lesson and its contents.',
        'type' => 'write',
    ],
    'local_budu_move_lesson' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'move_lesson',
        'description' => 'Move a lesson up or down.',
        'type' => 'write',
    ],
    'local_budu_add_material' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'add_material',
        'description' => 'Add an uploaded video/PDF/file to a lesson (mod_resource).',
        'type' => 'write',
    ],
    'local_budu_save_task' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'save_task',
        'description' => 'Add or change a lesson task (mod_assign, graded 0-100).',
        'type' => 'write',
    ],
    'local_budu_delete_item' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'delete_item',
        'description' => 'Delete a lesson material or task.',
        'type' => 'write',
    ],
    'local_budu_file_access' => [
        'classname' => \local_budu\external\courses::class,
        'methodname' => 'file_access',
        'description' => 'Check whether the acting user may open a lesson file; return its location.',
        'type' => 'read',
    ],
];
