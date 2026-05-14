export type SiteNavItem = {
  href: string;
  label: string;
};

export type SiteMenuSection = {
  id: string;
  label: string;
  links: Array<SiteNavItem & { description?: string }>;
};

export const sitePrimaryNavItems: SiteNavItem[] = [
  { href: "/#programs", label: "Программы" },
  { href: "/#teachers", label: "Преподаватели" },
  { href: "/#pricing", label: "Стоимость" }
];

export const siteDropdownMenus: SiteMenuSection[] = [
  {
    id: "about",
    label: "О школе",
    links: [
      { label: "Наша методика", href: "/#how-it-works", description: "Как выстраиваем программу под цель ученика" },
      { label: "Преподаватели", href: "/#teachers", description: "Кто ведет занятия и как проходит отбор" },
      { label: "Результаты учеников", href: "/#reviews", description: "Отзывы и реальные кейсы прогресса" }
    ]
  },
  {
    id: "resources",
    label: "Ресурсы",
    links: [
      { label: "Блог", href: "/articles", description: "Материалы по английскому и обучению" },
      { label: "Поиск по сайту", href: "/search", description: "Глобальный поиск по блогу и учебному кабинету" },
      { label: "FAQ", href: "/#faq", description: "Ответы на частые вопросы перед стартом" },
      { label: "Поддержка", href: "/#lead-form", description: "Помощь и связь с командой Флексенг" }
    ]
  }
];

export const schoolFooterLinks: SiteNavItem[] = [
  { href: "/#how-it-works", label: "О нас" },
  { href: "/#how-it-works", label: "Наша методика" },
  { href: "/#teachers", label: "Преподаватели" },
  { href: "/#reviews", label: "Результаты учеников" },
  { href: "/#lead-form", label: "Контакты" }
];

export const learningFooterLinks: SiteNavItem[] = [
  { href: "/#programs", label: "Программы" },
  { href: "/#pricing", label: "Стоимость и тарифы" },
  { href: "/#faq", label: "Вопросы и ответы" },
  { href: "/#lead-form", label: "Оставить заявку" }
];

export const formatFooterLinks: SiteNavItem[] = [
  { href: "/#programs", label: "Индивидуально" },
  { href: "/#programs", label: "Мини-группы" },
  { href: "/#programs", label: "Разговорный клуб" },
  { href: "/#programs", label: "Интенсив" },
  { href: "/#programs", label: "Для работы" },
  { href: "/#programs", label: "Для путешествий" },
  { href: "/#programs", label: "Подготовка к экзаменам" },
  { href: "/#programs", label: "Для собеседований" }
];

export const supportFooterLinks: SiteNavItem[] = [
  { href: "/#pricing", label: "Условия оплаты" },
  { href: "/#pricing", label: "Как проходит оплата" },
  { href: "/#pricing", label: "Возврат и перенос" },
  { href: "/articles", label: "Блог" },
  { href: "/#lead-form", label: "Поддержка" },
  { href: "/#lead-form", label: "Контакты" }
];

export const legalFooterLinks: SiteNavItem[] = [
  { href: "/#lead-form", label: "Публичная оферта" },
  { href: "/#lead-form", label: "Политика конфиденциальности" },
  { href: "/#lead-form", label: "Согласие на обработку ПД" }
];
