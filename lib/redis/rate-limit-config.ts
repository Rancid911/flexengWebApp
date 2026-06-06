import "@/lib/redis/server-only";

import type { AuthRateLimitMessageFlow } from "@/lib/auth/rate-limit-messages";

export type RateLimitFlow = AuthRateLimitMessageFlow | "forgot-password-ip";

export type RateLimitConfig = {
  flow: RateLimitFlow;
  messageFlow: AuthRateLimitMessageFlow;
  limit: number;
  window: "15 m" | "1 h";
};

export const AUTH_RATE_LIMITS = {
  login: {
    flow: "login",
    messageFlow: "login",
    limit: 5,
    window: "15 m"
  },
  signup: {
    flow: "signup",
    messageFlow: "signup",
    limit: 3,
    window: "1 h"
  },
  forgotPassword: {
    flow: "forgot-password",
    messageFlow: "forgot-password",
    limit: 3,
    window: "1 h"
  },
  forgotPasswordIp: {
    flow: "forgot-password-ip",
    messageFlow: "forgot-password",
    limit: 10,
    window: "1 h"
  },
  resetPassword: {
    flow: "reset-password",
    messageFlow: "reset-password",
    limit: 5,
    window: "15 m"
  },
  changePassword: {
    flow: "change-password",
    messageFlow: "change-password",
    limit: 5,
    window: "15 m"
  }
} satisfies Record<string, RateLimitConfig>;
