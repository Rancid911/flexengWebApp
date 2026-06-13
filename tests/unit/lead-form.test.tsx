import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LeadForm } from "@/features/marketing/components/lead-form";
import { TrialLessonPage } from "@/features/marketing/landing-pages/trial-lesson/trial-lesson-page";

function fillValidLeadForm(scope: ReturnType<typeof within>) {
  fireEvent.change(scope.getByLabelText("Имя"), { target: { value: "Анна" } });
  fireEvent.change(scope.getByLabelText("Телефон"), { target: { value: "9991112233" } });
  fireEvent.change(scope.getByLabelText("Email"), { target: { value: "anna@example.com" } });
  fireEvent.click(scope.getByRole("radio", { name: "Для взрослого" }));
  fireEvent.click(scope.getByRole("checkbox", { name: /обработку персональных данных/i }));
}

describe("LeadForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: ""
    });
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("preserves the homepage payload defaults and omits tracking metadata", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);
    render(<LeadForm />);

    fillValidLeadForm(within(screen.getByRole("form")));
    fireEvent.click(screen.getByRole("button", { name: "Отправить заявку" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] ?? [];
    const payload = JSON.parse(String(request?.body)) as Record<string, unknown>;

    expect(payload).toMatchObject({
      name: "Анна",
      phone: "+7 (999) 111 22 33",
      email: "anna@example.com",
      source: "website",
      form_type: "main_lead_form",
      metadata: {
        audience: "adult",
        consent_personal_data: true,
        consent_marketing: false
      }
    });
    expect(payload.metadata).not.toHaveProperty("utm_source");
    expect(payload.metadata).not.toHaveProperty("full_url");
  });

  it("adds landing attribution and tracking while preserving actual form values", async () => {
    window.history.replaceState(
      {},
      "",
      "/lp/trial-lesson?utm_source=telegram&utm_medium=cpc&utm_campaign=summer&utm_content=video&utm_term=english"
    );
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://example.com/campaign"
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

    render(
      <LeadForm
        source="trial_lesson_landing"
        formType="trial_lesson"
        submitLabel="Записаться"
        includeTrackingData
        additionalMetadata={{
          offer: "free_intro_lesson",
          placement: "lp_trial_lesson",
          audience: "child",
          consent_personal_data: false
        }}
      />
    );

    fillValidLeadForm(within(screen.getByRole("form")));
    fireEvent.click(screen.getByRole("button", { name: "Записаться" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] ?? [];
    const payload = JSON.parse(String(request?.body)) as {
      source: string;
      form_type: string;
      page_url: string;
      metadata: Record<string, unknown>;
    };

    expect(payload.source).toBe("trial_lesson_landing");
    expect(payload.form_type).toBe("trial_lesson");
    expect(payload.page_url).toContain("/lp/trial-lesson?utm_source=telegram");
    expect(payload.metadata).toMatchObject({
      offer: "free_intro_lesson",
      placement: "lp_trial_lesson",
      audience: "adult",
      consent_personal_data: true,
      consent_marketing: false,
      utm_source: "telegram",
      utm_medium: "cpc",
      utm_campaign: "summer",
      utm_content: "video",
      utm_term: "english",
      referrer: "https://example.com/campaign",
      landing_path: "/lp/trial-lesson"
    });
    expect(payload.metadata.full_url).toBe(payload.page_url);
  });

  it("uses independent ids and radio groups for multiple mounted forms", () => {
    render(
      <>
        <LeadForm />
        <LeadForm />
      </>
    );

    const nameInputs = screen.getAllByLabelText("Имя");
    const adultRadios = screen.getAllByRole("radio", { name: "Для взрослого" });
    const personalConsentInputs = screen.getAllByRole("checkbox", { name: /обработку персональных данных/i });

    expect(nameInputs[0].id).not.toBe(nameInputs[1].id);
    expect(adultRadios[0].id).not.toBe(adultRadios[1].id);
    expect(adultRadios[0]).not.toHaveAttribute("name", adultRadios[1].getAttribute("name"));
    expect(personalConsentInputs[0].id).not.toBe(personalConsentInputs[1].id);
  });
});

describe("TrialLessonPage", () => {
  it("renders the focused offer, benefits, form fields, and CTA", () => {
    const { container } = render(<TrialLessonPage />);

    expect(screen.getByRole("heading", { name: "Запишитесь на бесплатный вводный урок", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Познакомимся, определим уровень и подберём подходящий формат обучения")).toBeInTheDocument();
    expect(screen.getByText("Познакомитесь с преподавателем")).toBeInTheDocument();
    expect(screen.getByText("Пройдёте короткое тестирование уровня")).toBeInTheDocument();
    expect(screen.getByText("Получите рекомендации по обучению")).toBeInTheDocument();
    expect(screen.getByText("Узнаете, какой формат занятий подойдёт именно вам")).toBeInTheDocument();
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Телефон")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Записаться" })).toBeInTheDocument();
    expect(container.querySelector("main")).not.toHaveClass("bg-[#F7F5FC]");
    expect(container.querySelector("section")).not.toHaveClass(
      "bg-[linear-gradient(135deg,#2D284A_0%,#403965_50%,#554D82_100%)]"
    );
    expect(container.querySelector(".bg-\\[\\#F76D63\\]\\/15")).not.toBeInTheDocument();
    expect(container.querySelector(".max-w-6xl")).toHaveClass(
      "lg:items-start",
      "lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.82fr)]"
    );
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveClass("lg:text-6xl");
  });
});
