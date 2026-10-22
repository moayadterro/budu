<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_budu\drafts;

/**
 * Course builder for Budu teachers: courses (IOMAD company courses), lessons
 * (course sections), materials (mod_resource: video / PDF / any file), text pages
 * (mod_page: rich text, HTML cleaned by Moodle's purifier) and tasks (mod_assign, graded 0–100).
 *
 * The integration token performs the changes; every function takes the acting
 * Budu user (`userid`) and checks THAT user's rights in Moodle first:
 * editing needs moodle/course:manageactivities in the course (the course's
 * teacher), viewing needs an active enrolment in a visible course (or editing).
 * Files are uploaded beforehand to the integration user's draft area
 * (webservice/upload.php) and passed as `draftitemid`.
 */
class courses extends external_api {

    // ----- helpers -------------------------------------------------------

    private static function setup(): void {
        global $CFG;
        require_once($CFG->dirroot . '/course/lib.php');
        require_once($CFG->dirroot . '/course/modlib.php');
        require_once($CFG->libdir . '/resourcelib.php');
        require_once($CFG->libdir . '/enrollib.php');
        self::validate_context(\context_system::instance());
    }

    /** The course, if $userid may edit it; otherwise an exception. */
    private static function editable(int $courseid, int $userid): \stdClass {
        $course = get_course($courseid);
        if ($course->id == SITEID || !has_capability('moodle/course:manageactivities', \context_course::instance($course->id), $userid)) {
            throw new \moodle_exception('nopermissions', 'error', '', 'edit this course');
        }
        return $course;
    }

    private static function can_view(\stdClass $course, int $userid): bool {
        $ctx = \context_course::instance($course->id);
        if (has_capability('moodle/course:manageactivities', $ctx, $userid)) {
            return true;
        }
        return $course->visible && is_enrolled($ctx, $userid, '', true);
    }

    /** A lesson = a course section other than section 0 (the course's general section). */
    private static function lesson(\stdClass $course, int $sectionid): \stdClass {
        global $DB;
        $section = $DB->get_record('course_sections', ['id' => $sectionid, 'course' => $course->id], '*', MUST_EXIST);
        if ($section->section == 0 || !empty($section->component)) {
            throw new \moodle_exception('invalidrecord', 'error', '', 'lesson');
        }
        return $section;
    }

    /**
     * The free preview of a published course: its FIRST lesson (lowest visible section, no access
     * restrictions). Anyone — even a visitor (user 0) — may see its videos, files and text pages.
     */
    private static function preview_section(\stdClass $course): ?\stdClass {
        global $DB;
        if (!$course->visible || school_exams::is_exam_space($course)) {
            return null;
        }
        // the first lesson students see (a new, unpublished lesson moved to the top doesn't count)
        $first = $DB->get_records_select('course_sections', 'course = ? AND section > 0 AND component IS NULL AND visible = 1',
            [$course->id], 'section', '*', 0, 1);
        $first = $first ? reset($first) : null;
        return $first && empty($first->availability) ? $first : null;
    }

    /** Is this module part of the course's free preview (a material in lesson 1, shown to everyone)? */
    private static function in_preview(\stdClass $course, $cm): bool {
        if (!in_array($cm->modname, ['resource', 'page']) || !$cm->visible || !empty($cm->availability)
                || !empty($cm->deletioninprogress)) {
            return false;
        }
        $first = self::preview_section($course);
        return $first && (int)$cm->section === (int)$first->id;
    }

    /** A new item in a published course waits hidden — unless its whole lesson is new (hidden already). */
    private static function new_item_visible(\stdClass $course, \stdClass $section): int {
        return drafts::live($course) && !drafts::added('section', $section->id) ? 0 : 1;
    }

    private static function note_new_item(\stdClass $course, \stdClass $section, int $cmid, int $userid): void {
        if (drafts::live($course) && !drafts::added('section', $section->id)) {
            drafts::put($course->id, 'cm', $cmid, 'add', [], $userid);
        }
    }

    /** Do changes to this item go into the draft (it is live: published course, visible, not itself new)? */
    private static function drafted(\stdClass $course, \stdClass $cm): bool {
        return drafts::live($course) && $cm->visible && !drafts::added('cm', $cm->id);
    }

    /** Change a task now. $draftitemid 0 = keep its current attachment. */
    private static function apply_task(\stdClass $course, \stdClass $cm, string $name, string $instructions, int $duedate, int $draftitemid): void {
        [, , , $data] = get_moduleinfo_data($cm, $course);
        if (!$draftitemid) {
            // Keep the current attachment: copy it into a fresh draft area for the update.
            file_prepare_draft_area($draftitemid, \context_module::instance($cm->id)->id, 'mod_assign', 'introattachment', 0);
        }
        update_module(self::task_settings($data, $name, $instructions, $duedate, $draftitemid));
    }

    /** Change a text page now. */
    private static function apply_page(\stdClass $course, \stdClass $cm, string $name, string $html): void {
        global $DB;
        [, , , $data] = get_moduleinfo_data($cm, $course);
        $data->name = $name;
        $data->introeditor = self::intro('');
        $data->page = ['text' => $html, 'format' => FORMAT_HTML, 'itemid' => 0];
        $data->content = $html;
        $data->contentformat = FORMAT_HTML;
        update_module($data);
    }

    private static function cm(\stdClass $course, int $cmid): \stdClass {
        $cm = get_coursemodule_from_id('', $cmid, $course->id, false, MUST_EXIST);
        if (!in_array($cm->modname, ['resource', 'assign', 'page'])) {
            throw new \moodle_exception('invalidrecord', 'error', '', 'item');
        }
        return $cm;
    }

