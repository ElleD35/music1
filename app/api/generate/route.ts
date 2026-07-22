import { generateMusic } from "@/lib/suno";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let payload: { prompt?: string; instrumental?: boolean; model?: string };
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (payload.prompt || "").trim();
  if (!prompt) {
    return Response.json({ error: "Please describe the music you want." }, { status: 400 });
  }
  if (prompt.length > 500) {
    return Response.json(
      { error: "Please keep your description under 500 characters." },
      { status: 400 },
    );
  }

  // Suno requires a callBackUrl. We still poll for status, so this can point at
  // our own no-op endpoint. Prefer an explicit env, else derive from this request.
  const callBackUrl =
    process.env.SUNO_CALLBACK_URL ||
    new URL("/api/suno-callback", req.url).toString();

  try {
    const taskId = await generateMusic({
      prompt,
      instrumental: Boolean(payload.instrumental),
      model: payload.model,
      callBackUrl,
    });
    return Response.json({ taskId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
