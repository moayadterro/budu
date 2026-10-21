<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * School (IOMAD company) overview for Budu managers: the people in the school with their role,
 * and the school's courses with teachers and counts. Only company managers (or site admins)
 * may call these for their company — checked against the acting `userid`.
 */
class school extends external_api {

    /** Is the user a manager of this company (or a site admin)? */
    public static function is_manager(int $companyid, int $userid): bool {
        global $DB;
        return is_siteadmin($userid) || $DB->record_exists_select('company_users',
            'companyid = ? AND userid = ? AND managertype > 0', [$companyid, $userid]);
    }

    private static function require_manager(int $companyid, int $userid): void {
        self::validate_context(\context_system::instance());
        if (!self::is_manager($companyid, $userid)) {
            throw new \moodle_exception('nopermissions', 'error', '', 'manage this school');
        }
    }

    // ----- company_people --------------------------------------------------

    public static function company_people_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School (IOMAD company)'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
        ]);
    }

    /** Everyone in the school: role manager | teacher | student, active or not. */
    public static function company_people(int $companyid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::company_people_parameters(), compact('companyid', 'userid'));
        self::require_manager($p['companyid'], $p['userid']);
        $rows = $DB->get_records_sql(
            'SELECT u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename,
                    u.email, u.suspended, u.lastaccess, MAX(cu.managertype) AS managertype, MAX(cu.educator) AS educator
               FROM {company_users} cu
               JOIN {user} u ON u.id = cu.userid AND u.deleted = 0
              WHERE cu.companyid = ?
           GROUP BY u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename,
                    u.email, u.suspended, u.lastaccess
           ORDER BY u.lastname, u.firstname', [$p['companyid']]);
        // each person's class in this school (a student is in at most one)
        $categoryctx = \context_coursecat::instance($DB->get_field('company', 'category', ['id' => $p['companyid']], MUST_EXIST));
        $classof = [];
        foreach ($DB->get_records_sql("SELECT m.id, m.userid, c.id AS classid, c.name FROM {cohort_members} m
                JOIN {cohort} c ON c.id = m.cohortid WHERE c.contextid = ? AND c.component = 'local_budu'", [$categoryctx->id]) as $m) {
            $classof[$m->userid] = $m;
        }
        $out = [];
        foreach ($rows as $u) {
            $ctx = \context_user::instance($u->id, IGNORE_MISSING);
            $picture = $ctx ? (int)$DB->get_field_select('files', 'id',
                "contextid = ? AND component = 'user' AND filearea = 'icon' AND itemid = 0 AND " . $DB->sql_like('filename', '?'),
                [$ctx->id, 'f1.%'], IGNORE_MULTIPLE) : 0;
            $out[] = [
                'id' => (int)$u->id, 'name' => fullname($u), 'email' => $u->email, 'picture' => $picture,
                // managers first: IOMAD also flags every company manager as an educator
                'role' => $u->managertype > 0 ? 'manager' : ($u->educator ? 'teacher' : 'student'),
                'suspended' => (bool)$u->suspended, 'lastaccess' => (int)$u->lastaccess,
                'classid' => isset($classof[$u->id]) ? (int)$classof[$u->id]->classid : 0,
                'classname' => isset($classof[$u->id]) ? $classof[$u->id]->name : '',
            ];
        }
        return $out;
    }

    public static function company_people_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'User id'),
            'name' => new external_value(PARAM_TEXT, 'Full name'),
            'email' => new external_value(PARAM_RAW, 'Email'),
            'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
            'role' => new external_value(PARAM_ALPHA, 'manager | teacher | student'),
            'suspended' => new external_value(PARAM_BOOL, 'Suspended (e.g. invite not accepted yet)'),
            'lastaccess' => new external_value(PARAM_INT, 'Last access to IOMAD itself (0 = never)'),
            'classid' => new external_value(PARAM_INT, 'Their class in this school, 0 = none'),
            'classname' => new external_value(PARAM_TEXT, 'That class name'),
        ]));
    }

    // ----- company_courses -------------------------------------------------

    public static function company_courses_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School (IOMAD company)'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
        ]);
    }

    /** The school's courses with their teachers, students, lessons and homework counts. */
    public static function company_courses(int $companyid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::company_courses_parameters(), compact('companyid', 'userid'));
        self::require_manager($p['companyid'], $p['userid']);
        $teacherrole = $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST);
        $studentrole = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        $courses = $DB->get_records_sql('SELECT c.id, c.fullname, c.visible, c.timemodified FROM {course} c
            JOIN {company_course} cc ON cc.courseid = c.id WHERE cc.companyid = ? AND ' .
            $DB->sql_like('c.idnumber', '?', true, true, true) . ' ORDER BY c.fullname', [$p['companyid'], school_exams::PREFIX . '%']);
        $out = [];
        foreach ($courses as $c) {
            $ctx = \context_course::instance($c->id);
            $teachers = get_role_users($teacherrole, $ctx, false, 'u.id, u.firstname, u.lastname, u.firstnamephonetic,
                u.lastnamephonetic, u.middlename, u.alternatename', 'u.lastname', true);
            $out[] = [
                'id' => (int)$c->id, 'fullname' => $c->fullname, 'visible' => (bool)$c->visible,
                'teachers' => implode(', ', array_map('fullname', $teachers)),
                'students' => count(get_role_users($studentrole, $ctx, false, 'u.id', 'u.id', true)),
                'lessons' => $DB->count_records_select('course_sections', 'course = ? AND section > 0 AND component IS NULL', [$c->id]),
                'homework' => $DB->count_records_sql("SELECT COUNT(1) FROM {course_modules} cm JOIN {modules} m ON m.id = cm.module
                    WHERE cm.course = ? AND m.name = 'assign' AND cm.deletioninprogress = 0", [$c->id]),
                'timemodified' => (int)$c->timemodified,
            ];
        }
        return $out;
    }

    public static function company_courses_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Course'),
            'fullname' => new external_value(PARAM_TEXT, 'Title'),
            'visible' => new external_value(PARAM_BOOL, 'Published'),
            'teachers' => new external_value(PARAM_TEXT, 'Teacher names'),
            'students' => new external_value(PARAM_INT, 'Students'),
            'lessons' => new external_value(PARAM_INT, 'Lessons'),
            'homework' => new external_value(PARAM_INT, 'Homework'),
            'timemodified' => new external_value(PARAM_INT, 'Last change'),
        ]));
    }

    // ----- set_role ----------------------------------------------------------

    public static function set_role_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School (IOMAD company)'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'targetid' => new external_value(PARAM_INT, 'Person whose role changes'),
            'role' => new external_value(PARAM_ALPHA, 'manager | teacher | student'),
        ]);
    }

    /**
     * Changes someone's role in the school. IOMAD's assign_users only sets the educator flag when a
     * user is first added, so the flags are updated here. Not for the acting manager themself.
     */
    public static function set_role(int $companyid, int $userid, int $targetid, string $role): array {
        global $DB;
        $p = self::validate_parameters(self::set_role_parameters(), compact('companyid', 'userid', 'targetid', 'role'));
        self::require_manager($p['companyid'], $p['userid']);
        if ($p['targetid'] == $p['userid'] || !in_array($p['role'], ['manager', 'teacher', 'student'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'change this role');
        }
        $rows = $DB->get_records('company_users', ['companyid' => $p['companyid'], 'userid' => $p['targetid']]);
        if (!$rows) {
            throw new \moodle_exception('invaliduser');
        }
        foreach ($rows as $row) {
            $DB->update_record('company_users', (object)[
                'id' => $row->id,
                'managertype' => $p['role'] === 'manager' ? 1 : 0,
                // managers are educators too in IOMAD (they can work in the school's courses)
                'educator' => $p['role'] === 'student' ? 0 : 1,
            ]);
        }
        return ['id' => $p['targetid']];
    }

    public static function set_role_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Changed user')]);
    }
}