    /** Teacher HTML → safe HTML (Moodle's HTMLPurifier: no scripts, event handlers or unsafe URLs). */
    private static function clean_html(string $html): string {
        return clean_text($html, FORMAT_HTML);
    }

    private static function intro(string $text): array {
        return ['text' => $text, 'format' => FORMAT_PLAIN, 'itemid' => 0];
    }

    private static function file_info(\stored_file $f): array {
        return ['id' => (int)$f->get_id(), 'filename' => $f->get_filename(), 'filesize' => (int)$f->get_filesize(), 'mimetype' => (string)$f->get_mimetype()];
    }

    private static function files_of(int $contextid, string $component, string $area): array {
        $fs = get_file_storage();
        $files = $fs->get_area_files($contextid, $component, $area, false, 'sortorder DESC, id ASC', false);
        return array_values(array_map([self::class, 'file_info'], $files));
    }

    /** Settings for a Budu task: online text and/or file submission, graded 0–100. */
    private static function task_settings(\stdClass $data, string $name, string $instructions, int $duedate, int $draftitemid): \stdClass {
        $data->name = $name;
        $data->introeditor = self::intro($instructions);
        $data->intro = $instructions;
        $data->introformat = FORMAT_PLAIN;
        $data->introattachments = $draftitemid;
        $data->duedate = $duedate;
        $data->allowsubmissionsfromdate = 0;
        $data->cutoffdate = 0;
        $data->gradingduedate = 0;
        $data->alwaysshowdescription = 1;
        $data->submissiondrafts = 0;
        $data->requiresubmissionstatement = 0;
        $data->sendnotifications = 0;
        $data->sendlatenotifications = 0;
        $data->sendstudentnotifications = 1;
        $data->grade = 100;
        $data->teamsubmission = 0;
        $data->requireallteammemberssubmit = 0;
        $data->teamsubmissiongroupingid = 0;
        $data->blindmarking = 0;
        $data->hidegrader = 0;
        $data->attemptreopenmethod = 'untilpass';
        $data->maxattempts = 1;
        $data->markingworkflow = 0;
        $data->markingallocation = 0;
        $data->markinganonymous = 0;
        $data->preventsubmissionnotingroup = 0;
        $data->activityformat = 0;
        $data->timelimit = 0;
        $data->submissionattachments = 0;
        $data->assignsubmission_onlinetext_enabled = 1;
        $data->assignsubmission_onlinetext_wordlimit = 0;
        $data->assignsubmission_onlinetext_wordlimit_enabled = 0;
        $data->assignsubmission_file_enabled = 1;
        $data->assignsubmission_file_maxfiles = 5;
        $data->assignsubmission_file_maxsizebytes = 0;
        $data->assignsubmission_file_filetypes = '';
        $data->assignfeedback_comments_enabled = 1;
        $data->assignfeedback_comments_commentinline = 0;
        $data->assignfeedback_file_enabled = 0;
        return $data;
    }

    private static function course_structure(): array {
        return [
            'id' => new external_value(PARAM_INT, 'Course id'),
            'fullname' => new external_value(PARAM_TEXT, 'Title'),
            'summary' => new external_value(PARAM_RAW, 'Description (plain text)'),
            'visible' => new external_value(PARAM_BOOL, 'Published'),
            'lessons' => new external_value(PARAM_INT, 'Number of lessons'),
            'timemodified' => new external_value(PARAM_INT, 'Last change'),
            'image' => new external_value(PARAM_INT, 'Cover image file id, 0 = none', VALUE_DEFAULT, 0),
        ];
    }

    /** The course's cover image (Moodle's course image: course/overviewfiles); 0 = none. */
    public static function image_id(int $courseid): int {
        $ctx = \context_course::instance($courseid, IGNORE_MISSING);
        if (!$ctx) {
            return 0;
        }
        foreach (get_file_storage()->get_area_files($ctx->id, 'course', 'overviewfiles', 0, 'id', false) as $f) {
            if (str_starts_with((string)$f->get_mimetype(), 'image/')) {
                return (int)$f->get_id();
            }
        }
        return 0;
    }

    private static function lesson_count(int $courseid): int {
        global $DB;
        return $DB->count_records_select('course_sections', 'course = ? AND section > 0 AND component IS NULL', [$courseid]);
    }

    private static function ok(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Id of the created/changed record')]);
    }

    // ----- list_courses --------------------------------------------------

