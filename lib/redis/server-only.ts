if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
  throw new Error("Redis utilities are server-only and must not be imported by client code.");
}
