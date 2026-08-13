import { NextRequest, NextResponse } from "next/server";
import { getProjects, saveProjects } from "@/lib/data";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  const project = getProjects().find((p) => p.id === params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
});

export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  projects[idx] = { ...projects[idx], ...body, id: params.id, updatedAt: new Date().toISOString() };
  saveProjects(projects);
  return NextResponse.json(projects[idx]);
});

export const DELETE = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  saveProjects(getProjects().filter((p) => p.id !== params.id));
  return NextResponse.json({ ok: true });
});
