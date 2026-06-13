import { render, screen } from "@testing-library/react";
import { CreditCard } from "lucide-react";
import { describe, expect, it } from "vitest";

import { WorkspaceSectionHero } from "@/shared/ui/workspace-section-hero";

describe("WorkspaceSectionHero", () => {
  it("renders badge, title, description and companion slots", () => {
    render(
      <WorkspaceSectionHero
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