    public static function list_courses_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'IOMAD company'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
        ]);
    }

    /** Company courses the user can edit (a teacher's own courses). */
    public static function list_courses(int $companyid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::list_courses_parameters(), ['companyid' => $companyid, 'userid' => $userid]);
        self::setup();
        $courses = $DB->get_records_sql(
            'SELECT c.* FROM {course} c JOIN {company_course} cc ON cc.courseid = c.id WHERE cc.companyid = ? ORDER BY c.timemodified DESC',
            [$p['companyid']]);
        $out = [];
        foreach ($courses as $c) {
            if (school_exams::is_exam_space($c)) {
                continue; // a school's exam space is not a course
            }
            if (has_capability('moodle/course:manageactivities', \context_course::instance($c->id), $p['userid'])) {
                $out[] = ['id' => $c->id, 'fullname' => $c->fullname, 'summary' => $c->summary, 'visible' => (bool)$c->visible,
                    'lessons' => self::lesson_count($c->id), 'timemodified' => $c->timemodified, 'image' => self::image_id($c->id)];
            }
        }
        return $out;
    }

    public static function list_courses_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure(self::course_structure()));
    }

    // ----- create_course -------------------------------------------------

    public static function create_course_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'IOMAD company'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (an educator in the company)'),
            'fullname' => new external_value(PARAM_TEXT, 'Title'),
            'summary' => new external_value(PARAM_RAW, 'Description (plain text)'),
        ]);
    }

    /** New course (a draft: hidden) in the company's category, its creator enrolled as editing teacher. */
    public static function create_course(int $companyid, int $userid, string $fullname, string $summary): array {
        global $CFG, $DB;
        $p = self::validate_parameters(self::create_course_parameters(), compact('companyid', 'userid', 'fullname', 'summary'));
        self::setup();
        require_once($CFG->dirroot . '/local/iomad/lib/company.php');

        if (!$DB->record_exists('company_users', ['companyid' => $p['companyid'], 'userid' => $p['userid'], 'educator' => 1])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'create courses in this company');
        }
        $company = new \company($p['companyid']);
        $category = $DB->get_field('company', 'category', ['id' => $p['companyid']], MUST_EXIST);

        $course = create_course((object)[
            'fullname' => trim($p['fullname']),
            'shortname' => 'budu-' . $p['companyid'] . '-' . bin2hex(random_bytes(4)),
            'category' => $category,
            'summary' => $p['summary'],
            'summaryformat' => FORMAT_PLAIN,
            'format' => 'topics',
            'numsections' => 0,
            'visible' => 0,
            'enablecompletion' => 1,
        ]);
        $company->add_course($course, 0, true);

        $teacher = $DB->get_field('role', 'id', ['shortname' => 'editingteacher'], MUST_EXIST);
        if (!enrol_try_internal_enrol($course->id, $p['userid'], $teacher)) {
            throw new \moodle_exception('cannotenrol', 'enrol_manual');
        }
        return ['id' => $course->id];
    }

    public static function create_course_returns(): external_single_structure {
        return self::ok();
    }

    // ----- update_course -------------------------------------------------

    public static function update_course_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'fullname' => new external_value(PARAM_TEXT, 'Title'),
            'summary' => new external_value(PARAM_RAW, 'Description (plain text)'),
            'visible' => new external_value(PARAM_BOOL, 'Published'),
        ]);
    }

    public static function update_course(int $courseid, int $userid, string $fullname, string $summary, bool $visible): array {
        $p = self::validate_parameters(self::update_course_parameters(), compact('courseid', 'userid', 'fullname', 'summary', 'visible'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        if ($course->visible && !$p['visible']) {
            self::apply_changes($course); // unpublished: nobody sees it, so pending changes simply apply
        }
        update_course((object)[
            'id' => $course->id,
            'fullname' => trim($p['fullname']),
            'summary' => $p['summary'],
            'summaryformat' => FORMAT_PLAIN,
            'visible' => $p['visible'] ? 1 : 0,
        ]);
        return ['id' => $course->id];
    }

    public static function update_course_returns(): external_single_structure {
        return self::ok();
    }

    // ----- get_course ----------------------------------------------------

    public static function get_course_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
        ]);
    }

    /** A course with its lessons and their items, as the given user may see it. */
    public static function get_course(int $courseid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::get_course_parameters(), compact('courseid', 'userid'));
        self::setup();
        $course = get_course($p['courseid']);
        if ($course->id == SITEID || !self::can_view($course, $p['userid'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'view this course');
        }
        $canedit = has_capability('moodle/course:manageactivities', \context_course::instance($course->id), $p['userid']);
        $modinfo = get_fast_modinfo($course, $p['userid']);
        // editors see their unpublished changes (drafts.php); students only the published version
        $rows = $canedit ? drafts::of_course($course->id) : [];
        $edit = fn(?\stdClass $row): array => $row && $row->action === 'edit' ? drafts::data($row) : [];

        $lessons = [];
        foreach ($modinfo->get_section_info_all() as $section) {
            if ($section->section == 0 || $section->component || (!$canedit && !$section->uservisible)) {
                continue;
            }
            $items = [];
            foreach ($modinfo->sections[$section->section] ?? [] as $cmid) {
                $cm = $modinfo->get_cm($cmid);
                if ($cm->deletioninprogress || !in_array($cm->modname, ['resource', 'assign', 'page']) || (!$canedit && !$cm->uservisible)) {
                    continue;
                }
                $ctx = \context_module::instance($cm->id);
                $row = $rows['cm:' . $cm->id] ?? null;
                $d = $edit($row);
                $state = drafts::state($row);
                if ($cm->modname === 'resource') {
                    $files = self::files_of($ctx->id, 'mod_resource', 'content');
                    $kind = $files && str_starts_with($files[0]['mimetype'], 'video/') ? 'video' : 'file';
                    $items[] = ['cmid' => $cm->id, 'kind' => $kind, 'name' => $cm->name, 'instructions' => '', 'duedate' => 0, 'files' => $files,
                        'draft' => $state];
                } else if ($cm->modname === 'page') {
                    $content = $d['content'] ?? (string)$DB->get_field('page', 'content', ['id' => $cm->instance]);
                    $items[] = ['cmid' => $cm->id, 'kind' => 'text', 'name' => $d['name'] ?? $cm->name, 'instructions' => '', 'duedate' => 0,
                        'files' => [], 'content' => self::clean_html($content), 'draft' => $state];
                } else {
                    $assign = $DB->get_record('assign', ['id' => $cm->instance], 'intro, duedate', MUST_EXIST);
                    $items[] = ['cmid' => $cm->id, 'kind' => 'task', 'name' => $d['name'] ?? $cm->name,
                        'instructions' => $d['instructions'] ?? $assign->intro, 'duedate' => (int)($d['duedate'] ?? $assign->duedate),
                        'files' => self::files_of($ctx->id, 'mod_assign', 'introattachment'), 'draft' => $state];
                }
            }
            // Raw name: get_section_name() returns HTML-escaped text; the frontend escapes on output itself.
            $name = $section->name ?? '';
            $name = $name !== '' ? $name : html_entity_decode(get_section_name($course, $section), ENT_QUOTES);
            $row = $rows['section:' . $section->id] ?? null;
            $d = $edit($row);
            $lessons[] = ['id' => $section->id, 'name' => $d['name'] ?? $name, 'summary' => (string)($d['summary'] ?? $section->summary),
                'items' => $items, 'draft' => drafts::state($row)];
        }

        return [
            'id' => $course->id, 'fullname' => $course->fullname, 'summary' => $course->summary, 'visible' => (bool)$course->visible,
            'lessons' => count($lessons), 'timemodified' => $course->timemodified, 'canedit' => $canedit, 'lessonlist' => $lessons,
            'image' => self::image_id($course->id), 'changes' => count($rows),
            'language' => (string)(profile::course_languages([$course->id])[$course->id] ?? ''),
        ];
    }

    public static function get_course_returns(): external_single_structure {
        return new external_single_structure(self::course_structure() + [
            'canedit' => new external_value(PARAM_BOOL, 'The user may edit'),
            'lessonlist' => new external_multiple_structure(self::lesson_structure()),
            'changes' => new external_value(PARAM_INT, 'Unpublished changes (editors; 0 for others)'),
            'language' => new external_value(PARAM_ALPHA, 'Teaching language (ISO 639-1), empty = not said'),
        ]);
    }

    /** One lesson with its items (get_course, preview_lesson). */
    private static function lesson_structure(): external_single_structure {
        $file = new external_single_structure([
            'id' => new external_value(PARAM_INT, 'File id (for local_budu_file_access)'),
            'filename' => new external_value(PARAM_FILE, 'File name'),
            'filesize' => new external_value(PARAM_INT, 'Bytes'),
            'mimetype' => new external_value(PARAM_RAW, 'MIME type'),
        ]);
        $item = new external_single_structure([
            'cmid' => new external_value(PARAM_INT, 'Course module id'),
            'kind' => new external_value(PARAM_ALPHA, 'video | file | text | task'),
            'name' => new external_value(PARAM_TEXT, 'Name'),
            'instructions' => new external_value(PARAM_RAW, 'Task instructions (plain text)'),
            'duedate' => new external_value(PARAM_INT, 'Task due date (0 = none)'),
            'files' => new external_multiple_structure($file),
            'content' => new external_value(PARAM_RAW, 'Text pages: cleaned HTML', VALUE_OPTIONAL),
            'draft' => new external_value(PARAM_ALPHA, 'Editors: new | changed | removed | empty = published as is', VALUE_DEFAULT, ''),
        ]);
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Section id'),
            'name' => new external_value(PARAM_RAW, 'Lesson title (plain text)'),
            'summary' => new external_value(PARAM_RAW, 'Lesson description (plain text)'),
            'items' => new external_multiple_structure($item),
            'draft' => new external_value(PARAM_ALPHA, 'Editors: new | changed | removed | empty = published as is', VALUE_DEFAULT, ''),
        ]);
    }

    // ----- preview_lesson --------------------------------------------------

    public static function preview_lesson_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'A published course'),
        ]);
    }

    /**
     * The free preview (lesson 1) of a published course, for anyone — no user needed. Only its
     * videos, files and text pages; homework needs an account. id 0 = no preview available.
     */
    public static function preview_lesson(int $courseid): array {
        global $DB;
        $p = self::validate_parameters(self::preview_lesson_parameters(), compact('courseid'));
        self::setup();
        $course = $DB->get_record('course', ['id' => $p['courseid']]);
        $section = $course && $course->id != SITEID ? self::preview_section($course) : null;
        if (!$section) {
            return ['id' => 0, 'name' => '', 'summary' => '', 'items' => []];
        }
        $modinfo = get_fast_modinfo($course);
        $items = [];
        foreach ($modinfo->sections[$section->section] ?? [] as $cmid) {
            $cm = $modinfo->get_cm($cmid);
            if (!self::in_preview($course, $cm)) {
                continue;
            }
            $ctx = \context_module::instance($cm->id);
            if ($cm->modname === 'resource') {
                $files = self::files_of($ctx->id, 'mod_resource', 'content');
                $kind = $files && str_starts_with($files[0]['mimetype'], 'video/') ? 'video' : 'file';
                $items[] = ['cmid' => $cm->id, 'kind' => $kind, 'name' => $cm->name, 'instructions' => '', 'duedate' => 0, 'files' => $files];
            } else {
                $content = (string)$DB->get_field('page', 'content', ['id' => $cm->instance]);
                $items[] = ['cmid' => $cm->id, 'kind' => 'text', 'name' => $cm->name, 'instructions' => '', 'duedate' => 0,
                    'files' => [], 'content' => self::clean_html($content)];
            }
        }
        $name = $section->name ?? '';
        $name = $name !== '' ? $name : html_entity_decode(get_section_name($course, $section), ENT_QUOTES);
        return ['id' => (int)$section->id, 'name' => $name, 'summary' => (string)$section->summary, 'items' => $items];
    }

    public static function preview_lesson_returns(): external_single_structure {
        return self::lesson_structure();
    }

    // ----- save_lesson / delete_lesson / move_lesson ---------------------

    public static function save_lesson_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'sectionid' => new external_value(PARAM_INT, 'Lesson to change; 0 = add a new one at the end'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'summary' => new external_value(PARAM_RAW, 'Description (plain text)'),
        ]);
    }

    public static function save_lesson(int $courseid, int $userid, int $sectionid, string $name, string $summary): array {
        $p = self::validate_parameters(self::save_lesson_parameters(), compact('courseid', 'userid', 'sectionid', 'name', 'summary'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $values = ['name' => trim($p['name']), 'summary' => $p['summary']];
        if (!$p['sectionid']) {
            $section = course_create_section($course);
            course_update_section($course, $section, $values + ['summaryformat' => FORMAT_PLAIN]);
            if (drafts::live($course)) {
                // published course: the new lesson stays hidden until "Publish changes"
                set_section_visible($course->id, $section->section, 0);
                drafts::put($course->id, 'section', $section->id, 'add', [], $p['userid']);
            }
            return ['id' => $section->id];
        }
        $section = self::lesson($course, $p['sectionid']);
        if (drafts::live($course) && !drafts::added('section', $section->id)) {
            drafts::put($course->id, 'section', $section->id, 'edit', $values, $p['userid']);
            return ['id' => $section->id];
        }
        course_update_section($course, $section, $values + ['summaryformat' => FORMAT_PLAIN]);
        return ['id' => $section->id];
    }

    public static function save_lesson_returns(): external_single_structure {
        return self::ok();
    }

    public static function delete_lesson_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'sectionid' => new external_value(PARAM_INT, 'Lesson'),
        ]);
    }

    /** Deletes the lesson and everything in it. */
    public static function delete_lesson(int $courseid, int $userid, int $sectionid): array {
        $p = self::validate_parameters(self::delete_lesson_parameters(), compact('courseid', 'userid', 'sectionid'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $section = self::lesson($course, $p['sectionid']);
        if (drafts::live($course) && !drafts::added('section', $section->id)) {
            drafts::put($course->id, 'section', $section->id, 'remove', [], $p['userid']); // removed on "Publish changes"
            return ['id' => $section->id];
        }
        drafts::drop_section($section->id);
        course_delete_section($course, $section, true);
        return ['id' => $section->id];
    }

    public static function delete_lesson_returns(): external_single_structure {
        return self::ok();
    }

    public static function move_lesson_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'sectionid' => new external_value(PARAM_INT, 'Lesson'),
            'direction' => new external_value(PARAM_INT, '-1 = up, 1 = down'),
        ]);
    }

    public static function move_lesson(int $courseid, int $userid, int $sectionid, int $direction): array {
        global $DB;
        $p = self::validate_parameters(self::move_lesson_parameters(), compact('courseid', 'userid', 'sectionid', 'direction'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $section = self::lesson($course, $p['sectionid']);
        $to = $section->section + ($p['direction'] < 0 ? -1 : 1);
        $last = (int)$DB->get_field_sql('SELECT MAX(section) FROM {course_sections} WHERE course = ? AND component IS NULL', [$course->id]);
        if ($to >= 1 && $to <= $last) {
            move_section_to($course, $section->section, $to);
        }
        return ['id' => $section->id];
    }

    public static function move_lesson_returns(): external_single_structure {
        return self::ok();
    }

    // ----- unpublished changes (drafts.php) ---------------------------------

    /**
     * Make every pending change of the course live. Returns the homework that students can see
     * now for the first time (to notify them).
     */
    private static function apply_changes(\stdClass $course): array {
        global $DB;
        $rows = drafts::of_course($course->id);
        $newtasks = [];
        // removals last, so an edit never touches something already gone
        uasort($rows, fn($a, $b) => ($a->action === 'remove') <=> ($b->action === 'remove'));
        foreach ($rows as $row) {
            try {
                self::apply_row($course, $row, $newtasks);
            } catch (\Throwable $e) {
                debugging('local_budu: could not apply change ' . $row->id . ': ' . $e->getMessage(), DEBUG_DEVELOPER);
            }
            drafts::drop($row->kind, (int)$row->objectid);
            get_file_storage()->delete_area_files(\context_course::instance($course->id)->id, 'local_budu', 'taskdraft', $row->objectid);
        }
        rebuild_course_cache($course->id, true);
        return $newtasks;
    }

    private static function apply_row(\stdClass $course, \stdClass $row, array &$newtasks): void {
        global $DB;
        $d = drafts::data($row);
        if ($row->kind === 'section') {
            $section = $DB->get_record('course_sections', ['id' => $row->objectid, 'course' => $course->id]);
            if (!$section) {
                return;
            }
            if ($row->action === 'add') {
                set_section_visible($course->id, $section->section, 1);
                foreach ($DB->get_records('course_modules', ['section' => $section->id, 'deletioninprogress' => 0]) as $cm) {
                    $cm = get_coursemodule_from_id('', $cm->id, $course->id, false, IGNORE_MISSING);
                    if ($cm && $cm->modname === 'assign') {
                        $newtasks[] = ['cmid' => (int)$cm->id, 'name' => $cm->name];
                    }
                }
            } else if ($row->action === 'edit') {
                course_update_section($course, $section, ['name' => $d['name'] ?? $section->name,
                    'summary' => $d['summary'] ?? $section->summary, 'summaryformat' => FORMAT_PLAIN]);
            } else {
                course_delete_section($course, $section, true);
            }
            return;
        }
        $cm = get_coursemodule_from_id('', $row->objectid, $course->id, false, IGNORE_MISSING);
        if (!$cm) {
            return;
        }
        if ($row->action === 'add') {
            set_coursemodule_visible($cm->id, 1);
            if ($cm->modname === 'assign') {
                $newtasks[] = ['cmid' => (int)$cm->id, 'name' => $cm->name];
            }
        } else if ($row->action === 'edit' && $cm->modname === 'page') {
            self::apply_page($course, $cm, $d['name'] ?? $cm->name, self::clean_html($d['content'] ?? ''));
        } else if ($row->action === 'edit' && $cm->modname === 'assign') {
            $draft = 0;
            if (!empty($d['attachment'])) {
                file_prepare_draft_area($draft, \context_course::instance($course->id)->id, 'local_budu', 'taskdraft', $cm->id);
            }
            $assign = $DB->get_record('assign', ['id' => $cm->instance], 'intro, duedate', MUST_EXIST);
            self::apply_task($course, $cm, $d['name'] ?? $cm->name, $d['instructions'] ?? $assign->intro,
                (int)($d['duedate'] ?? $assign->duedate), $draft);
        } else if ($row->action === 'remove') {
            course_delete_module($cm->id);
        }
    }

    /** Throw away one pending change: a new lesson / item is deleted, an edit or removal forgotten. */
    private static function revert_row(\stdClass $course, \stdClass $row): void {
        global $DB;
        if ($row->action === 'add' && $row->kind === 'section') {
            $section = $DB->get_record('course_sections', ['id' => $row->objectid, 'course' => $course->id]);
            if ($section) {
                drafts::drop_section($section->id);
                course_delete_section($course, $section, true);
            }
        } else if ($row->action === 'add') {
            if (get_coursemodule_from_id('', $row->objectid, $course->id, false, IGNORE_MISSING)) {
                course_delete_module($row->objectid);
            }
        }
        drafts::drop($row->kind, (int)$row->objectid);
        get_file_storage()->delete_area_files(\context_course::instance($course->id)->id, 'local_budu', 'taskdraft', $row->objectid);
    }

    public static function publish_changes_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
        ]);
    }

    /** "Publish changes": students now see the edited course. */
    public static function publish_changes(int $courseid, int $userid): array {
        $p = self::validate_parameters(self::publish_changes_parameters(), compact('courseid', 'userid'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        return ['newtasks' => self::apply_changes($course)];
    }

    public static function publish_changes_returns(): external_single_structure {
        return new external_single_structure([
            'newtasks' => new external_multiple_structure(new external_single_structure([
                'cmid' => new external_value(PARAM_INT, 'Homework'),
                'name' => new external_value(PARAM_TEXT, 'Title'),
            ]), 'Homework students see for the first time'),
        ]);
    }

    public static function discard_changes_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'kind' => new external_value(PARAM_ALPHA, 'section | cm — only this one change; empty = all', VALUE_DEFAULT, ''),
            'objectid' => new external_value(PARAM_INT, 'Lesson / item id (with kind)', VALUE_DEFAULT, 0),
        ]);
    }

    /** "Discard changes" (all, or one lesson / item): back to the published version. */
    public static function discard_changes(int $courseid, int $userid, string $kind = '', int $objectid = 0): array {
        $p = self::validate_parameters(self::discard_changes_parameters(), compact('courseid', 'userid', 'kind', 'objectid'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $rows = drafts::of_course($course->id);
        if ($p['kind'] !== '') {
            $rows = array_filter($rows, fn($r) => $r->kind === $p['kind'] && (int)$r->objectid === $p['objectid']);
        }
        foreach ($rows as $row) {
            self::revert_row($course, $row);
        }
        rebuild_course_cache($course->id, true);
        return ['id' => $course->id];
    }

    public static function discard_changes_returns(): external_single_structure {
        return self::ok();
    }

    // ----- add_material --------------------------------------------------

    public static function add_material_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'sectionid' => new external_value(PARAM_INT, 'Lesson'),
            'name' => new external_value(PARAM_TEXT, 'Display name'),
            'draftitemid' => new external_value(PARAM_INT, 'Draft area holding the uploaded file'),
        ]);
    }

    /** A video, PDF or other file in a lesson (mod_resource). */
    public static function add_material(int $courseid, int $userid, int $sectionid, string $name, int $draftitemid): array {
        $p = self::validate_parameters(self::add_material_parameters(), compact('courseid', 'userid', 'sectionid', 'name', 'draftitemid'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $section = self::lesson($course, $p['sectionid']);
        $info = create_module((object)[
            'modulename' => 'resource',
            'course' => $course->id,
            'section' => $section->section,
            'visible' => self::new_item_visible($course, $section),
            'name' => trim($p['name']),
            'introeditor' => self::intro(''),
            'files' => $p['draftitemid'],
            'display' => RESOURCELIB_DISPLAY_AUTO,
            'printintro' => 0,
            'showsize' => 1,
            'showtype' => 1,
        ]);
        self::note_new_item($course, $section, (int)$info->coursemodule, $p['userid']);
        return ['id' => $info->coursemodule];
    }

    public static function add_material_returns(): external_single_structure {
        return self::ok();
    }

    // ----- save_task -----------------------------------------------------

    public static function save_task_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'sectionid' => new external_value(PARAM_INT, 'Lesson (used when adding)'),
            'cmid' => new external_value(PARAM_INT, 'Task to change; 0 = add a new one'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'instructions' => new external_value(PARAM_RAW, 'Instructions (plain text)'),
            'duedate' => new external_value(PARAM_INT, 'Due date (0 = none)'),
            'draftitemid' => new external_value(PARAM_INT, 'Draft area with a new attachment; 0 = keep the current one'),
        ]);
    }

    /** A task (mod_assign) in a lesson: students submit text and/or files; graded 0–100. */
    public static function save_task(int $courseid, int $userid, int $sectionid, int $cmid, string $name, string $instructions,
            int $duedate, int $draftitemid): array {
        $p = self::validate_parameters(self::save_task_parameters(),
            compact('courseid', 'userid', 'sectionid', 'cmid', 'name', 'instructions', 'duedate', 'draftitemid'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);

        if (!$p['cmid']) {
            $section = self::lesson($course, $p['sectionid']);
            $data = (object)['modulename' => 'assign', 'course' => $course->id, 'section' => $section->section,
                'visible' => self::new_item_visible($course, $section)];
            $info = create_module(self::task_settings($data, trim($p['name']), $p['instructions'], $p['duedate'], $p['draftitemid']));
            self::note_new_item($course, $section, (int)$info->coursemodule, $p['userid']);
            return ['id' => $info->coursemodule];
        }

        $cm = self::cm($course, $p['cmid']);
        if ($cm->modname !== 'assign') {
            throw new \moodle_exception('invalidrecord', 'error', '', 'task');
        }
        if (self::drafted($course, $cm)) {
            // published: keep the edit (and a new attachment, in our own file area) until "Publish changes"
            $values = ['name' => trim($p['name']), 'instructions' => $p['instructions'], 'duedate' => $p['duedate']];
            if ($p['draftitemid']) {
                file_save_draft_area_files($p['draftitemid'], \context_course::instance($course->id)->id, 'local_budu', 'taskdraft', $cm->id);
                $values['attachment'] = 1;
            }
            drafts::put($course->id, 'cm', $cm->id, 'edit', $values, $p['userid']);
            return ['id' => $cm->id];
        }
        self::apply_task($course, $cm, trim($p['name']), $p['instructions'], $p['duedate'], $p['draftitemid']);
        return ['id' => $cm->id];
    }

    public static function save_task_returns(): external_single_structure {
        return self::ok();
    }

    // ----- save_page -----------------------------------------------------

    public static function save_page_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'sectionid' => new external_value(PARAM_INT, 'Lesson (used when adding)'),
            'cmid' => new external_value(PARAM_INT, 'Text page to change; 0 = add a new one'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'content' => new external_value(PARAM_RAW, 'HTML from the editor (cleaned here)'),
        ]);
    }

    /** A text page (mod_page) in a lesson: rich text written in Budu's editor. */
    public static function save_page(int $courseid, int $userid, int $sectionid, int $cmid, string $name, string $content): array {
        $p = self::validate_parameters(self::save_page_parameters(), compact('courseid', 'userid', 'sectionid', 'cmid', 'name', 'content'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $html = self::clean_html($p['content']);
        $settings = function (\stdClass $data) use ($p, $html): \stdClass {
            $data->name = trim($p['name']);
            $data->introeditor = self::intro('');
            $data->page = ['text' => $html, 'format' => FORMAT_HTML, 'itemid' => 0];
            // page_add_instance() reads `page` only when given a Moodle form (never, from the API)
            $data->content = $html;
            $data->contentformat = FORMAT_HTML;
            $data->display = RESOURCELIB_DISPLAY_OPEN;
            $data->printintro = 0;
            $data->printlastmodified = 0;
            $data->printheading = 0;
            return $data;
        };
        if (!$p['cmid']) {
            $section = self::lesson($course, $p['sectionid']);
            $data = (object)['modulename' => 'page', 'course' => $course->id, 'section' => $section->section,
                'visible' => self::new_item_visible($course, $section)];
            $cmid = (int)create_module($settings($data))->coursemodule;
            self::note_new_item($course, $section, $cmid, $p['userid']);
            return ['id' => $cmid];
        }
        $cm = self::cm($course, $p['cmid']);
        if ($cm->modname !== 'page') {
            throw new \moodle_exception('invalidrecord', 'error', '', 'text page');
        }
        if (self::drafted($course, $cm)) {
            drafts::put($course->id, 'cm', $cm->id, 'edit', ['name' => trim($p['name']), 'content' => $html], $p['userid']);
            return ['id' => $cm->id];
        }
        [, , , $data] = get_moduleinfo_data($cm, $course);
        update_module($settings($data));
        return ['id' => $cm->id];
    }

    public static function save_page_returns(): external_single_structure {
        return self::ok();
    }

    // ----- set_course_image ------------------------------------------------

    public static function set_course_image_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'draftitemid' => new external_value(PARAM_INT, 'Draft area with the new image; 0 = remove the cover'),
        ]);
    }

    /** Set (or remove) the course's cover image. Only images are kept, one at most. */
    public static function set_course_image(int $courseid, int $userid, int $draftitemid): array {
        $p = self::validate_parameters(self::set_course_image_parameters(), compact('courseid', 'userid', 'draftitemid'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $ctx = \context_course::instance($course->id);
        $fs = get_file_storage();
        $fs->delete_area_files($ctx->id, 'course', 'overviewfiles');
        if ($p['draftitemid']) {
            file_save_draft_area_files($p['draftitemid'], $ctx->id, 'course', 'overviewfiles', 0,
                ['subdirs' => 0, 'maxfiles' => 1, 'accepted_types' => ['.jpg', '.jpeg', '.png', '.webp', '.gif']]);
            foreach ($fs->get_area_files($ctx->id, 'course', 'overviewfiles', 0, 'id', false) as $f) {
                if (!str_starts_with((string)$f->get_mimetype(), 'image/')) {
                    $f->delete(); // never keep anything but an image
                }
            }
        }
        \cache_helper::purge_by_event('changesincourse');
        return ['id' => self::image_id($course->id)];
    }

    public static function set_course_image_returns(): external_single_structure {
        return self::ok();
    }

    // ----- delete_item ---------------------------------------------------

    public static function delete_item_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'cmid' => new external_value(PARAM_INT, 'Material or task'),
        ]);
    }

    public static function delete_item(int $courseid, int $userid, int $cmid): array {
        $p = self::validate_parameters(self::delete_item_parameters(), compact('courseid', 'userid', 'cmid'));
        self::setup();
        $course = self::editable($p['courseid'], $p['userid']);
        $cm = self::cm($course, $p['cmid']);
        if (self::drafted($course, $cm)) {
            drafts::put($course->id, 'cm', $cm->id, 'remove', [], $p['userid']); // removed on "Publish changes"
            return ['id' => $cm->id];
        }
        drafts::drop('cm', $cm->id);
        course_delete_module($cm->id);
        return ['id' => $cm->id];
    }

    public static function delete_item_returns(): external_single_structure {
        return self::ok();
    }

    // ----- file_access ---------------------------------------------------

    public static function file_access_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user'),
            'fileid' => new external_value(PARAM_INT, 'File id from get_course'),
        ]);
    }

    /**
     * May this user open this file? If so, where it is (for webservice/pluginfile.php).
     * Served: lesson materials and task attachments (course viewers), lesson 1's materials of a
     * published course to anyone (the free preview, flagged `preview`), and profile
     * pictures (any user — they appear next to names everywhere).
     */
    public static function file_access(int $userid, int $fileid): array {
        global $DB;
        $p = self::validate_parameters(self::file_access_parameters(), compact('userid', 'fileid'));
        self::setup();
        $no = ['allowed' => false, 'path' => '', 'filename' => '', 'filesize' => 0, 'mimetype' => ''];

        $file = get_file_storage()->get_file_by_id($p['fileid']);
        if (!$file || $file->is_directory()) {
            return $no;
        }
        $area = $file->get_component() . '/' . $file->get_filearea();
        if ($area === 'user/icon' && preg_match('/^f[123]\./', $file->get_filename())) {
            if (!\core_user::get_user($p['userid'])) {
                return $no;
            }
            // user/icon URLs: /{usercontext}/user/icon/{theme}/f1 (Moodle picks the stored extension)
            $path = '/' . $file->get_contextid() . '/user/icon/boost/' . pathinfo($file->get_filename(), PATHINFO_FILENAME);
            return ['allowed' => true, 'path' => $path] + self::file_info($file);
        }
        if ($area === 'course/overviewfiles') {
            // A course cover: public once the course is published (the marketplace shows it to
            // visitors, userid 0); a draft's cover only to its teachers.
            $ctx = \context::instance_by_id($file->get_contextid(), IGNORE_MISSING);
            if (!$ctx || $ctx->contextlevel != CONTEXT_COURSE || !str_starts_with((string)$file->get_mimetype(), 'image/')) {
                return $no;
            }
            $course = get_course($ctx->instanceid);
            if (!$course->visible && !($p['userid'] && has_capability('moodle/course:manageactivities', $ctx, $p['userid']))) {
                return $no;
            }
            $path = '/' . $ctx->id . '/course/overviewfiles' . $file->get_filepath() . $file->get_filename();
            return ['allowed' => true, 'path' => $path] + self::file_info($file);
        }
        if ($area === 'local_budu/schoolpage') {
            // A photo on a school's public page — public by design (anyone, visitors too).
            $path = '/' . $file->get_contextid() . '/local_budu/schoolpage/' . $file->get_itemid() . $file->get_filepath() . $file->get_filename();
            return ['allowed' => true, 'path' => $path] + self::file_info($file);
        }
        if ($area === 'assignsubmission_file/submission_files') {
            // A homework answer: its author, or someone who grades in that course.
            $ctx = \context::instance_by_id($file->get_contextid(), IGNORE_MISSING);
            $owner = $DB->get_field('assign_submission', 'userid', ['id' => $file->get_itemid()]);
            if (!$ctx || !$owner || ($owner != $p['userid'] && !has_capability('mod/assign:grade', $ctx, $p['userid']))) {
                return $no;
            }
            $path = '/' . $file->get_contextid() . '/assignsubmission_file/submission_files/' . $file->get_itemid()
                . $file->get_filepath() . $file->get_filename();
            return ['allowed' => true, 'path' => $path] + self::file_info($file);
        }
        if (!in_array($area, ['mod_resource/content', 'mod_assign/introattachment'])) {
            return $no;
        }
        $ctx = \context::instance_by_id($file->get_contextid(), IGNORE_MISSING);
        if (!$ctx || $ctx->contextlevel != CONTEXT_MODULE) {
            return $no;
        }
        $cm = get_coursemodule_from_id('', $ctx->instanceid, 0, false, IGNORE_MISSING);
        if (!$cm) {
            return $no;
        }
        $course = get_course($cm->course);
        // not in the course (a visitor, or not enrolled): only the free preview — lesson 1's materials
        $preview = !self::can_view($course, $p['userid']);
        if ($preview && ($area !== 'mod_resource/content' || !self::in_preview($course, $cm))) {
            return $no;
        }
        $editor = !$preview && has_capability('moodle/course:manageactivities', \context_course::instance($course->id), $p['userid']);
        if (!$preview && !$editor && !get_fast_modinfo($course, $p['userid'])->get_cm($cm->id)->uservisible) {
            return $no;
        }

        // mod_resource URLs carry a revision number in place of the itemid; any value works.
        $itemid = $file->get_component() === 'mod_resource' ? 1 : $file->get_itemid();
        $path = '/' . $file->get_contextid() . '/' . $file->get_component() . '/' . $file->get_filearea() . '/' . $itemid
            . $file->get_filepath() . $file->get_filename();
        // preview files: the frontend also checks the course is in the marketplace
        return ['allowed' => true, 'path' => $path, 'courseid' => (int)$course->id, 'preview' => $preview] + self::file_info($file);
    }

    public static function file_access_returns(): external_single_structure {
        return new external_single_structure([
            'allowed' => new external_value(PARAM_BOOL, 'The user may open it'),
            'path' => new external_value(PARAM_RAW, 'Path for webservice/pluginfile.php'),
            'id' => new external_value(PARAM_INT, 'File id', VALUE_OPTIONAL),
            'filename' => new external_value(PARAM_RAW, 'File name'),
            'filesize' => new external_value(PARAM_INT, 'Bytes'),
            'mimetype' => new external_value(PARAM_RAW, 'MIME type'),
            'courseid' => new external_value(PARAM_INT, 'Course of a lesson material', VALUE_OPTIONAL),
            'preview' => new external_value(PARAM_BOOL, 'Allowed only as the course’s free preview (lesson 1)', VALUE_OPTIONAL),
        ]);
    }
}
