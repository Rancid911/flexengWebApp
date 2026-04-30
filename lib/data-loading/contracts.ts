import type { AccessMode } from "@/lib/supabase/access";

export type DataLoadLevel = "layout" | "page" | "section" | "client_interaction";
export type DataShape = "identity" | "summary" | "list" | "detail" | "aggregate";
export type DataLoadingIssue = "duplicated_fetch" | "waterfall" | "overfetch" | "mixed_responsibilities";

export type DataLoadingDescriptor = {
  id: string;
  owner: string;
  accessMode: AccessMode;
  loadLevel: DataLoadLevel;
  shape: DataShape;
  issues: DataLoadingIssue[];
  transitional?: boolean;
  notes?: string[];
};

export type DataLoadingCatalogEntry = {
  route: string;
  pageLoaders: DataLoadingDescriptor[];
  sectionLoaders?: DataLoadingDescriptor[];
  notes?: string[];
};

export function defineDataLoadingDescriptor(descriptor: DataLoadingDescriptor) {
  return descriptor;
}
