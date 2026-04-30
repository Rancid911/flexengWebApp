import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminStudentsSearch } from "@/app/(workspace)/(staff-zone)/admin/students/admin-students-search";
import { useState } from "react";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/students",
  useRouter: () => ({
    replace: replaceMock
  })
}));

describe("AdminStudentsSearch", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  function SearchHarness({ serverQuery = "" }: { serverQuery?: string }) {
    const [value, setValue] = useState(serverQuery);
    return <AdminStudentsSearch serverQuery={serverQuery} value={value} onValueChange={setValue} />;
  }

  it("does not search before three characters", async () => {
    render(<SearchHarness />);

    fireEvent.change(screen.getByLabelText("Поиск ученика"), { target: { value: "ab" } });
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    });

    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("updates the URL after three characters and debounce", async () => {
    render(<SearchHarness />);

    fireEvent.change(screen.getByLabelText("Поиск ученика"), { target: { value: "Ann" } });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/students?q=Ann&page=1", { scroll: false });
    });
  });

  it("clears the URL when the field is emptied", async () => {
    render(<SearchHarness serverQuery="Ann" />);

    fireEvent.change(screen.getByLabelText("Поиск ученика"), { target: { value: "" } });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/students", { scroll: false });
    });
  });

  it("keeps the search field compact", () => {
    render(<SearchHarness />);

    expect(screen.getByLabelText("Поиск ученика").className).toContain("sm:w-[360px]");
    expect(screen.getByLabelText("Поиск ученика").className).not.toContain("flex-1");
  });
});
