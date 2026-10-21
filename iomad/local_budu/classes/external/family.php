<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Parents for Budu. A parent is linked to a child the standard Moodle way: the role `budu_parent`
 * assigned in the CHILD's user context (Moodle's "parent role" pattern), so IOMAD stays the record of
 * who is whose parent. The request / approval flow lives in the Budu frontend, which calls link_parent
 * only after the parent accepted; read functions here take the user the frontend has already checked.
 */
class family extends external_api {

    /** The parent role (created on first use: a marker role, assignable in user contexts only). */
    public static function parent_role(): int {
        global $DB;
        $id = $DB->get_field('role', 'id', ['shortname' => 'budu_parent']);
        if ($id) {
            return (int)$id;
        }
        $id = create_role('Parent (Budu)', 'budu_parent', 'Parent of a student, linked by Budu after both agreed.');
        set_role_contextlevels($id, [CONTEXT_USER]);
        return (int)$id;
    }

    private static function setup(): void {
        self::validate_context(\context_system::instance());
    }

    private static function user(int $id): \stdClass {
        global $DB;
        return $DB->get_record('user', ['id' => $id, 'deleted' => 0], '*', MUST_EXIST);
    }

    /** Person + the schools (IOMAD companies) they belong to. */
    private static function member(\stdClass $u): array {
        global $DB;
        $schools = $DB->get_records_sql('SELECT c.id, c.name FROM {company_users} cu JOIN {company} c ON c.id = cu.companyid
            WHERE cu.userid = ? ORDER BY c.name', [$u->id]);
        return learning::person($u) + ['schools' => array_values(array_map(
            fn($c) => ['companyid' => (int)$c->id, 'name' => $c->name], $schools))];
    }

    private static function member_structure(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'User id'),
            'name' => new external_value(PARAM_TEXT, 'Full name'),
            'email' => new external_value(PARAM_RAW, 'Email'),
            'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
            'schools' => new external_multiple_structure(new external_single_structure([
                'companyid' => new external_value(PARAM_INT, 'IOMAD company'),
                'name' => new external_value(PARAM_TEXT, 'Company name'),
            ])),
        ]);
    }

    /** Ids of the user's children (people this user is the parent of). */
    public static function children_of(int $userid): array {
        global $DB;
        return array_map('intval', $DB->get_fieldset_sql('SELECT ctx.instanceid FROM {role_assignments} ra
            JOIN {context} ctx ON ctx.id = ra.contextid AND ctx.contextlevel = ?
            JOIN {user} u ON u.id = ctx.instanceid AND u.deleted = 0
            WHERE ra.roleid = ? AND ra.userid = ?', [CONTEXT_USER, self::parent_role(), $userid]));
    }

    // ----- link_parent / unlink_parent ------------------------------------

    public static function link_parent_parameters(): external_function_parameters {
        return new external_function_parameters([
            'parentid' => new external_value(PARAM_INT, 'Parent (accepted the request)'),
            'childid' => new external_value(PARAM_INT, 'Child (asked for it)'),
        ]);
    }

    /** Make parentid a parent of childid. Idempotent. */
    public static function link_parent(int $parentid, int $childid): array {
        $p = self::validate_parameters(self::link_parent_parameters(), compact('parentid', 'childid'));
        self::setup();
        if ($p['parentid'] == $p['childid']) {
            throw new \moodle_exception('invalidparameter', 'error');
        }
        self::user($p['parentid']);
        self::user($p['childid']);
        role_assign(self::parent_role(), $p['parentid'], \context_user::instance($p['childid'])->id, 'local_budu');
        return ['ok' => true];
    }

    public static function link_parent_returns(): external_single_structure {
        return new external_single_structure(['ok' => new external_value(PARAM_BOOL, 'Done')]);
    }

    public static function unlink_parent_parameters(): external_function_parameters {
        return self::link_parent_parameters();
    }

    /** Remove the link (either side asked). Idempotent. */
    public static function unlink_parent(int $parentid, int $childid): array {
        $p = self::validate_parameters(self::unlink_parent_parameters(), compact('parentid', 'childid'));
        self::setup();
        $ctx = \context_user::instance($p['childid'], IGNORE_MISSING);
        if ($ctx) {
            role_unassign(self::parent_role(), $p['parentid'], $ctx->id, 'local_budu');
        }
        return ['ok' => true];
    }

    public static function unlink_parent_returns(): external_single_structure {
        return self::link_parent_returns();
    }

    // ----- family ---------------------------------------------------------

    public static function family_parameters(): external_function_parameters {
        return new external_function_parameters(['userid' => new external_value(PARAM_INT, 'Budu user')]);
    }

    /** The user's parents and children, each with their schools. */
    public static function family(int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::family_parameters(), compact('userid'));
        self::setup();
        $ctx = \context_user::instance($p['userid'], IGNORE_MISSING);
        $parents = $ctx ? $DB->get_records_sql('SELECT u.* FROM {role_assignments} ra JOIN {user} u ON u.id = ra.userid
            WHERE ra.roleid = ? AND ra.contextid = ? AND u.deleted = 0 ORDER BY u.lastname, u.firstname',
            [self::parent_role(), $ctx->id]) : [];
        $children = [];
        foreach (self::children_of($p['userid']) as $id) {
            $children[] = self::member(self::user($id));
        }
        usort($children, fn($a, $b) => strcmp($a['name'], $b['name']));
        return [
            'parents' => array_values(array_map(fn($u) => self::member($u), $parents)),
            'children' => $children,
        ];
    }

    public static function family_returns(): external_single_structure {
        return new external_single_structure([
            'parents' => new external_multiple_structure(self::member_structure()),
            'children' => new external_multiple_structure(self::member_structure()),
        ]);
    }

    // ----- child_teachers -------------------------------------------------

    public static function child_teachers_parameters(): external_function_parameters {
        return new external_function_parameters(['childid' => new external_value(PARAM_INT, 'Student')]);
    }

    /** The student's published courses with their teachers (who a parent may message). */
    public static function child_teachers(int $childid): array {
        global $CFG;
        require_once($CFG->libdir . '/enrollib.php');
        $p = self::validate_parameters(self::child_teachers_parameters(), compact('childid'));
        self::setup();
        $out = [];
        foreach (learning::my_courses($p['childid']) as $c) {
            $out[] = [
                'courseid' => $c['id'], 'coursename' => $c['fullname'],
                'teachers' => array_map(fn($u) => learning::person($u), learning::teachers_of($c['id'])),
            ];
        }
        return $out;
    }

    public static function child_teachers_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'teachers' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_INT, 'User id'),
                'name' => new external_value(PARAM_TEXT, 'Full name'),
                'email' => new external_value(PARAM_RAW, 'Email'),
                'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
            ])),
        ]));
    }

    // ----- company_parents ------------------------------------------------

    public static function company_parents_parameters(): external_function_parameters {
        return new external_function_parameters(['companyid' => new external_value(PARAM_INT, 'School (IOMAD company)')]);
    }

    /** Parents of the school's members (who also get school announcements). */
    public static function company_parents(int $companyid): array {
        global $DB;
        $p = self::validate_parameters(self::company_parents_parameters(), compact('companyid'));
        self::setup();
        $users = $DB->get_records_sql('SELECT DISTINCT u.* FROM {company_users} cu
            JOIN {context} ctx ON ctx.contextlevel = ? AND ctx.instanceid = cu.userid
            JOIN {role_assignments} ra ON ra.contextid = ctx.id AND ra.roleid = ?
            JOIN {user} u ON u.id = ra.userid AND u.deleted = 0 AND u.suspended = 0
            WHERE cu.companyid = ?', [CONTEXT_USER, self::parent_role(), $p['companyid']]);
        return array_values(array_map(fn($u) => learning::person($u), $users));
    }

    public static function company_parents_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'User id'),
            'name' => new external_value(PARAM_TEXT, 'Full name'),
            'email' => new external_value(PARAM_RAW, 'Email'),
            'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
        ]));
    }
}
