import type { en } from "./en";

/** Russian plural: 1 урок, 2 урока, 5 уроков (one / few / many). */
const plural = (n: number, one: string, few: string, many: string) => {
  const d = n % 10;
  const h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
};

/** Russian UI strings. Same keys as en.ts. */
export const ru: typeof en = {
  appName: "Budu",
  pricesIn: "Цены в",
  currencySearch: "Найти валюту",
  currencyNone: "Ничего не найдено",
  moreActions: "Ещё действия",
  audit: {
    title: "Журнал действий",
    sub: "Всё, что люди делают на платформе, — сначала новое.",
    search: "Поиск по имени, email или объекту",
    action: "Действие",
    allActions: "Все действия",
    onlyFailed: "Только неудачные",
    apply: "Показать",
    count: (n: number) => `${n} ${plural(n, "запись", "записи", "записей")}`,
    empty: "Пока пусто.",
    failed: "Неудачно",
    nobody: "Не вошёл в систему",
  },
  errorsAdmin: {
    title: "Ошибки",
    sub: "Каждая отдельная проблема, сначала свежие. В рабочей версии о каждой новой приходит письмо.",
    count: (n: number) =>
      `${n} ${plural(n, "разная ошибка", "разные ошибки", "разных ошибок")}`,
    empty: "Ошибок нет. Всё хорошо.",
    browser: "В браузере",
    server: "На сервере",
    times: (n: number) =>
      n === 1
        ? "Случилась один раз"
        : `Случилась ${n} ${plural(n, "раз", "раза", "раз")}`,
    first: "впервые",
    last: "последний раз",
    user: "пользователь",
    page: "Страница",
    school: "школа",
    nobody: "Не вошёл в систему",
    emailed: "Письмо",
    notEmailed: "Нет (только в рабочей версии)",
  },
  errorPage: {
    title: "Что-то пошло не так",
    body: "Мы уже знаем об этом и разберёмся. Попробуйте ещё раз или перейдите на главную.",
    retry: "Попробовать ещё раз",
    home: "На главную",
  },
  pager: {
    range: (from: number, to: number, total: number) =>
      `${from}–${to} из ${total}`,
    prev: "Предыдущая страница",
    next: "Следующая страница",
  },
  datePick: "Выберите дату",
  dateClear: "Очистить",
  monthPrev: "Предыдущий месяц",
  monthNext: "Следующий месяц",
  actionsFor: (name: string) => `Действия: «${name}»`,
  connection: {
    offline: "Нет подключения к интернету. Проверьте соединение.",
    back: "Снова в сети",
  },
  searchPh: "Поиск…",
  settings: "Настройки",
  notifications: "Уведомления",
  theme: "Сменить тему",
  roleLabel: "Роль",
  soon: "Скоро",
  showPassword: "Показать пароль",
  hidePassword: "Скрыть пароль",

  role: {
    admin: "Администратор",
    manager: "Менеджер",
    teacher: "Учитель",
    student: "Ученик",
    parent: "Родитель",
  },

  nav: {
    activity: "Журнал действий",
    errors: "Ошибки",
    schoolPage: "Страница школы",
    myCourses: "Мои курсы",
    tenants: "Организации",
    deals: "Сделки по курсам",
    platformSettings: "Настройки платформы",
    home: "Главная",
    timetable: "Расписание",
    myClasses: "Мои классы",
    explore: "Каталог",
    live: "Онлайн-урок",
    dashboard: "Обзор",
    courses: "Курсы",
    grading: "Проверка",
    gradebook: "Журнал",
    school: "Школа",
    classes: "Классы",
    people: "Люди",
    schedule: "Расписание",
    settings: "Настройки",
    family: "Мои дети",
    messages: "Сообщения",
    payments: "Платежи",
    exams: "Экзамены",
  },

  subject: {
    math: "Математика",
    phys: "Физика",
    rus: "Русский язык",
    eng: "Английский язык",
    ar: "Арабский язык",
  },

  withTeacher: "с учителем",
  room: "Класс",
  joinNow: "Войти на урок",
  viewAll: "Все",
  nowShort: "Сейчас",
  min: "мин",

  home: {
    todayDate: "Четверг · 18 октября",
    hi: (name: string) => `Привет, ${name}`,
    classLine: "10-А класс · Lincoln Online School",
    yourNext: "СЛЕДУЮЩИЙ УРОК",
    nextSubject: "Математика — производные на практике",
    startsAt: "начало в 10:30",
    then: "Затем в 12:00 · Физика, Сергей Кузнецов",
    today: "Уроки сегодня",
    fullWeek: "Вся неделя",
    subjectsTitle: "Мои предметы",
    hwTitle: "Домашние задания",
    nextLesson: "Следующий урок",
    todayTitle: "Сегодня",
    noLessonsToday: "Сегодня уроков нет.",
    noUpcoming: "Ближайших уроков нет.",
    eventsTitle: "События школы",
    inMin: (n: number) => `через ${n} мин`,
    annTitle: "Новости школы",
    ann: "Родительское собрание перенесено на пятницу, 24 октября, 18:00. Экзамены в 10 классе начинаются на неделе 3 ноября.",
  },

  timetable: {
    title: "Расписание",
    today: "Сегодня",
    prev: "Предыдущая неделя",
    next: "Следующая неделя",
    noItems: "Ничего не запланировано.",
    emptyWeek: "На этой неделе ничего не запланировано.",
    allDay: "Весь день",
    schoolEvent: "Событие школы",
    place: "Место",
    teacher: "Учитель",
    class: "Класс",
    openCourse: "Открыть курс",
    addEvent: "Добавить событие",
    addEventSub:
      "Все в вашей школе увидят его в расписании и получат уведомление.",
    eventTitle: "Название",
    eventTitlePh: "Например, научная ярмарка",
    date: "Дата",
    start: "Начало",
    end: "Конец",
    allDayToggle: "Весь день",
    details: "Место / подробности (необязательно)",
    save: "Добавить событие",
    saving: "Добавляем…",
    cancel: "Отмена",
    deleteEvent: "Удалить событие",
    now: "Сейчас",
    errors: {
      invalid: "Укажите название, дату и время (конец позже начала).",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  admin: {
    tenantsTitle: "Организации",
    tenantsSub: "Все школы, компании и независимые учителя на Budu.",
    total: (n: number) =>
      `${n} ${plural(n, "организация", "организации", "организаций")}`,
    cols: {
      name: "Название",
      kind: "Тип",
      location: "Город",
      status: "Статус",
      id: "ID",
    },
    kinds: { school: "Школа", teacher: "Учитель", unknown: "—" },
    active: "Активна",
    suspended: "Приостановлена",
    empty: "Пока нет организаций.",
  },

  hub: {
    breadcrumb: "10-А класс · Lincoln Online School",
    students: "учеников",
    nextLive: "СЛЕДУЮЩИЙ ОНЛАЙН-УРОК · ЧЕРЕЗ 12 МИН",
    tabs: {
      lessons: "Уроки",
      homework: "Домашние задания",
      classmates: "Одноклассники",
    },
    done: "Пройден",
    resume: "Продолжить",
    soon: "Скоро",
    submit: "Сдать",
    graded: "Оценено",
  },

  lesson: {
    back: "Назад к предмету",
    about: "Об уроке",
    materials: "Материалы",
    contents: "Уроки курса",
    prev: "Назад",
    next: "Следующий урок",
    complete: "Отметить пройденным",
    completed: "✓ Пройден",
    liveShort: "идёт",
  },

  homework: {
    back: "Назад к предмету",
    instructions: "Задание",
    yours: "Ваш ответ",
    answerPh: "Введите ответ…",
    upload: "Загрузить файл",
    uploadHint: "PDF, изображение или документ",
    submit: "Сдать задание",
    notYet: "Ещё не сдано",
    doneTitle: "Сдано",
    doneSub: "Только что · ждёт проверки",
  },

  courses: {
    uploadState: {
      uploading: "Загрузка…",
      resuming: "Продолжаем с места остановки…",
      processing: "Обработка — почти готово…",
      offline: "Ждём подключения…",
      offlineHint:
        "Интернет пропал. Загрузка продолжится сама, когда связь вернётся, — не закрывайте страницу.",
      offlineStopped:
        "Связи не было слишком долго. Нажмите «Продолжить», когда интернет вернётся.",
      failed:
        "Загрузка остановилась. Нажмите «Продолжить», чтобы продолжить с места остановки.",
      retry: (pct: number) => `Продолжить (${pct}%)`,
      cancel: "Отменить загрузку",
      left: (s: number) =>
        s < 60 ? `осталось ${s} с` : `осталось ${Math.round(s / 60)} мин`,
    },
    cover: {
      title: "Обложка",
      upload: "Загрузить изображение",
      change: "Сменить изображение",
      uploading: "Загрузка…",
      remove: "Удалить",
      hint: "Показывается на карточке курса в каталоге. PNG, JPG или WebP до 5 МБ; лучше всего широкие (16:9).",
      errors: {
        notImage: "Выберите изображение PNG, JPG, GIF или WebP.",
        tooBig: "Изображение больше 5 МБ.",
        server: "Не удалось сохранить изображение. Попробуйте ещё раз.",
      },
    },
    tabs: {
      content: "Содержание",
      students: "Ученики",
      schedule: "Расписание",
      announcements: "Объявления",
      quizzes: "Тесты",
    },
    title: "Мои курсы",
    sub: "Курсы, которые вы публикуете — для каталога или для школ.",
    newCourse: "Новый курс",
    empty:
      "Курсов пока нет. Создайте первый — добавьте уроки, видео, PDF и задания.",
    edit: "Изменить",
    back: "Мои курсы",
    published: "Опубликован",
    draft: "Черновик",
    lessonCount: (n: number) => `${n} ${plural(n, "урок", "урока", "уроков")}`,
    updated: "Изменён",
    loadError: "Не удалось загрузить курсы. Попробуйте чуть позже.",

    newTitle: "Новый курс",
    newSub: "Начните с названия и короткого описания. Уроки добавите дальше.",
    name: "Название курса",
    namePh: "Например, Математический анализ",
    desc: "Описание",
    descPh: "Чему научатся ученики…",
    create: "Создать курс",
    creating: "Создаём…",
    details: "О курсе",
    save: "Сохранить",
    saving: "Сохраняем…",
    saved: "✓ Сохранено",
    author: "Автор:",
    underName: "публикуется под вашим именем",
    status: "Статус",
    draftHint: "Курс видите только вы. Опубликуйте его, когда он будет готов.",
    publishedHint:
      "Ученики видят опубликованную версию. Ваши правки остаются неопубликованными, пока вы их не опубликуете.",
    publish: "Опубликовать курс",
    unpublish: "Снять с публикации",
    unpublishTitle: (title: string) => `Снять «${title}» с публикации?`,
    unpublishDesc:
      "Записанные ученики потеряют доступ к курсу, пока вы не опубликуете его снова.",
    unpublishApplies: "Неопубликованные изменения будут применены.",
    changes: (n: number) => `Неопубликованных изменений: ${n}`,
    changesHint: "Ученики пока видят опубликованную версию.",
    publishChanges: "Опубликовать изменения",
    discardChanges: "Отменить изменения",
    discardTitle: "Отменить все неопубликованные изменения?",
    discardDesc:
      "Новые уроки и материалы удалятся, правки и удаления отменятся. Ученики ничего не заметят.",
    keepEditing: "Продолжить редактирование",
    undoChanges: "Отменить изменения",
    keepIt: "Не удалять",
    draftState: { new: "Новое", changed: "Изменено", removed: "Будет удалено" },

    lessons: "Уроки",
    noLessons: "Уроков пока нет. Добавьте первый ниже.",
    addLesson: "Добавить урок",
    lessonName: "Название урока",
    lessonNamePh: "Например, Введение",
    lessonDesc: "Об уроке (необязательно)",
    lessonDescPh: "О чём этот урок…",
    cancel: "Отмена",
    moveUp: "Выше",
    moveDown: "Ниже",
    rename: "Изменить урок",
    delete: "Удалить",
    emptyLesson: "В этом уроке пока ничего нет.",

    addMaterial: "Добавить видео или PDF",
    materialFile: "Файл",
    materialHint: (mb: number) =>
      `Видео, PDF, презентации или документы · до ${mb} МБ`,
    materialName: "Название для учеников (необязательно)",
    upload: "Загрузить",
    uploading: "Загружаем… не закрывайте страницу",
    open: "Открыть",
    kind: {
      video: "Видео",
      file: "Файл",
      text: "Текст",
      task: "Домашнее задание",
    },

    addText: "Добавить текст",
    textName: "Заголовок",
    textNamePh: "например, Законы Ньютона — конспект",
    textBody: "Текст",
    textSave: "Сохранить текст",
    editText: "Изменить текст",
    addTask: "Добавить домашнее задание",
    taskName: "Название задания",
    taskNamePh: "Например, Домашнее задание 1: производные",
    instructions: "Что нужно сделать",
    instructionsPh: "Что ученики должны сделать и сдать…",
    due: "Срок сдачи (необязательно)",
    dueOn: "Срок:",
    noDue: "Без срока",
    attachment: "Вложение (необязательно)",
    replaceAttachment: "Заменить вложение (необязательно)",
    taskSave: "Сохранить задание",
    editTask: "Изменить задание",
    taskHint: "Ученики отвечают текстом и/или загружают файлы. Оценка 0–100.",

    errors: {
      invalid: "Заполните обязательные поля.",
      tooLong: "Слишком длинно — сократите, пожалуйста.",
      noFile: "Выберите файл для загрузки.",
      tooBig: "Файл слишком большой для загрузки.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  hw: {
    status: { new: "Сделать", submitted: "Сдано", graded: "Оценено" },
    late: "С опозданием",
    due: "Срок",
    noDue: "Без срока",
    outOf: "/ 100",
  },

  teach: {
    studentCount: (n: number) =>
      `${n} ${plural(n, "ученик", "ученика", "учеников")}`,
    greeting: (name: string) => `С возвращением, ${name}`,
    sub: "Ваши курсы, ученики и домашние задания.",
    stats: {
      students: "Ученики",
      studentsSub: (n: number) =>
        `в ${n} ${plural(n, "курсе", "курсах", "курсах")}`,
      courses: "Курсы",
      coursesSub: (n: number) => `опубликовано: ${n}`,
      toGrade: "Проверить",
      toGradeSub: "ответов ждут",
      dueWeek: "Сроки на неделе",
      dueWeekSub: "домашних заданий",
    },
    toGradeTitle: "Ждут вашей оценки",
    toGradeEmpty: "Проверять нечего — всё проверено.",
    openGrading: "К проверке",
    coursesTitle: "Ваши курсы",
    cols: {
      course: "Курс",
      students: "Ученики",
      homework: "Задания",
      toGrade: "Проверить",
      status: "Статус",
    },
    open: "Открыть",
    noClasses: "Курсов пока нет — создайте курс в разделе «Курсы».",
    studentsTitle: "Ученики",
    studentsSub:
      "Добавляйте учеников по почте, с которой они зарегистрировались.",
    email: "Почта ученика",
    emailPh: "student@example.com",
    add: "Добавить ученика",
    adding: "Добавляем…",
    enrol: {
      enrolled: "✓ Ученик добавлен",
      already: "Этот ученик уже записан на курс.",
      notfound:
        "Аккаунта Budu с такой почтой нет. Попросите ученика сначала зарегистрироваться.",
      notstudent: "Этот аккаунт нельзя добавить как ученика.",
      invalid: "Введите правильный адрес почты.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
    remove: "Убрать",
    noStudents: "Учеников пока нет.",
    manageStudents: "Ученики",
    gradebookLink: "Журнал",
  },

  grading: {
    title: "Проверка",
    sub: "Ответы, которые сдали ваши ученики.",
    allHomework: "Все задания",
    toGrade: "Проверить",
    graded: "Оценено",
    empty:
      "Ответов пока нет. Они появятся здесь, когда ученики сдадут задания.",
    pick: "Выберите ответ в списке.",
    handedIn: "Сдано",
    answer: "Ответ",
    noAnswer: "Письменного ответа нет.",
    files: "Файлы",
    grade: "Оценка (0–100)",
    feedback: "Комментарий",
    feedbackPh: "Напишите комментарий для ученика…",
    save: "Сохранить оценку",
    saveNext: "Сохранить и дальше",
    saving: "Сохраняем…",
    saved: "✓ Оценка сохранена",
    errors: {
      invalid: "Введите оценку от 0 до 100.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  gradebook: {
    title: "Журнал",
    sub: "Оценки каждого ученика за каждое задание по шкале вашей школы.",
    course: "Курс",
    noCourses: "Курсов пока нет.",
    noStudents: "На этом курсе пока нет учеников.",
    noHomework: "В этом курсе пока нет заданий.",
    student: "Ученик",
    average: "Средний",
    classAverage: "Средний по курсу",
    handedIn: "Сдано",
    gradedCount: "Оценено",
    submittedNotGraded: "Сдано, не оценено",
  },

  learn: {
    coursesTitle: "Мои курсы",
    coursesSub: "Ваши курсы. Откройте курс, чтобы увидеть уроки и задания.",
    empty:
      "Вы пока не записаны ни на один курс. Вас добавит учитель или школа.",
    lessonsTab: "Уроки",
    homeworkTab: "Домашние задания",
    todo: (n: number) => `сделать: ${n}`,
    noLessons: "Уроков пока нет.",
    noHomework: "Заданий пока нет.",
    homeworkDue: "Домашние задания",
    allDone: "Невыполненных заданий нет — отлично!",
    back: "Назад к курсу",
    materials: "Материалы",
    inLesson: "Задания к уроку",
    prev: "Предыдущий урок",
    next: "Следующий урок",
    contents: "Уроки курса",
    nothingYet: "В этом уроке пока ничего нет.",
    open: "Открыть",
    instructions: "Задание",
    attachments: "Вложения",
    yourAnswer: "Ваш ответ",
    answerPh: "Введите ответ…",
    addFiles: "Прикрепить файлы",
    filesHint: (mb: number) =>
      `PDF, изображения или документы · до ${mb} МБ каждый`,
    keepFiles: "Ранее сданные файлы останутся, если не прикрепить новые.",
    submit: "Сдать",
    resubmit: "Обновить ответ",
    submitting: "Сдаём…",
    submitted: "✓ Сдано",
    grade: "Оценка",
    feedback: "Комментарий учителя",
    locked: "Задание оценено, ответ больше нельзя изменить.",
    errors: {
      empty: "Напишите ответ или прикрепите файл.",
      tooBig: "Файл слишком большой.",
      closed: "Это задание больше не принимает ответы.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  notify: {
    allTab: "Все",
    unreadTab: "Непрочитанные",
    groups: { today: "Сегодня", yesterday: "Вчера", earlier: "Ранее" },
    bellUnread: (n: number) => `Уведомления, непрочитанных: ${n}`,
    title: "Уведомления",
    empty: "Новых уведомлений нет.",
    markAllRead: "Отметить все прочитанными",
    open: "Открыть в Budu",
    emailFooter: "Вы получаете эти письма о событиях в ваших курсах Budu.",
    kinds: {
      enrolled: {
        title: (p: Record<string, string>) =>
          `Вас добавили в курс «${p.course}»`,
        body: (p: Record<string, string>) =>
          `${p.by} добавил(а) вас в курс «${p.course}». Откройте его, чтобы увидеть уроки и задания.`,
      },
      homeworkNew: {
        title: (p: Record<string, string>) => `Новое задание: ${p.homework}`,
        body: (p: Record<string, string>) =>
          `В курсе «${p.course}» новое домашнее задание: «${p.homework}».`,
      },
      homeworkSubmitted: {
        title: (p: Record<string, string>) =>
          `${p.student} сдал(а) «${p.homework}»`,
        body: (p: Record<string, string>) =>
          `${p.student} сдал(а) «${p.homework}» в курсе «${p.course}». Ответ ждёт вашей оценки.`,
      },
      homeworkGraded: {
        title: (p: Record<string, string>) =>
          `Оценено: ${p.homework} — ${p.grade}`,
        body: (p: Record<string, string>) =>
          `Ваше задание «${p.homework}» в курсе «${p.course}» оценено: ${p.grade}.`,
      },
      addedToClass: {
        title: (p: Record<string, string>) => `Вы в классе «${p.class}»`,
        body: (p: Record<string, string>) =>
          `${p.by} добавил(а) вас в класс «${p.class}» в «${p.school}».`,
      },
      schoolInvite: {
        title: (p: Record<string, string>) => `«${p.school}» приглашает вас`,
        body: (p: Record<string, string>) =>
          `${p.by} приглашает вас в «${p.school}» на Budu. Роль: ${p.role}. Примите или отклоните приглашение.`,
      },
      inviteAnswered: {
        title: (p: Record<string, string>) =>
          p.answer === "accepted"
            ? `${p.name} в «${p.school}»`
            : `${p.name} отклонил(а) приглашение`,
        body: (p: Record<string, string>) =>
          p.answer === "accepted"
            ? `${p.name} принял(а) приглашение и теперь в «${p.school}». Роль: ${p.role}.`
            : `${p.name} отклонил(а) приглашение в «${p.school}».`,
      },
      schoolEvent: {
        title: (p: Record<string, string>) => `${p.school}: ${p.event}`,
        body: (p: Record<string, string>) =>
          `Новое событие школы: «${p.event}». Смотрите в расписании.`,
      },
      parentRequest: {
        title: (p: Record<string, string>) =>
          `${p.child} просит подтвердить, что вы родитель`,
        body: (p: Record<string, string>) =>
          `${p.child} указал(а) вас как родителя на Budu. Подтвердите, чтобы следить за домашними заданиями и оценками и общаться с учителями.`,
      },
      parentAnswered: {
        title: (p: Record<string, string>) =>
          p.answer === "accepted"
            ? `${p.parent} теперь ваш родитель на Budu`
            : `${p.parent} отклонил(а) запрос`,
        body: (p: Record<string, string>) =>
          p.answer === "accepted"
            ? `${p.parent} подтвердил(а) запрос и теперь видит ваши успехи и может писать учителям.`
            : `${p.parent} отклонил(а) запрос. Вы можете добавить другого родителя в настройках.`,
      },
      newMessage: {
        title: (p: Record<string, string>) => `Новое сообщение от ${p.from}`,
        body: (p: Record<string, string>) =>
          `${p.from} пишет вам об ученике ${p.child}: «${p.preview}»`,
      },
      announcement: {
        title: (p: Record<string, string>) => `${p.school}: ${p.title}`,
        body: (p: Record<string, string>) =>
          p.body || `Новое объявление от «${p.school}»: «${p.title}».`,
      },
      orderConfirmed: {
        title: (p: Record<string, string>) =>
          `Вы записаны на курс «${p.course}»`,
        body: (p: Record<string, string>) =>
          `Оплата курса «${p.course}» (заказ ${p.order}) подтверждена. Откройте курс и начинайте учиться.`,
      },
      orderRejected: {
        title: (p: Record<string, string>) =>
          `Оплата не подтверждена: ${p.course}`,
        body: (p: Record<string, string>) =>
          `Не удалось подтвердить оплату курса «${p.course}» (заказ ${p.order}). Напишите на billing@budu-school.ru.`,
      },
      quizPublished: {
        title: (p: Record<string, string>) =>
          `${p.kind === "exam" ? "Новый экзамен" : "Новый тест"}: ${p.quiz}`,
        body: (p: Record<string, string>) =>
          `${p.kind === "exam" ? "Экзамен" : "Тест"} «${p.quiz}» готов в курсе «${p.course}».`,
      },
      quizToGrade: {
        title: (p: Record<string, string>) =>
          `${p.student} завершил(а) «${p.quiz}»`,
        body: (p: Record<string, string>) =>
          `${p.student} сдал(а) «${p.quiz}». Некоторые ответы ждут вашей оценки.`,
      },
      quizGraded: {
        title: (p: Record<string, string>) =>
          `Оценено: ${p.quiz} — ${p.grade}/100`,
        body: (p: Record<string, string>) =>
          `Ваши ответы в «${p.quiz}» оценены: ${p.grade}/100. Откройте, чтобы увидеть отзыв.`,
      },
      examResult: {
        title: (p: Record<string, string>) =>
          `${p.child}: ${p.quiz} — ${p.grade}/100`,
        body: (p: Record<string, string>) =>
          `${p.child} получил(а) ${p.grade}/100 за экзамен «${p.quiz}».`,
      },
      quizReminder: {
        title: (p: Record<string, string>) =>
          `${p.kind === "exam" ? "Экзамен" : "Тест"} скоро закроется: ${p.quiz}`,
        body: (p: Record<string, string>) =>
          `«${p.quiz}» в курсе «${p.course}» закроется в течение суток, а вы ещё не начали.`,
      },
      examInvite: {
        title: (p: Record<string, string>) => `${p.school}: ${p.exam}`,
        body: (p: Record<string, string>) =>
          `Вас пригласили сдать экзамен «${p.exam}» в «${p.school}». Откройте, чтобы узнать, когда он открыт и сколько времени у вас будет.`,
      },
      examNudge: {
        title: (p: Record<string, string>) => `Напоминание: ${p.exam}`,
        body: (p: Record<string, string>) =>
          `Экзамен «${p.exam}» в ${p.school} ждёт вас — вы ещё не начали его.`,
      },
      addedToSchool: {
        title: (p: Record<string, string>) => `Вы в школе «${p.school}»`,
        body: (p: Record<string, string>) =>
          `${p.by} добавил(а) вас в «${p.school}» как: ${p.role}.`,
      },
    },
  },

  school: {
    overviewSub: "Ваша школа в цифрах.",
    stats: {
      teachers: "Учителя",
      teachersSub: "в вашей школе",
      students: "Ученики",
      studentsSub: "в вашей школе",
      courses: "Курсы",
      coursesSub: (n: number) => `опубликовано: ${n}`,
      homework: "Задания",
      homeworkSub: "во всех курсах",
    },
    recentPeople: "Люди",
    recentCourses: "Курсы",
    peopleTitle: "Люди",
    peopleSub: "Учителя, ученики и менеджеры вашей школы.",
    inviteTitle: "Пригласить",
    inviteSub:
      "Новым людям придёт письмо, чтобы задать пароль. Те, у кого уже есть аккаунт Budu, добавляются сразу.",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Эл. почта",
    role: "Роль",
    sendInvite: "Отправить приглашение",
    sending: "Отправляем…",
    invited: {
      created: "✓ Приглашение отправлено на почту",
      invited: "✓ Приглашение отправлено — человек вступит, когда примет его",
      pending: "У этого человека уже есть приглашение, ждём ответа.",
      already: "Этот человек уже в вашей школе.",
      invalid: "Заполните все поля и укажите правильную почту.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
    filters: {
      all: "Все",
      teacher: "Учителя",
      student: "Ученики",
      manager: "Менеджеры",
      invites: "Приглашения",
    },
    awaiting: "Ждёт ответа",
    noInvites: "Нет приглашений, ждущих ответа.",
    pending: "Ждёт активации",
    active: "Активен",
    noPeople: "Здесь пока никого нет.",
    coursesTitle: "Курсы",
    coursesSub: "Все курсы вашей школы, их учителя и ученики.",
    cols: {
      course: "Курс",
      teachers: "Учителя",
      students: "Ученики",
      lessons: "Уроки",
      homework: "Задания",
      status: "Статус",
    },
    noCourses: "Курсов пока нет. Учителя создают курсы в разделе «Курсы».",
    settingsTitle: "Настройки школы",
    settingsSub: "Настройки для всех в вашей школе.",
    location: "Местоположение",
    city: "Город",
    cityPh: "Например, Казань",
    country: "Страна",
    countrySearch: "Поиск страны",
    countryPick: "Выберите страну",
    address: "Юзернейм школы",
    addressConfirm: (name: string) => `Изменить юзернейм школы на @${name}?`,
    addressConfirmDesc: "Старые ссылки на вашу страницу перестанут работать.",
    addressChange: "Изменить",
    gradeScale: "Шкала оценок",
    gradeScaleSub:
      "Как оценки показываются учителям и ученикам. Учителя всегда ставят 0–100.",
    example: "напр.",
    save: "Сохранить",
    saving: "Сохраняем…",
    saved: "✓ Сохранено",
  },

  scales: {
    percent: "0–100",
    letter: "Буквы A–F",
    gpa: "GPA 4.0",
    ects: "ECTS A–F",
    germany: "Германия 1–5",
    france: "Франция 0–20",
    russia: "Россия 1–5",
    russiaEcts: "Россия 1–5 + ECTS",
    ten: "0–10",
    japan: "Япония S / A / B / C",
  },

  classes: {
    willMove: (from: string) => `Сейчас в «${from}» — перейдёт`,
    courseCount: (n: number) => `${n} ${plural(n, "курс", "курса", "курсов")}`,
    title: "Классы",
    sub: "Группы учеников, например год обучения. Записывайте весь класс на его курсы сразу.",
    myTitle: "Мои классы",
    mySub: "Классы, которыми вы руководите как классный руководитель.",
    myEmpty:
      "Вы не руководите классом. Школа может назначить вас классным руководителем.",
    empty: "Классов пока нет. Создайте, например, «10 класс».",
    create: "Создать класс",
    creating: "Создаём…",
    name: "Название класса",
    namePh: "Например, 10 класс или 10-А",
    desc: "Описание (необязательно)",
    cols: {
      class: "Класс",
      students: "Ученики",
      courses: "Курсы",
      teachers: "Классные руководители",
    },
    open: "Открыть",
    back: "Классы",
    save: "Сохранить",
    saving: "Сохраняем…",
    saved: "✓ Сохранено",
    details: "О классе",
    deleteClass: "Удалить класс",
    deleteHint: "Ученики выйдут из курсов, на которые записан этот класс.",
    studentsTitle: "Ученики",
    studentsSub: "Ученики вашей школы в этом классе.",
    addStudents: "Добавить в класс",
    adding: "Добавляем…",
    pickStudents: "Выберите учеников",
    allIn: "Все ученики школы уже в этом классе.",
    noStudents: "В классе пока нет учеников.",
    remove: "Убрать",
    teachersTitle: "Классные руководители",
    teachersSub:
      "Необязательно — учителя, которые ведут этот класс (видят его успеваемость).",
    noTeachers: "Классный руководитель не назначен.",
    saveTeachers: "Сохранить",
    coursesTitle: "Курсы и успеваемость",
    coursesSub: "Курсы, на которые записан класс, и как он справляется.",
    enrol: "Записать класс",
    enrolling: "Записываем…",
    pickCourse: "Выберите курс",
    noCourses: "Класс пока не записан ни на один курс.",
    handedIn: "Сдано",
    average: "Средний",
    homework: "Задания",
    gradebook: "Журнал",
    inCourseTitle: "Классы",
    inCourseSub:
      "Запишите целый класс вашей школы: ученики приходят и уходят вместе с классом.",
    noneInCourse: "Классы не записаны.",
    pickClass: "Выберите класс",
    classFilter: "Класс",
    allStudents: "Все ученики",
    noClass: "Без класса (записались сами)",
  },

  invites: {
    title: "Приглашения",
    sub: "Приглашения от школ и запросы от детей. Ничего не изменится, пока вы не примете их.",
    empty: "Сейчас приглашений нет.",
    from: (p: { school: string; role: string; by: string }) =>
      `${p.by} приглашает вас в «${p.school}». Роль: ${p.role}.`,
    accept: "Принять",
    decline: "Отклонить",
    accepted: (school: string) => `✓ Вы в «${school}»`,
    declined: "Приглашение отклонено",
    banner: (school: string) => `«${school}» приглашает вас.`,
    view: "Посмотреть приглашение",
    pendingTitle: "Ждут ответа",
    pendingSub: "Приглашения людям, у которых уже есть аккаунт Budu.",
    cancel: "Отменить приглашение",
    confirmCancel: "Отменить?",
  },

  schedule: {
    title: "Расписание",
    sub: "Еженедельные уроки курса. Ученики видят их в своём расписании.",
    add: "Добавить уроки",
    forWhom: "Для кого",
    wholeCourse: "Все ученики курса",
    days: "Дни",
    time: "Начало",
    duration: "Длительность",
    minutes: (n: number) => `${n} мин`,
    from: "С",
    until: "По",
    room: "Кабинет / заметки (необязательно)",
    roomPh: "Например, кабинет 204",
    save: "Добавить уроки",
    saving: "Добавляем…",
    none: "Уроки пока не запланированы.",
    lessons: (n: number) => `${n} ${plural(n, "урок", "урока", "уроков")}`,
    weekly: (days: string, time: string) => `${days} · ${time}`,
    delete: "Удалить",
    errors: {
      invalid:
        "Выберите хотя бы один день и правильные даты (конец позже начала).",
      tooMany: "Это больше 200 уроков — сократите период.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  family: {
    stepTitle: "Добавьте родителя",
    stepSub:
      "Родитель сможет следить за вашими заданиями и оценками и общаться с учителями. Так учиться легче.",
    parentFirst: "Имя родителя",
    parentLast: "Фамилия родителя",
    parentEmail: "Email родителя",
    send: "Отправить запрос",
    continue: "Продолжить",
    skip: "Пропустить",
    sent: (email: string) =>
      `Запрос отправлен на ${email}. Родитель получит письмо для подтверждения.`,
    errors: {
      invalid: "Проверьте имя и email.",
      self: "Нельзя добавить самого себя.",
      pending: "Запрос этому человеку уже ждёт ответа.",
      already: "Этот человек уже ваш родитель.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
    cardTitle: "Добавьте родителя",
    cardSub: "Учиться легче, когда родитель в курсе. Пригласите его в Budu.",
    cardAction: "Добавить родителя",
    parentsTitle: "Родители",
    parentsSub: "Те, кто видит ваши успехи и может писать вашим учителям.",
    noParents: "Родитель ещё не добавлен.",
    waiting: "Ждём подтверждения",
    cancel: "Отменить запрос",
    remove: "Удалить",
    requestsTitle: "Запросы от детей",
    requestFrom: (child: string) =>
      `${child} просит подтвердить, что вы родитель. Вы будете видеть задания, оценки и новости школы и сможете писать учителям.`,
    requestBanner: (child: string) =>
      `${child} просит подтвердить, что вы родитель.`,
    accept: "Подтвердить",
    decline: "Отклонить",
    homeTitle: "Мои дети",
    homeSub: "Как дела у ваших детей в школе.",
    noChildren:
      "Пока нет связанных детей. Когда ребёнок добавит вас как родителя, он появится здесь.",
    viewProgress: "Подробнее",
    thisWeek: "За 7 дней",
    periods: { day: "За 24 часа", week: "За 7 дней", month: "За 30 дней" },
    stats: {
      handedIn: "Сдано",
      late: "Сдано с опозданием",
      overdue: "Просрочено",
      average: "Средняя оценка",
    },
    feedbackTitle: "Оценки и отзывы учителей",
    noFeedback: "За этот период оценок нет.",
    overdueTitle: "Просроченные задания",
    noOverdue: "Просроченных заданий нет.",
    wasDue: "срок",
    coursesTitle: "Курсы",
    average: "Средняя",
    homeworkDone: (done: number, total: number) => `Сдано ${done} из ${total}`,
    noCourses: "Пока не записан(а) ни на один курс.",
    message: "Написать",
    eventsTitle: "События школы",
    back: "Мои дети",
    late: "С опозданием",
  },

  messages: {
    status: { sent: "Отправлено", delivered: "Доставлено", seen: "Прочитано" },
    title: "Сообщения",
    sub: "Переписка родителей и учителей.",
    empty: "Переписок пока нет.",
    emptyParent:
      "Откройте страницу ребёнка, выберите учителя и нажмите «Написать».",
    emptyTeacher:
      "Родители могут написать вам. Начать можно и со вкладки «Ученики» курса.",
    about: (child: string) => `Об ученике: ${child}`,
    placeholder: "Напишите сообщение…",
    send: "Отправить",
    noMessages: "Сообщений пока нет. Поздоровайтесь.",
    pick: "Выберите переписку.",
    parentsOf: (name: string) => `Родители: ${name}`,
    parentsOfSub: "Напишите родителю об этом ученике.",
    noParentsOf: (name: string) =>
      `У ученика ${name} пока нет родителя на Budu.`,
    messageParents: "Написать родителям",
    you: "Вы",
    back: "Все переписки",
    tooLong: "Сообщение слишком длинное.",
  },

  announcements: {
    title: "Объявления",
    sub: "Новости для всей школы или выбранных классов. Ученики, учителя и родители получат уведомление.",
    sendTo: "Кому",
    wholeSchool: "Вся школа",
    someClasses: "Выбранные классы",
    pickClasses: "Выберите один или несколько классов.",
    noClasses: "Выберите хотя бы один класс.",
    courseSub: "Новости для учеников курса и их родителей.",
    new: "Новое объявление",
    titleLabel: "Заголовок",
    bodyLabel: "Текст",
    post: "Опубликовать",
    posted: "✓ Опубликовано",
    empty: "Объявлений пока нет.",
    delete: "Удалить",
    by: (name: string) => `автор: ${name}`,
    invalid: "Добавьте заголовок.",
  },

  editor: {
    toolbar: "Форматирование",
    bold: "Жирный",
    italic: "Курсив",
    strike: "Зачёркнутый",
    h2: "Заголовок",
    h3: "Подзаголовок",
    bullet: "Маркированный список",
    ordered: "Нумерованный список",
    quote: "Цитата",
    link: "Ссылка",
    linkAddress: "Адрес ссылки",
    apply: "Применить",
    undo: "Отменить",
    redo: "Повторить",
  },

  quiz: {
    outcome: {
      excellent: "Отлично!",
      passed: "Зачёт",
      failed: "Незачёт",
      excellentMsg: "Великолепная работа — так держать.",
      passedMsg: (p: number) => `Проходной балл (${p}%) достигнут.`,
      failedMsg: (p: number) => `Проходной балл — ${p}%.`,
      tryAgain: "Попробовать ещё раз",
    },
    homeTitle: "Тесты и экзамены",
    noneOpen: "Сейчас нечего проходить.",
    examsTitle: "Экзамены",
    noExams: "Экзаменов пока нет.",
    kind: { quiz: "Тест", exam: "Экзамен" },
    state: {
      todo: "Нужно пройти",
      notOpen: "Ещё не открыт",
      inprogress: "В процессе",
      waiting: "Ждёт проверки",
      done: "Готово",
      submitted: "Сдано",
      closed: "Закрыт",
    },
    list: {
      scheduled: "Запланирован",
      tab: "Тесты",
      new: "Новый тест или экзамен",
      back: "Тесты",
      emptyTitle: "Тестов пока нет",
      empty:
        "Создайте тренировочный тест или экзамен с оценкой для этого курса.",
      noneStudent: "В этом курсе пока нет тестов и экзаменов.",
      toGrade: (n: number) => `${n} на проверку`,
      questions: (n: number) => `вопросов: ${n}`,
      attempts: (n: number) => `сдано: ${n}`,
      minutes: (n: number) => `${n} мин`,
      closes: "закрывается",
      results: "Результаты",
      edit: "Изменить",
    },
    settings: {
      title: "Настройки",
      newSub: "Выберите вид и время. Вопросы добавите на следующем шаге.",
      name: "Название",
      namePh: "например, Глава 2 — Силы",
      kind: "Вид",
      kindHint: {
        quiz: "Тренировка: любое число попыток, ответы видны сразу.",
        exam: "С оценкой: одна попытка, балл после сдачи, правильные ответы — после закрытия.",
      },
      intro: "Инструкция",
      introPh: "Что нужно знать ученикам перед началом (необязательно)",
      opens: "Открывается",
      opensHint: "Пусто — сразу после публикации.",
      closes: "Закрывается",
      closesHint: "Пусто — никогда.",
      timeLimit: "Время (минуты)",
      timeLimitHint:
        "0 — без ограничения. У каждого ученика столько минут с момента начала; когда время выйдет, сдаётся всё, что он успел ответить.",
      passMark: "Проходной балл (%)",
      passMarkHint: "Необязательно, 0–100.",
      classes: "Только для этих классов",
      classesHint: "Ничего не выбрано — для всех учеников курса.",
      create: "Создать и добавить вопросы",
      save: "Сохранить",
      saving: "Сохраняем…",
      saved: "✓ Сохранено",
      errors: {
        invalid: "Проверьте название, время и проходной балл.",
        dates: "Закрытие должно быть позже открытия.",
        server: "Что-то пошло не так. Попробуйте ещё раз.",
      },
    },
    q: {
      title: "Вопросы",
      none: "Вопросов пока нет.",
      add: "Добавить вопрос",
      pickType: "Какой вопрос?",
      changeType: "Сменить тип",
      types: {
        multichoice: "Выбор ответа",
        truefalse: "Верно / неверно",
        shortanswer: "Короткий ответ",
        numerical: "Число",
        essay: "Развёрнутый ответ",
        match: "Соответствие",
        ordering: "Порядок",
        gapselect: "Пропущенные слова",
      },
      typeHints: {
        multichoice: "Один или несколько правильных вариантов.",
        truefalse: "Утверждение, которое верно или нет.",
        shortanswer: "Слово или фраза, проверяется автоматически.",
        numerical: "Число с допустимой погрешностью.",
        essay: "Развёрнутый ответ, который вы оцениваете сами.",
        match: "Сопоставьте элементы слева и справа.",
        ordering: "Расставьте элементы в правильном порядке.",
        gapselect: "Выберите пропущенные слова в предложении.",
      },
      text: "Вопрос",
      textPh: "Введите вопрос",
      sentence: "Предложение",
      sentenceHint:
        "Правильные слова возьмите в [квадратные скобки] — они станут пропусками.",
      sentencePh: "Сила равна [массе], умноженной на [ускорение].",
      extras: "Неправильные варианты",
      extrasHint:
        "Дополнительные слова для выбора через запятую (необязательно).",
      extrasPh: "скорости, время",
      multiple: "Несколько правильных ответов",
      options: "Варианты",
      optionPh: (n: number) => `Вариант ${n}`,
      correctOption: "Правильный",
      correctHint:
        "Отметьте правильные варианты. Порядок перемешивается для каждого ученика.",
      addOption: "Добавить вариант",
      rightAnswer: "Правильный ответ",
      true: "Верно",
      false: "Неверно",
      accepted: "Принимаемые ответы",
      acceptedPh: "Принимаемый ответ",
      addAnswer: "Добавить ответ",
      caseSensitive: "Учитывать регистр",
      numbers: "Правильный ответ",
      value: "Значение",
      tolerance: "Погрешность",
      toleranceHint: "например, 9,8 ± 0,1 принимает 9,7–9,9.",
      graderInfo: "Заметки для проверки",
      graderInfoHint: "Видны только вам (необязательно).",
      pairs: "Пары",
      left: "Элемент",
      right: "Соответствует",
      addPair: "Добавить пару",
      pairsHint: "Оставьте «Элемент» пустым, чтобы добавить лишний вариант.",
      items: "Элементы в правильном порядке",
      itemPh: "Элемент",
      addItem: "Добавить элемент",
      itemsHint: "Ученики получат их перемешанными.",
      explanation: "Пояснение",
      explanationHint:
        "Показывается вместе с правильным ответом (необязательно).",
      mark: "Баллы",
      points: (n: number) => `баллов: ${n}`,
      total: (n: number, p: number) =>
        `вопросов: ${n} · баллов всего: ${p} (оценка из 100)`,
      save: "Сохранить вопрос",
      saving: "Сохраняем…",
      cancel: "Отмена",
      edit: "Изменить",
      up: "Выше",
      down: "Ниже",
      remove: "Удалить",
      locked:
        "Ученики уже проходили этот тест: вопросы можно менять, но не добавлять, удалять или переставлять.",
      errors: {
        mark: "Баллы — от 0,5 до 100.",
        text: "Введите вопрос.",
        options: "Добавьте хотя бы два варианта.",
        correct:
          "Отметьте правильный вариант (ровно один, если не разрешено несколько).",
        answers: "Добавьте хотя бы один принимаемый ответ.",
        numbers: "Введите правильное число (и число для погрешности).",
        pairs: "Добавьте хотя бы две пары.",
        items: "Добавьте хотя бы два элемента.",
        gaps: "Возьмите хотя бы одно слово в [скобки] и дайте всего не меньше двух вариантов.",
        invalid: "Проверьте вопрос.",
        server: "Не удалось сохранить. Проверьте вопрос и попробуйте ещё раз.",
      },
    },
    publish: {
      publishNow: "Опубликовать сейчас",
      scheduleButton: "Запланировать…",
      scheduleAt: "Опубликовать",
      schedule: "Запланировать",
      scheduleHint: "Ученики увидят его — и получат уведомление — в это время.",
      scheduledFor: "Будет опубликован",
      cancelSchedule: "Отменить публикацию",
      title: "Публикация",
      draft:
        "Черновик — ученики не видят. При публикации они получат уведомление (для экзаменов — и родители).",
      live: "Опубликовано — ученики видят.",
      publish: "Опубликовать",
      hide: "Скрыть от учеников",
      delete: "Удалить",
      confirmDelete: "Удалить вместе с ответами?",
      errors: {
        past: "Выберите время в будущем.",
        dates: "Закрытие должно быть позже публикации.",
        empty: "Добавьте вопросы перед публикацией.",
        server: "Что-то пошло не так. Попробуйте ещё раз.",
      },
    },
    intro: {
      questions: "Вопросов",
      timeLimit: "Время",
      noLimit: "Без ограничения",
      attempts: "Попытки",
      unlimited: "Без ограничения",
      opens: "Открывается",
      closes: "Закрывается",
      passMark: "Проходной балл",
      quizRules:
        "Тренировочный тест: балл и правильные ответы видны сразу после сдачи.",
      examRules:
        "Экзамен: одна попытка. Ответы сохраняются автоматически; когда время выйдет, работа будет сдана. Балл виден после сдачи, правильные ответы — после закрытия.",
      yourGrade: "Ваша оценка",
      seeResult: "Посмотреть результат",
      notOpen: "Ещё не открыт.",
    },
    take: {
      start: "Начать",
      continue: "Продолжить",
      starting: "Начинаем…",
      question: (n: number) => `Вопрос ${n}`,
      progress: (d: number, n: number) => `Отвечено ${d} из ${n}`,
      autosave: "Ответы сохраняются автоматически",
      saving: "Сохраняем…",
      saved: "Сохранено",
      saveFailed: "Не сохранено — проверьте подключение",
      timeLeft: "Осталось времени",
      submit: "Сдать",
      back: "Назад",
      sure: "Сдать ответы?",
      unanswered: (n: number) => `Без ответа: ${n}.`,
      answered: "Отвечено",
      pickAll: "Выберите все подходящие.",
      typeAnswer: "Ваш ответ",
      typeNumber: "Число",
      writeAnswer: "Напишите ответ",
      choose: "Выберите…",
      moveUp: "Выше",
      moveDown: "Ниже",
      gap: (n: number) => `Пропуск ${n}`,
    },
    review: {
      submitted: "Сдано",
      yourGrade: "Ваша оценка",
      waiting:
        "Некоторые ответы ждут проверки учителем. Вы получите уведомление.",
      hidden: "Оценка будет показана позже.",
      notYet: "Результат пока не показывается.",
      yourAnswer: "Ваш ответ",
      noAnswer: "Нет ответа",
      rightAnswer: "Правильный ответ",
      explanation: "Пояснение",
      comment: "Комментарий учителя",
      result: {
        correct: "Верно",
        partiallycorrect: "Частично верно",
        incorrect: "Неверно",
        needsgrading: "На проверке",
        unanswered: "Нет ответа",
      },
    },
    results: {
      title: "Результаты",
      summary: (g: number, n: number) => `Оценено ${g} из ${n} учеников`,
      average: "средняя",
      passed: (p: number, n: number) => `сдали ${p} из ${n}`,
      noStudents: "Пока никто не проходит.",
      state: {
        notstarted: "Не начат",
        inprogress: "В процессе",
        needsgrading: "Проверить",
        finished: "Готово",
      },
      grade: "Проверить",
      open: "Открыть",
    },
    grade: {
      points: "Баллы",
      comment: "Комментарий",
      commentPh: "Отзыв для ученика (необязательно)",
      save: "Сохранить оценку",
      saved: "✓ Сохранено",
      range: (max: number) => `Баллы — от 0 до ${max}.`,
      errors: {
        invalid: "Проверьте баллы.",
        server: "Не удалось сохранить. Попробуйте ещё раз.",
      },
    },
  },

  exams: {
    title: "Экзамены",
    sub: "Экзамены без курса — вступительные и входные. Выберите, кто сдаёт: классы, ученики или кандидаты по email.",
    new: "Новый экзамен",
    newSub:
      "Название, время закрытия, время на решение и проходной балл. Затем добавите вопросы и участников.",
    emptyTitle: "Экзаменов пока нет",
    empty:
      "Создайте вступительный экзамен и пригласите кандидатов по email или назначьте экзамен целым классам.",
    passMark: (p: number) => `проходной балл ${p}%`,
    audience: {
      title: "Кто сдаёт",
      sub: "Экзамен видят только эти люди. Кандидатам не нужно быть в школе.",
      classes: "Классы",
      students: "Ученики",
      candidates: "Кандидаты",
      classesHint:
        "Добавляет всех, кто сейчас в классе (пришедшие позже не добавятся).",
      search: "Поиск учеников",
      noMatch: "Никого не найдено.",
      add: "Добавить",
      addCount: (n: number) => (n ? `Добавить (${n})` : "Добавить"),
      candidatesHint:
        "Новые люди получат письмо для активации аккаунта; у кого аккаунт уже есть — получат экзамен сразу.",
      fullName: "Полное имя",
      email: "Email",
      addRow: "Добавить ещё",
      removeRow: "Убрать строку",
      pasteHint: "или вставьте список — по человеку в строке",
      inviteCount: (n: number) => (n > 1 ? `Пригласить ${n}` : "Пригласить"),
      listTitle: "Приглашённые",
      listSummary: (people: number, invited: number, notStarted: number) =>
        [
          `${people} ${plural(people, "человек приглашён", "человека приглашены", "человек приглашены")}`,
          invited
            ? `${invited} ${plural(invited, "приглашение", "приглашения", "приглашений")} ещё не ${invited % 10 === 1 && invited % 100 !== 11 ? "принято" : "приняты"}`
            : "",
          notStarted
            ? `${notStarted} ${plural(notStarted, "человек", "человека", "человек")} ещё не ${notStarted % 10 === 1 && notStarted % 100 !== 11 ? "начал" : "начали"} экзамен`
            : "",
        ]
          .filter(Boolean)
          .join(" · "),
      filterLabel: "Показать",
      filter: {
        all: "Все",
        invited: "Приглашение не принято",
        notStarted: "Экзамен не начат",
      },
      status: {
        invited: "Приглашение не принято",
        notStarted: "Экзамен не начат",
        started: "Экзамен начат",
      },
      remindOne: "Напомнить об экзамене",
      remindToast: {
        sending: "Отправляем…",
        sendingOne: (name: string) => `Напоминаем: ${name}…`,
        done: (r: { invited: number; reminded: number; recent: number }) =>
          [
            r.invited
              ? `Приглашение отправлено ещё раз: ${r.invited} ${plural(r.invited, "человек", "человека", "человек")}.`
              : "",
            r.reminded
              ? `Напоминание отправлено: ${r.reminded} ${plural(r.reminded, "человек", "человека", "человек")}.`
              : "",
            r.recent
              ? `${r.recent} ${plural(r.recent, "человеку", "людям", "людям")} уже напоминали в последний час.`
              : "",
          ]
            .filter(Boolean)
            .join(" ") || "Напоминать никому не нужно.",
      },
      bulk: {
        invited: "Отправить приглашение ещё раз всем",
        notStarted: "Напомнить всем",
        send: "Отправить",
        invitedTitle: (n: number) =>
          `Отправить приглашение ещё раз — ${n} ${plural(n, "человек", "человека", "человек")}?`,
        notStartedTitle: (n: number) =>
          `Напомнить об экзамене — ${n} ${plural(n, "человек", "человека", "человек")}?`,
        desc: "Каждый получит письмо. Тем, кому уже напоминали в последний час, не отправим.",
      },
      searchPeople: "Поиск по имени или email",
      noPeopleMatch: "Никого не нашли.",
      empty: "Пока никого — добавьте классы, учеников или кандидатов.",
      candidate: "Кандидат",
      searchClasses: "Поиск класса",
      allClasses: "Все классы",
      noClassMatch: "Таких классов нет.",
      selected: (students: string) => `Выбрано: ${students}`,
      emptyClass: "Пока нет учеников",
      remove: "Убрать",
      failed: "Что-то пошло не так. Попробуйте ещё раз.",
      added: (n: number) =>
        n === 1
          ? "Готово — экзамен уже ждёт на главной странице."
          : n
            ? `Готово — ${n} ${plural(n, "человек", "человека", "человек")} увидят экзамен на главной странице.`
            : "Этот экзамен у них уже есть.",
      rowError: {
        badEmail: "Проверьте email.",
        needName: "Это новый человек — укажите имя и фамилию.",
        admin:
          "Это аккаунт администратора платформы — он не может сдавать экзамены.",
        failed:
          "Не удалось создать аккаунт для этого email. Проверьте его и попробуйте ещё раз.",
      },
      sent: (c: {
        invited: number;
        added: number;
        already: number;
        mailFailed: number;
        left: number;
      }) =>
        [
          c.invited === 1
            ? "Приглашение отправлено."
            : c.invited
              ? `Отправили ${c.invited} ${plural(c.invited, "приглашение", "приглашения", "приглашений")}.`
              : "",
          c.added
            ? `${c.added} ${plural(c.added, "человек", "человека", "человек")} с аккаунтом ${c.added === 1 ? "получил" : "получили"} экзамен.`
            : "",
          c.already
            ? `У ${c.already} ${plural(c.already, "человека", "человек", "человек")} он уже был.`
            : "",
          c.mailFailed
            ? `${c.mailFailed} ${plural(c.mailFailed, "письмо не ушло", "письма не ушли", "писем не ушли")} — отправьте ещё раз из списка ниже.`
            : "",
          c.left === 1
            ? "Исправьте отмеченную строку и отправьте снова."
            : c.left
              ? `Исправьте отмеченные строки (${c.left}) и отправьте снова.`
              : "",
        ]
          .filter(Boolean)
          .join(" "),
      resend: "Отправить ещё раз",
      resendToast: {
        sending: (email: string) => `Отправляем приглашение на ${email}…`,
        sent: (email: string) => `Приглашение отправлено на ${email}`,
      },
      resendResult: {
        sent: "Приглашение отправлено ещё раз",
        recent: "Только что отправили — подождите минуту",
        failed: "Не удалось отправить. Попробуйте ещё раз.",
      },
    },
    results: {
      passedCount: (p: number, n: number) => `сдали ${p} из ${n}`,
      invite: "Пригласить в школу",
      inviteAll: (n: number) => `Пригласить всех сдавших (${n})`,
      invited: (n: number) => (n === 1 ? "✓ Приглашён" : `✓ Приглашено: ${n}`),
      alreadyInvited: "Приглашён",
      inSchool: "В школе",
    },
  },

  confirm: {
    untilPublish: "Ученики будут видеть его, пока вы не опубликуете изменения.",
    inviteTitle: (name: string) => `Отменить приглашение для ${name}?`,
    inviteDesc: "Принять его будет нельзя. Позже вы сможете пригласить снова.",
    dismiss: "Отмена",
    keepInvite: "Оставить приглашение",
    keepRequest: "Оставить запрос",
    unlinkClassTitle: (cls: string, course: string) =>
      `Убрать ${cls} из курса «${course}»?`,
    unlinkClassDesc:
      "Ученики класса потеряют доступ к курсу. У тех, кого вы добавили по одному, доступ останется.",
    leaveClassTitle: (name: string) => `Убрать ${name} из класса?`,
    leaveClassDesc:
      "Ученик останется в школе, но выйдет из курсов, на которые записан этот класс.",
    removeStudentTitle: (name: string) => `Убрать ${name} из курса?`,
    removeStudentDesc:
      "Уроки и задания курса станут недоступны. Позже его можно добавить снова.",
    eventTitle: (title: string) => `Удалить «${title}»?`,
    eventDesc: "Событие исчезнет из расписания у всех.",
    announcementTitle: (title: string) => `Удалить «${title}»?`,
    announcementDesc:
      "Его больше не увидят те, кто его получил, — ученики, родители и учителя.",
    seriesTitle: "Удалить эти уроки?",
    seriesDesc: (n: number) =>
      `Все уроки этой серии (${n}) исчезнут из расписания.`,
    parentTitle: (name: string) => `Убрать ${name} из ваших родителей?`,
    parentDesc:
      "Он больше не будет видеть вашу успеваемость и писать вашим учителям о вас.",
    parentRequestTitle: (email: string) => `Отменить запрос для ${email}?`,
    parentRequestDesc:
      "Ссылка из письма перестанет работать. Позже можно отправить запрос снова.",
    rejectOrderTitle: (num: string) => `Отклонить заказ ${num}?`,
    rejectOrderDesc:
      "Ученик не будет записан, ему предложат написать в бухгалтерию.",
    cannotUndo: "Это действие нельзя отменить.",
    lessonTitle: (name: string) => `Удалить «${name}»?`,
    lessonDesc:
      "Вместе с ним удалятся видео, файлы, тексты и задания — с ответами учеников. Это нельзя отменить.",
    itemTitle: (name: string) => `Удалить «${name}»?`,
    itemDesc: "Ученики больше не увидят его. Это нельзя отменить.",
    taskDesc:
      "Ответы и оценки учеников по нему тоже удалятся. Это нельзя отменить.",
    classTitle: "Удалить этот класс?",
    classDesc:
      "Ученики останутся в школе и на своих курсах — просто больше не будут в этом классе.",
    quizDesc: "Попытки и оценки учеников тоже удалятся. Это нельзя отменить.",
    questionTitle: "Удалить этот вопрос?",
    audienceTitle: (name: string) => `Убрать ${name} из экзамена?`,
    audienceDesc:
      "Экзамен перестанет быть виден. Если он уже сдан, ответы сохранятся.",
    photoTitle: "Удалить ваше фото?",
    coverTitle: "Удалить обложку?",
  },

  landing: {
    navCourses: "Курсы",
    badge: "Школы · учителя · ученики · родители",
    title: "Учёба, которая объединяет школу, учителей и семью",
    sub: "Курсы с видеоуроками, домашними заданиями, тестами и онлайн-уроками. Расписание, оценки и родители, которые всегда в курсе.",
    chips: {
      schedule: "Расписание",
      exams: "Экзамены",
      quizzes: "Тесты: 8 типов вопросов",
      grades: "Журнал оценок",
      video: "Видеоуроки",
      homework: "Домашние задания",
      chat: "Чат с учителями",
      parents: "Родители в курсе",
      classes: "Классы",
      alerts: "Уведомления",
      scales: "Оценки в вашей шкале",
      currency: "Курсы в любой валюте",
      preview: "Первый урок бесплатно",
      page: "Страница вашей школы",
      uploads: "Большие видео без обрывов",
      languages: "3 языка",
    },
    browse: "Смотреть курсы",
    start: "Создать аккаунт",
    forTitle: "Для всех, кто учится и учит",
    for: {
      schools: {
        title: "Школам",
        text: "Классы, расписание, вступительные экзамены, журнал в вашей шкале оценок и объявления для семей.",
      },
      teachers: {
        title: "Учителям",
        text: "Создавайте курсы с видео, текстом и заданиями, проводите тесты и экзамены, продавайте свои курсы.",
      },
      students: {
        title: "Ученикам",
        text: "Неделя как на ладони, уроки и задания в одном месте, результаты сразу, как будут готовы.",
      },
      parents: {
        title: "Родителям",
        text: "Каждую неделю видно, как дела у ребёнка, а с учителями можно переписываться напрямую.",
      },
    },
    coursesTitle: "Популярные курсы",
    coursesSub:
      "Начните уже сегодня — для бесплатных курсов нужен только аккаунт.",
    allCourses: "Все курсы",
    ctaWho: { students: "Ученикам", teachers: "Учителям", schools: "Школам" },
    ctaTitle: "Готовы учиться или учить?",
    ctaSub:
      "Это займёт минуту. Школы и учителя сразу смогут пригласить своих учеников.",
  },

  preview: {
    tag: "Бесплатный урок",
    locked: "Откроется после записи",
    signInToOpen: "Войдите, чтобы открыть урок",
    watch: "Бесплатный урок",
    lessonOf: (n: number) => `Урок 1 из ${n}`,
    back: "О курсе",
    nothing: "В этом уроке пока нет видео и материалов.",
    nextTitle: "Продолжить курс",
    nextFree: (n: number) =>
      `Создайте аккаунт, чтобы открыть все уроки (${n}), сдавать домашние задания и получать отзывы.`,
    nextPaid: (n: number) =>
      `Создайте аккаунт, чтобы купить курс и открыть все уроки (${n}).`,
    nextStudent: (n: number) =>
      `Запишитесь на курс, чтобы открыть все уроки (${n}).`,
    join: "Записаться на курс",
    open: "Перейти к курсу",
  },

  reviews: {
    title: "Отзывы учеников",
    new: "Новый",
    none: "Пока нет отзывов",
    count: (n: number) => `${n} ${plural(n, "отзыв", "отзыва", "отзывов")}`,
    summary: (avg: string, n: number) =>
      `${avg} из 5 — ${n} ${plural(n, "отзыв", "отзыва", "отзывов")}`,
    students: (n: number) =>
      `${n} ${plural(n, "ученик", "ученика", "учеников")}`,
    taughtIn: (lang: string) => `Язык курса: ${lang}`,
    askTitle: "Как вам курс?",
    yourRating: "Ваша оценка",
    askSub: (course: string) =>
      `Вы дошли до конца курса «${course}». Ваша оценка поможет другим ученикам выбрать.`,
    starsLabel: "Оценка",
    starN: (n: number) => `${n} из 5`,
    label: ["Плохо", "Так себе", "Хорошо", "Очень хорошо", "Отлично"],
    commentPh: "Что понравилось? Что можно улучшить? (необязательно)",
    send: "Отправить оценку",
    update: "Изменить оценку",
    sending: "Отправляем…",
    notNow: "Не сейчас",
    thanks: "Спасибо! Ваша оценка сохранена.",
    failed: "Не получилось сохранить оценку. Попробуйте ещё раз.",
  },

  seo: {
    siteName: "Budu",
    home: {
      title: "Budu — онлайн-школа для школ, учителей и семей",
      description:
        "Уроки, домашние задания, оценки, расписание и чат с родителями в одном месте. Школы, учителя и ученики учатся вместе в Budu — начать можно бесплатно.",
    },
    catalog: {
      title: "Онлайн-курсы",
      description:
        "Онлайн-курсы учителей и школ Budu: видеоуроки, домашние задания и тесты. Первый урок — бесплатно.",
    },
    schools: {
      title: "Школы на Budu",
      description:
        "Школы, которые учат с Budu: их новости, фотографии и лучшие ученики.",
    },
    pricing: {
      title: "Тарифы: ученикам бесплатно, школам по числу учеников",
      description:
        "Ученики учатся в Budu бесплатно, учителя начинают без оплаты, а школы платят по числу учеников. Расписание, экзамены, журнал и онлайн-курсы в одном месте.",
    },
    about: {
      title: "О Budu",
      description:
        "Budu объединяет школу, учителей и семьи: что мы делаем и во что верим.",
    },
    help: {
      title: "Помощь",
      description:
        "Ответы на частые вопросы о Budu и как связаться с поддержкой.",
    },
    contact: {
      title: "Контакты",
      description: "Напишите команде Budu — школы, партнёрство и поддержка.",
    },
    privacy: {
      title: "Политика конфиденциальности",
      description: "Какие данные хранит Budu, зачем и как вы ими управляете.",
    },
    terms: {
      title: "Условия использования",
      description:
        "Правила пользования Budu: аккаунты, материалы, платные курсы и ваши права.",
    },
    coursePreview: (course: string) => `${course} — первый урок бесплатно`,
  },
  site: {
    nav: {
      home: "Главная",
      courses: "Курсы",
      pricing: "Тарифы",
      schools: "Школы",
      about: "О нас",
    },
    menu: "Меню",
    closeMenu: "Закрыть меню",
    footer: {
      tagline: "Обучение, которое объединяет школу, учителей и семьи.",
      product: "Продукт",
      company: "Компания",
      help: "Помощь",
      links: {
        courses: "Курсы",
        pricing: "Тарифы",
        schools: "Школы на Budu",
        about: "О нас",
        values: "Наши ценности",
        contact: "Контакты",
        support: "Помощь и поддержка",
        privacy: "Политика конфиденциальности",
        terms: "Условия использования",
      },
      rights: (year: number) => `© ${year} Budu. Все права защищены.`,
    },
    about: {
      title: "Мы создаём место, где учатся вместе",
      sub: "Budu — это «Буду»: обещание, которое ученик даёт себе, когда решает учиться. Мы помогаем школам, учителям и семьям его сдержать.",
      storyTitle: "Зачем нужен Budu",
      story: [
        "Большинство школ живут в десятке сервисов: уроки в одном, домашние задания в другом, оценки в третьем, а переписка разбросана по мессенджерам. Учителя теряют часы, родители видят мало, ученики путаются.",
        "Budu собирает всё в одном месте: курсы с видео и текстом, домашние задания и тесты, расписание, оценки в школьной шкале, онлайн-уроки и объявления — и родители, которые видят успехи и пишут учителям.",
        "Мы делаем Budu прежде всего для русско-, арабо- и англоязычных учеников и размещаем всё на собственных серверах, чтобы уроки быстро открывались там, где живут наши ученики.",
      ],
      valuesTitle: "Наши ценности",
      values: {
        learner: {
          title: "Ученик на первом месте",
          text: "Каждый экран начинается с вопроса: помогает ли это ученику учиться?",
        },
        simple: {
          title: "Просто по умолчанию",
          text: "Меньше кликов, понятные слова, никаких инструкций. Если нужно объяснять — переделываем.",
        },
        trust: {
          title: "Доверие и приватность",
          text: "Ваши данные — ваши. Без рекламы, без продажи данных, только необходимые cookie.",
        },
        open: {
          title: "Открыто для всех",
          text: "Бесплатно для учеников и учителей, на родном языке — с телефона или ноутбука.",
        },
        families: {
          title: "Семья — часть учёбы",
          text: "Родители видят успехи и общаются с учителями — школа это командная работа.",
        },
        teachers: {
          title: "Уважение к учителям",
          text: "Учителя публикуют курсы под своим именем и сами решают, сколько они стоят.",
        },
      },
      ctaTitle: "Учитесь или преподавайте с нами",
      ctaSub: "Создайте аккаунт за минуту или расскажите нам о своей школе.",
      ctaStart: "Создать аккаунт",
      ctaContact: "Написать нам",
    },
    pricing: {
      eyebrow: "Тарифы",
      title: "Учиться должно быть интересно",
      sub: "Мы поддерживаем учеников, поэтому у них бесплатный доступ. Школы платят в зависимости от числа учеников.",
      free: "Бесплатный доступ для учеников",
      students: {
        name: "Ученикам",
        price: "Свободный доступ",
        who: "Мы поддерживаем каждого ученика",
        cta: "Начать учиться",
        features: [
          "Классы, уроки и расписание в одном месте",
          "Видео, файлы и текстовые уроки",
          "Сдавайте домашние задания, получайте оценки и отзывы",
          "Тесты и экзамены, результаты тренировок сразу",
          "Курсы из каталога, платные в вашей валюте",
          "Родители могут следить за успехами, только по вашему приглашению",
          "Напоминания о новых заданиях, оценках и экзаменах",
        ],
        soon: [
          "Обучающие онлайн-игры в свободное время",
          "AI-помощник, возможно платный",
        ],
      },
      teachers: {
        name: "Учителям",
        price: "Старт без оплаты",
        who: "Для независимых учителей и репетиторов",
        cta: "Начать преподавать",
        features: [
          "Конструктор курсов: видео, PDF, файлы, текст и задания со сроками",
          "Большие видео загружаются дальше даже после обрыва связи",
          "Тесты и экзамены: 8 типов вопросов, лимит времени, автосохранение",
          "Очередь проверки и журнал; письменные ответы проверяются вручную",
          "Продавайте курсы в любой валюте, с пробным уроком",
          "Повторяющиеся уроки в расписании",
          "Объявления и чат с родителями",
        ],
        soon: [
          "AI-набор для учителей, платно",
          "AI-помощник, возможно платный",
        ],
      },
      schools: {
        name: "Школам",
        price: "Под размер школы",
        who: "Цена зависит от того, сколько учеников в вашей школе",
        cta: "Создать аккаунт школы",
        quote: "Узнать цену для вашей школы",
        features: [
          "Свой портал школы, опубликованный в интернете по вашему адресу",
          "Календарь и расписание: уроки, классы и школьные события",
          "Создание экзаменов, в том числе вступительных, с приглашениями",
          "Журнал в вашей системе оценок: 10 систем на выбор",
          "Классы, классные руководители и запись целым классом",
          "Приглашения и роли для сотрудников и учеников",
          "Объявления для школы, классов и родителей",
        ],
        soon: ["Онлайн-сертификаты", "AI-помощник, возможно платный"],
      },
      paidCourses:
        "Цену платных курсов назначают их учителя. Ученики видят цены в своей валюте.",
      soonTitle: "Что мы делаем дальше",
      soonBadge: "Скоро",
      soon: {
        ai: {
          title: "AI-набор для учителей",
          text: "Превращайте тему в план урока, тест и домашнее задание за минуты и получайте черновики отзывов и конспекты уроков. Для учителей; платно.",
        },
        certificates: {
          title: "Онлайн-сертификаты",
          text: "Школы и учителя выдают сертификаты за пройденные курсы и экзамены. Их подлинность можно проверить онлайн.",
        },
        games: {
          title: "Обучающие игры",
          text: "Короткие обучающие игры, в которые ученики играют между уроками, сами или с одноклассниками.",
        },
        cowork: {
          title: "Пространство для совместной работы",
          text: "Общая комната и доска, где класс или учебная группа проводит мозговой штурм и вместе делает проект.",
        },
        clubs: {
          title: "Кружки по интересам",
          text: "Ученики, которые любят одно и то же, например робототехнику, шахматы или поэзию, находят друг друга и создают кружок.",
        },
      },
      cta: {
        apps: {
          portal: "Портал",
          schedule: "Расписание",
          exams: "Экзамены",
          gradebook: "Журнал",
        },
        title: "Приводите свою школу в Budu",
        sub: "Портал, расписание, экзамены и журнал в одном месте. Создайте аккаунт школы и посмотрите всё сами, а мы подготовим цену под ваше число учеников.",
        primary: "Создать аккаунт школы",
        secondary: "Узнать цену",
      },
      faqTitle: "Вопросы",
      faq: [
        {
          q: "Почему у учеников бесплатный доступ?",
          a: "Потому что учёба должна быть открыта всем. Ученики никогда не платят за сам Budu, только за платные курсы, которые выбирают сами.",
        },
        {
          q: "Сколько платит школа?",
          a: "Это зависит от числа учеников в школе. Напишите нам, и мы подготовим цену для вашей школы.",
        },
        {
          q: "За что будут платить учителя?",
          a: "Сам Budu для учителей бесплатен. Платными будут только необязательные AI-инструменты, когда они появятся. А с каждой продажи платного курса Budu берёт свой процент.",
        },
        {
          q: "Как Budu зарабатывает на платных курсах?",
          a: "Выложить курс учителю ничего не стоит. Когда ученик покупает платный курс, Budu оставляет себе процент от цены, остальное получает учитель. С бесплатных курсов комиссии нет.",
        },
        {
          q: "Можно посмотреть Budu до решения?",
          a: "Да. Создайте аккаунт школы и посмотрите всё сами или напишите нам, и мы всё покажем.",
        },
      ],
    },
    schools: {
      more: "Показать ещё",
      loading: "Загрузка…",
      title: "Школы на Budu",
      sub: "Школы, которые учат с Budu и согласились появиться здесь.",
      empty: "Пока здесь нет школ.",
      emptyHint:
        "Школа появляется здесь, когда публикует свою страницу на Budu.",
      joinTitle: "Подключите свою школу",
      joinSub:
        "Бесплатный старт — классы, расписание, журнал и семьи в одном месте.",
      join: "Зарегистрировать школу",
      talk: "Написать нам",
    },
    help: {
      title: "Помощь и поддержка",
      sub: "Ответы на частые вопросы. Не нашли свой — напишите нам.",
      groups: {
        start: {
          title: "С чего начать",
          items: [
            {
              q: "Как создать аккаунт?",
              a: "Нажмите «Создать аккаунт», выберите, кто вы: школа, учитель или ученик, и подтвердите почту по ссылке из письма.",
            },
            {
              q: "Не пришло письмо с подтверждением.",
              a: "Проверьте папку «Спам». На странице входа можно отправить ссылку ещё раз.",
            },
            {
              q: "Я забыл пароль.",
              a: "На странице входа нажмите «Забыли пароль?» — мы пришлём ссылку, чтобы задать новый.",
            },
          ],
        },
        students: {
          title: "Ученикам и родителям",
          items: [
            {
              q: "Как попасть в свою школу?",
              a: "Школа приглашает вас по почте. Примите приглашение — и классы и курсы появятся на главной.",
            },
            {
              q: "Как добавить родителя?",
              a: "В настройках → «Родители» укажите почту родителя. Он подтвердит — и сможет следить за вашими успехами.",
            },
            {
              q: "Можно ли пройти курс без школы?",
              a: "Да. Откройте каталог, посмотрите бесплатный первый урок и запишитесь: на бесплатные — с аккаунтом, на платные — после оплаты.",
            },
          ],
        },
        teachers: {
          title: "Учителям",
          items: [
            {
              q: "Как создать курс?",
              a: "Откройте «Мои курсы» → «Новый курс», добавьте уроки с видео, текстом и заданиями и опубликуйте.",
            },
            {
              q: "Можно ли менять опубликованный курс?",
              a: "Да. Правки остаются неопубликованными — ученики видят текущую версию, пока вы не нажмёте «Опубликовать изменения».",
            },
            {
              q: "Как продавать курс?",
              a: "В конструкторе курса включите «Показывать в каталоге» и укажите цену в своей валюте. Ученики увидят её в своей.",
            },
          ],
        },
        payments: {
          title: "Оплата",
          items: [
            {
              q: "Как оплатить курс?",
              a: "Нажмите «Купить курс»: вы увидите сумму, реквизиты и номер заказа. После подтверждения оплаты вы будете записаны автоматически.",
            },
            {
              q: "Сколько ждать подтверждения?",
              a: "Обычно в течение дня. Как только вас запишут, придёт уведомление.",
            },
          ],
        },
      },
      stillTitle: "Нужна помощь?",
      stillSub: "Напишите нам — обычно отвечаем в течение рабочего дня.",
      contact: "Написать в поддержку",
    },
    contact: {
      eyebrow: "Контакты",
      title: "Давайте поговорим",
      sub: "Вопрос, цена для вашей школы, идея для партнёрства или отзыв. Мы читаем каждое сообщение.",
      formTitle: "Напишите нам",
      formSub: "Ответим на почту, которую вы укажете.",
      name: "Ваше имя",
      namePh: "Анна Иванова",
      email: "Почта",
      emailPh: "you@example.com",
      topic: "О чём вопрос?",
      topics: {
        general: "Общий вопрос",
        school: "Цена для моей школы",
        support: "Помощь с Budu",
        billing: "Оплата",
        partnership: "Партнёрство",
      },
      message: "Сообщение",
      messagePh: "Расскажите немного, что вам нужно",
      send: "Отправить сообщение",
      sending: "Отправляем…",
      sentTitle: "Сообщение отправлено",
      sent: "Спасибо! Мы ответим вам на почту.",
      sendAnother: "Написать ещё",
      errors: {
        invalid: "Укажите имя, правильную почту и сообщение (не короче 10 символов).",
        tooMany: "Слишком много сообщений. Попробуйте через час.",
        server: "Что-то пошло не так. Попробуйте ещё раз.",
      },
      otherTitle: "Напишите напрямую",
      emailLabels: {
        support: "Поддержка",
        info: "Общие вопросы",
        partners: "Партнёрство",
        billing: "Оплата и чеки",
      },
      emailHints: {
        support: "Что-то не работает или нужна помощь.",
        info: "Всё о Budu, школах и курсах.",
        partners: "Сотрудничество и совместные проекты.",
        billing: "Оплата курсов, заказы и чеки.",
      },
      copy: "Скопировать адрес",
      copied: "Скопировано",
      socialTitle: "Budu в соцсетях",
      socialInvite: "Будем рады видеть вас с нами! Каждая подписка поддерживает Budu.",
      socialSoon: "Скоро",
      whatsapp: "WhatsApp",
      legalTitle: "Реквизиты",
      legal: { name: "Компания", inn: "ИНН", ogrn: "ОГРН", address: "Адрес" },
    },
    privacy: {
      title: "Политика конфиденциальности",
      updated: "Обновлено: 22 октября 2026 г.",
      intro:
        "Здесь объясняется, какие персональные данные собирает Budu, зачем и что вы можете с ними сделать. Коротко и простыми словами.",
      operator: "Кто отвечает за данные",
      operatorPending:
        "За ваши данные отвечает Budu. Реквизиты компании будут опубликованы на этой странице.",
      sections: [
        {
          title: "Что мы собираем",
          items: [
            "Данные аккаунта: имя, почта и роль (ученик, учитель, руководитель школы, родитель). Пароли хранятся только в виде защищённых хешей.",
            "Учебные данные: ваши курсы, открытые уроки, домашние задания, ответы на тесты, оценки и отзывы.",
            "Переписку родителей и учителей, объявления.",
            "Фото профиля, если вы его добавили.",
            "Заказы платных курсов (курс, сумма, статус). Данные карт мы не видим и не храним — оплата банковским переводом.",
            "Сообщения, отправленные через форму обратной связи.",
          ],
        },
        {
          title: "Зачем мы их используем",
          items: [
            "Чтобы работал ваш аккаунт и вы могли учиться или преподавать.",
            "Чтобы школа, учителя и родители видели успехи, которые им положено видеть.",
            "Чтобы отправлять нужные письма: подтверждения, приглашения, уведомления.",
            "Чтобы защищать Budu и исправлять ошибки.",
          ],
        },
        {
          title: "Чего мы никогда не делаем",
          items: [
            "Не показываем рекламу и не продаём и не передаём ваши данные.",
            "Не используем рекламные и отслеживающие cookie.",
          ],
        },
        {
          title: "Cookie",
          items: [
            "Только необходимые: сессия входа и ваш выбор языка, темы и валюты цен.",
          ],
        },
        {
          title: "Кто видит ваши данные",
          items: [
            "Ваша школа или учитель — вашу учёбу в их курсах; родители — ваши успехи, после согласия обеих сторон.",
            "Подрядчики, которые помогают работать Budu (хостинг, почта), — только для оказания услуги.",
            "Государственные органы — только когда этого требует закон.",
          ],
        },
        {
          title: "Где и сколько хранятся",
          items: [
            "Данные хранятся на наших собственных серверах — пока существует ваш аккаунт; по вашему запросу мы их удаляем, если закон не требует хранить дольше.",
          ],
        },
        {
          title: "Дети",
          items: [
            "Ученики младше 14 лет пользуются Budu через школу или с согласия родителя. Родители видят успехи ребёнка и могут попросить удалить аккаунт.",
          ],
        },
        {
          title: "Ваши права",
          items: [
            "Вы можете получить, исправить, выгрузить или удалить свои данные и отозвать согласие. Напишите нам через страницу контактов — ответим в течение 30 дней.",
          ],
        },
        {
          title: "Изменения",
          items: [
            "Если политика изменится, мы обновим дату выше и сообщим о важных изменениях в Budu.",
          ],
        },
      ],
      contact: "Вопросы о ваших данных? Напишите нам через страницу контактов.",
    },
    terms: {
      title: "Условия использования",
      updated: "Обновлено: 22 октября 2026 г.",
      intro:
        "Эти условия — договорённость между вами и Budu, когда вы пользуетесь сайтом и приложением. Создавая аккаунт или пользуясь Budu, вы их принимаете. Мы пишем коротко и понятно.",
      operator: "Кто предоставляет Budu",
      operatorPending:
        "Сервис предоставляет Budu. Реквизиты компании будут опубликованы на этой странице.",
      sections: [
        {
          title: "Ваш аккаунт",
          items: [
            "Указывайте настоящее имя и почту, которую вы читаете. Один аккаунт — для одного человека.",
            "Не сообщайте никому пароль. Вы отвечаете за то, что происходит в вашем аккаунте, — сразу напишите нам, если в него вошёл кто-то другой.",
          ],
        },
        {
          title: "Дети",
          items: [
            "Ученики младше 14 лет пользуются Budu через школу или с согласия родителя; школа или родитель принимают эти условия за них.",
          ],
        },
        {
          title: "Школы и учителя",
          items: [
            "Школы и учителя сами решают, чему учить и кто учится у них. Никого не добавляют в школу без согласия — человек сам принимает приглашение.",
            "Они отвечают за то, что публикуют, в том числе за согласие на показ имён и фотографий учеников.",
          ],
        },
        {
          title: "Ваши материалы",
          items: [
            "То, что вы загружаете, — курсы, уроки, домашние задания, фото, сообщения — остаётся вашим. Вы разрешаете Budu хранить это и показывать тем, для кого оно предназначено, только чтобы сервис работал.",
            "Загружайте только то, чем вы вправе делиться.",
          ],
        },
        {
          title: "Что запрещено",
          items: [
            "Нарушать закон, оскорблять или обманывать людей, рассылать спам.",
            "Входить в чужие аккаунты или получать чужие данные, атаковать Budu или перегружать его.",
            "Загружать вирусы и другие вредные файлы.",
            "Мы можем удалить материалы или заблокировать аккаунт за нарушение этих правил.",
          ],
        },
        {
          title: "Платные курсы",
          items: [
            "Цены устанавливают учителя; мы показываем их в вашей валюте. Вы оплачиваете сумму, указанную в заказе.",
            "Курс открывается, когда мы подтвердим оплату. Если с оплатой что-то пошло не так, напишите нам — мы разберёмся.",
          ],
        },
        {
          title: "Как работает Budu",
          items: [
            "Мы стараемся, чтобы Budu работал без сбоев и ваши данные были в безопасности, но не можем обещать, что перерывов не будет никогда. Мы можем менять и улучшать возможности.",
            "Мы не отвечаем за то, что публикуют школы, учителя и другие пользователи. Ничто здесь не ограничивает ваши права потребителя по закону.",
          ],
        },
        {
          title: "Прекращение",
          items: [
            "Вы можете в любой момент перестать пользоваться Budu и попросить удалить аккаунт. Мы можем закрыть аккаунт за серьёзные или повторные нарушения этих условий.",
          ],
        },
        {
          title: "Изменения",
          items: [
            "Если мы изменим условия, мы обновим дату выше и расскажем о важных изменениях в Budu.",
          ],
        },
      ],
      contact:
        "Вопросы об этих условиях? Напишите нам через страницу контактов.",
    },
  },

  schoolPage: {
    emptyPublic: "Школа ещё готовит свою страницу.",
    newsDefault: "Новости",
    topDefault: "Наши лучшие ученики",
    draftBanner:
      "Черновик — страницу видят только руководители вашей школы. Опубликуйте её в настройках страницы школы.",
    ctaTitle: (school: string) => `Учитесь вместе с «${school}»`,
    ctaSub:
      "Ученики, родители и учителя используют Budu для уроков, заданий, оценок и новостей — всё в одном месте.",
    ctaJoin: "Создать аккаунт",
    ctaMore: "Другие школы на Budu",
    editor: {
      title: "Страница школы",
      sub: "Публичная страница вашей школы в интернете — новости, фото и люди, которыми вы гордитесь.",
      blocks: "Блоки страницы",
      settings: "Адрес и видимость",
      address: "Адрес страницы",
      addressHint: "Латинские буквы, цифры и дефисы, 3–40 символов.",
      available: "Адрес свободен",
      slugErrors: {
        ok: "",
        invalid:
          "Используйте 3–40 латинских букв, цифр или дефисов (не в начале и не в конце).",
        reserved: "Этот юзернейм недоступен. Попробуйте другой.",
        taken: "Этот юзернейм уже занят.",
        server: "Не удалось сохранить. Попробуйте ещё раз.",
      },
      city: "Город",
      cityPh: "например, Казань",
      tagline: "Подзаголовок",
      taglinePh: "Школа, где замечают каждого ученика",
      published: "Опубликована",
      publishedOn:
        "Страницу видит любой по ссылке, и школа есть в списке «Школы на Budu».",
      publishedOff:
        "Закрыта: видят только руководители вашей школы, в списке её нет.",
      save: "Сохранить",
      saving: "Сохраняем…",
      saved: "✓ Сохранено",
      failed: "Не удалось сохранить. Попробуйте ещё раз.",
      open: "Открыть страницу",
      logo: "Логотип или фото",
      addLogo: "Загрузить изображение",
      cover: "Обложка",
      noBlocks:
        "Блоков пока нет. Добавьте текст, фото, новости или людей, которых хотите отметить.",
      emptyBlock: "Пусто — откройте, чтобы заполнить",
      edit: "Изменить",
      close: "Готово",
      add: "Добавить блок",
      addTitle: "Добавить блок",
      addSub: "Выберите, что показать. Порядок блоков можно поменять позже.",
      kinds: {
        text: {
          title: "Текст",
          desc: "Заголовок и несколько абзацев — о школе, о поступлении…",
        },
        photos: { title: "Фото", desc: "До 6 фото с подписями." },
        news: {
          title: "Новости",
          desc: "Записи с датой — события, результаты, объявления.",
        },
        spotlight: {
          title: "В центре внимания",
          desc: "Отметьте ученика или учителя.",
        },
        top: {
          title: "Лучшие ученики",
          desc: "Ваша тройка лидеров с медалями.",
        },
      },
      deleteTitle: (kind: string) => `Удалить блок «${kind}»?`,
      deleteDesc: "Он исчезнет с публичной страницы. Это нельзя отменить.",
      heading: "Заголовок",
      body: "Текст",
      textHeadingPh: "О нашей школе",
      textBodyPh: "Расскажите, кто вы, чему учите и чем особенна ваша школа.",
      photosHeadingPh: "Жизнь школы",
      photosHint: (n: number) =>
        `До ${n} фото, PNG / JPG / WebP, до 8 МБ каждое.`,
      caption: "Подпись (необязательно)",
      addPhoto: "Добавить фото",
      changePhoto: "Заменить",
      removePhoto: "Убрать",
      changeCover: "Изменить обложку",
      changeLogo: "Изменить логотип",
      removeCoverTitle: (school: string) => `Убрать обложку «${school}»?`,
      removeLogoTitle: (school: string) => `Убрать логотип «${school}»?`,
      publishing: "Публикация",
      publish: "Опубликовать",
      unpublish: "Снять с публикации",
      live: "Опубликована",
      notLive: "Не опубликована",
      publishNote:
        "После публикации страницу увидит любой человек в интернете.",
      copyLink: "Копировать ссылку",
      copied: "Скопировано",
      changeAddress: "Изменить юзернейм школы",
      taglineAdd: "Добавьте короткую строку о школе",
      taglineEdit: "Изменить строку под названием",
      uploading: "Загрузка…",
      photoErrors: {
        type: "Нужна картинка PNG, JPG, GIF или WebP.",
        size: "Фото слишком большое (до 8 МБ).",
        server: "Не удалось загрузить. Попробуйте ещё раз.",
      },
      addNews: "Добавить новость",
      removeNews: "Удалить",
      date: "Дата",
      newsTitle: "Заголовок",
      spotLabel: "Звание",
      spotLabelPh: "Ученик месяца",
      spotName: "Имя",
      spotNamePh: "Начните вводить — подскажем людей вашей школы",
      spotText: "Почему мы гордимся",
      spotTextPh: "Что он сделал? Пара тёплых предложений.",
      topName: "Имя",
      topNote: "Пояснение, например «Средний балл 97 / 100»",
      privacy:
        "Страница публичная. Указывайте имена и фото учеников только с согласия их семей.",
    },
  },

  catalog: {
    heroTitle: "Учитесь у учителей и школ, которым доверяете",
    heroSub:
      "Смотрите все курсы Budu и первый урок бесплатно. Чтобы записаться на любой курс, даже бесплатный, создайте аккаунт.",
    all: "Все курсы",
    signIn: "Войти",
    signUp: "Регистрация",
    openApp: "Открыть Budu",
    signUpFree: "Зарегистрироваться и начать — бесплатно",
    signUpBuy: "Зарегистрироваться, чтобы купить курс",
    haveAccount: "У меня есть аккаунт — войти",
    studentsOnly: "Ученики записываются из своего аккаунта (Каталог).",
  },

  market: {
    language: "Язык курса",
    languageHint: "На каком языке вы преподаёте — видно на карточке курса.",
    languageNone: "Не указан",
    subject: "Предмет",
    subjectHint: "О чём курс. Ученики могут искать курсы по предмету.",
    subjectNone: "Не указан",
    title: "Маркетплейс",
    sub: "Покажите курс в «Каталоге», чтобы его нашёл любой ученик — бесплатно или за плату.",
    listed: "Показывать в каталоге",
    needsPublish: "Опубликуйте курс — черновики в каталоге не видны.",
    price: "Цена",
    freeHint: "Пусто или 0 — бесплатно.",
    currency: "Валюта",
    save: "Сохранить",
    saved: "✓ Сохранено",
    invalid: "Проверьте цену.",
  },

  subjects: {
    math: "Математика",
    physics: "Физика",
    chemistry: "Химия",
    biology: "Биология",
    cs: "Информатика",
    languages: "Иностранные языки",
    literature: "Литература",
    history: "История",
    geography: "География",
    economics: "Экономика",
    exams: "Подготовка к экзаменам",
    art: "Искусство",
    music: "Музыка",
    sports: "Спорт",
    other: "Другое",
  },
  shop: {
    filter: {
      search: "Найти курс по названию",
      clear: "Очистить поиск",
      subject: "Предмет",
      anySubject: "Любой предмет",
      language: "Язык",
      anyLanguage: "Любой язык",
      price: "Цена",
      anyPrice: "Любая цена",
      free: "Бесплатные",
      paid: "Платные",
      found: (n: number) =>
        `${plural(n, "Найден", "Найдено", "Найдено")} ${n} ${plural(n, "курс", "курса", "курсов")}`,
      reset: "Сбросить фильтры",
      noMatch: "Курсов не найдено",
      noMatchSub: "Попробуйте другое слово или уберите фильтр.",
      showMore: "Показать ещё",
    },
    title: "Каталог",
    sub: "Курсы учителей и школ на Budu. На бесплатные можно записаться сразу.",
    empty: "В каталоге пока нет курсов.",
    enrolled: "Вы записаны",
    free: "Бесплатно",
    back: "Каталог",
    about: "О курсе",
    program: "Уроки",
    price: "Цена",
    teachers: "Учителя",
    open: "Открыть курс",
    enrolFree: "Записаться бесплатно",
    buy: "Купить курс",
    checking:
      "Мы проверяем вашу оплату. Вы будете записаны сразу после подтверждения.",
    payDetails: "Реквизиты оплаты",
    pay: {
      title: "Оплата курса",
      failed: "Сейчас этот курс нельзя купить. Попробуйте позже.",
      preparing: "Готовим заказ…",
      amount: "Сумма перевода",
      step1: (amount: string) =>
        `Переведите ${amount} через Сбербанк или Систему быстрых платежей (СБП) по номеру телефона:`,
      step2: "В комментарии к платежу укажите номер заказа:",
      step3: "Отправьте чек (можно скриншот) на",
      note: "Мы проверяем платежи вручную и записываем вас на курс — обычно в течение дня. Вы получите уведомление.",
      paid: "Я оплатил(а)",
      reported: "Спасибо! Мы проверяем вашу оплату.",
      copy: "Копировать",
      copied: "Скопировано",
    },
  },

  payments: {
    title: "Платежи",
    sub: (email: string) =>
      `Покупки курсов переводом. Проверьте поступление денег и чек на ${email}, затем подтвердите.`,
    openTitle: "Ждут подтверждения",
    empty: "Нет платежей на проверке.",
    reported: "Ученик сообщил об оплате",
    waiting: "Ещё не оплачен",
    confirm: "Подтвердить и записать",
    reject: "Отклонить",
    history: "Последние решения",
    historySub: "20 последних подтверждённых или отклонённых заказов.",
    confirmed: "Подтверждён",
    rejected: "Отклонён",
  },

  rates: {
    defaultCurrency: (c: string) =>
      `Валюта платформы: ${c}. Учителя назначают цену в любой валюте, ученики видят цены в своей.`,
    title: "Курсы валют",
    sub: "Единиц валюты за 1 доллар США, обновляются автоматически раз в день. Укажите свой курс, чтобы заменить автоматический — например, рыночный курс сирийского фунта.",
    updated: "Обновлено:",
    currency: "Валюта",
    auto: "Автоматический",
    override: "Ваш курс",
    hint: "Оставьте поле пустым, чтобы использовать автоматический курс.",
    save: "Сохранить курсы",
    saved: "✓ Сохранено",
    invalid: "Курс должен быть положительным числом.",
  },

  live: {
    eyebrow: "● Идёт урок",
    host: "(ведущий)",
    aiSummary: "ИИ-конспект включён",
    rec: "ЗАПИСЬ",
    sharing: "Омар показывает экран · Степенное правило",
    onBoard: "Омар пишет на доске",
    bannerTeacher:
      "вы ведёте урок — показывайте экран, открывайте доску и управляйте учениками.",
    bannerStudent:
      "вы вошли как ученик — следите за уроком, пишите в чат и поднимайте руку.",
    leave: "Выйти",
    end: "Завершить урок",
    chat: "Чат",
    people: (n: number) => `Участники · ${n}`,
    typeMsg: "Сообщение…",
    send: "Отправить",
    controls: {
      mic: "Микрофон",
      cam: "Камера",
      share: "Показать экран",
      board: "Доска",
      rec: "Запись",
      muteAll: "Выключить всем микрофон",
      manage: "Управление учениками",
      hand: "Поднять руку",
    },
  },

  account: {
    currency: "Валюта",
    currencyHint:
      "Цены показываются в этой валюте — пересчитаны из цены учителя по текущему курсу и округлены вверх.",
    title: "Настройки",
    sub: "Профиль, пароль, язык и оформление.",
    profile: "Профиль",
    profileHint: "Имя и фото, которые видят учителя и одноклассники.",
    changePhoto: "Сменить фото",
    removePhoto: "Удалить фото",
    photoHint: "PNG, JPG, GIF или WebP · до 5 МБ",
    uploading: "Загружаем…",
    firstName: "Имя",
    lastName: "Фамилия",
    email: "Эл. почта",
    save: "Сохранить",
    saving: "Сохраняем…",
    saved: "✓ Сохранено",
    password: "Пароль",
    passwordHint:
      "Здесь вы останетесь в системе, на других устройствах выполнится выход.",
    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    passwordRules: "Не меньше 8 символов: заглавные и строчные буквы и цифра.",
    changePassword: "Сменить пароль",
    changing: "Меняем…",
    passwordChanged: "✓ Пароль изменён",
    language: "Язык",
    languageHint: "Язык меню, кнопок и писем.",
    theme: "Тема",
    themeHint: "Светлая, тёмная или как на устройстве.",
    themes: { light: "Светлая", dark: "Тёмная", system: "Системная" },
    /** the short name of 'system' where space is tight (segmented control) */
    themeAuto: "Авто",
    errors: {
      invalid: "Заполните все поля.",
      tooLong: "Слишком длинно — сократите, пожалуйста.",
      notImage: "Выберите изображение PNG, JPG, GIF или WebP.",
      tooBig: "Изображение больше 5 МБ.",
      wrongPassword: "Текущий пароль неверный.",
      locked: "Слишком много попыток — аккаунт временно заблокирован.",
      weak: "Не меньше 8 символов: заглавные и строчные буквы и цифра.",
      server: "Что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  signUp: {
    strength: {
      levels: ["Слабый", "Средний", "Хороший", "Надёжный"],
      rules: {
        length: "От 8 символов",
        upper: "Заглавная буква",
        lower: "Строчная буква",
        digit: "Цифра",
      },
    },
    title: "Создайте аккаунт",
    sub: "Выберите, что вам подходит. В школу вас смогут пригласить позже.",
    short: { student: "Ученик", teacher: "Учитель", school: "Школа" },
    kindLabel: "Я регистрируюсь как",
    kinds: {
      school: {
        title: "Школа",
        desc: "Ведите классы, добавляйте учеников и учителей.",
      },
      teacher: {
        title: "Учитель",
        desc: "Преподавайте и публикуйте курсы под своим именем.",
      },
      student: {
        title: "Ученик",
        desc: "Учитесь и проходите курсы из каталога.",
      },
    },
    schoolSection: "Школа",
    schoolName: "Название школы",
    city: "Город",
    country: "Страна",
    accountSection: "Ваш аккаунт",
    fullName: "ФИО",
    fullNameHint: "Имя и фамилия, отчество — если есть. В любом порядке.",
    fullNamePh: "Иван Иванович Иванов",
    email: "Эл. почта",
    password: "Пароль",
    passwordHint: "Не меньше 8 символов: заглавные и строчные буквы и цифра.",
    submit: "Создать аккаунт",
    submitting: "Создаём…",
    checkEmail: "Проверьте почту",
    checkEmailBody: (email: string) =>
      `Мы отправили ссылку для подтверждения на ${email}. Откройте её, чтобы активировать аккаунт, затем войдите.`,
    haveAccount: "Уже есть аккаунт?",
    signIn: "Войти",
    errors: {
      fullName: "Напишите имя и фамилию.",
      invalid: "Заполните все поля правильно.",
      weakPassword: "Пароль не соответствует требованиям ниже.",
      emailTaken: "Аккаунт с этой почтой уже существует.",
      schoolTaken: "Школа с таким названием уже существует.",
      server: "На нашей стороне что-то пошло не так. Попробуйте ещё раз.",
    },
  },

  auth: {
    backToSignIn: "Назад ко входу",
    backToSite: "На сайт",
    signIn: {
      title: "С возвращением",
      sub: "Войдите в свой аккаунт Budu.",
      email: "Эл. почта",
      password: "Пароль",
      forgot: "Забыли пароль?",
      submit: "Войти",
      submitting: "Входим…",
      noAccount: "Впервые в Budu?",
      register: "Создать аккаунт",
      verified: "Почта подтверждена. Теперь можно войти.",
      resetDone: "Пароль изменён. Войдите с новым паролем.",
      invited: "Аккаунт активирован. Войдите с новым паролем.",
      notVerified: "Сначала подтвердите почту — ссылка в письме.",
      resend: "Отправить ссылку ещё раз",
      resent: "Если аккаунт ждёт подтверждения, новая ссылка уже в пути.",
      errors: {
        invalid: "Неверная почта или пароль.",
        locked:
          "Слишком много неудачных попыток — аккаунт временно заблокирован. Проверьте почту или попробуйте позже.",
        server: "На нашей стороне что-то пошло не так. Попробуйте ещё раз.",
      },
    },
    forgot: {
      title: "Восстановление пароля",
      sub: "Введите почту аккаунта, и мы пришлём ссылку для нового пароля.",
      email: "Эл. почта",
      submit: "Отправить ссылку",
      submitting: "Отправляем…",
      sentTitle: "Проверьте почту",
      sentBody:
        "Если аккаунт с этой почтой существует, ссылка уже в пути. Она одноразовая и действует 1 час.",
      back: "Назад ко входу",
    },
    reset: {
      title: "Новый пароль",
      sub: "На всех остальных устройствах выполнится выход.",
      password: "Новый пароль",
      submit: "Сменить пароль",
      submitting: "Меняем…",
      errors: {
        invalidLink: "Ссылка недействительна или устарела. Запросите новую.",
        weakPassword: "Пароль не соответствует требованиям ниже.",
        server: "На нашей стороне что-то пошло не так. Попробуйте ещё раз.",
      },
      requestNew: "Запросить новую ссылку",
    },
    verify: {
      okTitle: "Почта подтверждена",
      okBody: "Аккаунт активирован. Войдите, чтобы начать.",
      failTitle: "Ссылка не сработала",
      failBody:
        "Возможно, она устарела или уже использована. Войдите, чтобы получить новую ссылку.",
      toSignIn: "Ко входу",
    },
    invite: {
      title: "Присоединяйтесь к школе в Budu",
      sub: "Задайте пароль, чтобы активировать аккаунт.",
      password: "Пароль",
      submit: "Активировать аккаунт",
      submitting: "Активируем…",
      errors: {
        invalidLink:
          "Ссылка-приглашение недействительна или устарела. Попросите школу прислать новую.",
        weakPassword: "Пароль не соответствует требованиям ниже.",
        server: "На нашей стороне что-то пошло не так. Попробуйте ещё раз.",
      },
    },
    signOut: "Выйти",
  },

  email: {
    contactTeam: {
      subject: (topic: string, name: string) => `Новое сообщение: ${topic}, от ${name}`,
      title: "Новое сообщение с сайта",
      name: "команда",
      body: "Кто-то написал в Budu через форму на сайте. Сообщение ниже; нажмите «Ответить», чтобы ответить по почте.",
      details: { name: "Имя", email: "Почта", topic: "Тема", language: "Язык", message: "Сообщение" },
      action: "Ответить",
    },
    fallback: "Если кнопка не работает, скопируйте ссылку в браузер:",
    footer: "Budu — обучение, которое объединяет школу, учителей и семьи.",
    examInvite: {
      subject: (exam: string) => `Приглашение на экзамен «${exam}»`,
      title: "Вас пригласили на экзамен",
      body: (p: { school: string; by: string }) =>
        `${p.by} из «${p.school}» приглашает вас сдать экзамен.`,
      details: { exam: "Экзамен", school: "Школа", by: "Кто пригласил" },
      stepsTitle: "Что дальше",
      steps: [
        "Задайте пароль — кнопка ниже.",
        "Откройте экзамен на главной странице и начните, когда будете готовы.",
      ],
      action: "Задать пароль",
      validity: "Ссылка действует 7 дней.",
    },
    parentInvite: {
      subject: (child: string) => `${child} приглашает вас в Budu как родителя`,
      body: (child: string) =>
        `${child} просит вас стать родителем на Budu: вы сможете следить за домашними заданиями и оценками и общаться с учителями. Задайте пароль, чтобы подтвердить и активировать аккаунт. Ссылка действует 7 дней.`,
      action: "Подтвердить и задать пароль",
    },
    invite: {
      subject: (school: string) => `Приглашение в «${school}» на Budu`,
      body: (p: { school: string; by: string; role: string }) =>
        `${p.by} приглашает вас в «${p.school}» на Budu. Ваша роль: ${p.role}. Задайте пароль, чтобы активировать аккаунт. Ссылка действует 7 дней.`,
      action: "Задать пароль",
    },
    greeting: (name: string) => `Здравствуйте, ${name}!`,
    signature: "— Команда Budu",
    verify: {
      title: "Подтвердите почту",
      subject: "Подтвердите почту для Budu",
      body: "Подтвердите адрес почты, чтобы активировать аккаунт Budu. Ссылка действует 48 часов.",
      action: "Подтвердить почту",
    },
    reset: {
      title: "Сброс пароля",
      subject: "Восстановление пароля Budu",
      body: "Кто-то (надеемся, вы) запросил смену пароля Budu. Ссылка одноразовая и действует 1 час.",
      action: "Задать новый пароль",
      ignore:
        "Если вы этого не запрашивали, просто проигнорируйте письмо — пароль не изменится.",
    },
  },
};
