import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeroLeadModal } from "@/app/main/hero-lead-modal";

describe("HeroLeadModal", () => {
  it("opens a compact mobile-ready form with all lead fields", async () => {
    render(<HeroLeadModal />);

    fireEvent.click(screen.getByRole("button", { name: /Оставить заявку/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Закрыть окно" })).toBeInTheDocument());

    expect(screen.getByTestId("hero-lead-modal-promo")).toHaveClass("hidden");
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Телефон")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Для ребёнка" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Для взрослого" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /обработку персональных данных/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /информационных и рекламных сообщений/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отправить заявку" })).toBeInTheDocument();
  });
});
