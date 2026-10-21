<?php
// One-time (idempotent) setup of the API the Budu frontend uses:
// REST web services on, a dedicated integration user holding only the
// capabilities it needs, a "budu" service limited to the functions it calls,
// account lockout, and a permanent token. Prints the token on stdout, nothing else.
//
//   docker compose exec -u www-data iomad php /usr/local/share/budu/ws-setup.php

define('CLI_SCRIPT', true);
require('/var/www/html/config.php');
require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/user/lib.php');

const FUNCTIONS = [
    'core_user_create_users',
    'core_user_get_users_by_field',
    'block_iomad_company_admin_create_companies',
    'block_iomad_company_admin_get_companies',
    'block_iomad_company_admin_assign_users',
    'core_user_update_users',           // activate after email confirmation, reset password
    'local_budu_get_account',           // sign-in lookup + tenant role (iomad/local_budu)
    'local_budu_check_password',        // sign-in password check (iomad/local_budu)
    'core_user_update_picture',         // profile photo (draft uploaded via webservice/upload.php)
    // Course builder (iomad/local_budu/classes/external/courses.php); each checks the acting user's rights.
    'local_budu_list_courses',
    'local_budu_create_course',
    'local_budu_update_course',
    'local_budu_get_course',
    'local_budu_save_lesson',
    'local_budu_delete_lesson',
    'local_budu_move_lesson',
    'local_budu_add_material',
    'local_budu_save_task',
    'local_budu_delete_item',
    'local_budu_file_access',
    // Students, homework and grades (iomad/local_budu/classes/external/learning.php).
    'local_budu_list_students',
    'local_budu_enrol_student',
    'local_budu_unenrol_student',
    'local_budu_submissions',
    'local_budu_get_submission',
    'local_budu_grade',
    'local_budu_gradebook',
    'local_budu_my_courses',
    'local_budu_my_homework',
    'local_budu_my_submission',
    'local_budu_submit',
    // School overview for managers (iomad/local_budu/classes/external/school.php).
    'local_budu_company_people',
    'local_budu_company_courses',
    'local_budu_set_role',
];
const CAPABILITIES = [
    'webservice/rest:use',
    'moodle/user:create',
    'moodle/user:viewdetails',
    'moodle/user:viewalldetails',
    'moodle/site:viewuseridentity', // lets get_users_by_field match on email
    'block/iomad_company_admin:company_add',
    'block/iomad_company_admin:company_view',
    'block/iomad_company_admin:assign_company_manager',
    'moodle/user:update',
    'moodle/user:editprofile',          // core_user_update_picture for another user
    // Course builder: the integration user makes the changes after local_budu checked the teacher.
    'moodle/course:create',
    'moodle/course:update',
    'moodle/course:manageactivities',
    'moodle/course:movesections',
    'moodle/course:sectionvisibility',
    'moodle/course:viewhiddensections',
    'moodle/course:viewhiddenactivities',
    'moodle/course:viewhiddencourses',
    'moodle/course:view',             // open course files without being enrolled (webservice/pluginfile.php)
    'moodle/user:manageownfiles',     // upload into its own draft area (webservice/upload.php)
    'enrol/manual:enrol',
    'mod/resource:addinstance',
    'mod/resource:view',
    'mod/assign:addinstance',
    'mod/assign:view',
    // Homework: hand in for a student, grade, read grades (after local_budu checked the real user).
    'mod/assign:editothersubmission',
    'mod/assign:grade',
    'mod/assign:viewgrades',
    'mod/assign:submit',
    'moodle/grade:edit',
    'enrol/manual:unenrol',
];

$system = context_system::instance();

// 1. Web services + REST.
set_config('enablewebservices', 1);
$protocols = array_filter(explode(',', $CFG->webserviceprotocols ?? ''));
if (!in_array('rest', $protocols)) {
    set_config('webserviceprotocols', implode(',', array_merge($protocols, ['rest'])));
}

// Lock an account after 10 failed sign-ins (Budu's password check uses Moodle's authentication).
if (empty($CFG->lockoutthreshold)) {
    set_config('lockoutthreshold', 10);
}

// 2. Integration user (random password nobody knows: it can only use its token).
$user = $DB->get_record('user', ['username' => 'budu_integration', 'deleted' => 0]);
if (!$user) {
    $id = user_create_user((object)[
        'username' => 'budu_integration',
        'auth' => 'manual',
        'password' => bin2hex(random_bytes(24)) . 'Aa1!',
        'firstname' => 'Budu',
        'lastname' => 'Integration',
        'email' => 'integration@budu.invalid',
        'confirmed' => 1,
        'mnethostid' => $CFG->mnet_localhost_id,
    ], true, false);
    $user = $DB->get_record('user', ['id' => $id]);
}

// 3. A role with just the needed capabilities, assigned at system level.
$role = $DB->get_record('role', ['shortname' => 'budu_integration']);
$roleid = $role ? $role->id : create_role('Budu integration', 'budu_integration', 'Used by the Budu frontend API token.');
set_role_contextlevels($roleid, [CONTEXT_SYSTEM]);
foreach (CAPABILITIES as $cap) {
    assign_capability($cap, CAP_ALLOW, $roleid, $system->id, true);
}
role_assign($roleid, $user->id, $system->id);
$system->mark_dirty();

// 4. The service, limited to our functions and our user.
$service = $DB->get_record('external_services', ['shortname' => 'budu']);
if (!$service) {
    $service = (object)[
        'name' => 'Budu frontend',
        'shortname' => 'budu',
        'enabled' => 1,
        'restrictedusers' => 1,
        'downloadfiles' => 1,
        'uploadfiles' => 1,
        'requiredcapability' => '',
        'timecreated' => time(),
    ];
    $service->id = $DB->insert_record('external_services', $service);
}
// Lesson files: upload to IOMAD (webservice/upload.php) and stream them back (webservice/pluginfile.php).
if (!$service->uploadfiles || !$service->downloadfiles) {
    $DB->update_record('external_services', (object)['id' => $service->id, 'uploadfiles' => 1, 'downloadfiles' => 1]);
}
foreach (FUNCTIONS as $fn) {
    if (!$DB->record_exists('external_services_functions', ['externalserviceid' => $service->id, 'functionname' => $fn])) {
        $DB->insert_record('external_services_functions', (object)['externalserviceid' => $service->id, 'functionname' => $fn]);
    }
}
if (!$DB->record_exists('external_services_users', ['externalserviceid' => $service->id, 'userid' => $user->id])) {
    $DB->insert_record('external_services_users', (object)[
        'externalserviceid' => $service->id, 'userid' => $user->id, 'timecreated' => time(),
    ]);
}

// Cleanup from an earlier setup that signed in via login/token.php: remove the
// open "budu_login" service and the token permission it needed.
if ($login = $DB->get_record('external_services', ['shortname' => 'budu_login'])) {
    $DB->delete_records('external_tokens', ['externalserviceid' => $login->id]);
    $DB->delete_records('external_services_functions', ['externalserviceid' => $login->id]);
    $DB->delete_records('external_services', ['id' => $login->id]);
}
unassign_capability('moodle/webservice:createtoken', $CFG->defaultuserroleid, $system->id);
$system->mark_dirty();

// 5. Token (reuse the existing one).
$token = $DB->get_field('external_tokens', 'token', ['externalserviceid' => $service->id, 'userid' => $user->id]);
if (!$token) {
    $token = \core_external\util::generate_token(EXTERNAL_TOKEN_PERMANENT, $service, $user->id, $system, 0, '', 'Budu frontend');
}
echo $token, PHP_EOL;
