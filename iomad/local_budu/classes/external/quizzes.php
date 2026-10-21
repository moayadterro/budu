<?php
namespace local_budu\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use mod_quiz\quiz_attempt;
use mod_quiz\quiz_settings;

/**
 * Quizzes and exams for Budu, on Moodle's quiz engine (mod_quiz + question bank): grading, attempts,
 * time limits and the gradebook are Moodle's. Budu gives them a simple shape:
 *  - kind "quiz" (practice: unlimited attempts, answers shown after submitting) or "exam" (one attempt,
 *    score after submitting, correct answers only after it closes). Stored as the cm idnumber.
 *  - questions are written in Budu's editor as simple JSON and saved as Moodle questions (8 types).
 *  - a quiz belongs to a course; it can be limited to some classes (the classes' groups).
 * Teacher functions check the acting user teaches the course (or manages its school); student
 * functions check the quiz is visible to them. The frontend renders questions itself.
 */
class quizzes extends external_api {

    const TYPES = ['multichoice', 'truefalse', 'shortanswer', 'numerical', 'essay', 'match', 'ordering', 'gapselect'];

    // ----- helpers -------------------------------------------------------

    private static function setup(): void {
        global $CFG;
        require_once($CFG->dirroot . '/mod/quiz/locallib.php');
        require_once($CFG->dirroot . '/mod/quiz/lib.php');
        require_once($CFG->dirroot . '/course/lib.php');
        require_once($CFG->dirroot . '/course/modlib.php');
        require_once($CFG->libdir . '/questionlib.php');
        require_once($CFG->libdir . '/enrollib.php');
        require_once($CFG->dirroot . '/group/lib.php');
        self::validate_context(\context_system::instance());
    }

    private static function deny(string $what): \moodle_exception {
        return new \moodle_exception('nopermissions', 'error', '', $what);
    }

    /** A quiz the user teaches: [cm, course, quiz record]. */
    private static function taught_quiz(int $cmid, int $userid): array {
        global $DB;
        $cm = get_coursemodule_from_id('quiz', $cmid, 0, false, MUST_EXIST);
        $course = learning::taught($cm->course, $userid);
        $quiz = $DB->get_record('quiz', ['id' => $cm->instance], '*', MUST_EXIST);
        $quiz->cmid = $cm->id;
        return [$cm, $course, $quiz];
    }

    /** The quiz cm, if the student may see it. */
    private static function student_quiz(int $cmid, int $userid): array {
        global $DB;
        $cm = get_coursemodule_from_id('quiz', $cmid, 0, false, MUST_EXIST);
        $course = get_course($cm->course);
        $ctx = \context_module::instance($cm->id);
        if (!$course->visible || !is_enrolled(\context_course::instance($course->id), $userid, '', true)
                || !has_capability('mod/quiz:attempt', $ctx, $userid)
                || !get_fast_modinfo($course, $userid)->get_cm($cm->id)->uservisible) {
            throw self::deny('take this quiz');
        }
        $quiz = $DB->get_record('quiz', ['id' => $cm->instance], '*', MUST_EXIST);
        $quiz->cmid = $cm->id;
        return [$cm, $course, $quiz];
    }

    private static function kind(\stdClass $cm): string {
        return $cm->idnumber === 'exam' ? 'exam' : 'quiz';
    }

    /** Review options per preset (Moodle's "attempt / correctness / marks / … during / immediately / open / closed"). */
    private static function review_flags(string $kind): array {
        $flags = [];
        $all = ['attempt', 'correctness', 'maxmarks', 'marks', 'specificfeedback', 'generalfeedback', 'rightanswer', 'overallfeedback'];
        foreach (['during', 'immediately', 'open', 'closed'] as $when) {
            foreach ($all as $what) {
                if ($kind === 'quiz') {
                    $on = $when !== 'during';
                } else if ($when === 'closed') {
                    $on = true;
                } else if ($when === 'during') {
                    $on = false;
                } else {
                    // exam, after submitting / while still open: own answers and the score, not the right answers
                    $on = in_array($what, ['attempt', 'maxmarks', 'marks']);
                }
                $flags[$what . $when] = (int)$on;
            }
        }
        return $flags;
    }

    /**
     * Who sees the quiz and from when: only these classes' groups (created on first need), or a school
     * exam's audience group, and — when publishing is scheduled — nobody before `publishat`.
     */
    private static function availability_for(int $courseid, array $classids, int $publishat = 0, int $audiencegroup = 0): ?string {
        $conditions = [];
        if ($audiencegroup) {
            // a school exam: only its audience (an empty audience = nobody)
            $conditions[] = \availability_group\condition::get_json($audiencegroup);
        }
        if ($classids) {
            $groups = [];
            foreach (array_unique($classids) as $classid) {
                $groups[] = \availability_group\condition::get_json(schedule::class_group($courseid, (int)$classid));
            }
            $conditions[] = \core_availability\tree::get_nested_json($groups, \core_availability\tree::OP_OR);
        }
        if ($publishat > 0) {
            $conditions[] = \availability_date\condition::get_json(\availability_date\condition::DIRECTION_FROM, $publishat);
        }
        if (!$conditions) {
            return null;
        }
        return json_encode(\core_availability\tree::get_root_json($conditions, \core_availability\tree::OP_AND, false));
    }

    /** Class ids a quiz is limited to (from its group conditions). */
    private static function class_ids_of(\stdClass $cm): array {
        global $DB;
        if (empty($cm->availability)) {
            return [];
        }
        $groupids = [];
        $walk = function ($node) use (&$walk, &$groupids) {
            foreach ($node->c ?? [] as $c) {
                if (isset($c->type) && $c->type === 'group' && !empty($c->id)) {
                    $groupids[] = (int)$c->id;
                } else if (isset($c->c)) {
                    $walk($c);
                }
            }
        };
        $walk(json_decode($cm->availability));
        if (!$groupids) {
            return [];
        }
        [$in, $params] = $DB->get_in_or_equal($groupids);
        return array_map('intval', $DB->get_fieldset_select('enrol', 'customint1',
            "enrol = 'cohort' AND courseid = ? AND customint2 $in", array_merge([$cm->course], $params)));
    }

    private static function question_category(\stdClass $course): \stdClass {
        $ctx = \context_course::instance($course->id);
        return question_get_default_category($ctx->id) ?: question_make_default_categories([$ctx]);
    }

    private static function text(string $s): array {
        return ['text' => $s, 'format' => FORMAT_PLAIN];
    }

    private static function html(string $s): array {
        return ['text' => $s, 'format' => FORMAT_HTML];
    }

    private static function combined_feedback(\stdClass $f): void {
        $f->correctfeedback = self::html('');
        $f->partiallycorrectfeedback = self::html('');
        $f->incorrectfeedback = self::html('');
        $f->shownumcorrect = 0;
    }

