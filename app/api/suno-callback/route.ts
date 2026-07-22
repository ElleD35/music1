// Suno POSTs generation results here. The prototype relies on polling instead,
// so this endpoint simply acknowledges receipt with 200.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return new Response("ok", { status: 200 });
}

export async function GET() {
  return new Response("ok", { status: 200 });
}
