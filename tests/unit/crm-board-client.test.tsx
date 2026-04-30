import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CrmBoardClient } from "@/app/(workspace)/(staff-zone)/crm/crm-board-client";
import { CRM_STAGES } from "@/lib/crm/stages";
import type { CrmBoardDto, CrmLeadDetailDto, CrmSettingsDto } from "@/lib/crm/types";

const lead = {
  id: "lead-1",
  name: "Анна",
  phone: "+7 (999) 111 22 33",
  email: "anna@example.com",
  source: "website",
  form_type: "main_lead_form",
  page_url: "https://example.com/",
  comment: "Хочу консультацию",
  status: "new_request" as const,
  viewed_at: null,
  viewed_by: null,
  created_at: "2026-04-24T10:00:00.000Z",
  updated_at: "2026-04-24T10:00:00.000Z"
};

const board: CrmBoardDto = {
  stages: CRM_STAGES.map((stage) => ({
    slug: stage.slug,
    title: stage.title,
    leads: stage.slug === "new_request" ? [lead] : []
  }))
};

const detail: CrmLeadDetailDto = {
  ...lead,
  history: [{ id: "history-1", from_status: null, to_status: "new_request", changed_by: null, changed_by_name: null, created_at: lead.created_at }],
  comments: [{ id: "comment-1", body: "Позвонить завтра", author_id: "admin-1", author_name: "Admin", created_at: lead.created_at }]
};

const crmSettings: CrmSettingsDto = {
  background_image_url: "https://example.com/crm-bg.jpg",
  updated_at: "2026-04-24T11:00:00.000Z"
};

