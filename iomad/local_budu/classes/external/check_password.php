<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Password check for Budu sign-in. Runs Moodle's own authenticate_user_login,
 * so lockout, suspension, auth plugins and failed-login logging all apply.
 * It does NOT start a Moodle session. Only the integration token can call it.
 */
class check_password extends external_api {

    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'username' => new external_value(PARAM_RAW, 'Username'),
            'password' => new external_value(PARAM_RAW, 'Password'),
        ]);
    }

    public static function execute(string $username, string $password): array {
        global $CFG;
        require_once($CFG->libdir . '/authlib.php');

        $params = self::validate_parameters(self::execute_parameters(), ['username' => $username, 'password' => $password]);
        $context = \context_system::instance();
        self::validate_context($context);
        require_capability('moodle/user:viewalldetails', $context);

        $reason = AUTH_LOGIN_OK;
        $user = authenticate_user_login($params['username'], $params['password'], false, $reason);
        $map = [
            AUTH_LOGIN_OK => 'ok', AUTH_LOGIN_NOUSER => 'invalid', AUTH_LOGIN_FAILED => 'invalid',
            AUTH_LOGIN_SUSPENDED => 'suspended', AUTH_LOGIN_LOCKOUT => 'locked', AUTH_LOGIN_UNAUTHORISED => 'invalid',
        ];
        return ['ok' => (bool)$user, 'reason' => $user ? 'ok' : ($map[$reason] ?? 'invalid')];
    }

    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'Password accepted'),
            'reason' => new external_value(PARAM_ALPHA, 'ok | invalid | suspended | locked'),
        ]);
    }
}
