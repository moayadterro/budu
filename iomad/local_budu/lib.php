<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Serves local_budu's own files (webservice/pluginfile.php → here). Only `schoolpage`: photos a school
 * puts on its public page (/schools/<slug>), stored in the school's category context. The Budu
 * frontend already asked local_budu_file_access before fetching.
 */
function local_budu_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = []) {
    if ($filearea !== 'schoolpage' || $context->contextlevel != CONTEXT_COURSECAT) {
        return false;
    }
    $itemid = (int)array_shift($args);
    $filename = array_pop($args);
    $filepath = $args ? '/' . implode('/', $args) . '/' : '/';
    $file = get_file_storage()->get_file($context->id, 'local_budu', 'schoolpage', $itemid, $filepath, $filename);
    if (!$file || $file->is_directory()) {
        return false;
    }
    send_stored_file($file, DAYSECS, 0, $forcedownload, $options);
}
