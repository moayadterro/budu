<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * School classes for Budu ("Class 10", "11-A"): a class = a Moodle cohort in the school's (IOMAD
 * company's) category, component local_budu. Students are cohort members; a class is enrolled
 * into courses with cohort sync (enrol_cohort), so joining / leaving the class enrols / unenrols.
 * Optional class teachers (who manage the class) are kept in local_budu_class_teacher.
 *
 * Rights: school managers manage everything; class teachers read their class; teachers of a
 * course may link a class of the same school to it. Checked against the acting `userid`.
 */
class classes extends external_api {

    // ----- helpers -------------------------------------------------------

    private static function setup(): void {
        global $CFG;
        require_once($CFG->dirroot . '/cohort/lib.php');
        require_once($CFG->dirroot . '/enrol/cohort/locallib.php');
        self::validate_context(\context_system::instance());
    }

    private static function deny(string $what): \moodle_exception {
        return new \moodle_exception('nopermissions', 'error', '', $what);
    }

    private static function company_context(int $companyid): \context {
        global $DB;
        $category = $DB->get_field('company', 'category', ['id' => $companyid], MUST_EXIST);
        return \context_coursecat::instance($category);
    }

    /** A Budu class with the id of the school it belongs to. */
    private static function load(int $classid): array {
        global $DB;
        $cohort = $DB->get_record('cohort', ['id' => $classid, 'component' => 'local_budu'], '*', MUST_EXIST);
        $ctx = \context::instance_by_id($cohort->contextid);
        $companyid = (int)$DB->get_field('company', 'id', ['category' => $ctx->instanceid], MUST_EXIST);
        return [$cohort, $companyid];
    }

    private static function is_class_teacher(int $classid, int $userid): bool {
        global $DB;
        return $DB->record_exists('local_budu_class_teacher', ['cohortid' => $classid, 'userid' => $userid]);
    }

    private static function is_educator(int $companyid, int $userid): bool {
        global $DB;
        return $DB->record_exists_select('company_users', 'companyid = ? AND userid = ? AND (educator = 1 OR managertype > 0)',
            [$companyid, $userid]);
    }

    private static function person(\stdClass $u): array {
        global $DB;
        $ctx = \context_user::instance($u->id, IGNORE_MISSING);
        $picture = $ctx ? (int)$DB->get_field_select('files', 'id',
            "contextid = ? AND component = 'user' AND filearea = 'icon' AND itemid = 0 AND " . $DB->sql_like('filename', '?'),
            [$ctx->id, 'f1.%'], IGNORE_MULTIPLE) : 0;
        return ['id' => (int)$u->id, 'name' => fullname($u), 'email' => (string)$u->email, 'picture' => $picture];
    }

