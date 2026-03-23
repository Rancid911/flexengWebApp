function normalizeMessage(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((needle) => haystack.includes(needle));
}

export function mapUiErrorMessage(rawMessage: unknown, fallback = ""): string {
  const message = normalizeMessage(rawMessage);
  if (!message) return fallback;

  const normalized = message.toLowerCase();

  if (includesAny(normalized, ["invalid login credentials", "invalid credentials"])) {
    return "Неверные данные для входа.";
  }
  if (includesAny(normalized, ["email not confirmed"])) {
    return "Подтвердите email перед входом.";
  }
  if (includesAny(normalized, ["already registered", "already been registered", "user already registered"])) {
    return "Пользователь с таким email уже существует.";
  }
  if (includesAny(normalized, ["invalid email"])) {
    return "Введите корректный email.";
  }
  if (includesAny(normalized, ["invalid api key", "apikey"])) {
    return "Ошибка конфигурации сервиса авторизации.";
  }
  if (includesAny(normalized, ["load failed", "failed to fetch", "networkerror", "network request failed"])) {
    return "Проблема с сетью. Проверьте подключение и попробуйте снова.";
  }
  if (includesAny(normalized, ["otp expired", "email link is invalid or has expired", "invalid or has expired"])) {
    return "Ссылка подтверждения недействительна или устарела.";
  }
  if (includesAny(normalized, ["auth_request_timeout", "timeout"])) {
    return "Истекло время ожидания. Попробуйте снова.";
  }
  if (includesAny(normalized, ["not found"])) {
    return "Запрашиваемые данные не найдены.";
  }
  if (includesAny(normalized, ["internal server error"])) {
    return "Внутренняя ошибка сервера. Попробуйте позже.";
  }
  if (includesAny(normalized, ["forbidden", "admin access required"])) {
    return "Недостаточно прав для выполнения действия.";
  }
  if (includesAny(normalized, ["invalid password", "password"])) {
    return "Проверьте корректность пароля.";
  }
  if (includesAny(normalized, ["at least one field must be provided"])) {
    return "Заполните хотя бы одно поле.";
  }
  if (includesAny(normalized, ["invalid user payload", "invalid test payload", "invalid blog post payload", "validation error"])) {
    return "Проверьте правильность заполнения полей.";
  }
  if (includesAny(normalized, ["birth_date is required for student"])) {
    return "Для студента обязательно укажите дату рождения.";
  }
  if (includesAny(normalized, ["english_level is required for student"])) {
    return "Для студента обязательно укажите текущий уровень.";
  }
  if (includesAny(normalized, ["target_level is required for student"])) {
    return "Для студента обязательно укажите целевой уровень.";
  }
  if (includesAny(normalized, ["learning_goal is required for student"])) {
    return "Для студента обязательно укажите цель обучения.";
  }
  if (includesAny(normalized, ["phone must match +7xxxxxxxxxx"])) {
    return "Телефон должен быть в формате +7 (999) 999 99 99.";
  }
  if (includesAny(normalized, ["request failed"])) {
    return "Не удалось выполнить запрос. Попробуйте снова.";
  }

  if (/[a-z]/i.test(message) && !/[а-яё]/i.test(message)) {
    return fallback || "Произошла ошибка. Попробуйте снова.";
  }

  return message;
}

export function mapUiErrorByCode(code: unknown, fallback = ""): string {
  if (typeof code !== "string") return fallback;
  switch (code) {
    case "NOT_FOUND":
    case "USER_NOT_FOUND":
    case "TEST_NOT_FOUND":
    case "BLOG_POST_NOT_FOUND":
    case "BLOG_CATEGORY_NOT_FOUND":
    case "BLOG_TAG_NOT_FOUND":
    case "NOTIFICATION_NOT_FOUND":
      return "Запрашиваемая запись не найдена.";
    case "FORBIDDEN":
      return "Недостаточно прав для выполнения действия.";
    case "VALIDATION_ERROR":
      return "Проверьте корректность заполнения полей.";
    case "INTERNAL_ERROR":
      return "Внутренняя ошибка сервера. Попробуйте позже.";
    case "NOTIFICATIONS_FETCH_FAILED":
    case "NOTIFICATION_CREATE_FAILED":
    case "NOTIFICATION_UPDATE_FAILED":
    case "NOTIFICATION_DELETE_FAILED":
    case "NOTIFICATION_READ_FAILED":
    case "NOTIFICATION_DISMISS_FAILED":
      return "Не удалось обработать уведомления. Попробуйте снова.";
    default:
      return fallback;
  }
}