describe("CrmBoardClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders all CRM columns and lead cards", () => {
    render(<CrmBoardClient initialBoard={board} />);

    for (const stage of CRM_STAGES) {
      const count = stage.slug === "new_request" ? 1 : 0;
      expect(screen.getByRole("heading", { name: `${stage.title} (${count})` })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Анна/i })).toBeInTheDocument();
    expect(screen.getByText("+7 (999) 111 22 33")).toBeInTheDocument();
    expect(screen.getByText("anna@example.com")).toBeInTheDocument();
  });

  it("renders colored Bitrix-style CRM stage headers", () => {
    render(<CrmBoardClient initialBoard={board} />);

    expect(screen.getByTestId("crm-stage-header-new_request")).toHaveClass("bg-[#00f018]");
    expect(screen.getByTestId("crm-stage-header-contact_established")).toHaveClass("bg-[#fff200]");
    expect(screen.getByTestId("crm-stage-header-contract_signed")).toHaveClass("bg-[#ff5f8f]");
    expect(screen.getByRole("heading", { name: "Новый запрос (1)" })).toBeInTheDocument();
  });

  it("renders CRM board columns as transparent dashed lanes", () => {
    render(<CrmBoardClient initialBoard={board} />);

    const root = screen.getByTestId("crm-board-root");
    const boardScroll = screen.getByTestId("crm-board-scroll");
    const boardRow = screen.getByTestId("crm-board-row");
    const firstStageColumn = screen.getByTestId("crm-stage-column-new_request");
    const firstStageDivider = screen.getByTestId("crm-stage-divider-new_request");

    expect(root).toHaveClass("flex");
    expect(root).toHaveClass("flex-col");
    expect(root).toHaveClass("min-h-[calc(100vh-5rem+1.5rem)]");
    expect(root).toHaveClass("xl:min-h-[calc(100vh-5rem+2rem)]");
    expect(root).toHaveClass("pt-5");
    expect(root).toHaveClass("pb-0");
    expect(root).toHaveClass("-mb-6");
    expect(root).toHaveClass("xl:-mb-8");
    expect(boardScroll).toHaveClass("flex");
    expect(boardScroll).toHaveClass("flex-1");
    expect(boardRow).toHaveClass("gap-1");
    expect(boardRow).toHaveClass("flex-1");
    expect(boardRow).toHaveClass("items-stretch");
    expect(boardRow).not.toHaveClass("min-h-[calc(100vh-15rem)]");
    expect(boardRow).not.toHaveClass("min-h-screen");
    expect(firstStageColumn).toHaveClass("bg-transparent");
    expect(firstStageColumn).toHaveClass("min-h-full");
    expect(firstStageColumn).toHaveClass("self-stretch");
    expect(firstStageColumn).not.toHaveClass("border-l");
    expect(firstStageColumn).not.toHaveClass("border-x");
    expect(firstStageColumn).not.toHaveClass("border-r");
    expect(firstStageColumn).not.toHaveClass("bg-[#eef3f9]");
    expect(firstStageDivider).toHaveClass("absolute");
    expect(firstStageDivider).toHaveClass("top-2");
    expect(firstStageDivider).toHaveClass("bottom-0");
    expect(firstStageDivider).toHaveClass("border-l");
    expect(firstStageDivider).toHaveClass("border-dashed");
    expect(screen.getAllByText("Нет заявок")[0]).toHaveClass("bg-slate-950/15");
  });

  it("keeps the colored source badge on CRM lead cards", () => {
    render(<CrmBoardClient initialBoard={board} />);

    const sourceBadge = screen.getByTestId("crm-lead-source-badge");
    const leadCard = screen.getByRole("button", { name: /Анна/i });

    expect(leadCard).toHaveClass("bg-white/90");
    expect(leadCard).not.toHaveClass("bg-white/5");
    expect(leadCard).not.toHaveClass("backdrop-blur-md");
    expect(sourceBadge).toHaveTextContent("website");
    expect(sourceBadge).toHaveClass("bg-[#eef2ff]");
    expect(sourceBadge).toHaveClass("text-[#4f46e5]");
  });

  it("renders top CRM stats as glass cards with white text", () => {
    render(<CrmBoardClient initialBoard={board} />);

    for (const testId of ["crm-stat-card-total", "crm-stat-card-new", "crm-stat-card-columns"]) {
      expect(screen.getByTestId(testId)).toHaveClass("bg-white/5");
      expect(screen.getByTestId(testId)).toHaveClass("backdrop-blur-md");
      expect(screen.getByTestId(testId)).not.toHaveClass("bg-white");
      expect(screen.getByTestId(testId)).not.toHaveClass("border-slate-200");
    }

    expect(screen.getByText("Всего заявок")).toHaveClass("text-white/60");
    expect(screen.getByText("Колонок")).toHaveClass("text-white/60");
    expect(screen.getByText("11")).toHaveClass("text-white");
  });

  it("keeps the original CRM page padding", () => {
    const { container } = render(<CrmBoardClient initialBoard={board} />);
    const root = container.querySelector("main");

    expect(root).toHaveClass("px-4");
    expect(root).toHaveClass("sm:px-6");
    expect(root).toHaveClass("lg:px-8");
  });

  it("renders stats before search without the old page heading block", () => {
    render(<CrmBoardClient initialBoard={board} />);

    expect(screen.queryByRole("heading", { name: "Заявки" })).not.toBeInTheDocument();
    expect(screen.queryByText("Канбан по воронке продаж. Новые заявки с форм сайта автоматически попадают в первую колонку.")).not.toBeInTheDocument();

    const totalCardLabel = screen.getByText("Всего заявок");
    const searchInput = screen.getByPlaceholderText("Поиск по имени, телефону, email");
    const refreshButton = screen.getByRole("button", { name: "Обновить" });
    const settingsButton = screen.getByRole("button", { name: "Настройки CRM" });
    const firstColumnHeading = screen.getByRole("heading", { name: "Новый запрос (1)" });

    expect(totalCardLabel.compareDocumentPosition(searchInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(searchInput.compareDocumentPosition(refreshButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(refreshButton.compareDocumentPosition(settingsButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(settingsButton.compareDocumentPosition(firstColumnHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("opens CRM settings drawer from the gear button", () => {
    render(<CrmBoardClient initialBoard={board} />);

    fireEvent.click(screen.getByRole("button", { name: "Настройки CRM" }));

    expect(screen.getByRole("dialog", { name: "Настройки CRM" })).toBeInTheDocument();
    expect(screen.getByText("Фон CRM")).toBeInTheDocument();
    expect(screen.getByText("Фон не выбран")).toBeInTheDocument();
  });

  it("keeps the CRM page root transparent when a saved background is provided by the shell", () => {
    render(<CrmBoardClient initialBoard={board} initialSettings={crmSettings} />);

    expect(screen.getByTestId("crm-board-root")).toHaveClass("bg-transparent");
    expect(screen.getByTestId("crm-board-root").style.backgroundImage).toBe("");
    expect(screen.getByTestId("crm-board-root").style.backgroundImage).not.toContain("linear-gradient");
  });

  it("clears CRM background through settings drawer", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ background_image_url: null, updated_at: "2026-04-24T12:00:00.000Z" })
    } as Response);

    render(<CrmBoardClient initialBoard={board} initialSettings={crmSettings} />);

    fireEvent.click(screen.getByRole("button", { name: "Настройки CRM" }));
    fireEvent.click(screen.getByRole("button", { name: "Удалить фон" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Фон CRM удалён."));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/crm/settings",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ background_image_url: null })
      })
    );
    expect(screen.getByTestId("crm-board-root").style.backgroundImage).toBe("");
  });

  it("opens lead details with history and comments", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => detail
    } as Response);

    render(<CrmBoardClient initialBoard={board} />);
    fireEvent.click(screen.getByRole("button", { name: /Анна/i }));

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Комментарий пользователя")).toBeInTheDocument();
    expect(screen.getByText("Позвонить завтра")).toBeInTheDocument();
    expect(screen.getByText(/Создание/)).toBeInTheDocument();
  });

  it("does not delete a lead when confirmation is cancelled", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => detail
    } as Response);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<CrmBoardClient initialBoard={board} />);
    fireEvent.click(screen.getByRole("button", { name: /Анна/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Удалить заявку" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Удалить заявку" }));

    expect(fetchMock).not.toHaveBeenCalledWith("/api/crm/leads/lead-1", expect.objectContaining({ method: "DELETE" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Анна/i })).toBeInTheDocument();
  });

  it("deletes a lead after confirmation and closes the drawer", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (String(input).endsWith("/api/crm/leads/lead-1") && init?.method === "DELETE") {
        return { ok: true, json: async () => ({ ok: true, id: "lead-1" }) } as Response;
      }
      return { ok: true, json: async () => detail } as Response;
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<CrmBoardClient initialBoard={board} />);
    fireEvent.click(screen.getByRole("button", { name: /Анна/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Удалить заявку" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Удалить заявку" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Анна/i })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/crm/leads/lead-1", expect.objectContaining({ method: "DELETE" }));
  });

  it("refreshes CRM unread summary after opening lead details", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/api/crm/unread-summary")) {
        return { ok: true, json: async () => ({ unreadCount: 0 }) } as Response;
      }
      return { ok: true, json: async () => detail } as Response;
    });

    render(<CrmBoardClient initialBoard={board} />);
    fireEvent.click(screen.getByRole("button", { name: /Анна/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/crm/unread-summary", expect.objectContaining({ cache: "no-store" })));
  });

  it("auto-refreshes CRM board every 60 seconds and updates unread summary", async () => {
    vi.useFakeTimers();
    const nextLead = {
      ...lead,
      id: "lead-2",
      name: "Мария",
      email: "maria@example.com"
    };
    const nextBoard: CrmBoardDto = {
      stages: CRM_STAGES.map((stage) => ({
        slug: stage.slug,
        title: stage.title,
        leads: stage.slug === "new_request" ? [nextLead] : []
      }))
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/api/crm/leads")) {
        return { ok: true, json: async () => nextBoard } as Response;
      }
      if (String(input).endsWith("/api/crm/unread-summary")) {
        return { ok: true, json: async () => ({ unreadCount: 1 }) } as Response;
      }
      return { ok: true, json: async () => detail } as Response;
    });

    render(<CrmBoardClient initialBoard={board} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/crm/leads", expect.any(Object));
    expect(fetchMock).toHaveBeenCalledWith("/api/crm/unread-summary", expect.objectContaining({ cache: "no-store" }));
    expect(screen.getByRole("button", { name: /Мария/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Анна/i })).not.toBeInTheDocument();
  });

  it("skips auto-refresh while a lead detail request is loading", async () => {
    vi.useFakeTimers();
    let resolveDetail: ((value: Response) => void) | null = null;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
      if (String(input).endsWith("/api/crm/leads/lead-1")) {
        return new Promise<Response>((resolve) => {
          resolveDetail = resolve;
        });
      }
      return Promise.resolve({ ok: true, json: async () => board } as Response);
    });

    render(<CrmBoardClient initialBoard={board} />);
    fireEvent.click(screen.getByRole("button", { name: /Анна/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(fetchMock).not.toHaveBeenCalledWith("/api/crm/leads");

    await act(async () => {
      resolveDetail?.({ ok: true, json: async () => detail } as Response);
    });
  });
});
