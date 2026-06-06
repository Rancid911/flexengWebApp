import "@/lib/redis/server-only";

export type RateLimitFlow = "login" | "signup" | "forgot-password" | "reset-password" | "change-password";

export type RateLimitConfig = {
  flow: RateLimitFlow;
  limit: number;
  window: "15 m" | "1 h";
};

export const AUTH_RATE_LIMITS = {
  login: {
    flow: "login",
    limit: 5,
    window: "15 m"
  },
  signup: {
    flow: "signup",
    limit: 3,
    window: "1 h"
  },
  forgotPassword: {
    flow: "forgot-password",
    limit: 3,
    window: "1 h"
  },
  resetPassword: {
    flow: "reset-password",
    limit: 5,
    window: "15 m"
  },
  changePassword: {
    flow: "change-password",
    limit: 5,
    window: "15 m"
  }
} satisfies Record<string, RateLimitConfig>;
