<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * School exams without a course (e.g. an entrance exam). Each school has one "exam space": a Moodle
 * course in the school's company with idnumber budu-exams-<companyid>, never shown as a course (every
 * course list skips it). An exam is an exam-kind quiz in it (quizzes.php does the rest: questions,
 * scheduling, attempts, results, grading); who may take it is the exam's own group
 * (idnumber budu-exam-<cmid>) — its audience: students, classes' students, or invited candidates.
 * Only managers of the school (or site admins) use these functions.
 */
class school_exams extends external_api {

    const PREFIX = 'budu-exams-';

    /** Is this course a school's exam space (hidden from every course list)? */
    public static function is_exam_space($course): bool {
        return str_starts_with((string)($course->idnumber ?? ''), self::PREFIX);
    }

    private static function setup(int $companyid, int $userid): void {
        global $CFG;
        require_once($CFG->dirroot . '/course/lib.php');
        require_once($CFG->libdir . '/enrollib.php');
        require_once($CFG->dirroot . '/group/lib.php');
        require_once($CFG->dirroot . '/local/iomad/lib/company.php');
        self::validate_context(\context_system::instance());
        if (!school::is_manager($companyid, $userid)) {
            throw new \moodle_exception('nopermissions', 'error', '', 'manage this school\'s exams');
        }
    }

    /** The school's exam space (created on first use). */
    public static function space(int $companyid): \stdClass {
        global $DB;
        $course = $DB->get_record('course', ['idnumber' => self::PREFIX . $companyid]);
        if ($course) {
            return $course;
        }
        $company = new \company($companyid);
        $name = (string)$DB->get_field('company', 'name', ['id' => $companyid], MUST_EXIST);
        $course = create_course((object)[
            'fullname' => $name,
            'shortname' => self::PREFIX . $companyid,
            'idnumber' => self::PREFIX . $companyid,
            'category' => (int)$DB->get_field('company', 'category', ['id' => $companyid], MUST_EXIST),
            'summary' => '',
            'summaryformat' => FORMAT_PLAIN,
            'format' => 'topics',
            'numsections' => 0,
            'visible' => 1, // takers must reach it; it is never listed
        ]);
        $company->add_course($course, 0, true);
        return $course;
    }

    /** The exam's audience group (idnumber budu-exam-<cmid>); 0 when none. */
    public static function group_id(int $courseid, int $cmid, bool $create = false): int {
        global $CFG, $DB;
        $id = (int)$DB->get_field('groups', 'id', ['courseid' => $courseid, 'idnumber' => 'budu-exam-' . $cmid]);
        if (!$id && $create) {
            require_once($CFG->dirroot . '/group/lib.php');
            $id = (int)groups_create_group((object)['courseid' => $courseid, 'name' => 'Exam ' . $cmid, 'idnumber' => 'budu-exam-' . $cmid]);
        }
        return $id;
    }

    /** An exam of this school: [cm, course]. */
    private static function exam(int $companyid, int $cmid): array {
        $cm = get_coursemodule_from_id('quiz', $cmid, 0, false, MUST_EXIST);
        $course = get_course($cm->course);
        if ($course->idnumber !== self::PREFIX . $companyid) {
            throw new \moodle_exception('invalidrecord', 'error', '', 'exam');
        }
        return [$cm, $course];
    }

    // ----- exam_space ------------------------------------------------------

    public static function exam_space_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School (IOMAD company)'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
        ]);
    }

    /** The school's exam space course id (its exams are quizzes in it). */
    public static function exam_space(int $companyid, int $userid): array {
        $p = self::validate_parameters(self::exam_space_parameters(), compact('companyid', 'userid'));
        self::setup($p['companyid'], $p['userid']);
        return ['courseid' => (int)self::space($p['companyid'])->id];
    }

    public static function exam_space_returns(): external_single_structure {
        return new external_single_structure(['courseid' => new external_value(PARAM_INT, 'Exam space course')]);
    }

    // ----- audience --------------------------------------------------------

    public static function exam_audience_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'cmid' => new external_value(PARAM_INT, 'Exam'),
        ]);
    }

    /** Who takes the exam: each with "in the school already" (candidates are not). */
    public static function exam_audience(int $companyid, int $userid, int $cmid): array {
        global $DB;
        $p = self::validate_parameters(self::exam_audience_parameters(), compact('companyid', 'userid', 'cmid'));
        self::setup($p['companyid'], $p['userid']);
        [$cm, $course] = self::exam($p['companyid'], $p['cmid']);
        $groupid = self::group_id($course->id, $cm->id);
        if (!$groupid) {
            return [];
        }
        $users = $DB->get_records_sql('SELECT u.* FROM {groups_members} gm JOIN {user} u ON u.id = gm.userid AND u.deleted = 0
            WHERE gm.groupid = ? ORDER BY u.lastname, u.firstname', [$groupid]);
        return array_values(array_map(fn($u) => learning::person($u) + [
            'member' => $DB->record_exists('company_users', ['companyid' => $p['companyid'], 'userid' => $u->id]),
            'pending' => (bool)$u->suspended, // invited, account not activated yet
        ], $users));
    }

    public static function exam_audience_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'User id'),
            'name' => new external_value(PARAM_TEXT, 'Full name'),
            'email' => new external_value(PARAM_RAW, 'Email'),
            'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
            'member' => new external_value(PARAM_BOOL, 'Already in the school'),
            'pending' => new external_value(PARAM_BOOL, 'Invited, has not activated the account yet'),
        ]));
    }

    public static function set_exam_audience_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'cmid' => new external_value(PARAM_INT, 'Exam'),
            'add' => new external_multiple_structure(new external_value(PARAM_INT, 'User'), 'Give the exam to these', VALUE_DEFAULT, []),
            'remove' => new external_multiple_structure(new external_value(PARAM_INT, 'User'), 'Take it from these', VALUE_DEFAULT, []),
        ]);
    }

    /**
     * Add people to / remove them from the exam's audience. Added people are enrolled in the exam
     * space as students (so they can attempt it) and put in the exam's group. Returns who was new.
     */
    public static function set_exam_audience(int $companyid, int $userid, int $cmid, array $add = [], array $remove = []): array {
        global $DB;
        $p = self::validate_parameters(self::set_exam_audience_parameters(), compact('companyid', 'userid', 'cmid', 'add', 'remove'));
        self::setup($p['companyid'], $p['userid']);
        [$cm, $course] = self::exam($p['companyid'], $p['cmid']);
        $groupid = self::group_id($course->id, $cm->id, true);
        $studentrole = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        $added = [];
        foreach (array_unique(array_map('intval', $p['add'])) as $uid) {
            if (!$DB->record_exists('user', ['id' => $uid, 'deleted' => 0]) || is_siteadmin($uid)) {
                continue;
            }
            if (!is_enrolled(\context_course::instance($course->id), $uid)) {
                enrol_try_internal_enrol($course->id, $uid, $studentrole);
            }
            if (!groups_is_member($groupid, $uid)) {
                groups_add_member($groupid, $uid);
                $added[] = $uid;
            }
        }
        foreach (array_unique(array_map('intval', $p['remove'])) as $uid) {
            groups_remove_member($groupid, $uid);
        }
        return ['added' => $added];
    }

    public static function set_exam_audience_returns(): external_single_structure {
        return new external_single_structure([
            'added' => new external_multiple_structure(new external_value(PARAM_INT, 'User'), 'Newly given the exam'),
        ]);
    }
}
