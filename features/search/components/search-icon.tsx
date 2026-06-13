"use client";

import {
  Bell,
  BookOpen,
  Brain,
  ClipboardList,
  FileText,
  Folder,
  GraduationCap,
  Languages,
  Layers,
  LucideIcon,
  User
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  bell: Bell,
  "book-open": BookOpen,
  brain: Brain,
  "clipboard-list": ClipboardList,
  "file-text": FileText,
  folder: Folder,
  "graduation-cap": GraduationCap,
  languages: Languages,
  layers: Layers,
  user: User
};

export function SearchIcon({ icon, className }: { icon: string | null; className?: string }) {
  const Icon = (icon && iconMap[icon]) || FileText;
  return <Icon className={className} />;
}
