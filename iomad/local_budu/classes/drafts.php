<?php
namespace local_budu;

defined('MOODLE_INTERNAL') || die();

/**
 * Unpublished changes of a PUBLISHED course. Students keep the last published version while the
 * teacher edits: new lessons / items are created hidden (action 'add'), edits of live ones are kept
 * here as data (action 'edit'), deletions are only marked (action 'remove'). "Publish changes"
 * applies them all at once; "Discard" drops them. A draft (hidden) course is edited directly.
 * One row per object: kind 'section' (a lesson) or 'cm' (an item), objectid = its id.
 */
class drafts {

    const TABLE = 'local_budu_draft';

    /** Do edits of this course go into drafts (it is published, students see it)? */
    public static function live(\stdClass $course): bool {
        return (bool)$course->visible && !\local_budu\external\school_exams::is_exam_space($course);
    }

    public static function get(string $kind, int $objectid): ?\stdClass {
        global $DB;
        $row = $DB->get_record(self::TABLE, ['kind' => $kind, 'objectid' => $objectid]);
        return $row ?: null;
    }

    /** Was this object created as a draft (hidden until published)? */
    public static function added(string $kind, int $objectid): bool {
        return self::get($kind, $objectid)?->action === 'add';
    }

    /** Record a change (one row per object; a newer edit merges into the older one). */
    public static function put(int $courseid, string $kind, int $objectid, string $action, array $data, int $userid): void {
        global $DB;
        $row = self::get($kind, $objectid);
        $now = time();
        if ($row) {
            $old = $row->action === 'edit' && $action === 'edit' ? (json_decode((string)$row->data, true) ?: []) : [];
            $row->action = $row->action === 'add' ? 'add' : $action; // still new: stays an "add"
            $row->data = json_encode($data + $old);
            $row->userid = $userid;
            $row->timemodified = $now;
            $DB->update_record(self::TABLE, $row);
            return;
        }
        $DB->insert_record(self::TABLE, (object)['courseid' => $courseid, 'kind' => $kind, 'objectid' => $objectid,
            'action' => $action, 'data' => json_encode($data), 'userid' => $userid, 'timemodified' => $now]);
    }

    public static function drop(string $kind, int $objectid): void {
        global $DB;
        $DB->delete_records(self::TABLE, ['kind' => $kind, 'objectid' => $objectid]);
    }

    /** A lesson is gone: forget its changes and its items' changes. */
    public static function drop_section(int $sectionid): void {
        global $DB;
        self::drop('section', $sectionid);
        foreach ($DB->get_fieldset_select('course_modules', 'id', 'section = ?', [$sectionid]) as $cmid) {
            self::drop('cm', (int)$cmid);
        }
    }

    /** All changes of a course, keyed "kind:objectid". */
    public static function of_course(int $courseid): array {
        global $DB;
        $out = [];
        foreach ($DB->get_records(self::TABLE, ['courseid' => $courseid], 'id') as $row) {
            $out[$row->kind . ':' . $row->objectid] = $row;
        }
        return $out;
    }

    public static function data(\stdClass $row): array {
        return json_decode((string)$row->data, true) ?: [];
    }

    /** 'new' | 'changed' | 'removed' for the UI. */
    public static function state(?\stdClass $row): string {
        return match ($row?->action) { 'add' => 'new', 'edit' => 'changed', 'remove' => 'removed', default => '' };
    }
}