    /** Budu's question JSON → Moodle question form data. */
    private static function question_form(string $type, string $questiontext, float $mark, array $d, \stdClass $category): \stdClass {
        $f = new \stdClass();
        $f->category = $category->id . ',' . $category->contextid;
        $f->name = shorten_text(trim(strip_tags($questiontext)), 80) ?: '-';
        $f->questiontext = self::text($questiontext);
        $f->generalfeedback = self::text((string)($d['explanation'] ?? ''));
        $f->defaultmark = $mark;
        $f->penalty = 0;
        $f->status = \core_question\local\bank\question_version_status::QUESTION_STATUS_READY;
        $nonempty = fn(array $xs) => array_values(array_filter(array_map(fn($x) => is_string($x) ? trim($x) : $x, $xs),
            fn($x) => $x !== '' && $x !== null));

        switch ($type) {
            case 'multichoice':
                $options = array_values(array_filter($d['options'] ?? [], fn($o) => trim((string)($o['text'] ?? '')) !== ''));
                $correct = count(array_filter($options, fn($o) => !empty($o['correct'])));
                if (count($options) < 2 || $correct < 1) {
                    throw new \invalid_parameter_exception('multichoice needs 2+ options and a correct one');
                }
                $multiple = !empty($d['multiple']);
                if (!$multiple && $correct !== 1) {
                    throw new \invalid_parameter_exception('single choice needs exactly one correct option');
                }
                $wrong = count($options) - $correct;
                $f->single = $multiple ? '0' : '1';
                $f->shuffleanswers = 1;
                $f->answernumbering = 'abc';
                $f->showstandardinstruction = 0;
                $f->answer = $f->fraction = $f->feedback = [];
                foreach ($options as $o) {
                    $f->answer[] = self::text(trim($o['text']));
                    $f->fraction[] = !empty($o['correct']) ? ($multiple ? 1 / $correct : 1) : ($multiple && $wrong ? -1 / $correct : 0);
                    $f->feedback[] = self::html('');
                }
                self::combined_feedback($f);
                break;
            case 'truefalse':
                $f->correctanswer = !empty($d['correct']) ? '1' : '0';
                $f->feedbacktrue = self::html('');
                $f->feedbackfalse = self::html('');
                $f->penalty = 1;
                break;
            case 'shortanswer':
                $answers = $nonempty($d['answers'] ?? []);
                if (!$answers) {
                    throw new \invalid_parameter_exception('shortanswer needs an accepted answer');
                }
                $f->usecase = !empty($d['caseSensitive']) ? 1 : 0;
                $f->answer = $answers;
                $f->fraction = array_fill(0, count($answers), '1.0');
                $f->feedback = array_fill(0, count($answers), self::html(''));
                break;
            case 'numerical':
                $answers = array_values(array_filter($d['answers'] ?? [], fn($a) => is_numeric($a['value'] ?? null)));
                if (!$answers) {
                    throw new \invalid_parameter_exception('numerical needs an answer');
                }
                $f->answer = array_map(fn($a) => (string)$a['value'], $answers);
                $f->tolerance = array_map(fn($a) => (float)($a['tolerance'] ?? 0), $answers);
                $f->fraction = array_fill(0, count($answers), '1.0');
                $f->feedback = array_fill(0, count($answers), self::html(''));
                $f->unitrole = '3'; // qtype_numerical::UNITNONE
                $f->unitpenalty = 0;
                $f->unitgradingtypes = '1';
                $f->unitsleft = '0';
                $f->nounits = 1;
                $f->multiplier = ['1.0'];
                break;
            case 'essay':
                $f->responseformat = 'plain';
                $f->responserequired = 1;
                $f->responsefieldlines = 10;
                $f->attachments = 0;
                $f->attachmentsrequired = 0;
                $f->maxbytes = 0;
                $f->filetypeslist = '';
                $f->graderinfo = self::html((string)($d['graderInfo'] ?? ''));
                $f->responsetemplate = self::html('');
                break;
            case 'match':
                $pairs = array_values(array_filter($d['pairs'] ?? [], fn($p) => trim((string)($p['right'] ?? '')) !== ''));
                if (count(array_filter($pairs, fn($p) => trim((string)($p['left'] ?? '')) !== '')) < 2) {
                    throw new \invalid_parameter_exception('match needs 2+ pairs');
                }
                $f->shuffleanswers = 1;
                $f->subquestions = array_map(fn($p) => self::text(trim((string)($p['left'] ?? ''))), $pairs);
                $f->subanswers = array_map(fn($p) => trim($p['right']), $pairs);
                $f->noanswers = count($pairs);
                self::combined_feedback($f);
                break;
            case 'ordering':
                $items = $nonempty($d['items'] ?? []);
                if (count($items) < 2) {
                    throw new \invalid_parameter_exception('ordering needs 2+ items');
                }
                $f->layouttype = 0; // vertical
                $f->selecttype = 0; // all items
                $f->selectcount = 0;
                $f->gradingtype = 0; // absolute position
                $f->showgrading = 1;
                $f->numberingstyle = 'none';
                $f->countanswers = count($items);
                $f->answer = array_map(fn($s) => self::text($s), $items);
                self::combined_feedback($f);
                break;
            case 'gapselect':
                // the frontend sends the text with [[1]], [[2]] … and the choices (1 = the right word for [[1]] …)
                $choices = $nonempty($d['choices'] ?? []);
                if (!preg_match('/\[\[\d+\]\]/', $questiontext) || count($choices) < 2) {
                    throw new \invalid_parameter_exception('gapselect needs gaps and choices');
                }
                $f->questiontext = self::text($questiontext);
                $f->shuffleanswers = 1;
                $f->choices = array_map(fn($c) => ['answer' => $c, 'choicegroup' => '1'], $choices);
                self::combined_feedback($f);
                break;
            default:
                throw new \invalid_parameter_exception('unknown question type');
        }
        return $f;
    }

    /** Moodle question → Budu's question JSON (for the editor). */
    private static function question_data(\stdClass $q): array {
        $o = $q->options;
        $plain = fn($s) => trim(html_entity_decode(strip_tags((string)$s), ENT_QUOTES));
        $d = ['explanation' => $plain($q->generalfeedback)];
        switch ($q->qtype) {
            case 'multichoice':
                $d['multiple'] = empty($o->single);
                $d['options'] = array_values(array_map(fn($a) => ['text' => $plain($a->answer), 'correct' => $a->fraction > 0], $o->answers));
                break;
            case 'truefalse':
                $d['correct'] = isset($o->answers[$o->trueanswer]) && $o->answers[$o->trueanswer]->fraction > 0.5;
                break;
            case 'shortanswer':
                $d['caseSensitive'] = !empty($o->usecase);
                $d['answers'] = array_values(array_map(fn($a) => $a->answer, array_filter($o->answers, fn($a) => $a->fraction > 0)));
                break;
            case 'numerical':
                $d['answers'] = array_values(array_map(fn($a) => ['value' => (float)$a->answer, 'tolerance' => (float)$a->tolerance],
                    array_filter($o->answers, fn($a) => $a->fraction > 0 && is_numeric($a->answer))));
                break;
            case 'essay':
                $d['graderInfo'] = $plain($o->graderinfo ?? '');
                break;
            case 'match':
                $d['pairs'] = array_values(array_map(fn($s) => ['left' => $plain($s->questiontext), 'right' => $s->answertext], $o->subquestions));
                break;
            case 'ordering':
                $answers = $o->answers;
                usort($answers, fn($a, $b) => $a->fraction <=> $b->fraction); // fraction = correct position
                $d['items'] = array_map(fn($a) => $plain($a->answer), $answers);
                break;
            case 'gapselect':
                $d['choices'] = array_values(array_map(fn($a) => $a->answer, $o->answers));
                break;
        }
        return $d;
    }

    /** Questions of a quiz in slot order: slot, question id, type, text, mark, data. */
    private static function quiz_questions(\stdClass $quiz, bool $withdata): array {
        $quizobj = quiz_settings::create($quiz->id);
        $out = [];
        foreach (\mod_quiz\question\bank\qbank_helper::get_question_structure($quiz->id, $quizobj->get_context()) as $slot) {
            if (empty($slot->questionid) || !in_array($slot->qtype, self::TYPES)) {
                continue;
            }
            $row = ['slot' => (int)$slot->slot, 'questionid' => (int)$slot->questionid, 'type' => $slot->qtype,
                'text' => html_entity_decode(strip_tags((string)$slot->questiontext), ENT_QUOTES), 'mark' => (float)$slot->maxmark, 'data' => '{}'];
            if ($withdata) {
                $q = \question_bank::load_question_data($slot->questionid);
                $row['text'] = (string)$q->questiontext;
                $row['data'] = json_encode(self::question_data($q));
            }
            $out[] = $row;
        }
        return $out;
    }

