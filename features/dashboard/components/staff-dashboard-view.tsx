import type { UserRole } from "@/lib/auth/get-user-role";

export default function StaffDashboardView({ role = "manager" }: { role?: Exclude<UserRole, "student" | "teacher" | "admin"> }) {
  return (
    <div className="space-y-4 pb-8">
      <section className="rounded-2xl border border-[#dde2e9] bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Дашборд</h1>
        <p className="mt-3 text-base text-slate-600">
          {role === "manager" ? "Manager dashboard будет следующим этапом после teacher workspace." : "Раздел в разработке."}
        </p>
      </section>
    </div>
  );
}
