import { getTask } from "@/lib/suno";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId) {
    return Response.json({ error: "Missing taskId." }, { status: 400 });
  }

  try {
    const result = await getTask(taskId);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
