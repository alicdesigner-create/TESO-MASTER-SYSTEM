import { NextRequest, NextResponse } from "next/server";
import { getProjects, saveProjects, generateId } from "@/lib/data";
import { Project } from "@/lib/types";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async () => {
  return NextResponse.json(getProjects());
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const projects = getProjects();
  const now = new Date().toISOString();
  const newProject: Project = {
    ...body,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  saveProjects([...projects, newProject]);
  return NextResponse.json(newProject, { status: 201 });
});
