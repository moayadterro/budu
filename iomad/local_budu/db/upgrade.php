<?php
defined('MOODLE_INTERNAL') || die();

/** Upgrade steps for local_budu (new installs get db/install.xml). */
function xmldb_local_budu_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2026102500) {
        // Teachers who manage a school class (cohort).
        $table = new xmldb_table('local_budu_class_teacher');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('cohortid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('cohort', XMLDB_KEY_FOREIGN, ['cohortid'], 'cohort', ['id']);
        $table->add_key('user', XMLDB_KEY_FOREIGN, ['userid'], 'user', ['id']);
        $table->add_index('cohort_user', XMLDB_INDEX_UNIQUE, ['cohortid', 'userid']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }
        upgrade_plugin_savepoint(true, 2026102500, 'local', 'budu');
    }
    return true;
}
