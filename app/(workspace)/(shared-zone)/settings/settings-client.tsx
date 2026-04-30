"use client";

import { useSettingsFormState } from "@/app/(workspace)/(shared-zone)/settings/use-settings-form-state";
import {
  SettingsEmailSection,
  SettingsPasswordSection,
  SettingsProfileSection,
  SettingsSaveSection
} from "@/app/(workspace)/(shared-zone)/settings/settings-sections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAutoClearingState } from "@/hooks/use-auto-clearing-state";

export function SettingsClient() {
  const settingsState = useSettingsFormState();
  useAutoClearingState(settingsState.saveMessage, settingsState.setSaveMessage, "");
  useAutoClearingState(settingsState.avatarMessage, settingsState.setAvatarMessage, "");

  if (settingsState.loading) {
    return <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Загрузка настроек...</div>;
  }

  return (
    <div className="w-full">
      <Card className="w-full rounded-2xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">Профиль</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={settingsState.handleSaveAll} className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="space-y-4">
                <SettingsProfileSection {...settingsState} />
                <SettingsEmailSection {...settingsState} />
              </section>
              <section className="flex h-full flex-col space-y-4">
                <SettingsPasswordSection {...settingsState} />
                <div className="mt-auto hidden xl:block">
                  <div className="pt-4">
                    <SettingsSaveSection align="right" {...settingsState} />
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-2 xl:hidden">
              <SettingsSaveSection {...settingsState} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
