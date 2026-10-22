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
}
