<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Marketplace (Explore) for Budu. Which courses are listed, and at what price, lives in the Budu
 * frontend (app-db); here: the public facts of those courses, and enrolling a learner once the
 * frontend has decided they may join (free course, or a payment the platform admin confirmed).
 */
class market extends external_api {

    private static function setup(): void {
        global $CFG;
        require_once($CFG->libdir . '/enrollib.php');
        require_once($CFG->dirroot . '/course/lib.php');
        self::validate_context(\context_system::instance());
    }

    // ----- catalog --------------------------------------------------------

    public static function catalog_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseids' => new external_multiple_structure(new external_value(PARAM_INT, 'Course'), 'Listed courses', VALUE_DEFAULT, []),
            'userid' => new external_value(PARAM_INT, 'Viewer (for "already enrolled"); 0 = none', VALUE_DEFAULT, 0),
        ]);
    }

    /** Published courses among `courseids`: title, description, teachers, school, lessons, viewer enrolled. */
    public static function catalog(array $courseids = [], int $userid = 0): array {
        global $DB;
        $p = self::validate_parameters(self::catalog_parameters(), compact('courseids', 'userid'));
        self::setup();
        $out = [];
        $languages = profile::course_languages(array_unique(array_map('intval', $p['courseids'])));
        $subjects = profile::course_subjects(array_unique(array_map('intval', $p['courseids'])));
        foreach (array_unique(array_map('intval', $p['courseids'])) as $id) {
            $course = $DB->get_record('course', ['id' => $id]);
            if (!$course || $course->id == SITEID || !$course->visible) {
                continue;
            }
            $ctx = \context_course::instance($course->id);
            $company = $DB->get_field_sql('SELECT c.name FROM {company_course} cc JOIN {company} c ON c.id = cc.companyid
                WHERE cc.courseid = ?', [$course->id], IGNORE_MULTIPLE);
            $lessons = $DB->get_records_select('course_sections', 'course = ? AND section > 0 AND component IS NULL AND visible = 1',
                [$course->id], 'section', 'id, section, name');
            $out[] = [
                'id' => (int)$course->id,
                'fullname' => $course->fullname,
                'summary' => (string)$course->summary,
                'school' => (string)$company,
                'teachers' => array_map(fn($u) => learning::person($u), learning::teachers_of($course->id)),
                // raw names (get_section_name() returns HTML-escaped text; the frontend escapes itself)
                'lessons' => array_values(array_map(fn($s) => (string)($s->name ?: html_entity_decode(get_section_name($course, (int)$s->section), ENT_QUOTES)), $lessons)),
                'enrolled' => $p['userid'] > 0 && is_enrolled($ctx, $p['userid'], '', true),
                'image' => courses::image_id($course->id),
                'students' => count(learning::students_of($course->id)), // how many took the course
                'language' => (string)($languages[$course->id] ?? ''), // teaching language (course custom field)
                'subject' => (string)($subjects[$course->id] ?? ''), // what it is about (course custom field)
            ];
        }
        return $out;
    }

    public static function catalog_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Course'),
            'fullname' => new external_value(PARAM_TEXT, 'Title'),
            'summary' => new external_value(PARAM_RAW, 'Description (plain text)'),
            'school' => new external_value(PARAM_TEXT, 'Owning company (school / teacher)'),
            'teachers' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_INT, 'User id'),
                'name' => new external_value(PARAM_TEXT, 'Full name'),
                'email' => new external_value(PARAM_RAW, 'Email'),
                'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
            ])),
            'lessons' => new external_multiple_structure(new external_value(PARAM_RAW, 'Lesson title')),
            'enrolled' => new external_value(PARAM_BOOL, 'The viewer is enrolled'),
            'image' => new external_value(PARAM_INT, 'Cover image file id, 0 = none'),
            'students' => new external_value(PARAM_INT, 'Students enrolled (active)'),
            'language' => new external_value(PARAM_ALPHA, 'Teaching language (ISO 639-1), empty = not said'),
            'subject' => new external_value(PARAM_ALPHANUMEXT, 'Subject key, empty = not said'),
        ]));
    }

    // ----- enrol_learner --------------------------------------------------

    public static function enrol_learner_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Published course'),
            'userid' => new external_value(PARAM_INT, 'Learner'),
        ]);
    }

    /** Enrol a learner as a student (free course, or payment confirmed). Result: enrolled | already. */
    public static function enrol_learner(int $courseid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::enrol_learner_parameters(), compact('courseid', 'userid'));
        self::setup();
        $course = get_course($p['courseid']);
        $user = $DB->get_record('user', ['id' => $p['userid'], 'deleted' => 0], '*', MUST_EXIST);
        if ($course->id == SITEID || !$course->visible || $user->suspended) {
            throw new \moodle_exception('cannotenrol', 'enrol_manual');
        }
        $ctx = \context_course::instance($course->id);
        $roleid = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        if (is_enrolled($ctx, $user->id, '', true) && user_has_role_assignment($user->id, $roleid, $ctx->id)) {
            return ['result' => 'already'];
        }
        if (!enrol_try_internal_enrol($course->id, $user->id, $roleid)) {
            throw new \moodle_exception('cannotenrol', 'enrol_manual');
        }
        return ['result' => 'enrolled'];
    }

    public static function enrol_learner_returns(): external_single_structure {
        return new external_single_structure(['result' => new external_value(PARAM_ALPHA, 'enrolled | already')]);
    }
}
