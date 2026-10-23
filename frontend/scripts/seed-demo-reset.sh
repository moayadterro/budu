#!/bin/sh
# Removes EVERYTHING made by scripts/seed-demo.mjs (people with @demo.budu.test addresses, the
# companies they manage — schools and solo teachers — with their classes, and the matching app-db
# rows). Nothing else is touched. Run from the repo root:  sh frontend/scripts/seed-demo-reset.sh
set -e
DOMAIN='%@demo.budu.test'
IDS=$(docker compose exec -T -u www-data iomad php -r '
define("CLI_SCRIPT",1); require "/var/www/html/config.php"; require_once($CFG->dirroot."/user/lib.php"); require_once($CFG->dirroot."/cohort/lib.php"); require_once($CFG->dirroot."/course/lib.php"); global $DB;
\core\session\manager::set_user(get_admin());
$users = $DB->get_records_select("user", "email LIKE ? AND deleted = 0", ["'"$DOMAIN"'"]);
$uids = array_keys($users);
$companies = $uids ? $DB->get_fieldset_select("company_users", "DISTINCT companyid", "managertype = 1 AND userid IN (".implode(",", $uids).")") : [];
foreach ($companies as $cid) {
  foreach ($DB->get_fieldset_select("company_course", "courseid", "companyid = ?", [$cid]) as $courseid) delete_course($courseid, false);
  $cat = $DB->get_field("company", "category", ["id" => $cid]);
  if ($cat) foreach ($DB->get_records("cohort", ["contextid" => context_coursecat::instance($cat)->id]) as $c) cohort_delete_cohort($c);
  \block_iomad_company_admin\event\company_deleted::create(["context" => context_system::instance(), "objectid" => $cid, "other" => ["companyid" => $cid]])->trigger();
}
foreach ($users as $u) delete_user($u);
fwrite(STDERR, "deleted ".count($users)." people, ".count($companies)." companies\n");
echo implode(" ", array_merge(["u"], $uids, ["c"], $companies));
')
UIDS=$(echo "$IDS" | sed -E 's/^u ?//; s/ ?c.*$//' | tr ' ' ',')
CIDS=$(echo "$IDS" | sed -E 's/^.*c ?//' | tr ' ' ',')
[ -n "$UIDS" ] || UIDS=0
[ -n "$CIDS" ] || CIDS=0
docker compose exec -T app-db sh -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -q -c \"
  DELETE FROM notifications WHERE iomad_user_id IN ($UIDS);
  DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE parent_id IN ($UIDS) OR teacher_id IN ($UIDS));
  DELETE FROM conversations WHERE parent_id IN ($UIDS) OR teacher_id IN ($UIDS);
  DELETE FROM parent_requests WHERE parent_id IN ($UIDS) OR child_id IN ($UIDS);
  DELETE FROM course_reviews WHERE user_id IN ($UIDS);
  DELETE FROM course_finishes WHERE user_id IN ($UIDS);
  DELETE FROM announcements WHERE company_id IN ($CIDS);
  DELETE FROM school_page_blocks WHERE company_id IN ($CIDS);
  DELETE FROM school_pages WHERE company_id IN ($CIDS);
  DELETE FROM course_listings WHERE updated_by IN ($UIDS);
  DELETE FROM user_prefs WHERE iomad_user_id IN ($UIDS);
  DELETE FROM tenants WHERE company_id IN ($CIDS);
\""
echo "demo data removed"
