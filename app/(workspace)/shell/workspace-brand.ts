import type { UserRole } from "@/lib/auth/get-user-role";

export type WorkspaceBrandStyles = {
  focusRingClassName: string;
  iconContainerClassName: string;
  titleClassName: string;
};

const studentBrandStyles: WorkspaceBrandStyles = {
  focusRingClassName: "focus-visible:ring-indigo-300",
  iconContainerClassName: "bg-[linear-gradient(135deg,#4e44d4_0%,#9895ff_100%)] shadow-lg",
  titleClassName: "text-indigo-700"
};

const staffBrandStyles: WorkspaceBrandStyles = {
  focusRingClassName: "focus-visible:ring-[#88a8e8]",
  iconContainerClassName: "bg-[linear-gradient(135deg,#0f172a_0%,#1f3d7a_100%)] shadow-[0_14px_30px_rgba(15,23,42,0.28)]",
  titleClassName: "text-[#1f3d7a]"
};

export function getWorkspaceBrandStyles(currentRole: UserRole | null): WorkspaceBrandStyles {
  if (currentRole === "teacher" || currentRole === "manager" || currentRole === "admin") {
    return staffBrandStyles;
  }

  return studentBrandStyles;
}
