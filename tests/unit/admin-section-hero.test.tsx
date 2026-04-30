import { render, screen } from "@testing-library/react";
import { CreditCard } from "lucide-react";
import { describe, expect, it } from "vitest";

import { AdminSectionHero } from "@/app/(workspace)/(staff-zone)/admin/ui/admin-section-hero";

describe("AdminSectionHero", () => {
  it("renders badge, title, description and companion slots", () => {
    render(
      <AdminSectionHero
        badgeIcon={CreditCard}
        badgeLabel="Оплата"
        title="Контроль оплаты"
        description="Описание раздела"
        metricsSlot={<div>Фокус периода</div>}
        actionsSlot={<button type="button">Открыть</button>}
      />
    );

    expect(screen.getByText("Оплата")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Контроль оплаты" })).toBeInTheDocument();
    expect(screen.getByText("Описание раздела")).toBeInTheDocument();
    expect(screen.getByText("Фокус периода")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Открыть" })).toBeInTheDocument();
  });
});
