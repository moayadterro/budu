<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Who an announcement reaches, for the Budu frontend: the parents of a set of students (a class, a
 * course), and the school (IOMAD company) a course belongs to. Read-only; the frontend checks that the
 * acting user may post to that class / course before asking.
 */
class audience extends external_api {

    // ----- parents_of -----------------------------------------------------

    public static function parents_of_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userids' => new external_multiple_structure(new external_value(PARAM_INT, 'Student'), 'Students', VALUE_DEFAULT, []),
        ]);
    }

    /** The (active) parents of these students, each once. */
    public static function parents_of(array $userids = []): array {
        global $DB;
        $p = self::validate_parameters(self::parents_of_parameters(), compact('userids'));
        self::validate_context(\context_system::instance());
        if (!$p['userids']) {
            return [];
        }
        [$in, $params] = $DB->get_in_or_equal(array_map('intval', $p['userids']));
        $users = $DB->get_records_sql("SELECT DISTINCT u.* FROM {context} ctx
            JOIN {role_assignments} ra ON ra.contextid = ctx.id AND ra.roleid = ?
            JOIN {user} u ON u.id = ra.userid AND u.deleted = 0 AND u.suspended = 0
            WHERE ctx.contextlevel = ? AND ctx.instanceid $in",
            array_merge([family::parent_role(), CONTEXT_USER], $params));
        return array_values(array_map(fn($u) => learning::person($u), $users));
    }

    public static function parents_of_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'User id'),
            'name' => new external_value(PARAM_TEXT, 'Full name'),
            'email' => new external_value(PARAM_RAW, 'Email'),
            'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
        ]));
    }

    // ----- course_company -------------------------------------------------

    public static function course_company_parameters(): external_function_parameters {
        return new external_function_parameters(['courseid' => new external_value(PARAM_INT, 'Course')]);
    }

    /** The IOMAD company that owns the course (0 = none). */
    public static function course_company(int $courseid): array {
        global $DB;
        $p = self::validate_parameters(self::course_company_parameters(), compact('courseid'));
        self::validate_context(\context_system::instance());
        $id = $DB->get_field_select('company_course', 'companyid', 'courseid = ?', [$p['courseid']], IGNORE_MULTIPLE);
        return ['companyid' => (int)$id];
    }

    public static function course_company_returns(): external_single_structure {
        return new external_single_structure(['companyid' => new external_value(PARAM_INT, 'IOMAD company, 0 = none')]);
    }
}
