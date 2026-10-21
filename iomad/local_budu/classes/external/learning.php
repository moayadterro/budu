<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Students, homework and grades for Budu:
 *  - teachers: enrol / list / remove students, see submissions, grade with feedback, gradebook;
 *  - students: their courses, their homework, submit text and/or files.
 *
 * Homework = a course's mod_assign activities (created by courses::save_task). As in courses.php, the
 * integration token acts, and every function first checks the acting Budu user (`userid`):
 * teacher functions need mod/assign:grade (course teachers), student functions need an active
 * enrolment with mod/assign:submit.
 */
class learning extends external_api {

    // ----- helpers -------------------------------------------------------

    private static function setup(): void {
        global $CFG;
        require_once($CFG->dirroot . '/mod/assign/locallib.php');
        require_once($CFG->libdir . '/enrollib.php');
        require_once($CFG->dirroot . '/user/lib.php');
        self::validate_context(\context_system::instance());
    }

    private static function deny(string $what): \moodle_exception {
        return new \moodle_exception('nopermissions', 'error', '', $what);
    }

    /** May $userid teach this course: its teacher, or a manager of the school that owns it. */
    private static function can_teach(\stdClass $course, int $userid): bool {
        global $DB;
        if (has_capability('mod/assign:grade', \context_course::instance($course->id), $userid)) {
            return true;
        }
        foreach ($DB->get_fieldset_select('company_course', 'companyid', 'courseid = ?', [$course->id]) as $companyid) {
            if (school::is_manager((int)$companyid, $userid)) {
                return true;
            }
        }
        return false;
    }

    /** The course, if $userid may teach it (teacher, or school manager). */
    private static function taught(int $courseid, int $userid): \stdClass {
        $course = get_course($courseid);
        if ($course->id == SITEID || !self::can_teach($course, $userid)) {
            throw self::deny('teach this course');
        }
        return $course;
    }

