<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Timetable for Budu, stored as Moodle calendar events in IOMAD:
 *  - lessons = weekly course events (or group events of ONE class's group in the course), created
 *    as a series (same repeatid). The browser sends every occurrence, so local time / DST is right;
 *  - school events = category events of the school's (IOMAD company's) category.
 * my_week returns what a user should see. Rights are checked against the acting `userid`:
 * course teachers or school managers schedule lessons; school managers manage school events.
 */
class schedule extends external_api {

    // ----- helpers -------------------------------------------------------

    private static function setup(): void {
        global $CFG;
        require_once($CFG->dirroot . '/calendar/lib.php');
        require_once($CFG->dirroot . '/enrol/cohort/lib.php');
        require_once($CFG->dirroot . '/enrol/cohort/locallib.php');
        require_once($CFG->dirroot . '/group/lib.php');
        self::validate_context(\context_system::instance());
    }

    private static function deny(string $what): \moodle_exception {
        return new \moodle_exception('nopermissions', 'error', '', $what);
    }

    /** Teacher of the course, or manager of a school owning it. */
    private static function can_schedule(\stdClass $course, int $userid): bool {
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

    /** The class's group in the course (created on first need — cohort sync keeps it filled). */
    public static function class_group(int $courseid, int $classid): int {
        global $DB;
        $instance = $DB->get_record('enrol', ['enrol' => 'cohort', 'courseid' => $courseid, 'customint1' => $classid]);
        if (!$instance) {
            throw self::deny('schedule a class that is not enrolled into this course');
        }
        if (empty($instance->customint2)) {
            $instance->customint2 = enrol_cohort_create_new_group($courseid, $classid);
            $DB->update_record('enrol', $instance);
            $trace = new \null_progress_trace();
            enrol_cohort_sync($trace, $courseid);
            $trace->finished();
        }
        return (int)$instance->customint2;
    }

    /** The class (cohort) name of a class group in a course ("Class 10", not Moodle's "Class 10 cohort"). */
    private static function class_name(int $courseid, int $groupid): string {
        global $DB;
        if (!$groupid) {
            return '';
        }
        $name = $DB->get_field_sql("SELECT c.name FROM {enrol} e JOIN {cohort} c ON c.id = e.customint1
            WHERE e.enrol = 'cohort' AND e.courseid = ? AND e.customint2 = ?", [$courseid, $groupid], IGNORE_MULTIPLE);
        return (string)($name ?: $DB->get_field('groups', 'name', ['id' => $groupid]));
    }

    private static function company_category(int $companyid): int {
        global $DB;
        return (int)$DB->get_field('company', 'category', ['id' => $companyid], MUST_EXIST);
    }

    private static function item_structure(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Event id'),
            'kind' => new external_value(PARAM_ALPHA, 'lesson | event'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'description' => new external_value(PARAM_RAW, 'Description / room (plain text)'),
            'timestart' => new external_value(PARAM_INT, 'Start (unix)'),
            'duration' => new external_value(PARAM_INT, 'Seconds'),
            'courseid' => new external_value(PARAM_INT, 'Course (lessons), 0 = none'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'classname' => new external_value(PARAM_TEXT, 'Class the lesson is for, empty = whole course'),
            'teachers' => new external_value(PARAM_TEXT, 'Teacher names'),
            'school' => new external_value(PARAM_TEXT, 'School (events)'),
            'seriesid' => new external_value(PARAM_INT, 'Series (repeatid), 0 = single'),
        ]);
    }

    // ----- add_lessons -------------------------------------------------------

    public static function add_lessons_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (course teacher or school manager)'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'classid' => new external_value(PARAM_INT, 'Only for this class (0 = everyone in the course)'),
            'description' => new external_value(PARAM_RAW, 'Room / notes (plain text)', VALUE_DEFAULT, ''),
            'duration' => new external_value(PARAM_INT, 'Lesson length in seconds'),
            'starts' => new external_multiple_structure(new external_value(PARAM_INT, 'Start (unix)'), 'Every occurrence'),
        ]);
    }

    /** Creates a lesson series (weekly occurrences computed by the browser). */
    public static function add_lessons(int $userid, int $courseid, int $classid, string $description, int $duration, array $starts): array {
        global $DB;
        $p = self::validate_parameters(self::add_lessons_parameters(),
            compact('userid', 'courseid', 'classid', 'description', 'duration', 'starts'));
        self::setup();
        $course = get_course($p['courseid']);
        if ($course->id == SITEID || !self::can_schedule($course, $p['userid'])) {
            throw self::deny('schedule this course');
        }
        if (!$p['starts'] || count($p['starts']) > 200 || $p['duration'] < 300 || $p['duration'] > 8 * 3600) {
            throw new \invalid_parameter_exception('1–200 lessons of 5 min – 8 h');
        }
        $groupid = $p['classid'] ? self::class_group($course->id, $p['classid']) : 0;
        $repeatid = 0;
        foreach (array_unique($p['starts']) as $start) {
            $event = \calendar_event::create((object)[
                'name' => $course->fullname,
                'description' => $p['description'],
                'format' => FORMAT_PLAIN,
                'courseid' => $course->id,
                'groupid' => $groupid,
                'userid' => $p['userid'],
                'eventtype' => $groupid ? 'group' : 'course',
                'component' => 'local_budu',
                'timestart' => $start,
                'timeduration' => $p['duration'],
                'visible' => 1,
            ], false);
            if (!$repeatid) {
                $repeatid = (int)$event->id;
            }
            $DB->set_field('event', 'repeatid', $repeatid, ['id' => $event->id]);
        }
        return ['id' => $repeatid];
    }

    public static function add_lessons_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Series id')]);
    }

    // ----- course_series / delete_series --------------------------------------

    public static function course_series_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
        ]);
    }

    /** The course's lesson series: first lesson, count, last date, class. */
    public static function course_series(int $userid, int $courseid): array {
        global $DB;
        $p = self::validate_parameters(self::course_series_parameters(), compact('userid', 'courseid'));
        self::setup();
        $course = get_course($p['courseid']);
        if (!self::can_schedule($course, $p['userid'])) {
            throw self::deny('see this schedule');
        }
        $rows = $DB->get_records_sql("SELECT repeatid, MIN(timestart) AS first, MAX(timestart) AS last, COUNT(1) AS n,
                MAX(timeduration) AS duration, MAX(groupid) AS groupid, MAX(description) AS description
            FROM {event} WHERE courseid = ? AND component = 'local_budu' AND repeatid > 0
            GROUP BY repeatid ORDER BY MIN(timestart)", [$course->id]);
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'id' => (int)$r->repeatid, 'first' => (int)$r->first, 'last' => (int)$r->last, 'count' => (int)$r->n,
                'duration' => (int)$r->duration, 'description' => (string)$r->description,
                'classname' => self::class_name($course->id, (int)$r->groupid),
            ];
        }
        return $out;
    }

    public static function course_series_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Series id'),
            'first' => new external_value(PARAM_INT, 'First lesson (unix)'),
            'last' => new external_value(PARAM_INT, 'Last lesson (unix)'),
            'count' => new external_value(PARAM_INT, 'Lessons'),
            'duration' => new external_value(PARAM_INT, 'Seconds'),
            'description' => new external_value(PARAM_RAW, 'Room / notes'),
            'classname' => new external_value(PARAM_TEXT, 'Class, empty = whole course'),
        ]));
    }

    public static function delete_series_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'seriesid' => new external_value(PARAM_INT, 'Series id'),
        ]);
    }

    public static function delete_series(int $userid, int $courseid, int $seriesid): array {
        global $DB;
        $p = self::validate_parameters(self::delete_series_parameters(), compact('userid', 'courseid', 'seriesid'));
        self::setup();
        $course = get_course($p['courseid']);
        if (!self::can_schedule($course, $p['userid'])) {
            throw self::deny('change this schedule');
        }
        $DB->delete_records('event', ['courseid' => $course->id, 'repeatid' => $p['seriesid'], 'component' => 'local_budu']);
        return ['id' => $p['seriesid']];
    }

    public static function delete_series_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Series id')]);
    }

    // ----- school events -------------------------------------------------------

    public static function add_school_event_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'description' => new external_value(PARAM_RAW, 'Description / place (plain text)', VALUE_DEFAULT, ''),
            'timestart' => new external_value(PARAM_INT, 'Start (unix)'),
            'duration' => new external_value(PARAM_INT, 'Seconds (0 = no end time)'),
        ]);
    }

    public static function add_school_event(int $companyid, int $userid, string $name, string $description, int $timestart, int $duration): array {
        $p = self::validate_parameters(self::add_school_event_parameters(),
            compact('companyid', 'userid', 'name', 'description', 'timestart', 'duration'));
        self::setup();
        if (!school::is_manager($p['companyid'], $p['userid'])) {
            throw self::deny('add school events');
        }
        $event = \calendar_event::create((object)[
            'name' => trim($p['name']),
            'description' => $p['description'],
            'format' => FORMAT_PLAIN,
            'categoryid' => self::company_category($p['companyid']),
            'courseid' => 0,
            'groupid' => 0,
            'userid' => $p['userid'],
            'eventtype' => 'category',
            'component' => 'local_budu',
            'timestart' => $p['timestart'],
            'timeduration' => max(0, $p['duration']),
            'visible' => 1,
        ], false);
        return ['id' => (int)$event->id];
    }

    public static function add_school_event_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Event id')]);
    }

    public static function delete_school_event_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'eventid' => new external_value(PARAM_INT, 'Event'),
        ]);
    }

    public static function delete_school_event(int $companyid, int $userid, int $eventid): array {
        global $DB;
        $p = self::validate_parameters(self::delete_school_event_parameters(), compact('companyid', 'userid', 'eventid'));
        self::setup();
        if (!school::is_manager($p['companyid'], $p['userid'])) {
            throw self::deny('remove school events');
        }
        $DB->delete_records('event', ['id' => $p['eventid'], 'eventtype' => 'category',
            'categoryid' => self::company_category($p['companyid']), 'component' => 'local_budu']);
        return ['id' => $p['eventid']];
    }

    public static function delete_school_event_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Event id')]);
    }

    // ----- my_week -----------------------------------------------------------

    public static function my_week_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'from' => new external_value(PARAM_INT, 'Range start (unix)'),
            'to' => new external_value(PARAM_INT, 'Range end (unix)'),
        ]);
    }

    /**
     * What the user should see in [from, to): lessons of courses they learn in (their class's group
     * lessons only) or teach / manage, and the events of the schools they belong to.
     */
    public static function my_week(int $userid, int $from, int $to): array {
        global $DB;
        $p = self::validate_parameters(self::my_week_parameters(), compact('userid', 'from', 'to'));
        self::setup();
        if ($p['to'] <= $p['from'] || $p['to'] - $p['from'] > 45 * 86400) {
            throw new \invalid_parameter_exception('range of up to 45 days');
        }
        $teacherrole = $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST);

        // courses: enrolled (as learner) or teachable (teacher / school manager)
        $courses = [];
        foreach (enrol_get_all_users_courses($p['userid'], true, 'id, fullname, visible') as $c) {
            $courses[$c->id] = $c;
        }
        $companies = array_map('intval', $DB->get_fieldset_select('company_users', 'companyid', 'userid = ?', [$p['userid']]));
        foreach ($companies as $companyid) {
            if (school::is_manager($companyid, $p['userid'])) {
                foreach ($DB->get_records_sql('SELECT c.id, c.fullname, c.visible FROM {course} c
                        JOIN {company_course} cc ON cc.courseid = c.id WHERE cc.companyid = ?', [$companyid]) as $c) {
                    $courses[$c->id] = $c;
                }
            }
        }

        $items = [];
        $teachercache = [];
        foreach ($courses as $c) {
            $ctx = \context_course::instance($c->id);
            $teaches = has_capability('mod/assign:grade', $ctx, $p['userid']) || !is_enrolled($ctx, $p['userid'], '', true)
                || !user_has_role_assignment($p['userid'], (int)$DB->get_field('role', 'id', ['shortname' => 'student']), $ctx->id);
            if (!$c->visible && !$teaches) {
                continue;
            }
            $mygroups = array_keys(groups_get_all_groups($c->id, $p['userid']));
            $events = $DB->get_records_select('event',
                "courseid = ? AND component = 'local_budu' AND timestart >= ? AND timestart < ?",
                [$c->id, $p['from'], $p['to']], 'timestart');
            foreach ($events as $e) {
                if ($e->groupid && !$teaches && !in_array((int)$e->groupid, $mygroups)) {
                    continue; // another class's lesson
                }
                $teachercache[$c->id] ??= implode(', ', array_map('fullname', get_role_users($teacherrole, $ctx, false,
                    'u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename', 'u.lastname', true)));
                $items[] = [
                    'id' => (int)$e->id, 'kind' => 'lesson', 'name' => $c->fullname, 'description' => (string)$e->description,
                    'timestart' => (int)$e->timestart, 'duration' => (int)$e->timeduration, 'courseid' => (int)$c->id,
                    'coursename' => $c->fullname,
                    'classname' => self::class_name($c->id, (int)$e->groupid),
                    'teachers' => $teachercache[$c->id], 'school' => '', 'seriesid' => (int)$e->repeatid,
                ];
            }
        }

        // school events of the user's schools
        foreach ($companies as $companyid) {
            $category = self::company_category($companyid);
            $school = (string)$DB->get_field('company', 'name', ['id' => $companyid]);
            foreach ($DB->get_records_select('event', "eventtype = 'category' AND categoryid = ? AND component = 'local_budu'
                    AND timestart < ? AND timestart + timeduration >= ?", [$category, $p['to'], $p['from']], 'timestart') as $e) {
                $items[] = [
                    'id' => (int)$e->id, 'kind' => 'event', 'name' => $e->name, 'description' => (string)$e->description,
                    'timestart' => (int)$e->timestart, 'duration' => (int)$e->timeduration, 'courseid' => 0, 'coursename' => '',
                    'classname' => '', 'teachers' => '', 'school' => $school, 'seriesid' => 0,
                ];
            }
        }
        usort($items, fn($a, $b) => $a['timestart'] <=> $b['timestart']);
        return $items;
    }

    public static function my_week_returns(): external_multiple_structure {
        return new external_multiple_structure(self::item_structure());
    }
}
