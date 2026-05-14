import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/lib/permissions";
import { requireScheduleApi } from "@/lib/schedule/server";
import { withScheduleErrorHandling } from "@/lib/schedule/http";
import { assignTeacherStudentPlacementTest, cancelTeacherStudentPlacementTest } from "@/lib/teacher-workspace/queries";

export const POST = withScheduleErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  requirePermission(actor, "learning.placement.assign", { studentId: id });

  const result = await assignTeacherStudentPlacementTest(actor, id);
  return NextResponse.json(result, { status: 201 });
});

export const DELETE = withScheduleErrorHandling(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const actor = await requireScheduleApi();
  const { id } = await params;
  requirePermission(actor, "learning.placement.assign", { studentId: id });

  const result = await cancelTeacherStudentPlacementTest(actor, id);
  return NextResponse.json(result);
});