    /** Teachers of a course (editing teacher role) — who gets told about new answers. */
    private static function teachers_of(int $courseid): array {
        global $DB;
        $roleid = $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST);
        return array_values(get_role_users($roleid, \context_course::instance($courseid), false,
            'u.id, u.firstname, u.lastname, u.email, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename',
            'u.lastname', true));
    }

    /** The assign object for a homework, checking it belongs to a course the user teaches. */
    private static function taught_assign(int $cmid, int $userid): \assign {
        $cm = get_coursemodule_from_id('assign', $cmid, 0, false, MUST_EXIST);
        $course = self::taught($cm->course, $userid);
        return new \assign(\context_module::instance($cm->id), $cm, $course);
    }

    /** The assign object for a homework the student may see and submit to. */
    private static function student_assign(int $cmid, int $userid): \assign {
        $cm = get_coursemodule_from_id('assign', $cmid, 0, false, MUST_EXIST);
        $course = get_course($cm->course);
        $ctx = \context_module::instance($cm->id);
        if (!$course->visible || !is_enrolled(\context_course::instance($course->id), $userid, '', true)
                || !has_capability('mod/assign:submit', $ctx, $userid)
                || !get_fast_modinfo($course, $userid)->get_cm($cm->id)->uservisible) {
            throw self::deny('open this homework');
        }
        return new \assign($ctx, $cm, $course);
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

    private static function files(int $contextid, string $component, string $area, int $itemid): array {
        $files = get_file_storage()->get_area_files($contextid, $component, $area, $itemid, 'filename', false);
        return array_values(array_map(fn(\stored_file $f) => [
            'id' => (int)$f->get_id(), 'filename' => $f->get_filename(),
            'filesize' => (int)$f->get_filesize(), 'mimetype' => (string)$f->get_mimetype(),
        ], $files));
    }

    private static function file_structure(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'File id (for local_budu_file_access)'),
            'filename' => new external_value(PARAM_FILE, 'File name'),
            'filesize' => new external_value(PARAM_INT, 'Bytes'),
            'mimetype' => new external_value(PARAM_RAW, 'MIME type'),
        ]));
    }

    /** Students = active enrolments with the student role. */
    private static function students_of(int $courseid): array {
        global $DB;
        $roleid = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        $ctx = \context_course::instance($courseid);
        return get_role_users($roleid, $ctx, false, 'u.id, u.firstname, u.lastname, u.email, u.firstnamephonetic,
            u.lastnamephonetic, u.middlename, u.alternatename', 'u.lastname, u.firstname', true, '', '', '', 'u.deleted = 0');
    }

    /**
     * One student's state on one homework: status new | submitted | graded, grade (−1 = none),
     * feedback, submission time.
     */
    private static function state(\stdClass $assigninstance, int $userid): array {
        global $DB;
        $sub = $DB->get_record('assign_submission',
            ['assignment' => $assigninstance->id, 'userid' => $userid, 'groupid' => 0, 'latest' => 1]);
        $grade = $DB->get_record_sql('SELECT * FROM {assign_grades} WHERE assignment = ? AND userid = ?
            ORDER BY attemptnumber DESC', [$assigninstance->id, $userid], IGNORE_MULTIPLE);
        $graded = $grade && $grade->grade !== null && (float)$grade->grade >= 0;
        $feedback = '';
        if ($grade) {
            $feedback = (string)$DB->get_field('assignfeedback_comments', 'commenttext',
                ['assignment' => $assigninstance->id, 'grade' => $grade->id]);
        }
        $submitted = $sub && $sub->status === ASSIGN_SUBMISSION_STATUS_SUBMITTED;
        return [
            'status' => $graded ? 'graded' : ($submitted ? 'submitted' : 'new'),
            'grade' => $graded ? (float)$grade->grade : -1.0,
            'feedback' => $feedback,
            'submittedat' => $submitted ? (int)$sub->timemodified : 0,
            'submissionid' => $sub ? (int)$sub->id : 0,
        ];
    }

    private static function state_structure(): array {
        return [
            'status' => new external_value(PARAM_ALPHA, 'new | submitted | graded'),
            'grade' => new external_value(PARAM_FLOAT, 'Grade 0–100, −1 = not graded'),
            'feedback' => new external_value(PARAM_RAW, 'Teacher feedback (plain text)'),
            'submittedat' => new external_value(PARAM_INT, 'Submission time, 0 = not submitted'),
        ];
    }

    /** Homework (assign activities) of a course, in course order, that the user may see. */
    private static function homework_of(\stdClass $course, int $userid): array {
        $modinfo = get_fast_modinfo($course, $userid);
        $out = [];
        foreach ($modinfo->get_instances_of('assign') as $cm) {
            if ($cm->deletioninprogress || !$cm->uservisible) {
                continue;
            }
            $out[] = $cm;
        }
        usort($out, fn($a, $b) => [$a->sectionnum, array_search($a->id, $modinfo->sections[$a->sectionnum] ?? [])]
            <=> [$b->sectionnum, array_search($b->id, $modinfo->sections[$b->sectionnum] ?? [])]);
        return $out;
    }

    // ----- teacher: students ---------------------------------------------

    public static function list_students_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
        ]);
    }

    public static function list_students(int $courseid, int $userid): array {
        $p = self::validate_parameters(self::list_students_parameters(), compact('courseid', 'userid'));
        self::setup();
        $course = self::taught($p['courseid'], $p['userid']);
        return array_values(array_map([self::class, 'person'], self::students_of($course->id)));
    }

    public static function list_students_returns(): external_multiple_structure {
        return new external_multiple_structure(self::person_structure());
    }

    public static function enrol_student_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'email' => new external_value(PARAM_RAW_TRIMMED, 'Student email (an existing Budu account)'),
        ]);
    }

    /** Enrols an existing account as a student. Result: enrolled | already | notfound | notstudent. */
    public static function enrol_student(int $courseid, int $userid, string $email): array {
        global $DB, $CFG;
        $p = self::validate_parameters(self::enrol_student_parameters(), compact('courseid', 'userid', 'email'));
        self::setup();
        $course = self::taught($p['courseid'], $p['userid']);
        $user = $DB->get_record_select('user', 'LOWER(email) = LOWER(?) AND deleted = 0 AND mnethostid = ?',
            [$p['email'], $CFG->mnet_localhost_id], '*', IGNORE_MULTIPLE);
        if (!$user || $user->suspended) {
            return ['result' => 'notfound', 'id' => 0];
        }
        if ($user->id == $p['userid'] || is_siteadmin($user->id)) {
            return ['result' => 'notstudent', 'id' => (int)$user->id];
        }
        $ctx = \context_course::instance($course->id);
        $roleid = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        if (is_enrolled($ctx, $user->id, '', true) && user_has_role_assignment($user->id, $roleid, $ctx->id)) {
            return ['result' => 'already', 'id' => (int)$user->id];
        }
        if (!enrol_try_internal_enrol($course->id, $user->id, $roleid)) {
            throw new \moodle_exception('cannotenrol', 'enrol_manual');
        }
        return ['result' => 'enrolled', 'id' => (int)$user->id];
    }

    public static function enrol_student_returns(): external_single_structure {
        return new external_single_structure([
            'result' => new external_value(PARAM_ALPHA, 'enrolled | already | notfound | notstudent'),
            'id' => new external_value(PARAM_INT, 'Student user id (0 if not found)'),
        ]);
    }

    public static function unenrol_student_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'studentid' => new external_value(PARAM_INT, 'Student to remove'),
        ]);
    }

    /** Removes a student's manual enrolment (their submissions and grades stay in Moodle). */
    public static function unenrol_student(int $courseid, int $userid, int $studentid): array {
        global $DB;
        $p = self::validate_parameters(self::unenrol_student_parameters(), compact('courseid', 'userid', 'studentid'));
        self::setup();
        $course = self::taught($p['courseid'], $p['userid']);
        $roleid = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        if (!user_has_role_assignment($p['studentid'], $roleid, \context_course::instance($course->id)->id)) {
            throw self::deny('remove this user');
        }
        $plugin = enrol_get_plugin('manual');
        foreach ($DB->get_records('enrol', ['courseid' => $course->id, 'enrol' => 'manual']) as $instance) {
            $plugin->unenrol_user($instance, $p['studentid']);
        }
        return ['id' => $p['studentid']];
    }

    public static function unenrol_student_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Removed user')]);
    }

    // ----- teacher: submissions, grading, gradebook ------------------------

    public static function submissions_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'companyid' => new external_value(PARAM_INT, 'Tenant: all courses the user teaches in it'),
            'courseid' => new external_value(PARAM_INT, 'Only this course (0 = all)', VALUE_DEFAULT, 0),
            'cmid' => new external_value(PARAM_INT, 'Only this homework (0 = all)', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Every enrolled student × homework that has been submitted (or graded), for the teacher's courses —
     * the grading queue. Newest first.
     */
    public static function submissions(int $userid, int $companyid, int $courseid = 0, int $cmid = 0): array {
        global $DB;
        $p = self::validate_parameters(self::submissions_parameters(), compact('userid', 'companyid', 'courseid', 'cmid'));
        self::setup();
        $courses = $DB->get_records_sql('SELECT c.* FROM {course} c JOIN {company_course} cc ON cc.courseid = c.id
            WHERE cc.companyid = ?', [$p['companyid']]);
        $rows = [];
        foreach ($courses as $course) {
            if (($p['courseid'] && $course->id != $p['courseid']) || !self::can_teach($course, $p['userid'])) {
                continue;
            }
            $students = self::students_of($course->id);
            foreach (self::homework_of($course, $p['userid']) as $cm) {
                if ($p['cmid'] && $cm->id != $p['cmid']) {
                    continue;
                }
                $instance = $DB->get_record('assign', ['id' => $cm->instance], 'id, name, duedate', MUST_EXIST);
                foreach ($students as $s) {
                    $state = self::state($instance, $s->id);
                    if ($state['status'] === 'new') {
                        continue;
                    }
                    $rows[] = [
                        'cmid' => (int)$cm->id, 'homework' => $instance->name, 'duedate' => (int)$instance->duedate,
                        'courseid' => (int)$course->id, 'coursename' => $course->fullname,
                        'student' => self::person($s),
                    ] + array_diff_key($state, ['submissionid' => 1]);
                }
            }
        }
        usort($rows, fn($a, $b) => $b['submittedat'] <=> $a['submittedat']);
        return $rows;
    }

    public static function submissions_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'cmid' => new external_value(PARAM_INT, 'Homework'),
            'homework' => new external_value(PARAM_TEXT, 'Homework title'),
            'duedate' => new external_value(PARAM_INT, 'Due date, 0 = none'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'student' => self::person_structure(),
        ] + self::state_structure()));
    }

    public static function get_submission_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'cmid' => new external_value(PARAM_INT, 'Homework'),
            'studentid' => new external_value(PARAM_INT, 'Student'),
        ]);
    }

    /** A student's answer (text + files) with its state, for grading. */
    public static function get_submission(int $userid, int $cmid, int $studentid): array {
        global $DB;
        $p = self::validate_parameters(self::get_submission_parameters(), compact('userid', 'cmid', 'studentid'));
        self::setup();
        $assign = self::taught_assign($p['cmid'], $p['userid']);
        $instance = $assign->get_instance();
        $student = \core_user::get_user($p['studentid'], '*', MUST_EXIST);
        $state = self::state($instance, $student->id);
        $text = '';
        $files = [];
        if ($state['submissionid']) {
            $text = (string)$DB->get_field('assignsubmission_onlinetext', 'onlinetext',
                ['assignment' => $instance->id, 'submission' => $state['submissionid']]);
            $files = self::files($assign->get_context()->id, 'assignsubmission_file', 'submission_files', $state['submissionid']);
        }
        return [
            'cmid' => $p['cmid'], 'homework' => $instance->name, 'duedate' => (int)$instance->duedate,
            'courseid' => (int)$assign->get_course()->id, 'coursename' => $assign->get_course()->fullname,
            'student' => self::person($student), 'text' => $text, 'files' => $files,
        ] + array_diff_key($state, ['submissionid' => 1]);
    }

    public static function get_submission_returns(): external_single_structure {
        return new external_single_structure([
            'cmid' => new external_value(PARAM_INT, 'Homework'),
            'homework' => new external_value(PARAM_TEXT, 'Homework title'),
            'duedate' => new external_value(PARAM_INT, 'Due date, 0 = none'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'student' => self::person_structure(),
            'text' => new external_value(PARAM_RAW, 'Answer text (plain)'),
            'files' => self::file_structure(),
        ] + self::state_structure());
    }

    public static function grade_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'cmid' => new external_value(PARAM_INT, 'Homework'),
            'studentid' => new external_value(PARAM_INT, 'Student'),
            'grade' => new external_value(PARAM_FLOAT, 'Grade 0–100'),
            'feedback' => new external_value(PARAM_RAW, 'Feedback (plain text)', VALUE_DEFAULT, ''),
        ]);
    }

    /** Saves a 0–100 grade with feedback (also written to the Moodle gradebook). */
    public static function grade(int $userid, int $cmid, int $studentid, float $grade, string $feedback = ''): array {
        global $DB;
        $p = self::validate_parameters(self::grade_parameters(), compact('userid', 'cmid', 'studentid', 'grade', 'feedback'));
        self::setup();
        $assign = self::taught_assign($p['cmid'], $p['userid']);
        $roleid = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        if (!user_has_role_assignment($p['studentid'], $roleid, \context_course::instance($assign->get_course()->id)->id)) {
            throw self::deny('grade this user');
        }
        if ($p['grade'] < 0 || $p['grade'] > 100) {
            throw new \invalid_parameter_exception('grade must be 0–100');
        }
        $assign->save_grade($p['studentid'], (object)[
            'grade' => $p['grade'],
            'attemptnumber' => -1,
            'addattempt' => 0,
            'applytoall' => 0,
            'workflowstate' => '',
            'assignfeedbackcomments_editor' => ['text' => $p['feedback'], 'format' => FORMAT_PLAIN],
        ]);
        return ['id' => $p['studentid']];
    }

    public static function grade_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Graded student')]);
    }

    public static function gradebook_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher, manager, or class teacher of classid)'),
            'classid' => new external_value(PARAM_INT, 'Only students of this class (0 = everyone)', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Students × homework grid of a course, optionally only one class's students. A class teacher may
     * read it for their class when that class is enrolled into the course.
     */
    public static function gradebook(int $courseid, int $userid, int $classid = 0): array {
        global $DB;
        $p = self::validate_parameters(self::gradebook_parameters(), compact('courseid', 'userid', 'classid'));
        self::setup();
        $course = get_course($p['courseid']);
        $classteacher = $p['classid']
            && $DB->record_exists('local_budu_class_teacher', ['cohortid' => $p['classid'], 'userid' => $p['userid']])
            && $DB->record_exists('enrol', ['enrol' => 'cohort', 'courseid' => $course->id, 'customint1' => $p['classid']]);
        if ($course->id == SITEID || (!$classteacher && !self::can_teach($course, $p['userid']))) {
            throw self::deny('see this gradebook');
        }
        $members = $p['classid']
            ? array_flip($DB->get_fieldset_select('cohort_members', 'userid', 'cohortid = ?', [$p['classid']]))
            : null;
        $homework = [];
        $instances = [];
        foreach (self::homework_of($course, $p['userid']) as $cm) {
            $instances[$cm->id] = $DB->get_record('assign', ['id' => $cm->instance], 'id, name, duedate', MUST_EXIST);
            $homework[] = ['cmid' => (int)$cm->id, 'name' => $instances[$cm->id]->name, 'duedate' => (int)$instances[$cm->id]->duedate];
        }
        $rows = [];
        foreach (self::students_of($course->id) as $s) {
            if ($members !== null && !isset($members[$s->id])) {
                continue;
            }
            $cells = [];
            foreach ($instances as $cmid => $instance) {
                $st = self::state($instance, $s->id);
                $cells[] = ['cmid' => $cmid, 'status' => $st['status'], 'grade' => $st['grade']];
            }
            $rows[] = ['student' => self::person($s), 'cells' => $cells];
        }
        return ['courseid' => (int)$course->id, 'coursename' => $course->fullname, 'homework' => $homework, 'rows' => $rows];
    }

    public static function gradebook_returns(): external_single_structure {
        return new external_single_structure([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'homework' => new external_multiple_structure(new external_single_structure([
                'cmid' => new external_value(PARAM_INT, 'Homework'),
                'name' => new external_value(PARAM_TEXT, 'Title'),
                'duedate' => new external_value(PARAM_INT, 'Due date, 0 = none'),
            ])),
            'rows' => new external_multiple_structure(new external_single_structure([
                'student' => self::person_structure(),
                'cells' => new external_multiple_structure(new external_single_structure([
                    'cmid' => new external_value(PARAM_INT, 'Homework'),
                    'status' => new external_value(PARAM_ALPHA, 'new | submitted | graded'),
                    'grade' => new external_value(PARAM_FLOAT, 'Grade 0–100, −1 = none'),
                ])),
            ])),
        ]);
    }

    // ----- student ---------------------------------------------------------

    public static function my_courses_parameters(): external_function_parameters {
        return new external_function_parameters(['userid' => new external_value(PARAM_INT, 'Acting Budu user (student)')]);
    }

    /** Published courses the user is enrolled in as a student, with teachers and homework counts. */
    public static function my_courses(int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::my_courses_parameters(), compact('userid'));
        self::setup();
        $studentrole = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        $teacherrole = $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST);
        $out = [];
        foreach (enrol_get_all_users_courses($p['userid'], true, 'id, fullname, summary, visible') as $course) {
            $ctx = \context_course::instance($course->id);
            if (!$course->visible || !user_has_role_assignment($p['userid'], $studentrole, $ctx->id)) {
                continue;
            }
            $teachers = get_role_users($teacherrole, $ctx, false, 'u.id, u.firstname, u.lastname, u.firstnamephonetic,
                u.lastnamephonetic, u.middlename, u.alternatename', 'u.lastname', true);
            $homework = self::homework_of(get_course($course->id), $p['userid']);
            $todo = 0;
            foreach ($homework as $cm) {
                $instance = $DB->get_record('assign', ['id' => $cm->instance], 'id', MUST_EXIST);
                if (self::state($instance, $p['userid'])['status'] === 'new') {
                    $todo++;
                }
            }
            $out[] = [
                'id' => (int)$course->id, 'fullname' => $course->fullname, 'summary' => (string)$course->summary,
                'teachers' => implode(', ', array_map('fullname', $teachers)),
                'lessons' => $DB->count_records_select('course_sections', 'course = ? AND section > 0 AND component IS NULL', [$course->id]),
                'homework' => count($homework), 'todo' => $todo,
            ];
        }
        return $out;
    }

    public static function my_courses_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Course'),
            'fullname' => new external_value(PARAM_TEXT, 'Title'),
            'summary' => new external_value(PARAM_RAW, 'Description (plain text)'),
            'teachers' => new external_value(PARAM_TEXT, 'Teacher names'),
            'lessons' => new external_value(PARAM_INT, 'Lessons'),
            'homework' => new external_value(PARAM_INT, 'Homework count'),
            'todo' => new external_value(PARAM_INT, 'Homework not submitted yet'),
        ]));
    }

    public static function my_homework_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (student)'),
            'courseid' => new external_value(PARAM_INT, 'Only this course (0 = all my courses)', VALUE_DEFAULT, 0),
        ]);
    }

    /** The student's homework across their courses with its state. */
    public static function my_homework(int $userid, int $courseid = 0): array {
        global $DB;
        $p = self::validate_parameters(self::my_homework_parameters(), compact('userid', 'courseid'));
        self::setup();
        $rows = [];
        foreach (self::my_courses($p['userid']) as $c) {
            if ($p['courseid'] && $c['id'] != $p['courseid']) {
                continue;
            }
            $course = get_course($c['id']);
            $modinfo = get_fast_modinfo($course, $p['userid']);
            foreach (self::homework_of($course, $p['userid']) as $cm) {
                $instance = $DB->get_record('assign', ['id' => $cm->instance], 'id, name, duedate', MUST_EXIST);
                $section = $modinfo->get_section_info($cm->sectionnum);
                $rows[] = [
                    'cmid' => (int)$cm->id, 'name' => $instance->name, 'duedate' => (int)$instance->duedate,
                    'courseid' => (int)$course->id, 'coursename' => $course->fullname,
                    'lessonid' => (int)$section->id, 'lessonname' => (string)($section->name ?: get_section_name($course, $section)),
                ] + array_diff_key(self::state($instance, $p['userid']), ['submissionid' => 1]);
            }
        }
        return $rows;
    }

    public static function my_homework_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'cmid' => new external_value(PARAM_INT, 'Homework'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'duedate' => new external_value(PARAM_INT, 'Due date, 0 = none'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'lessonid' => new external_value(PARAM_INT, 'Lesson (section id)'),
            'lessonname' => new external_value(PARAM_RAW, 'Lesson title'),
        ] + self::state_structure()));
    }

    public static function my_submission_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (student)'),
            'cmid' => new external_value(PARAM_INT, 'Homework'),
        ]);
    }

    /** The homework as the student sees it: instructions, attachments, their answer, grade and feedback. */
    public static function my_submission(int $userid, int $cmid): array {
        global $DB;
        $p = self::validate_parameters(self::my_submission_parameters(), compact('userid', 'cmid'));
        self::setup();
        $assign = self::student_assign($p['cmid'], $p['userid']);
        $instance = $assign->get_instance();
        $ctx = $assign->get_context();
        $state = self::state($instance, $p['userid']);
        $text = '';
        $files = [];
        if ($state['submissionid']) {
            $text = (string)$DB->get_field('assignsubmission_onlinetext', 'onlinetext',
                ['assignment' => $instance->id, 'submission' => $state['submissionid']]);
            $files = self::files($ctx->id, 'assignsubmission_file', 'submission_files', $state['submissionid']);
        }
        return [
            'cmid' => $p['cmid'], 'name' => $instance->name, 'instructions' => (string)$instance->intro,
            'duedate' => (int)$instance->duedate, 'courseid' => (int)$assign->get_course()->id,
            'coursename' => $assign->get_course()->fullname,
            'attachments' => self::files($ctx->id, 'mod_assign', 'introattachment', 0),
            'text' => $text, 'files' => $files,
        ] + array_diff_key($state, ['submissionid' => 1]);
    }

    public static function my_submission_returns(): external_single_structure {
        return new external_single_structure([
            'cmid' => new external_value(PARAM_INT, 'Homework'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'instructions' => new external_value(PARAM_RAW, 'Instructions (plain text)'),
            'duedate' => new external_value(PARAM_INT, 'Due date, 0 = none'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'attachments' => self::file_structure(),
            'text' => new external_value(PARAM_RAW, 'The student answer (plain text)'),
            'files' => self::file_structure(),
        ] + self::state_structure());
    }

    public static function submit_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (student)'),
            'cmid' => new external_value(PARAM_INT, 'Homework'),
            'text' => new external_value(PARAM_RAW, 'Answer (plain text)'),
            'draftitemid' => new external_value(PARAM_INT, 'Draft area with new files; 0 = keep the current files'),
        ]);
    }

    /** Saves the student's answer and hands it in (no drafts in Budu). Not allowed once graded. */
    public static function submit(int $userid, int $cmid, string $text, int $draftitemid): array {
        $p = self::validate_parameters(self::submit_parameters(), compact('userid', 'cmid', 'text', 'draftitemid'));
        self::setup();
        $assign = self::student_assign($p['cmid'], $p['userid']);
        if (self::state($assign->get_instance(), $p['userid'])['status'] === 'graded') {
            throw self::deny('change a graded homework');
        }
        if (!$assign->submissions_open($p['userid'])) {
            throw new \moodle_exception('submissionsclosed', 'assign');
        }
        $draft = $p['draftitemid'];
        if (!$draft) {
            // Keep the files already handed in: copy them into a fresh draft for the save.
            $submission = $assign->get_user_submission($p['userid'], true);
            file_prepare_draft_area($draft, $assign->get_context()->id, 'assignsubmission_file', 'submission_files', $submission->id);
        }
        $notices = [];
        $ok = $assign->save_submission((object)[
            'userid' => $p['userid'],
            'onlinetext_editor' => ['text' => $p['text'], 'format' => FORMAT_PLAIN, 'itemid' => 0],
            'files_filemanager' => $draft,
        ], $notices);
        if (!$ok) {
            throw new \moodle_exception('submissionempty', 'mod_assign', '', null, implode(' ', $notices));
        }
        $course = $assign->get_course();
        return [
            'id' => $p['cmid'], 'homework' => $assign->get_instance()->name,
            'courseid' => (int)$course->id, 'coursename' => $course->fullname,
            'student' => self::person(\core_user::get_user($p['userid'], '*', MUST_EXIST)),
            'teachers' => array_map([self::class, 'person'], self::teachers_of($course->id)),
        ];
    }

    public static function submit_returns(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Homework'),
            'homework' => new external_value(PARAM_TEXT, 'Homework title'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'student' => self::person_structure(),
            'teachers' => new external_multiple_structure(self::person_structure(), 'To notify'),
        ]);
    }
}
