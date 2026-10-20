<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Account lookup for the Budu frontend: sign-in (email → username), the
 * suspended flag (unconfirmed email), site-admin flag and the user's tenant roles.
 */
class get_account extends external_api {

    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'email' => new external_value(PARAM_RAW_TRIMMED, 'Email address'),
        ]);
    }

    public static function execute(string $email): array {
        global $DB, $CFG;

        ['email' => $email] = self::validate_parameters(self::execute_parameters(), ['email' => $email]);
        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('moodle/user:viewalldetails', $context);

        $user = $DB->get_record_select(
            'user',
            'LOWER(email) = LOWER(:email) AND deleted = 0 AND mnethostid = :host',
            ['email' => $email, 'host' => $CFG->mnet_localhost_id],
            'id, username, firstname, lastname, email, suspended',
            IGNORE_MULTIPLE
        );
        if (!$user) {
            return ['found' => false, 'memberships' => []];
        }

        $rows = $DB->get_records_sql(
            'SELECT cu.id, cu.companyid, c.name, cu.managertype, cu.educator
               FROM {company_users} cu
               JOIN {company} c ON c.id = cu.companyid
              WHERE cu.userid = :userid',
            ['userid' => $user->id]
        );

        // Profile picture (f1, 100px) for the frontend's /files route; 0 = none.
        $usercontext = \context_user::instance($user->id, IGNORE_MISSING);
        $picture = $usercontext ? (int)$DB->get_field_select('files', 'id',
            "contextid = ? AND component = 'user' AND filearea = 'icon' AND itemid = 0 AND " . $DB->sql_like('filename', '?'),
            [$usercontext->id, 'f1.%'], IGNORE_MULTIPLE) : 0;

        return [
            'found' => true,
            'picture' => $picture,
            'id' => (int)$user->id,
            'username' => $user->username,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'email' => $user->email,
            'suspended' => (bool)$user->suspended,
            'siteadmin' => is_siteadmin($user->id),
            'memberships' => array_values(array_map(fn($r) => [
                'companyid' => (int)$r->companyid,
                'companyname' => $r->name,
                'managertype' => (int)$r->managertype,
                'educator' => (bool)$r->educator,
            ], $rows)),
        ];
    }

    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'found' => new external_value(PARAM_BOOL, 'Whether an account exists'),
            'id' => new external_value(PARAM_INT, 'User id', VALUE_OPTIONAL),
            'username' => new external_value(PARAM_RAW, 'Username', VALUE_OPTIONAL),
            'firstname' => new external_value(PARAM_NOTAGS, 'First name', VALUE_OPTIONAL),
            'lastname' => new external_value(PARAM_NOTAGS, 'Last name', VALUE_OPTIONAL),
            'email' => new external_value(PARAM_RAW, 'Email', VALUE_OPTIONAL),
            'suspended' => new external_value(PARAM_BOOL, 'Account suspended (e.g. email not confirmed)', VALUE_OPTIONAL),
            'siteadmin' => new external_value(PARAM_BOOL, 'IOMAD site administrator (Budu platform admin)', VALUE_OPTIONAL),
            'picture' => new external_value(PARAM_INT, 'Profile picture file id (f1), 0 = none', VALUE_OPTIONAL),
            'memberships' => new external_multiple_structure(new external_single_structure([
                'companyid' => new external_value(PARAM_INT, 'IOMAD company (tenant) id'),
                'companyname' => new external_value(PARAM_TEXT, 'Company name'),
                'managertype' => new external_value(PARAM_INT, '0 user, 1 company manager, 2 department manager, 3 reporter'),
                'educator' => new external_value(PARAM_BOOL, 'Teaches in this company'),
            ])),
        ]);
    }
}
