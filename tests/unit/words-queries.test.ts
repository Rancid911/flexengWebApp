import { describe, expect, it } from "vitest";

import * as facade from "@/lib/words/queries";
import * as service from "@/lib/words/words.service";

describe("words queries compatibility facade", () => {
  it("re-exports the canonical service functions and descriptors", () => {
    expect(facade.getStudentWords).toBe(service.getStudentWords);
    expect(facade.buildWordSession).toBe(service.buildWordSession);
    expect(facade.completeWordSession).toBe(service.completeWordSession);
    expect(facade.WORDS_LIST_DATA_LOADING).toBe(
      service.WORDS_LIST_DATA_LOADING
    );
  });
});

