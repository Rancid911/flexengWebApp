import type { UserRole } from "@/lib/auth/get-user-role";
import type { AppCapability } from "@/lib/auth/request-context";

export type SearchSection = "all" | "practice" | "homework" | "words" | "blog" | "admin";

export type SearchContext = {
  userId: string | null;
  role: UserRole | null;
  capabilities: AppCapability[];
  studentId: string | null;
  teacherId: string | null;
  isAuthenticated: boolean;
};

export type SearchDocumentCandidate = {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  href: string;
  section: Exclude<SearchSection, "all"> | "other";
  icon: string | null;
  badge: string | null;
  roleScope: string[];
  visibility: "public" | "role" | "student_owned" | "enrollment";
  ownerStudentId: string | null;
  courseId: string | null;
  isPublished: boolean;
  meta: Record<string, unknown>;
  updatedAt: string;
  rank: number;
};

export type SearchResultDto = {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  href: string;
  section: Exclude<SearchSection, "all">;
  icon: string | null;
  badge: string | null;
  snippet: string | null;
  rank: number;
};

export type SearchGroupDto = {
  key: Exclude<SearchSection, "all">;
  label: string;
  count: number;
};