    private static function person_structure(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'User id'),
            'name' => new external_value(PARAM_TEXT, 'Full name'),
            'email' => new external_value(PARAM_RAW, 'Email'),
            'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
        ]);
    }

    private const USERFIELDS = 'u.id, u.firstname, u.lastname, u.email, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename';

    private static function members(int $classid): array {
        global $DB;
        return array_values($DB->get_records_sql('SELECT ' . self::USERFIELDS . ' FROM {cohort_members} cm
            JOIN {user} u ON u.id = cm.userid AND u.deleted = 0 WHERE cm.cohortid = ? ORDER BY u.lastname, u.firstname', [$classid]));
    }

    private static function teachers(int $classid): array {
        global $DB;
        return array_values($DB->get_records_sql('SELECT ' . self::USERFIELDS . ' FROM {local_budu_class_teacher} ct
            JOIN {user} u ON u.id = ct.userid AND u.deleted = 0 WHERE ct.cohortid = ? ORDER BY u.lastname, u.firstname', [$classid]));
    }

    /** Courses the class is enrolled into (cohort sync instances). */
    private static function courses(int $classid): array {
        global $DB;
        $teacherrole = $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST);
        $rows = $DB->get_records_sql("SELECT c.id, c.fullname, c.visible FROM {enrol} e JOIN {course} c ON c.id = e.courseid
            WHERE e.enrol = 'cohort' AND e.customint1 = ? ORDER BY c.fullname", [$classid]);
        $out = [];
        foreach ($rows as $c) {
            $teachers = get_role_users($teacherrole, \context_course::instance($c->id), false,
                'u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename', 'u.lastname', true);
            $out[] = ['id' => (int)$c->id, 'fullname' => $c->fullname, 'visible' => (bool)$c->visible,
                'teachers' => implode(', ', array_map('fullname', $teachers))];
        }
        return $out;
    }

    private static function summary(\stdClass $cohort, int $userid): array {
        global $DB;
        return [
            'id' => (int)$cohort->id, 'name' => $cohort->name, 'description' => (string)$cohort->description,
            'students' => $DB->count_records('cohort_members', ['cohortid' => $cohort->id]),
            'courses' => $DB->count_records('enrol', ['enrol' => 'cohort', 'customint1' => $cohort->id]),
            'courseids' => array_map('intval', $DB->get_fieldset_select('enrol', 'courseid', "enrol = 'cohort' AND customint1 = ?", [$cohort->id])),
            'teachers' => array_map([self::class, 'person'], self::teachers($cohort->id)),
            'mine' => self::is_class_teacher($cohort->id, $userid),
        ];
    }

    private static function summary_structure(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Class (cohort) id'),
            'name' => new external_value(PARAM_TEXT, 'Name, e.g. Class 10'),
            'description' => new external_value(PARAM_RAW, 'Description (plain text)'),
            'students' => new external_value(PARAM_INT, 'Students'),
            'courses' => new external_value(PARAM_INT, 'Courses the class is enrolled into'),
            'courseids' => new external_multiple_structure(new external_value(PARAM_INT, 'Course id'), 'Those courses'),
            'teachers' => new external_multiple_structure(self::person_structure(), 'Class teachers'),
            'mine' => new external_value(PARAM_BOOL, 'The acting user is a class teacher of it'),
        ]);
    }

    private static function ok(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Class id')]);
    }

    // ----- list_classes ----------------------------------------------------

    public static function list_classes_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager or teacher of the school)'),
        ]);
    }

    /** The school's classes (managers and teachers of the school). */
    public static function list_classes(int $companyid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::list_classes_parameters(), compact('companyid', 'userid'));
        self::setup();
        if (!school::is_manager($p['companyid'], $p['userid']) && !self::is_educator($p['companyid'], $p['userid'])) {
            throw self::deny('see this school');
        }
        $ctx = self::company_context($p['companyid']);
        $rows = $DB->get_records('cohort', ['contextid' => $ctx->id, 'component' => 'local_budu'], 'name');
        return array_values(array_map(fn($c) => self::summary($c, $p['userid']), $rows));
    }

    public static function list_classes_returns(): external_multiple_structure {
        return new external_multiple_structure(self::summary_structure());
    }

    // ----- save_class / delete_class ----------------------------------------

    public static function save_class_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'classid' => new external_value(PARAM_INT, 'Class to rename; 0 = create'),
            'name' => new external_value(PARAM_TEXT, 'Name'),
            'description' => new external_value(PARAM_RAW, 'Description (plain text)', VALUE_DEFAULT, ''),
        ]);
    }

    public static function save_class(int $companyid, int $userid, int $classid, string $name, string $description = ''): array {
        $p = self::validate_parameters(self::save_class_parameters(), compact('companyid', 'userid', 'classid', 'name', 'description'));
        self::setup();
        if (!school::is_manager($p['companyid'], $p['userid'])) {
            throw self::deny('manage classes');
        }
        $name = trim($p['name']);
        if ($name === '') {
            throw new \invalid_parameter_exception('name');
        }
        if ($p['classid']) {
            [$cohort, $companyid] = self::load($p['classid']);
            if ($companyid !== $p['companyid']) {
                throw self::deny('manage this class');
            }
            $cohort->name = $name;
            $cohort->description = $p['description'];
            $cohort->descriptionformat = FORMAT_PLAIN;
            cohort_update_cohort($cohort);
            return ['id' => (int)$cohort->id];
        }
        $id = cohort_add_cohort((object)[
            'contextid' => self::company_context($p['companyid'])->id,
            'name' => $name,
            'idnumber' => 'budu-' . $p['companyid'] . '-' . bin2hex(random_bytes(4)),
            'description' => $p['description'],
            'descriptionformat' => FORMAT_PLAIN,
            'component' => 'local_budu',
            'visible' => 1,
        ]);
        return ['id' => (int)$id];
    }

    public static function save_class_returns(): external_single_structure {
        return self::ok();
    }

    public static function delete_class_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'classid' => new external_value(PARAM_INT, 'Class'),
        ]);
    }

    /** Deletes the class: its students leave the courses it was enrolled into (cohort sync). */
    public static function delete_class(int $userid, int $classid): array {
        global $DB;
        $p = self::validate_parameters(self::delete_class_parameters(), compact('userid', 'classid'));
        self::setup();
        [$cohort, $companyid] = self::load($p['classid']);
        if (!school::is_manager($companyid, $p['userid'])) {
            throw self::deny('manage this class');
        }
        $plugin = enrol_get_plugin('cohort');
        foreach ($DB->get_records('enrol', ['enrol' => 'cohort', 'customint1' => $cohort->id]) as $instance) {
            $plugin->delete_instance($instance);
        }
        $DB->delete_records('local_budu_class_teacher', ['cohortid' => $cohort->id]);
        cohort_delete_cohort($cohort);
        return ['id' => $p['classid']];
    }

    public static function delete_class_returns(): external_single_structure {
        return self::ok();
    }

    // ----- get_class -------------------------------------------------------

    public static function get_class_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager or class teacher)'),
            'classid' => new external_value(PARAM_INT, 'Class'),
        ]);
    }

    /** A class with its students, class teachers and courses. */
    public static function get_class(int $userid, int $classid): array {
        $p = self::validate_parameters(self::get_class_parameters(), compact('userid', 'classid'));
        self::setup();
        [$cohort, $companyid] = self::load($p['classid']);
        $manager = school::is_manager($companyid, $p['userid']);
        if (!$manager && !self::is_class_teacher($cohort->id, $p['userid'])) {
            throw self::deny('see this class');
        }
        return self::summary($cohort, $p['userid']) + [
            'companyid' => $companyid,
            'canmanage' => $manager,
            'studentlist' => array_map([self::class, 'person'], self::members($cohort->id)),
            'courselist' => self::courses($cohort->id),
        ];
    }

    public static function get_class_returns(): external_single_structure {
        $s = self::summary_structure();
        return new external_single_structure($s->keys + [
            'companyid' => new external_value(PARAM_INT, 'School'),
            'canmanage' => new external_value(PARAM_BOOL, 'The acting user may change the class'),
            'studentlist' => new external_multiple_structure(self::person_structure()),
            'courselist' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_INT, 'Course'),
                'fullname' => new external_value(PARAM_TEXT, 'Title'),
                'visible' => new external_value(PARAM_BOOL, 'Published'),
                'teachers' => new external_value(PARAM_TEXT, 'Teacher names'),
            ])),
        ]);
    }

    // ----- set_students / set_teachers --------------------------------------

    public static function set_students_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'classid' => new external_value(PARAM_INT, 'Class'),
            'add' => new external_multiple_structure(new external_value(PARAM_INT, 'User id'), 'Students to add', VALUE_DEFAULT, []),
            'remove' => new external_multiple_structure(new external_value(PARAM_INT, 'User id'), 'Students to remove', VALUE_DEFAULT, []),
        ]);
    }

    /** Adds / removes students (must belong to the school). Cohort sync updates course enrolments. */
    public static function set_students(int $userid, int $classid, array $add = [], array $remove = []): array {
        global $DB;
        $p = self::validate_parameters(self::set_students_parameters(), compact('userid', 'classid', 'add', 'remove'));
        self::setup();
        [$cohort, $companyid] = self::load($p['classid']);
        if (!school::is_manager($companyid, $p['userid'])) {
            throw self::deny('manage this class');
        }
        foreach (array_unique($p['add']) as $id) {
            if (!$DB->record_exists('company_users', ['companyid' => $companyid, 'userid' => $id])) {
                throw self::deny('add someone from another school');
            }
            cohort_add_member($cohort->id, $id);
        }
        foreach (array_unique($p['remove']) as $id) {
            cohort_remove_member($cohort->id, $id);
        }
        return ['id' => (int)$cohort->id];
    }

    public static function set_students_returns(): external_single_structure {
        return self::ok();
    }

    public static function set_teachers_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'classid' => new external_value(PARAM_INT, 'Class'),
            'teacherids' => new external_multiple_structure(new external_value(PARAM_INT, 'User id'), 'The class teachers (replaces)'),
        ]);
    }

    /** Sets the class teachers (teachers or managers of the school; may be empty). */
    public static function set_teachers(int $userid, int $classid, array $teacherids): array {
        global $DB;
        $p = self::validate_parameters(self::set_teachers_parameters(), compact('userid', 'classid', 'teacherids'));
        self::setup();
        [$cohort, $companyid] = self::load($p['classid']);
        if (!school::is_manager($companyid, $p['userid'])) {
            throw self::deny('manage this class');
        }
        $wanted = array_unique($p['teacherids']);
        foreach ($wanted as $id) {
            if (!self::is_educator($companyid, $id)) {
                throw self::deny('make this person a class teacher');
            }
        }
        $DB->delete_records('local_budu_class_teacher', ['cohortid' => $cohort->id]);
        foreach ($wanted as $id) {
            $DB->insert_record('local_budu_class_teacher', (object)['cohortid' => $cohort->id, 'userid' => $id, 'timecreated' => time()]);
        }
        return ['id' => (int)$cohort->id];
    }

    public static function set_teachers_returns(): external_single_structure {
        return self::ok();
    }

    // ----- link_course -------------------------------------------------------

    public static function link_course_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager, or teacher of the course)'),
            'classid' => new external_value(PARAM_INT, 'Class'),
            'courseid' => new external_value(PARAM_INT, 'Course of the same school'),
            'link' => new external_value(PARAM_BOOL, 'true = enrol the class, false = remove it'),
        ]);
    }

    /** Enrols the whole class into a course (cohort sync, student role) or removes it. */
    public static function link_course(int $userid, int $classid, int $courseid, bool $link): array {
        global $DB;
        $p = self::validate_parameters(self::link_course_parameters(), compact('userid', 'classid', 'courseid', 'link'));
        self::setup();
        [$cohort, $companyid] = self::load($p['classid']);
        $course = get_course($p['courseid']);
        if (!$DB->record_exists('company_course', ['companyid' => $companyid, 'courseid' => $course->id])) {
            throw self::deny('link a course of another school');
        }
        $teaches = has_capability('mod/assign:grade', \context_course::instance($course->id), $p['userid']);
        if (!school::is_manager($companyid, $p['userid']) && !$teaches) {
            throw self::deny('enrol classes into this course');
        }
        $plugin = enrol_get_plugin('cohort');
        $existing = $DB->get_records('enrol', ['enrol' => 'cohort', 'courseid' => $course->id, 'customint1' => $cohort->id]);
        if ($p['link'] && !$existing) {
            $studentrole = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
            $plugin->add_instance($course, ['customint1' => $cohort->id, 'roleid' => $studentrole, 'customint2' => 0]);
        } else if (!$p['link']) {
            foreach ($existing as $instance) {
                $plugin->delete_instance($instance);
            }
        }
        return ['id' => (int)$cohort->id];
    }

    public static function link_course_returns(): external_single_structure {
        return self::ok();
    }

    // ----- my_classes --------------------------------------------------------

    public static function my_classes_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
        ]);
    }

    /** Classes the user is in as a student, and classes they teach as a class teacher. */
    public static function my_classes(int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::my_classes_parameters(), compact('userid'));
        self::setup();
        $member = $DB->get_records_sql("SELECT c.* FROM {cohort} c JOIN {cohort_members} m ON m.cohortid = c.id
            WHERE m.userid = ? AND c.component = 'local_budu' ORDER BY c.name", [$p['userid']]);
        $teaching = $DB->get_records_sql("SELECT c.* FROM {cohort} c JOIN {local_budu_class_teacher} t ON t.cohortid = c.id
            WHERE t.userid = ? AND c.component = 'local_budu' ORDER BY c.name", [$p['userid']]);
        return [
            'member' => array_values(array_map(fn($c) => self::summary($c, $p['userid']), $member)),
            'teaching' => array_values(array_map(fn($c) => self::summary($c, $p['userid']), $teaching)),
        ];
    }

    public static function my_classes_returns(): external_single_structure {
        return new external_single_structure([
            'member' => new external_multiple_structure(self::summary_structure(), 'Classes the user is a student of'),
            'teaching' => new external_multiple_structure(self::summary_structure(), 'Classes the user is a class teacher of'),
        ]);
    }
}
