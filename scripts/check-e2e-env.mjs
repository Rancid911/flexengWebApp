const required = [
  "E2E_STUDENT_EMAIL",
  "E2E_STUDENT_PASSWORD",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD"
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("E2E smoke env check failed.");
  console.error(`Missing variables: ${missing.join(", ")}`);
  console.error("Set them in your shell or .env.local before running `npm run test:smoke`.");
  process.exit(1);
}

console.log("E2E smoke env check passed.");

