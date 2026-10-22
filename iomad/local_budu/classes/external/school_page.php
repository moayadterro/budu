<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * Photos for a school's public page (cover, gallery, news, spotlight). Stored in the school's category
 * context, file area local_budu/schoolpage, one file per item; public by design (file_access lets
 * anyone open them). Only the school's managers add them.
 */
class school_page extends external_api {

    public static function save_school_photo_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School (IOMAD company)'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'draftitemid' => new external_value(PARAM_INT, 'Draft area holding the uploaded image'),
        ]);
    }

    /** Keep an uploaded image for the school's page; returns its file id (served by /files). */
    public static function save_school_photo(int $companyid, int $userid, int $draftitemid): array {
        global $DB;
        $p = self::validate_parameters(self::save_school_photo_parameters(), compact('companyid', 'userid', 'draftitemid'));
        self::validate_context(\context_system::instance());
        if (!school::is_manager($p['companyid'], $p['userid'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'edit this school’s page');
        }
        $category = (int)$DB->get_field('company', 'category', ['id' => $p['companyid']], MUST_EXIST);
        $ctx = \context_coursecat::instance($category);
        $itemid = (int)(time() % 100000000) * 10 + random_int(0, 9);
        file_save_draft_area_files($p['draftitemid'], $ctx->id, 'local_budu', 'schoolpage', $itemid, ['subdirs' => 0, 'maxfiles' => 1]);
        $files = get_file_storage()->get_area_files($ctx->id, 'local_budu', 'schoolpage', $itemid, 'id', false);
        $file = reset($files);
        if (!$file || !in_array($file->get_mimetype(), ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], true)) {
            get_file_storage()->delete_area_files($ctx->id, 'local_budu', 'schoolpage', $itemid);
            throw new \moodle_exception('invalidfiletype', 'error');
        }
        return ['id' => (int)$file->get_id()];
    }

    public static function save_school_photo_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'File id')]);
    }

    public static function member_photo_parameters(): external_function_parameters {
        return new external_function_parameters([
            'companyid' => new external_value(PARAM_INT, 'School (IOMAD company)'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (manager)'),
            'memberid' => new external_value(PARAM_INT, 'The school member to feature'),
        ]);
    }

    /**
     * A member's profile picture copied onto the school's page (a manager features them, e.g. among
     * the top students). Profile pictures are for signed-in users only, the page is public — so it is
     * a copy, made when the manager saves. Returns its file id, 0 = the member has no picture.
     */
    public static function member_photo(int $companyid, int $userid, int $memberid): array {
        global $DB;
        $p = self::validate_parameters(self::member_photo_parameters(), compact('companyid', 'userid', 'memberid'));
        self::validate_context(\context_system::instance());
        if (!school::is_manager($p['companyid'], $p['userid'])) {
            throw new \moodle_exception('nopermissions', 'error', '', 'edit this school’s page');
        }
        if (!$DB->record_exists('company_users', ['companyid' => $p['companyid'], 'userid' => $p['memberid']])) {
            return ['id' => 0];
        }
        $user = \core_user::get_user($p['memberid']);
        if (!$user || $user->deleted || !$user->picture) {
            return ['id' => 0];
        }
        $fs = get_file_storage();
        $usercontext = \context_user::instance($user->id, IGNORE_MISSING);
        $source = null;
        foreach ($usercontext ? $fs->get_area_files($usercontext->id, 'user', 'icon', 0, 'id', false) : [] as $f) {
            if (preg_match('/^f3\./', $f->get_filename())) {
                $source = $f;
            }
        }
        if (!$source) {
            return ['id' => 0];
        }
        $category = (int)$DB->get_field('company', 'category', ['id' => $p['companyid']], MUST_EXIST);
        $ctx = \context_coursecat::instance($category);
        $itemid = (int)(time() % 100000000) * 10 + random_int(0, 9);
        $copy = $fs->create_file_from_storedfile([
            'contextid' => $ctx->id, 'component' => 'local_budu', 'filearea' => 'schoolpage',
            'itemid' => $itemid, 'filepath' => '/', 'filename' => $source->get_filename(),
        ], $source);
        return ['id' => (int)$copy->get_id()];
    }

    public static function member_photo_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'File id, 0 = no picture')]);
    }
}
