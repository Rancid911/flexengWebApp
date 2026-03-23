import { CheckCircle2, ClipboardList, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const homeworkItems = [
  {
    id: "hw-essay",
    title: "Эссе: My Ideal Weekend",
    detail: "120–150 слов, использовать Present Perfect и Past Simple",
    deadline: "До понедельника, 20:00",
    status: "В работе"
  },
  {
    id: "hw-test",
    title: "Тест: времена группы Present",
    detail: "15 вопросов, автоматическая проверка",
    deadline: "До вторника, 18:00",
    status: "Не начато"
  }
];

export default function AssignmentsPage() {
  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Ваши текущие задания</h1>
        <p className="text-base text-slate-600">Здесь будут все задания от преподавателя, дедлайны и статус выполнения.</p>
      </section>

      <div className="space-y-4">
        {homeworkItems.map((item) => (
          <Card key={item.id} className="rounded-3xl border-[#dde2e9] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                  <p className="text-sm text-slate-600">{item.detail}</p>
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Timer className="h-3.5 w-3.5" />
                    {item.deadline}
                  </p>
                </div>
              </div>

              <Badge variant="secondary" className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                {item.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-[#dde2e9] bg-[#eef1f3]">
        <CardContent className="flex items-center gap-3 p-5 text-sm text-slate-700">
          <CheckCircle2 className="h-5 w-5 text-indigo-700" />
          Режим сдачи и проверок подключён. Следующий шаг: загрузка ответов и комментарии преподавателя.
        </CardContent>
      </Card>
    </div>
  );
}
