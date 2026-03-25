type AuthRole = "student" | "admin" | "teacher" | "manager";

const roleEnvMap: Record<AuthRole, { emailKey: string; passwordKey: string }> = {
  student: {
    emailKey: "E2E_STUDENT_EMAIL",
    passwordKey: "E2E_STUDENT_PASSWORD"
  },
  admin: {
    emailKey: "E2E_ADMIN_EMAIL",
    passwordKey: "E2E_ADMIN_PASSWORD"
  },
  teacher: {
    emailKey: "E2E_TEACHER_EMAIL",
    passwordKey: "E2E_TEACHER_PASSWORD"
  },
  manager: {
    emailKey: "E2E_MANAGER_EMAIL",
    passwordKey: "E2E_MANAGER_PASSWORD"
  }
};

export function readAuthEnv(role: AuthRole) {
  const config = roleEnvMap[role];
  const email = process.env[config.emailKey];
  const password = process.env[config.passwordKey];
  const missing = [config.emailKey, config.passwordKey].filter((key) => !process.env[key]);

  return { email, password, missing };
}

export function readOptionalAuthEnv(role: "teacher" | "manager") {
  const env = readAuthEnv(role);
  return {
    email: env.email,
    password: env.password,
    available: Boolean(env.email && env.password)
  };
}

export function ensureAuthEnvMessage(role: AuthRole) {
  const env = readAuthEnv(role);
  return env.missing.length ? `${role} auth env is missing: ${env.missing.join(", ")}` : "";
}

export function ensureOptionalAuthEnvMessage(role: "teacher" | "manager") {
  const env = readAuthEnv(role);
  return env.missing.length ? `${role} optional auth env is missing: ${env.missing.join(", ")}` : "";
}

export function hasOptionalAuthEnv(role: "teacher" | "manager") {
  const env = readAuthEnv(role);
  return env.missing.length === 0;
}

export type { AuthRole };
