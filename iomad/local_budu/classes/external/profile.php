<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Data that belongs to IOMAD's own records (so the website AND the future mobile API read one
 * source): users' Budu preferences (Moodle user preferences), schools' name / city (the IOMAD
 * company), course completion (Moodle's course_completions) and a course's teaching language (a
 * course custom field, shortname budu_language).
 */
class profile extends external_api {

    /** Budu preferences we keep per user, with the values allowed. */
    const PREFS = [
        'budu_locale' => '/^(en|ru|ar)$/',
        'budu_currency' => '/^[A-Z]{3}$/',
        'budu_parent_skipped' => '/^1$/',
    ];

    private static function setup(): void {
        self::validate_context(\context_system::instance());
    }

    // ----- preferences -------------------------------------------------------

    public static function get_prefs_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userids' => new external_multiple_structure(new external_value(PARAM_INT, 'User')),
        ]);
    }

    /** Budu preferences of these users (missing = not set). */
    public static function get_prefs(array $userids): array {
        global $DB;
        $p = self::validate_parameters(self::get_prefs_parameters(), compact('userids'));
        self::setup();
        $ids = array_values(array_unique(array_filter(array_map('intval', $p['userids']))));
        if (!$ids) {
            return [];
        }
        [$in, $params] = $DB->get_in_or_equal($ids);
        [$names, $nparams] = $DB->get_in_or_equal(array_keys(self::PREFS));
        $out = [];
        foreach ($ids as $id) {
            $out[$id] = ['userid' => $id, 'locale' => '', 'currency' => '', 'parentskipped' => false];
        }
        foreach ($DB->get_records_select('user_preferences', "userid $in AND name $names", array_merge($params, $nparams), '', 'id, userid, name, value') as $r) {
            $key = ['budu_locale' => 'locale', 'budu_currency' => 'currency', 'budu_parent_skipped' => 'parentskipped'][$r->name];
            $out[$r->userid][$key] = $key === 'parentskipped' ? $r->value === '1' : $r->value;
        }
        return array_values($out);
    }

    public static function get_prefs_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'userid' => new external_value(PARAM_INT, 'User'),
            'locale' => new external_value(PARAM_ALPHA, 'UI language (en / ru / ar), empty = not chosen'),
            'currency' => new external_value(PARAM_ALPHA, 'Price currency (ISO 4217), empty = default'),
            'parentskipped' => new external_value(PARAM_BOOL, 'Skipped the "add your parent" step'),
        ]));
    }

    public static function set_pref_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User (the signed-in user — the frontend checks the session)'),
            'name' => new external_value(PARAM_ALPHAEXT, 'budu_locale | budu_currency | budu_parent_skipped'),
            'value' => new external_value(PARAM_RAW, 'New value'),
        ]);
    }

    public static function set_pref(int $userid, string $name, string $value): array {
        global $DB;
        $p = self::validate_parameters(self::set_pref_parameters(), compact('userid', 'name', 'value'));
        self::setup();
        if (!isset(self::PREFS[$p['name']]) || !preg_match(self::PREFS[$p['name']], $p['value'])
                || !$DB->record_exists('user', ['id' => $p['userid'], 'deleted' => 0])) {
            throw new \invalid_parameter_exception('preference');
        }
        set_user_preference($p['name'], $p['value'], $p['userid']);
        return ['id' => $p['userid']];
    }

    public static function set_pref_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'User')]);
    }

    // ----- schools (IOMAD companies) ------------------------------------------

    public static function schools_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyids' => new external_multiple_structure(new external_value(PARAM_INT, 'Company')),
        ]);
    }

    /** Name, city and country of these schools — straight from the IOMAD company. */
    public static function schools(array $companyids): array {
        global $DB;
        $p = self::validate_parameters(self::schools_parameters(), compact('companyids'));
        self::setup();
        $ids = array_values(array_unique(array_filter(array_map('intval', $p['companyids']))));
        if (!$ids) {
            return [];
        }
        [$in, $params] = $DB->get_in_or_equal($ids);
        return array_values(array_map(fn($c) => ['id' => (int)$c->id, 'name' => $c->name, 'city' => (string)$c->city,
            'country' => (string)$c->country, 'logo' => self::logo_file_id((int)$c->id)],
            $DB->get_records_select('company', "id $in", $params, '', 'id, name, city, country')));
    }

    /** The school's logo — IOMAD's own company logo (system context, core_admin/logo<companyid>); 0 = none. */
    public static function logo_file_id(int $companyid): int {
        foreach (get_file_storage()->get_area_files(\context_system::instance()->id, 'core_admin', 'logo' . $companyid, 0, 'id', false) as $f) {
            return (int)$f->get_id();
        }
        return 0;
    }

    public static function set_school_logo_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'draftitemid' => new external_value(PARAM_INT, 'Draft area with the new logo; 0 = remove the logo'),
        ]);
    }

    /** Set (or remove) the school's logo — the same place IOMAD's company settings use. */
    public static function set_school_logo(int $companyid, int $userid, int $draftitemid): array {
        $p = self::validate_parameters(self::set_school_logo_parameters(), compact('companyid', 'userid', 'draftitemid'));
        self::setup();
        if (!school::is_manager($p['companyid'], $p['userid'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'edit this school');
        }
        $ctx = \context_system::instance();
        $area = 'logo' . $p['companyid'];
        $fs = get_file_storage();
        if (!$p['draftitemid']) {
            $fs->delete_area_files($ctx->id, 'core_admin', $area);
            set_config($area, '', 'core_admin');
            return ['id' => 0];
        }
        file_save_draft_area_files($p['draftitemid'], $ctx->id, 'core_admin', $area, 0, ['subdirs' => 0, 'maxfiles' => 1]);
        $files = $fs->get_area_files($ctx->id, 'core_admin', $area, 0, 'id', false);
        $file = reset($files);
        if (!$file || !in_array($file->get_mimetype(), ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true)) {
            $fs->delete_area_files($ctx->id, 'core_admin', $area);
            set_config($area, '', 'core_admin');
            throw new \moodle_exception('invalidfiletype', 'error');
        }
        set_config($area, $file->get_filepath() . $file->get_filename(), 'core_admin'); // IOMAD's themes read this
        theme_reset_all_caches();
        return ['id' => (int)$file->get_id()];
    }

    public static function set_school_logo_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Logo file id (0 = removed)')]);
    }

    public static function schools_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Company'),
            'name' => new external_value(PARAM_TEXT, 'Name'),
            'city' => new external_value(PARAM_TEXT, 'City'),
            'country' => new external_value(PARAM_ALPHA, 'Country (ISO 3166-1)'),
            'logo' => new external_value(PARAM_INT, 'Logo file id (served by /files), 0 = none'),
        ]));
    }

    public static function set_school_city_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'city' => new external_value(PARAM_TEXT, 'City'),
            'country' => new external_value(PARAM_ALPHA, 'ISO 3166 code ("RU"); empty = leave as it is', VALUE_DEFAULT, ''),
        ]);
    }

    /** The school's city and country (the IOMAD company's own fields). */
    public static function set_school_city(int $companyid, int $userid, string $city, string $country = ''): array {
        global $DB;
        $p = self::validate_parameters(self::set_school_city_parameters(), compact('companyid', 'userid', 'city', 'country'));
        self::setup();
        if (!school::is_manager($p['companyid'], $p['userid'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'edit this school');
        }
        $DB->set_field('company', 'city', \core_text::substr(trim($p['city']), 0, 120), ['id' => $p['companyid']]);
        $country = strtoupper($p['country']);
        if ($country !== '') {
            if (!array_key_exists($country, get_string_manager()->get_list_of_countries())) {
                throw new \invalid_parameter_exception('unknown country');
            }
            $DB->set_field('company', 'country', $country, ['id' => $p['companyid']]);
        }
        return ['id' => $p['companyid']];
    }

    public static function set_school_city_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Company')]);
    }

    // ----- course completion ---------------------------------------------------

    public static function complete_course_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'The student who reached its end'),
        ]);
    }

    /** Mark the course completed for a student enrolled in it (idempotent). */
    public static function complete_course(int $courseid, int $userid): array {
        global $CFG;
        require_once($CFG->dirroot . '/completion/completion_completion.php');
        $p = self::validate_parameters(self::complete_course_parameters(), compact('courseid', 'userid'));
        self::setup();
        $course = get_course($p['courseid']);
        if (!$course->visible || !is_enrolled(\context_course::instance($course->id), $p['userid'], '', true)) {
            throw new \moodle_exception('nopermissions', 'error', '', 'complete this course');
        }
        $cc = new \completion_completion(['userid' => $p['userid'], 'course' => $course->id]);
        if (!$cc->is_complete()) {
            $cc->mark_complete();
        }
        return ['completed' => true];
    }

    public static function complete_course_returns(): external_single_structure {
        return new external_single_structure(['completed' => new external_value(PARAM_BOOL, 'Completed')]);
    }

    public static function completed_courses_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Student'),
            'courseids' => new external_multiple_structure(new external_value(PARAM_INT, 'Course'), 'Only these (empty = all)', VALUE_DEFAULT, []),
        ]);
    }

    /** Which courses this student has completed (and when). */
    public static function completed_courses(int $userid, array $courseids = []): array {
        global $DB;
        $p = self::validate_parameters(self::completed_courses_parameters(), compact('userid', 'courseids'));
        self::setup();
        $where = 'userid = ? AND timecompleted IS NOT NULL';
        $params = [$p['userid']];
        if ($p['courseids']) {
            [$in, $cp] = $DB->get_in_or_equal(array_map('intval', $p['courseids']));
            $where .= " AND course $in";
            $params = array_merge($params, $cp);
        }
        return array_values(array_map(fn($r) => ['courseid' => (int)$r->course, 'timecompleted' => (int)$r->timecompleted],
            $DB->get_records_select('course_completions', $where, $params, '', 'id, course, timecompleted')));
    }

    public static function completed_courses_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'timecompleted' => new external_value(PARAM_INT, 'When'),
        ]));
    }

    // ----- course teaching language (custom field budu_language) ------------------

    /** The budu_language course custom field (created on first use). */
    public static function language_field_id(): int {
        return self::text_field_id('budu_language', 'Teaching language');
    }

    /** The budu_subject course custom field: what the course is about, a key like "math" (created on first use). */
    public static function subject_field_id(): int {
        return self::text_field_id('budu_subject', 'Subject');
    }

    /** A short text course custom field in the "Budu" category (created on first use). */
    private static function text_field_id(string $shortname, string $name): int {
        global $DB;
        $id = (int)$DB->get_field('customfield_field', 'id', ['shortname' => $shortname]);
        if ($id) {
            return $id;
        }
        $handler = \core_course\customfield\course_handler::create();
        $catid = (int)$DB->get_field('customfield_category', 'id', ['component' => 'core_course', 'area' => 'course', 'name' => 'Budu'])
            ?: $handler->create_category('Budu');
        $category = \core_customfield\category_controller::create($catid);
        $field = \core_customfield\field_controller::create(0, (object)['type' => 'text'], $category);
        $handler->save_field_configuration($field, (object)[
            'name' => $name, 'shortname' => $shortname, 'description' => '', 'descriptionformat' => FORMAT_PLAIN,
            'configdata' => ['required' => 0, 'uniquevalues' => 0, 'locked' => 0, 'visibility' => 2, 'defaultvalue' => '',
                'displaysize' => 20, 'maxlength' => 30, 'ispassword' => 0, 'link' => '', 'linktarget' => ''],
        ]);
        return (int)$field->get('id');
    }

    /** Teaching language of these courses (courseid => code). */
    public static function course_languages(array $courseids): array {
        return self::field_values(self::language_field_id(), $courseids);
    }

    /** Subject of these courses (courseid => key). */
    public static function course_subjects(array $courseids): array {
        return self::field_values(self::subject_field_id(), $courseids);
    }

    /** One custom field's values for these courses (courseid => value). */
    private static function field_values(int $fieldid, array $courseids): array {
        global $DB;
        if (!$courseids) {
            return [];
        }
        [$in, $params] = $DB->get_in_or_equal(array_map('intval', $courseids));
        return $DB->get_records_select_menu('customfield_data', "fieldid = ? AND instanceid $in", array_merge([$fieldid], $params), '', 'instanceid, value');
    }

    public static function set_course_language_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (may edit the course)'),
            'language' => new external_value(PARAM_ALPHA, 'ISO 639-1 code, empty = not said'),
        ]);
    }

    public static function set_course_language(int $courseid, int $userid, string $language): array {
        $p = self::validate_parameters(self::set_course_language_parameters(), compact('courseid', 'userid', 'language'));
        self::setup();
        if (!has_capability('moodle/course:manageactivities', \context_course::instance($p['courseid']), $p['userid'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'edit this course');
        }
        self::language_field_id();
        $handler = \core_course\customfield\course_handler::create();
        $handler->instance_form_save((object)['id' => $p['courseid'], 'customfield_budu_language' => \core_text::strtolower(substr($p['language'], 0, 5))]);
        return ['id' => $p['courseid']];
    }

    public static function set_course_language_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Course')]);
    }

    public static function set_course_subject_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (may edit the course)'),
            'subject' => new external_value(PARAM_ALPHANUMEXT, 'Subject key (e.g. math), empty = not said'),
        ]);
    }

    /** What the course is about (a key from the frontend's subject list; the frontend checks it). */
    public static function set_course_subject(int $courseid, int $userid, string $subject): array {
        $p = self::validate_parameters(self::set_course_subject_parameters(), compact('courseid', 'userid', 'subject'));
        self::setup();
        if (!has_capability('moodle/course:manageactivities', \context_course::instance($p['courseid']), $p['userid'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'edit this course');
        }
        self::subject_field_id();
        $handler = \core_course\customfield\course_handler::create();
        $handler->instance_form_save((object)['id' => $p['courseid'], 'customfield_budu_subject' => \core_text::strtolower(substr($p['subject'], 0, 30))]);
        return ['id' => $p['courseid']];
    }

    public static function set_course_subject_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Course')]);
    }
}
