<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Course builder for Budu teachers: courses (IOMAD company courses), lessons
 * (course sections), materials (mod_resource: video / PDF / any file) and tasks
 * (mod_assign, graded 0–100).
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

    private static function cm(\stdClass $course, int $cmid): \stdClass {
        $cm = get_coursemodule_from_id('', $cmid, $course->id, false, MUST_EXIST);
        if (!in_array($cm->modname, ['resource', 'assign'])) {
            throw new \moodle_exception('invalidrecord', 'error', '', 'item');
        }
        return $cm;
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
        ];
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
            if (has_capability('moodle/course:manageactivities', \context_course::instance($c->id), $p['userid'])) {
                $out[] = ['id' => $c->id, 'fullname' => $c->fullname, 'summary' => $c->summary, 'visible' => (bool)$c->visible,
                    'lessons' => self::lesson_count($c->id), 'timemodified' => $c->timemodified];
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

        $lessons = [];
        foreach ($modinfo->get_section_info_all() as $section) {
            if ($section->section == 0 || $section->component || (!$canedit && !$section->uservisible)) {
                continue;
            }
            $items = [];
            foreach ($modinfo->sections[$section->section] ?? [] as $cmid) {
                $cm = $modinfo->get_cm($cmid);
                if ($cm->deletioninprogress || !in_array($cm->modname, ['resource', 'assign']) || (!$canedit && !$cm->uservisible)) {
                    continue;
                }
                $ctx = \context_module::instance($cm->id);
                if ($cm->modname === 'resource') {
                    $files = self::files_of($ctx->id, 'mod_resource', 'content');
                    $kind = $files && str_starts_with($files[0]['mimetype'], 'video/') ? 'video' : 'file';
                    $items[] = ['cmid' => $cm->id, 'kind' => $kind, 'name' => $cm->name, 'instructions' => '', 'duedate' => 0, 'files' => $files];
                } else {
                    $assign = $DB->get_record('assign', ['id' => $cm->instance], 'intro, duedate', MUST_EXIST);
                    $items[] = ['cmid' => $cm->id, 'kind' => 'task', 'name' => $cm->name, 'instructions' => $assign->intro,
                        'duedate' => (int)$assign->duedate, 'files' => self::files_of($ctx->id, 'mod_assign', 'introattachment')];
                }
            }
            // Raw name: get_section_name() returns HTML-escaped text; the frontend escapes on output itself.
            $name = $section->name ?? '';
            $name = $name !== '' ? $name : html_entity_decode(get_section_name($course, $section), ENT_QUOTES);
            $lessons[] = ['id' => $section->id, 'name' => $name, 'summary' => (string)$section->summary, 'items' => $items];
        }

        return [
            'id' => $course->id, 'fullname' => $course->fullname, 'summary' => $course->summary, 'visible' => (bool)$course->visible,
            'lessons' => count($lessons), 'timemodified' => $course->timemodified, 'canedit' => $canedit, 'lessonlist' => $lessons,
        ];
    }

    public static function get_course_returns(): external_single_structure {
        $file = new external_single_structure([
            'id' => new external_value(PARAM_INT, 'File id (for local_budu_file_access)'),
            'filename' => new external_value(PARAM_FILE, 'File name'),
            'filesize' => new external_value(PARAM_INT, 'Bytes'),
            'mimetype' => new external_value(PARAM_RAW, 'MIME type'),
        ]);
        $item = new external_single_structure([
            'cmid' => new external_value(PARAM_INT, 'Course module id'),
            'kind' => new external_value(PARAM_ALPHA, 'video | file | task'),
            'name' => new external_value(PARAM_TEXT, 'Name'),
            'instructions' => new external_value(PARAM_RAW, 'Task instructions (plain text)'),
            'duedate' => new external_value(PARAM_INT, 'Task due date (0 = none)'),
            'files' => new external_multiple_structure($file),
        ]);
        $lesson = new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Section id'),
            'name' => new external_value(PARAM_RAW, 'Lesson title (plain text)'),
            'summary' => new external_value(PARAM_RAW, 'Lesson description (plain text)'),
            'items' => new external_multiple_structure($item),
        ]);
        return new external_single_structure(self::course_structure() + [
            'canedit' => new external_value(PARAM_BOOL, 'The user may edit'),
            'lessonlist' => new external_multiple_structure($lesson),
        ]);
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
        $section = $p['sectionid'] ? self::lesson($course, $p['sectionid']) : course_create_section($course);
        course_update_section($course, $section, ['name' => trim($p['name']), 'summary' => $p['summary'], 'summaryformat' => FORMAT_PLAIN]);
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
            'visible' => 1,
            'name' => trim($p['name']),
            'introeditor' => self::intro(''),
            'files' => $p['draftitemid'],
            'display' => RESOURCELIB_DISPLAY_AUTO,
            'printintro' => 0,
            'showsize' => 1,
            'showtype' => 1,
        ]);
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
            $data = (object)['modulename' => 'assign', 'course' => $course->id, 'section' => $section->section, 'visible' => 1];
            $info = create_module(self::task_settings($data, trim($p['name']), $p['instructions'], $p['duedate'], $p['draftitemid']));
            return ['id' => $info->coursemodule];
        }

        $cm = self::cm($course, $p['cmid']);
        if ($cm->modname !== 'assign') {
            throw new \moodle_exception('invalidrecord', 'error', '', 'task');
        }
        [, , , $data] = get_moduleinfo_data($cm, $course);
        $draft = $p['draftitemid'];
        if (!$draft) {
            // Keep the current attachment: copy it into a fresh draft area for the update.
            file_prepare_draft_area($draft, \context_module::instance($cm->id)->id, 'mod_assign', 'introattachment', 0);
        }
        update_module(self::task_settings($data, trim($p['name']), $p['instructions'], $p['duedate'], $draft));
        return ['id' => $cm->id];
    }

    public static function save_task_returns(): external_single_structure {
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
     * May this user open this lesson file? If so, where it is (for webservice/pluginfile.php).
     * Only lesson materials and task attachments are served.
     */
    public static function file_access(int $userid, int $fileid): array {
        $p = self::validate_parameters(self::file_access_parameters(), compact('userid', 'fileid'));
        self::setup();
        $no = ['allowed' => false, 'path' => '', 'filename' => '', 'filesize' => 0, 'mimetype' => ''];

        $file = get_file_storage()->get_file_by_id($p['fileid']);
        if (!$file || $file->is_directory()) {
            return $no;
        }
        $area = $file->get_component() . '/' . $file->get_filearea();
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
        if (!self::can_view($course, $p['userid'])) {
            return $no;
        }
        $editor = has_capability('moodle/course:manageactivities', \context_course::instance($course->id), $p['userid']);
        if (!$editor && !get_fast_modinfo($course, $p['userid'])->get_cm($cm->id)->uservisible) {
            return $no;
        }

        // mod_resource URLs carry a revision number in place of the itemid; any value works.
        $itemid = $file->get_component() === 'mod_resource' ? 1 : $file->get_itemid();
        $path = '/' . $file->get_contextid() . '/' . $file->get_component() . '/' . $file->get_filearea() . '/' . $itemid
            . $file->get_filepath() . $file->get_filename();
        return ['allowed' => true, 'path' => $path] + self::file_info($file);
    }

    public static function file_access_returns(): external_single_structure {
        return new external_single_structure([
            'allowed' => new external_value(PARAM_BOOL, 'The user may open it'),
            'path' => new external_value(PARAM_RAW, 'Path for webservice/pluginfile.php'),
            'id' => new external_value(PARAM_INT, 'File id', VALUE_OPTIONAL),
            'filename' => new external_value(PARAM_RAW, 'File name'),
            'filesize' => new external_value(PARAM_INT, 'Bytes'),
            'mimetype' => new external_value(PARAM_RAW, 'MIME type'),
        ]);
    }
}
