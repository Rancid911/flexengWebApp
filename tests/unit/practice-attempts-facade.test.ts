import { describe, expect, it } from "vitest";

import { submitPracticeTestAttempt as facadeSubmit } from "@/lib/practice/attempts";
import { submitPracticeTestAttempt as serviceSubmit } from "@/lib/practice/practice-attempts.service";

describe("practice attempts compatibility facade", () => {
  it("re-exports the canonical submit service", () => {
    expect(facadeSubmit).toBe(serviceSubmit);
  });
});