    private static function question_list_structure(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'slot' => new external_value(PARAM_INT, 'Position in the quiz'),
            'questionid' => new external_value(PARAM_INT, 'Question'),
            'type' => new external_value(PARAM_ALPHA, 'Question type'),
            'text' => new external_value(PARAM_RAW, 'Question text (plain)'),
            'mark' => new external_value(PARAM_FLOAT, 'Points'),
            'data' => new external_value(PARAM_RAW, 'Type-specific data (JSON)'),
        ]));
    }

    /** The pass mark lives on the quiz's grade item (0–100 here, as the quiz grade is out of 100). */
    private static function gradepass(\stdClass $quiz): float {
        global $DB;
        return (float)$DB->get_field('grade_items', 'gradepass',
            ['itemtype' => 'mod', 'itemmodule' => 'quiz', 'iteminstance' => $quiz->id, 'itemnumber' => 0]);
    }

    private static function quiz_info(\stdClass $cm, \stdClass $quiz): array {
        return [
            'cmid' => (int)$cm->id, 'courseid' => (int)$cm->course, 'name' => $quiz->name, 'intro' => (string)$quiz->intro,
            'kind' => self::kind($cm), 'published' => (bool)$cm->visible,
            'timeopen' => (int)$quiz->timeopen, 'timeclose' => (int)$quiz->timeclose, 'timelimit' => (int)$quiz->timelimit,
            'attempts' => (int)$quiz->attempts, 'gradepass' => self::gradepass($quiz), 'classids' => self::class_ids_of($cm),
            'schoolexam' => school_exams::is_exam_space(get_course($cm->course)),
        ];
    }

    private static function quiz_info_structure(): array {
        return [
            'cmid' => new external_value(PARAM_INT, 'Quiz (course module)'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'intro' => new external_value(PARAM_RAW, 'Instructions (plain text)'),
            'kind' => new external_value(PARAM_ALPHA, 'quiz | exam'),
            'published' => new external_value(PARAM_BOOL, 'Visible to students'),
            'timeopen' => new external_value(PARAM_INT, 'Opens (0 = any time)'),
            'timeclose' => new external_value(PARAM_INT, 'Closes (0 = never)'),
            'timelimit' => new external_value(PARAM_INT, 'Time limit in seconds (0 = none)'),
            'attempts' => new external_value(PARAM_INT, 'Attempts allowed (0 = unlimited)'),
            'gradepass' => new external_value(PARAM_FLOAT, 'Pass mark 0–100 (0 = none)'),
            'classids' => new external_multiple_structure(new external_value(PARAM_INT, 'Class'), 'Only these classes ([] = everyone)'),
            'schoolexam' => new external_value(PARAM_BOOL, 'A school exam (no course; its own audience)'),
        ];
    }

    // ----- teacher: quizzes ----------------------------------------------

    public static function course_quizzes_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
        ]);
    }

    /** The course's quizzes and exams with question count, attempts and answers waiting for a grade. */
    public static function course_quizzes(int $courseid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::course_quizzes_parameters(), compact('courseid', 'userid'));
        self::setup();
        $course = learning::taught($p['courseid'], $p['userid']);
        $out = [];
        foreach (get_fast_modinfo($course)->get_instances_of('quiz') as $cminfo) {
            if ($cminfo->deletioninprogress) {
                continue;
            }
            $cm = get_coursemodule_from_id('quiz', $cminfo->id, 0, false, MUST_EXIST);
            $quiz = $DB->get_record('quiz', ['id' => $cm->instance], '*', MUST_EXIST);
            $out[] = self::quiz_info($cm, $quiz) + [
                'questions' => $DB->count_records('quiz_slots', ['quizid' => $quiz->id]),
                'attemptcount' => $DB->count_records_select('quiz_attempts', "quiz = ? AND preview = 0 AND state = 'finished'", [$quiz->id]),
                'tograde' => self::to_grade_count($quiz),
            ];
        }
        return $out;
    }

    public static function course_quizzes_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure(self::quiz_info_structure() + [
            'questions' => new external_value(PARAM_INT, 'Number of questions'),
            'attemptcount' => new external_value(PARAM_INT, 'Finished attempts'),
            'tograde' => new external_value(PARAM_INT, 'Answers waiting for a manual grade'),
        ]));
    }

    private static function to_grade_count(\stdClass $quiz): int {
        global $DB;
        // question attempts whose latest step is "needs grading", in finished attempts
        return (int)$DB->count_records_sql("SELECT COUNT(1) FROM {quiz_attempts} qa
            JOIN {question_attempts} qta ON qta.questionusageid = qa.uniqueid
            JOIN {question_attempt_steps} s ON s.questionattemptid = qta.id
             AND s.sequencenumber = (SELECT MAX(s2.sequencenumber) FROM {question_attempt_steps} s2 WHERE s2.questionattemptid = qta.id)
           WHERE qa.quiz = ? AND qa.preview = 0 AND qa.state = 'finished' AND s.state = 'needsgrading'", [$quiz->id]);
    }

    public static function save_quiz_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'cmid' => new external_value(PARAM_INT, 'Quiz to change; 0 = new (a draft)'),
            'name' => new external_value(PARAM_TEXT, 'Title'),
            'intro' => new external_value(PARAM_RAW, 'Instructions (plain text)'),
            'kind' => new external_value(PARAM_ALPHA, 'quiz | exam'),
            'timeclose' => new external_value(PARAM_INT, 'Closes (0 = never)'),
            'timelimit' => new external_value(PARAM_INT, 'Seconds (0 = no limit)'),
            'gradepass' => new external_value(PARAM_FLOAT, 'Pass mark 0–100 (0 = none)', VALUE_DEFAULT, 0),
            'classids' => new external_multiple_structure(new external_value(PARAM_INT, 'Class'), 'Only these classes', VALUE_DEFAULT, []),
        ]);
    }

    /** Create (a hidden draft) or change a quiz / exam in the course's general section. */
    public static function save_quiz(int $courseid, int $userid, int $cmid, string $name, string $intro, string $kind,
            int $timeclose, int $timelimit, float $gradepass = 0, array $classids = []): array {
        $p = self::validate_parameters(self::save_quiz_parameters(),
            compact('courseid', 'userid', 'cmid', 'name', 'intro', 'kind', 'timeclose', 'timelimit', 'gradepass', 'classids'));
        self::setup();
        $course = learning::taught($p['courseid'], $p['userid']);
        $kind = $p['kind'] === 'exam' ? 'exam' : 'quiz';
        $exam = school_exams::is_exam_space($course);
        if ($exam) {
            $kind = 'exam'; // school exams are always exams
        }
        $settings = function (\stdClass $data) use ($p, &$kind, $course, $exam) {
            // the publish time (timeopen) is set by publish_quiz, never here
            $data->timeopen = (int)($data->timeopen ?? 0);
            if ($p['timeclose'] && $p['timeclose'] <= max($data->timeopen, 0)) {
                throw new \invalid_parameter_exception('closes before it is published');
            }
            $data->name = trim($p['name']);
            $data->introeditor = ['text' => $p['intro'], 'format' => FORMAT_PLAIN, 'itemid' => 0];
            $data->cmidnumber = $kind;
            $data->timeclose = $p['timeclose'];
            $data->timelimit = max(0, $p['timelimit']);
            $data->attempts = $kind === 'exam' ? 1 : 0;
            $data->grademethod = QUIZ_GRADEHIGHEST;
            $data->grade = 100;
            $data->gradepass = max(0, min(100, $p['gradepass']));
            $data->preferredbehaviour = 'deferredfeedback';
            $data->overduehandling = 'autosubmit';
            $data->graceperiod = 0;
            $data->questionsperpage = 0;
            $data->navmethod = QUIZ_NAVMETHOD_FREE;
            $data->shuffleanswers = 1;
            $data->decimalpoints = 2;
            $data->questiondecimalpoints = -1;
            $data->attemptonlast = 0;
            $data->quizpassword = '';
            $data->subnet = '';
            $data->browsersecurity = '-';
            $data->delay1 = 0;
            $data->delay2 = 0;
            $data->showuserpicture = 0;
            $data->showblocks = 0;
            $data->completionattemptsexhausted = 0;
            $data->completionminattempts = 0;
            foreach (self::review_flags($kind) as $k => $v) {
                $data->$k = $v;
            }
            $data->availability = self::availability_for($course->id, $exam ? [] : $p['classids'], $data->timeopen,
                $exam && !empty($data->coursemodule) ? school_exams::group_id($course->id, (int)$data->coursemodule, true) : 0);
            return $data;
        };
        if (!$p['cmid']) {
            $data = (object)['modulename' => 'quiz', 'course' => $course->id, 'section' => 0, 'visible' => 0, 'visibleoncoursepage' => 1];
            $cmid = (int)create_module($settings($data))->coursemodule;
            if ($exam) {
                // limit it to its (still empty) audience from the start
                global $DB;
                $DB->set_field('course_modules', 'availability',
                    self::availability_for($course->id, [], 0, school_exams::group_id($course->id, $cmid, true)), ['id' => $cmid]);
                rebuild_course_cache($course->id, true);
            }
            return ['id' => $cmid];
        }
        [$cm] = self::taught_quiz($p['cmid'], $p['userid']);
        if ($cm->course != $course->id) {
            throw self::deny('change this quiz');
        }
        [, , , $data] = get_moduleinfo_data($cm, $course);
        update_module($settings($data));
        return ['id' => (int)$cm->id];
    }

    public static function save_quiz_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Quiz (course module)')]);
    }

    public static function get_quiz_parameters(): external_function_parameters {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
        ]);
    }

    /** A quiz with its questions (full data, for the editor). */
    public static function get_quiz(int $cmid, int $userid): array {
        $p = self::validate_parameters(self::get_quiz_parameters(), compact('cmid', 'userid'));
        self::setup();
        [$cm, , $quiz] = self::taught_quiz($p['cmid'], $p['userid']);
        $structure = \mod_quiz\structure::create_for_quiz(quiz_settings::create($quiz->id));
        return self::quiz_info($cm, $quiz) + [
            'editable' => $structure->can_be_edited(),
            'questionlist' => self::quiz_questions($quiz, true),
        ];
    }

    public static function get_quiz_returns(): external_single_structure {
        return new external_single_structure(self::quiz_info_structure() + [
            'editable' => new external_value(PARAM_BOOL, 'Questions can still change (no attempts yet)'),
            'questionlist' => self::question_list_structure(),
        ]);
    }

    public static function publish_quiz_parameters(): external_function_parameters {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'published' => new external_value(PARAM_BOOL, 'Show to students'),
            'publishat' => new external_value(PARAM_INT, 'Publish at this time (0 = now)', VALUE_DEFAULT, 0),
        ]);
    }

    /**
     * Publish now, schedule publishing (hidden from students until `publishat`, which is also when it
     * opens), or hide. Publishing needs at least one question.
     */
    public static function publish_quiz(int $cmid, int $userid, bool $published, int $publishat = 0): array {
        global $DB;
        $p = self::validate_parameters(self::publish_quiz_parameters(), compact('cmid', 'userid', 'published', 'publishat'));
        self::setup();
        [$cm, $course, $quiz] = self::taught_quiz($p['cmid'], $p['userid']);
        if ($p['published'] && !$DB->record_exists('quiz_slots', ['quizid' => $quiz->id])) {
            throw new \invalid_parameter_exception('a quiz needs questions before it is published');
        }
        $at = $p['published'] && $p['publishat'] > time() ? $p['publishat'] : 0;
        if ($at && $quiz->timeclose && $quiz->timeclose <= $at) {
            throw new \invalid_parameter_exception('closes before it is published');
        }
        $DB->set_field('quiz', 'timeopen', $at, ['id' => $quiz->id]);
        $DB->set_field('course_modules', 'availability', self::availability_for($course->id, self::class_ids_of($cm), $at,
            school_exams::is_exam_space($course) ? school_exams::group_id($course->id, $cm->id, true) : 0), ['id' => $cm->id]);
        $quiz->timeopen = $at;
        quiz_update_events($quiz); // the quiz's calendar events follow the new open time
        set_coursemodule_visible($cm->id, $p['published'] ? 1 : 0);
        rebuild_course_cache($cm->course, true);
        return ['id' => (int)$cm->id];
    }

    public static function publish_quiz_returns(): external_single_structure {
        return self::save_quiz_returns();
    }

    public static function delete_quiz_parameters(): external_function_parameters {
        return self::get_quiz_parameters();
    }

    public static function delete_quiz(int $cmid, int $userid): array {
        $p = self::validate_parameters(self::delete_quiz_parameters(), compact('cmid', 'userid'));
        self::setup();
        [$cm] = self::taught_quiz($p['cmid'], $p['userid']);
        course_delete_module($cm->id);
        return ['id' => (int)$cm->id];
    }

    public static function delete_quiz_returns(): external_single_structure {
        return self::save_quiz_returns();
    }

    // ----- teacher: questions --------------------------------------------

    public static function save_question_parameters(): external_function_parameters {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'slot' => new external_value(PARAM_INT, 'Question to change (its slot); 0 = add at the end'),
            'type' => new external_value(PARAM_ALPHA, 'multichoice | truefalse | shortanswer | numerical | essay | match | ordering | gapselect'),
            'text' => new external_value(PARAM_RAW, 'Question text (plain text; gapselect: with [[1]] gaps)'),
            'mark' => new external_value(PARAM_FLOAT, 'Points'),
            'data' => new external_value(PARAM_RAW, 'Type-specific data (JSON)'),
        ]);
    }

    /** Add a question to the quiz, or save a new version of one (quizzes always use the latest version). */
    public static function save_question(int $cmid, int $userid, int $slot, string $type, string $text, float $mark, string $data): array {
        global $DB;
        $p = self::validate_parameters(self::save_question_parameters(), compact('cmid', 'userid', 'slot', 'type', 'text', 'mark', 'data'));
        self::setup();
        [, $course, $quiz] = self::taught_quiz($p['cmid'], $p['userid']);
        if (!in_array($p['type'], self::TYPES) || trim($p['text']) === '' || $p['mark'] <= 0 || $p['mark'] > 1000) {
            throw new \invalid_parameter_exception('invalid question');
        }
        $quizobj = quiz_settings::create($quiz->id);
        $structure = \mod_quiz\structure::create_for_quiz($quizobj);
        $d = json_decode($p['data'], true);
        if (!is_array($d)) {
            throw new \invalid_parameter_exception('invalid question data');
        }
        $form = self::question_form($p['type'], trim($p['text']), $p['mark'], $d, self::question_category($course));

        if ($p['slot']) {
            $existing = null;
            foreach (self::quiz_questions($quiz, false) as $q) {
                if ($q['slot'] === $p['slot']) {
                    $existing = $q;
                }
            }
            if (!$existing) {
                throw new \invalid_parameter_exception('no such question');
            }
            $old = \question_bank::load_question_data($existing['questionid']);
            if ($old->qtype !== $p['type']) {
                throw new \invalid_parameter_exception('the question type cannot change');
            }
            $question = \question_bank::get_qtype($p['type'])->save_question($old, $form);
            $slotrecord = $DB->get_record('quiz_slots', ['quizid' => $quiz->id, 'slot' => $p['slot']], '*', MUST_EXIST);
            $structure->update_slot_maxmark($slotrecord, $p['mark']);
        } else {
            if (!$structure->can_be_edited()) {
                throw new \invalid_parameter_exception('students have already taken this quiz');
            }
            $new = (object)['category' => $form->category, 'qtype' => $p['type'], 'createdby' => $p['userid']];
            $question = \question_bank::get_qtype($p['type'])->save_question($new, $form);
            quiz_add_quiz_question($question->id, $quiz, 0, $p['mark']);
        }
        $quizobj->get_grade_calculator()->recompute_quiz_sumgrades();
        return ['id' => (int)$question->id];
    }

    public static function save_question_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Question id')]);
    }

    public static function remove_question_parameters(): external_function_parameters {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'slot' => new external_value(PARAM_INT, 'Question slot'),
            'direction' => new external_value(PARAM_INT, '0 = remove, -1 = move up, 1 = move down', VALUE_DEFAULT, 0),
        ]);
    }

    /** Remove a question from the quiz, or move it up / down. Only before anyone has attempted it. */
    public static function remove_question(int $cmid, int $userid, int $slot, int $direction = 0): array {
        global $DB;
        $p = self::validate_parameters(self::remove_question_parameters(), compact('cmid', 'userid', 'slot', 'direction'));
        self::setup();
        [, , $quiz] = self::taught_quiz($p['cmid'], $p['userid']);
        $quizobj = quiz_settings::create($quiz->id);
        $structure = \mod_quiz\structure::create_for_quiz($quizobj);
        if (!$structure->can_be_edited()) {
            throw new \invalid_parameter_exception('students have already taken this quiz');
        }
        if ($p['direction'] === 0) {
            $structure->remove_slot($p['slot']);
        } else {
            $slots = $DB->get_records('quiz_slots', ['quizid' => $quiz->id], 'slot');
            $byslot = [];
            foreach ($slots as $s) {
                $byslot[(int)$s->slot] = $s;
            }
            $moving = $byslot[$p['slot']] ?? null;
            $target = $p['slot'] + $p['direction'];
            if ($moving && isset($byslot[$target])) {
                // move after the slot before the target position (0 = to the top)
                $after = $p['direction'] < 0 ? ($byslot[$target - 1]->id ?? 0) : $byslot[$target]->id;
                $structure->move_slot($moving->id, $after, 1);
            }
        }
        $quizobj->get_grade_calculator()->recompute_quiz_sumgrades();
        return ['id' => (int)$quiz->id];
    }

    public static function remove_question_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Quiz')]);
    }

    // ----- student: list, attempt, review --------------------------------

    public static function my_quizzes_parameters(): external_function_parameters {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (student)'),
            'courseid' => new external_value(PARAM_INT, 'Only this course (0 = all)', VALUE_DEFAULT, 0),
        ]);
    }

    /** Published quizzes / exams the student may take, with their state and (when shown) their grade. */
    public static function my_quizzes(int $userid, int $courseid = 0): array {
        global $DB;
        $p = self::validate_parameters(self::my_quizzes_parameters(), compact('userid', 'courseid'));
        self::setup();
        $out = [];
        foreach (self::student_course_ids($p['userid']) as $courseid) {
            if ($p['courseid'] && $courseid != $p['courseid']) {
                continue;
            }
            $course = get_course($courseid);
            foreach (get_fast_modinfo($course, $p['userid'])->get_instances_of('quiz') as $cminfo) {
                if (!$cminfo->uservisible || $cminfo->deletioninprogress) {
                    continue;
                }
                $cm = get_coursemodule_from_id('quiz', $cminfo->id, 0, false, MUST_EXIST);
                $quiz = $DB->get_record('quiz', ['id' => $cm->instance], '*', MUST_EXIST);
                $out[] = self::student_state($cm, $quiz, $p['userid']) + ['coursename' => $course->fullname];
                // (a school exam's "course" name is the school's name)
            }
        }
        return $out;
    }

    /** Visible courses the user is enrolled in as a student — including school exam spaces. */
    private static function student_course_ids(int $userid): array {
        global $DB;
        $studentrole = $DB->get_field('role', 'id', ['shortname' => 'student'], MUST_EXIST);
        $ids = [];
        foreach (enrol_get_all_users_courses($userid, true, 'id, visible') as $c) {
            if ($c->visible && user_has_role_assignment($userid, $studentrole, \context_course::instance($c->id)->id)) {
                $ids[] = (int)$c->id;
            }
        }
        return $ids;
    }

    /** What a student sees of a quiz: info + state (new | inprogress | finished | closed) + grade if shown. */
    private static function student_state(\stdClass $cm, \stdClass $quiz, int $userid): array {
        $attempts = quiz_get_user_attempts($quiz->id, $userid, 'all', true);
        $inprogress = null;
        $finished = [];
        foreach ($attempts as $a) {
            if ($a->state === quiz_attempt::IN_PROGRESS || $a->state === quiz_attempt::OVERDUE) {
                $inprogress = $a;
            } else if ($a->state === quiz_attempt::FINISHED) {
                $finished[] = $a;
            }
        }
        $now = time();
        $closed = $quiz->timeclose && $now > $quiz->timeclose;
        $canstart = !$inprogress && !$closed && (!$quiz->timeopen || $now >= $quiz->timeopen)
            && (!$quiz->attempts || count($finished) < $quiz->attempts);
        $grade = -1.0;
        $needsgrading = false;
        $lastid = 0;
        if ($finished) {
            $last = end($finished);
            $lastid = (int)$last->id;
            $attemptobj = quiz_attempt::create($last->id);
            $options = $attemptobj->get_display_options(true);
            $needsgrading = $attemptobj->requires_manual_grading();
            if ($options->marks >= \question_display_options::MARK_AND_MAX && !$needsgrading) {
                $best = quiz_get_best_grade($quiz, $userid);
                $grade = $best === null ? -1.0 : (float)$best;
            }
        }
        return self::quiz_info($cm, $quiz) + [
            'state' => $inprogress ? 'inprogress' : ($finished ? 'finished' : ($closed ? 'closed' : 'new')),
            'canstart' => $canstart,
            'attemptid' => $inprogress ? (int)$inprogress->id : $lastid,
            'attemptsused' => count($finished),
            'grade' => $grade,
            'needsgrading' => $needsgrading,
        ];
    }

    private static function student_state_structure(): array {
        return self::quiz_info_structure() + [
            'state' => new external_value(PARAM_ALPHA, 'new | inprogress | finished | closed'),
            'canstart' => new external_value(PARAM_BOOL, 'A new attempt can start now'),
            'attemptid' => new external_value(PARAM_INT, 'Attempt in progress, else the last finished one (0 = none)'),
            'attemptsused' => new external_value(PARAM_INT, 'Finished attempts'),
            'grade' => new external_value(PARAM_FLOAT, 'Best grade 0–100 when shown, −1 = not shown / none'),
            'needsgrading' => new external_value(PARAM_BOOL, 'The last attempt waits for the teacher'),
        ];
    }

    public static function my_quizzes_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure(self::student_state_structure() + [
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
        ]));
    }

    public static function quiz_for_student_parameters(): external_function_parameters {
        return new external_function_parameters([
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (student)'),
        ]);
    }

    /** One quiz as the student sees it (before / between attempts). */
    public static function quiz_for_student(int $cmid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::quiz_for_student_parameters(), compact('cmid', 'userid'));
        self::setup();
        [$cm, $course, $quiz] = self::student_quiz($p['cmid'], $p['userid']);
        return self::student_state($cm, $quiz, $p['userid']) + [
            'coursename' => $course->fullname,
            'questions' => $DB->count_records('quiz_slots', ['quizid' => $quiz->id]),
        ];
    }

    public static function quiz_for_student_returns(): external_single_structure {
        return new external_single_structure(self::student_state_structure() + [
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'questions' => new external_value(PARAM_INT, 'Number of questions'),
        ]);
    }

    public static function start_attempt_parameters(): external_function_parameters {
        return self::quiz_for_student_parameters();
    }

    /** Start an attempt (or return the one in progress). */
    public static function start_attempt(int $cmid, int $userid): array {
        $p = self::validate_parameters(self::start_attempt_parameters(), compact('cmid', 'userid'));
        self::setup();
        [$cm, , $quiz] = self::student_quiz($p['cmid'], $p['userid']);
        $state = self::student_state($cm, $quiz, $p['userid']);
        if ($state['state'] === 'inprogress') {
            return ['id' => $state['attemptid']];
        }
        if (!$state['canstart']) {
            throw self::deny('start this quiz now');
        }
        $quizobj = quiz_settings::create($quiz->id, $p['userid']);
        if (!$quizobj->has_questions()) {
            throw self::deny('start an empty quiz');
        }
        $attempts = quiz_get_user_attempts($quiz->id, $p['userid'], 'all', true);
        $last = end($attempts) ?: false;
        $attempt = quiz_prepare_and_start_new_attempt($quizobj, count($attempts) + 1, $last, false, [], [], $p['userid']);
        return ['id' => (int)$attempt->id];
    }

    public static function start_attempt_returns(): external_single_structure {
        return new external_single_structure(['id' => new external_value(PARAM_INT, 'Attempt')]);
    }

    /** The attempt, if it is this student's. */
    private static function own_attempt(int $attemptid, int $userid): quiz_attempt {
        $attemptobj = quiz_attempt::create($attemptid);
        if ((int)$attemptobj->get_userid() !== $userid || $attemptobj->is_preview()) {
            throw self::deny('open this attempt');
        }
        return $attemptobj;
    }

    /** When the attempt must end (0 = no limit). */
    private static function end_time(quiz_attempt $attemptobj): int {
        $end = $attemptobj->get_quizobj()->get_access_manager(time())->get_end_time($attemptobj->get_attempt());
        return $end ? (int)$end : 0;
    }

    /** One question of an attempt, shaped for Budu's UI (choices in this attempt's order) + the saved answer. */
    private static function render_slot(quiz_attempt $attemptobj, int $slot): array {
        $qa = $attemptobj->get_question_attempt($slot);
        $q = $qa->get_question();
        $plain = fn($s, $fmt = FORMAT_HTML) => trim(html_entity_decode(strip_tags(format_text((string)$s, $fmt, ['para' => false])), ENT_QUOTES));
        $data = $qa->get_last_qt_data();
        $type = $q->get_type_name();
        $out = ['slot' => $slot, 'type' => $type, 'text' => $plain($q->questiontext, $q->questiontextformat), 'mark' => (float)$qa->get_max_mark()];
        $ui = [];
        $answer = null;
        switch ($type) {
            case 'multichoice':
                $multiple = $q instanceof \qtype_multichoice_multi_question;
                $ui['multiple'] = $multiple;
                $ui['options'] = [];
                foreach ($q->get_order($qa) as $i => $answerid) {
                    $ui['options'][] = ['key' => (string)$i, 'text' => $plain($q->answers[$answerid]->answer, $q->answers[$answerid]->answerformat)];
                }
                if ($multiple) {
                    $answer = [];
                    foreach ($q->get_order($qa) as $i => $notused) {
                        if (!empty($data['choice' . $i])) {
                            $answer[] = (string)$i;
                        }
                    }
                } else {
                    $answer = isset($data['answer']) ? (string)$data['answer'] : null;
                }
                break;
            case 'truefalse':
                $answer = isset($data['answer']) ? (string)$data['answer'] : null;
                break;
            case 'shortanswer':
            case 'numerical':
            case 'essay':
                $answer = isset($data['answer']) ? (string)$data['answer'] : null;
                break;
            case 'match':
                $ui['stems'] = [];
                foreach ($q->get_stem_order() as $i => $stemid) {
                    $ui['stems'][] = ['key' => 'sub' . $i, 'text' => $plain($q->stems[$stemid], $q->stemformat[$stemid])];
                }
                $ui['choices'] = [];
                foreach ($q->get_choice_order() as $key => $choiceid) {
                    $ui['choices'][] = ['key' => (string)$key, 'text' => $q->choices[$choiceid]];
                }
                $answer = [];
                foreach ($q->get_stem_order() as $i => $notused) {
                    if (!empty($data['sub' . $i])) {
                        $answer['sub' . $i] = (string)$data['sub' . $i];
                    }
                }
                break;
            case 'ordering':
                $ui['items'] = [];
                $ids = $q->currentresponse ?: array_keys($q->answers);
                foreach ($ids as $answerid) {
                    $ui['items'][] = ['key' => $q->answers[$answerid]->md5key, 'text' => $plain($q->answers[$answerid]->answer, $q->answers[$answerid]->answerformat)];
                }
                $field = $q->get_response_fieldname();
                $answer = !empty($data[$field]) ? explode(',', $data[$field]) : array_column($ui['items'], 'key');
                break;
            case 'gapselect':
                // text fragments around the gaps; each gap picks from its group's choices (in this attempt's order)
                $ui['fragments'] = array_values(array_map(fn($f) => $plain($f, FORMAT_PLAIN), $q->textfragments));
                $ui['gaps'] = [];
                foreach ($q->places as $place => $group) {
                    $choices = [];
                    foreach ($q->get_ordered_choices($group) as $key => $choice) {
                        $choices[] = ['key' => (string)$key, 'text' => $choice->text];
                    }
                    $ui['gaps'][] = ['key' => 'p' . $place, 'choices' => $choices];
                }
                $answer = [];
                foreach ($q->places as $place => $notused) {
                    if (!empty($data['p' . $place])) {
                        $answer['p' . $place] = (string)$data['p' . $place];
                    }
                }
                break;
        }
        $out['ui'] = json_encode($ui);
        $out['answer'] = json_encode($answer);
        return $out;
    }

    /** Budu's answer for a slot → Moodle response fields for that question. */
    private static function response_fields(quiz_attempt $attemptobj, int $slot, $answer): array {
        $qa = $attemptobj->get_question_attempt($slot);
        $q = $qa->get_question();
        $r = [];
        switch ($q->get_type_name()) {
            case 'multichoice':
                if ($q instanceof \qtype_multichoice_multi_question) {
                    $chosen = array_map('strval', (array)$answer);
                    foreach ($q->get_order($qa) as $i => $notused) {
                        $r['choice' . $i] = in_array((string)$i, $chosen, true) ? '1' : '0';
                    }
                } else if ($answer !== null && $answer !== '') {
                    $r['answer'] = (string)(int)$answer;
                }
                break;
            case 'truefalse':
                if ($answer === '1' || $answer === '0' || $answer === 1 || $answer === 0) {
                    $r['answer'] = (string)$answer;
                }
                break;
            case 'shortanswer':
            case 'numerical':
                $r['answer'] = trim((string)$answer);
                break;
            case 'essay':
                $r['answer'] = (string)$answer;
                $r['answerformat'] = (string)FORMAT_PLAIN;
                break;
            case 'match':
                foreach ($q->get_stem_order() as $i => $notused) {
                    $v = is_array($answer) ? ($answer['sub' . $i] ?? '0') : '0';
                    $r['sub' . $i] = (string)(int)$v;
                }
                break;
            case 'ordering':
                $keys = array_map('strval', (array)$answer);
                $valid = array_map(fn($a) => $a->md5key, $q->answers);
                if (count($keys) === count($valid) && !array_diff($keys, $valid)) {
                    $r[$q->get_response_fieldname()] = implode(',', $keys);
                }
                break;
            case 'gapselect':
                foreach ($q->places as $place => $notused) {
                    $v = is_array($answer) ? ($answer['p' . $place] ?? '0') : '0';
                    $r['p' . $place] = (string)(int)$v;
                }
                break;
        }
        $post = [];
        foreach ($r as $name => $value) {
            $post[$qa->get_qt_field_name($name)] = $value;
        }
        $post[$qa->get_control_field_name('sequencecheck')] = $qa->get_sequence_check_count();
        return $post;
    }

    public static function get_attempt_parameters(): external_function_parameters {
        return new external_function_parameters([
            'attemptid' => new external_value(PARAM_INT, 'Attempt'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (student)'),
        ]);
    }

    /** An attempt in progress: its questions, saved answers and when it ends. Over time → it is submitted. */
    public static function get_attempt(int $attemptid, int $userid): array {
        $p = self::validate_parameters(self::get_attempt_parameters(), compact('attemptid', 'userid'));
        self::setup();
        $attemptobj = self::own_attempt($p['attemptid'], $p['userid']);
        $end = self::end_time($attemptobj);
        if (!$attemptobj->is_finished() && $end && time() >= $end) {
            $attemptobj->process_finish(time(), false, $end); // out of time: what was saved counts
            $attemptobj = quiz_attempt::create($p['attemptid']);
        }
        $quiz = $attemptobj->get_quiz();
        $questions = [];
        if (!$attemptobj->is_finished()) {
            foreach ($attemptobj->get_slots() as $slot) {
                $questions[] = self::render_slot($attemptobj, (int)$slot);
            }
        }
        return [
            'id' => (int)$attemptobj->get_attemptid(), 'cmid' => (int)$attemptobj->get_cmid(), 'name' => $quiz->name,
            'finished' => $attemptobj->is_finished(), 'endtime' => $end, 'now' => time(), 'questions' => $questions,
        ];
    }

    public static function get_attempt_returns(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Attempt'),
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'name' => new external_value(PARAM_TEXT, 'Quiz title'),
            'finished' => new external_value(PARAM_BOOL, 'Already submitted'),
            'endtime' => new external_value(PARAM_INT, 'Must be submitted by (0 = no limit)'),
            'now' => new external_value(PARAM_INT, 'Server time'),
            'questions' => new external_multiple_structure(new external_single_structure([
                'slot' => new external_value(PARAM_INT, 'Slot'),
                'type' => new external_value(PARAM_ALPHA, 'Question type'),
                'text' => new external_value(PARAM_RAW, 'Question text (plain)'),
                'mark' => new external_value(PARAM_FLOAT, 'Points'),
                'ui' => new external_value(PARAM_RAW, 'Choices etc. for the UI (JSON)'),
                'answer' => new external_value(PARAM_RAW, 'Saved answer (JSON)'),
            ])),
        ]);
    }

    public static function save_attempt_parameters(): external_function_parameters {
        return new external_function_parameters([
            'attemptid' => new external_value(PARAM_INT, 'Attempt'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (student)'),
            'answers' => new external_value(PARAM_RAW, 'JSON {slot: answer}'),
            'finish' => new external_value(PARAM_BOOL, 'Submit the attempt'),
        ]);
    }

    /** Save answers (autosave) and optionally submit. After the time limit nothing new is saved. */
    public static function save_attempt(int $attemptid, int $userid, string $answers, bool $finish): array {
        $p = self::validate_parameters(self::save_attempt_parameters(), compact('attemptid', 'userid', 'answers', 'finish'));
        self::setup();
        $attemptobj = self::own_attempt($p['attemptid'], $p['userid']);
        if ($attemptobj->is_finished()) {
            return ['finished' => true, 'needsgrading' => $attemptobj->requires_manual_grading()];
        }
        $now = time();
        $end = self::end_time($attemptobj);
        $overtime = $end && $now >= $end + 30; // a little slack for the network
        $given = json_decode($p['answers'], true);
        if (!$overtime && is_array($given)) {
            $post = [];
            $slots = [];
            foreach ($given as $slot => $answer) {
                $slot = (int)$slot;
                if (in_array($slot, $attemptobj->get_slots())) {
                    $post += self::response_fields($attemptobj, $slot, $answer);
                    $slots[] = $slot;
                }
            }
            if ($slots) {
                $post['slots'] = implode(',', $slots);
                $attemptobj->process_submitted_actions($now, false, $post);
            }
        }
        if ($p['finish'] || $overtime) {
            $attemptobj = quiz_attempt::create($p['attemptid']);
            $attemptobj->process_finish($now, false, $overtime ? $end : $now);
            $attemptobj = quiz_attempt::create($p['attemptid']);
            return ['finished' => true, 'needsgrading' => $attemptobj->requires_manual_grading()];
        }
        return ['finished' => false, 'needsgrading' => false];
    }

    public static function save_attempt_returns(): external_single_structure {
        return new external_single_structure([
            'finished' => new external_value(PARAM_BOOL, 'The attempt is submitted'),
            'needsgrading' => new external_value(PARAM_BOOL, 'Some answers wait for the teacher'),
        ]);
    }

    /** The review of a finished attempt; `$full` = teacher view (everything, plus what can be graded). */
    private static function review(quiz_attempt $attemptobj, bool $full): array {
        $quiz = $attemptobj->get_quiz();
        $options = $attemptobj->get_display_options(true);
        if (!$full && !$options->attempt) {
            throw self::deny('review this attempt yet');
        }
        $showmarks = $full || $options->marks >= \question_display_options::MARK_AND_MAX;
        $showright = $full || $options->rightanswer;
        $showcorrect = $full || $options->correctness;
        // per-question marks would tell which answers were right: only together with correctness
        // (an exam shows just the total until it closes)
        $showqmarks = $showmarks && $showcorrect;
        $plain = fn($s, $fmt = FORMAT_HTML) => trim(html_entity_decode(strip_tags(format_text((string)$s, $fmt, ['para' => false])), ENT_QUOTES));
        $questions = [];
        foreach ($attemptobj->get_slots() as $slot) {
            $qa = $attemptobj->get_question_attempt($slot);
            $q = $qa->get_question();
            $state = $qa->get_state();
            $response = (string)($qa->get_response_summary() ?? '');
            $right = $showright ? (string)($qa->get_right_answer_summary() ?? '') : '';
            if ($q->get_type_name() === 'truefalse') {
                // Moodle's summary is a word in Moodle's language ("True"): send a value, the UI translates it
                $given = $qa->get_last_qt_data();
                $response = isset($given['answer']) ? ($given['answer'] ? 'true' : 'false') : '';
                $right = $showright ? ($q->rightanswer ? 'true' : 'false') : '';
            }
            $questions[] = [
                'slot' => (int)$slot, 'type' => $q->get_type_name(),
                'text' => $plain($q->questiontext, $q->questiontextformat),
                'response' => $response,
                'rightanswer' => $right,
                'mark' => $showqmarks && $qa->get_mark() !== null ? (float)$qa->get_mark() : -1.0,
                'maxmark' => (float)$qa->get_max_mark(),
                'result' => $showcorrect ? ($state->is_graded() ? $state->get_feedback_class() : ($state == \question_state::$needsgrading ? 'needsgrading' : 'unanswered')) : '',
                'comment' => $plain($qa->get_manual_comment()[0] ?? '', (int)($qa->get_manual_comment()[1] ?? FORMAT_PLAIN)),
                'explanation' => $showright ? $plain($q->generalfeedback, $q->generalfeedbackformat) : '',
            ];
        }
        $attempt = $attemptobj->get_attempt();
        $needsgrading = $attemptobj->requires_manual_grading();
        return [
            'id' => (int)$attempt->id, 'cmid' => (int)$attemptobj->get_cmid(), 'name' => $quiz->name, 'userid' => (int)$attempt->userid,
            'timefinish' => (int)$attempt->timefinish, 'needsgrading' => $needsgrading,
            'grade' => $showmarks && !$needsgrading && $attempt->sumgrades !== null ? (float)quiz_rescale_grade($attempt->sumgrades, $quiz, false) : -1.0,
            'questions' => $questions,
        ];
    }

    private static function review_structure(): external_single_structure {
        return new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Attempt'),
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'name' => new external_value(PARAM_TEXT, 'Quiz title'),
            'userid' => new external_value(PARAM_INT, 'Student'),
            'timefinish' => new external_value(PARAM_INT, 'Submitted at'),
            'needsgrading' => new external_value(PARAM_BOOL, 'Some answers wait for the teacher'),
            'grade' => new external_value(PARAM_FLOAT, 'Grade 0–100, −1 = not shown yet'),
            'questions' => new external_multiple_structure(new external_single_structure([
                'slot' => new external_value(PARAM_INT, 'Slot'),
                'type' => new external_value(PARAM_ALPHA, 'Question type'),
                'text' => new external_value(PARAM_RAW, 'Question text'),
                'response' => new external_value(PARAM_RAW, 'The student\'s answer (summary)'),
                'rightanswer' => new external_value(PARAM_RAW, 'Correct answer (summary), \'\' when hidden'),
                'mark' => new external_value(PARAM_FLOAT, 'Points, −1 = hidden'),
                'maxmark' => new external_value(PARAM_FLOAT, 'Max points'),
                'result' => new external_value(PARAM_ALPHA, 'correct | partiallycorrect | incorrect | needsgrading | unanswered | \'\' hidden'),
                'comment' => new external_value(PARAM_RAW, 'Teacher comment'),
                'explanation' => new external_value(PARAM_RAW, 'Explanation shown after the answer'),
            ])),
        ]);
    }

    public static function review_attempt_parameters(): external_function_parameters {
        return self::get_attempt_parameters();
    }

    /** Student: review a finished attempt (as much as the quiz shows at this time). */
    public static function review_attempt(int $attemptid, int $userid): array {
        $p = self::validate_parameters(self::review_attempt_parameters(), compact('attemptid', 'userid'));
        self::setup();
        $attemptobj = self::own_attempt($p['attemptid'], $p['userid']);
        if (!$attemptobj->is_finished()) {
            throw self::deny('review an attempt in progress');
        }
        return self::review($attemptobj, false);
    }

    public static function review_attempt_returns(): external_single_structure {
        return self::review_structure();
    }

    // ----- teacher: results and grading ----------------------------------

    public static function quiz_results_parameters(): external_function_parameters {
        return self::get_quiz_parameters();
    }

    /** Every student who should take the quiz, with their last finished attempt and grade. */
    public static function quiz_results(int $cmid, int $userid): array {
        global $DB;
        $p = self::validate_parameters(self::quiz_results_parameters(), compact('cmid', 'userid'));
        self::setup();
        [$cm, $course, $quiz] = self::taught_quiz($p['cmid'], $p['userid']);
        $info = new \core_availability\info_module(\cm_info::create($cm));
        $students = $info->filter_user_list(learning::students_of($course->id));
        $rows = [];
        foreach ($students as $u) {
            $attempts = quiz_get_user_attempts($quiz->id, $u->id, 'all', true);
            $last = null;
            $state = 'notstarted';
            foreach ($attempts as $a) {
                if ($a->state === quiz_attempt::FINISHED) {
                    $last = $a;
                    $state = 'finished';
                } else if ($state !== 'finished') {
                    $state = 'inprogress';
                }
            }
            $needs = $last ? quiz_attempt::create($last->id)->requires_manual_grading() : false;
            $best = quiz_get_best_grade($quiz, $u->id);
            $rows[] = learning::person($u) + [
                'state' => $needs ? 'needsgrading' : $state,
                'attemptid' => $last ? (int)$last->id : 0,
                'grade' => $best === null || $needs ? -1.0 : (float)$best,
                'timefinish' => $last ? (int)$last->timefinish : 0,
            ];
        }
        return self::quiz_info($cm, $quiz) + ['students' => $rows];
    }

    public static function quiz_results_returns(): external_single_structure {
        return new external_single_structure(self::quiz_info_structure() + [
            'students' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_INT, 'User id'),
                'name' => new external_value(PARAM_TEXT, 'Full name'),
                'email' => new external_value(PARAM_RAW, 'Email'),
                'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
                'state' => new external_value(PARAM_ALPHA, 'notstarted | inprogress | needsgrading | finished'),
                'attemptid' => new external_value(PARAM_INT, 'Last finished attempt (0 = none)'),
                'grade' => new external_value(PARAM_FLOAT, 'Best grade 0–100, −1 = none yet'),
                'timefinish' => new external_value(PARAM_INT, 'Submitted at'),
            ])),
        ]);
    }

    public static function teacher_review_parameters(): external_function_parameters {
        return new external_function_parameters([
            'attemptid' => new external_value(PARAM_INT, 'Attempt'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
        ]);
    }

    /** Teacher: a student's finished attempt, everything shown. */
    public static function teacher_review(int $attemptid, int $userid): array {
        $p = self::validate_parameters(self::teacher_review_parameters(), compact('attemptid', 'userid'));
        self::setup();
        $attemptobj = quiz_attempt::create($p['attemptid']);
        self::taught_quiz($attemptobj->get_cmid(), $p['userid']);
        if (!$attemptobj->is_finished()) {
            throw self::deny('review an attempt in progress');
        }
        return self::review($attemptobj, true);
    }

    public static function teacher_review_returns(): external_single_structure {
        return self::review_structure();
    }

    public static function grade_answer_parameters(): external_function_parameters {
        return new external_function_parameters([
            'attemptid' => new external_value(PARAM_INT, 'Attempt'),
            'userid' => new external_value(PARAM_INT, 'Acting Budu user (teacher)'),
            'slot' => new external_value(PARAM_INT, 'Question slot'),
            'mark' => new external_value(PARAM_FLOAT, 'Points (0 … max)'),
            'comment' => new external_value(PARAM_RAW, 'Comment (plain text)', VALUE_DEFAULT, ''),
        ]);
    }

    /** Teacher grades one answer (written answers, or overriding an automatic mark). */
    public static function grade_answer(int $attemptid, int $userid, int $slot, float $mark, string $comment = ''): array {
        global $DB;
        $p = self::validate_parameters(self::grade_answer_parameters(), compact('attemptid', 'userid', 'slot', 'mark', 'comment'));
        self::setup();
        $attemptobj = quiz_attempt::create($p['attemptid']);
        [, , $quiz] = self::taught_quiz($attemptobj->get_cmid(), $p['userid']);
        if (!$attemptobj->is_finished() || !in_array($p['slot'], $attemptobj->get_slots())) {
            throw new \invalid_parameter_exception('cannot grade this answer');
        }
        $max = (float)$attemptobj->get_question_attempt($p['slot'])->get_max_mark();
        if ($p['mark'] < 0 || $p['mark'] > $max) {
            throw new \invalid_parameter_exception('mark out of range');
        }
        $transaction = $DB->start_delegated_transaction();
        $quba = \question_engine::load_questions_usage_by_activity($attemptobj->get_uniqueid());
        $quba->manual_grade($p['slot'], $p['comment'], $p['mark'], FORMAT_PLAIN);
        \question_engine::save_questions_usage_by_activity($quba);
        $DB->set_field('quiz_attempts', 'sumgrades', $quba->get_total_mark(), ['id' => $p['attemptid']]);
        $DB->set_field('quiz_attempts', 'timemodified', time(), ['id' => $p['attemptid']]);
        $transaction->allow_commit();
        quiz_settings::create($quiz->id)->get_grade_calculator()->recompute_final_grade($attemptobj->get_userid());
        quiz_update_grades($quiz, $attemptobj->get_userid());
        $after = quiz_attempt::create($p['attemptid']);
        return ['needsgrading' => $after->requires_manual_grading(), 'studentid' => (int)$after->get_userid()];
    }

    public static function grade_answer_returns(): external_single_structure {
        return new external_single_structure([
            'needsgrading' => new external_value(PARAM_BOOL, 'Other answers still wait'),
            'studentid' => new external_value(PARAM_INT, 'The student'),
        ]);
    }

    // ----- reminders -------------------------------------------------------

    public static function closing_soon_parameters(): external_function_parameters {
        return new external_function_parameters([
            'from' => new external_value(PARAM_INT, 'Closing after (unix time)'),
            'to' => new external_value(PARAM_INT, 'Closing up to (unix time)'),
        ]);
    }

    /** Published quizzes closing in (from, to], with the students who should take them and have not started. */
    public static function closing_soon(int $from, int $to): array {
        global $DB;
        $p = self::validate_parameters(self::closing_soon_parameters(), compact('from', 'to'));
        self::setup();
        $out = [];
        $rows = $DB->get_records_sql("SELECT cm.id AS cmid FROM {quiz} q
            JOIN {course_modules} cm ON cm.instance = q.id AND cm.deletioninprogress = 0 AND cm.visible = 1
            JOIN {modules} m ON m.id = cm.module AND m.name = 'quiz'
            JOIN {course} c ON c.id = q.course AND c.visible = 1
           WHERE q.timeclose > ? AND q.timeclose <= ?", [$p['from'], $p['to']]);
        foreach ($rows as $r) {
            $cm = get_coursemodule_from_id('quiz', $r->cmid, 0, false, MUST_EXIST);
            $quiz = $DB->get_record('quiz', ['id' => $cm->instance], '*', MUST_EXIST);
            $course = get_course($cm->course);
            $info = new \core_availability\info_module(\cm_info::create($cm));
            $students = [];
            foreach ($info->filter_user_list(learning::students_of($course->id)) as $u) {
                if (!$DB->record_exists('quiz_attempts', ['quiz' => $quiz->id, 'userid' => $u->id, 'preview' => 0])) {
                    $students[] = learning::person($u);
                }
            }
            if ($students) {
                $out[] = ['cmid' => (int)$cm->id, 'courseid' => (int)$course->id, 'coursename' => $course->fullname,
                    'name' => $quiz->name, 'kind' => self::kind($cm), 'timeclose' => (int)$quiz->timeclose, 'students' => $students];
            }
        }
        return $out;
    }

    public static function closing_soon_returns(): external_multiple_structure {
        return new external_multiple_structure(new external_single_structure([
            'cmid' => new external_value(PARAM_INT, 'Quiz'),
            'courseid' => new external_value(PARAM_INT, 'Course'),
            'coursename' => new external_value(PARAM_TEXT, 'Course title'),
            'name' => new external_value(PARAM_TEXT, 'Quiz title'),
            'kind' => new external_value(PARAM_ALPHA, 'quiz | exam'),
            'timeclose' => new external_value(PARAM_INT, 'Closes at'),
            'students' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_INT, 'User id'),
                'name' => new external_value(PARAM_TEXT, 'Full name'),
                'email' => new external_value(PARAM_RAW, 'Email'),
                'picture' => new external_value(PARAM_INT, 'Profile picture file id, 0 = none'),
            ])),
        ]));
    }

    public static function opening_now_parameters(): external_function_parameters {
        return self::closing_soon_parameters();
    }

    /** Published quizzes whose scheduled publish time is in (from, to], with the students who get them. */
    public static function opening_now(int $from, int $to): array {
        global $DB;
        $p = self::validate_parameters(self::opening_now_parameters(), compact('from', 'to'));
        self::setup();
        $out = [];
        $rows = $DB->get_records_sql("SELECT cm.id AS cmid FROM {quiz} q
            JOIN {course_modules} cm ON cm.instance = q.id AND cm.deletioninprogress = 0 AND cm.visible = 1
            JOIN {modules} m ON m.id = cm.module AND m.name = 'quiz'
            JOIN {course} c ON c.id = q.course AND c.visible = 1
           WHERE q.timeopen > ? AND q.timeopen <= ?", [$p['from'], $p['to']]);
        foreach ($rows as $r) {
            $cm = get_coursemodule_from_id('quiz', $r->cmid, 0, false, MUST_EXIST);
            $quiz = $DB->get_record('quiz', ['id' => $cm->instance], '*', MUST_EXIST);
            $course = get_course($cm->course);
            $info = new \core_availability\info_module(\cm_info::create($cm));
            $students = array_values(array_map(fn($u) => learning::person($u), $info->filter_user_list(learning::students_of($course->id))));
            $out[] = ['cmid' => (int)$cm->id, 'courseid' => (int)$course->id, 'coursename' => $course->fullname,
                // same shape as closing_soon ('timeclose' carries the publish time here)
                'name' => $quiz->name, 'kind' => self::kind($cm), 'timeclose' => (int)$quiz->timeopen, 'students' => $students];
        }
        return $out;
    }

    public static function opening_now_returns(): external_multiple_structure {
        return self::closing_soon_returns();
    }
}
