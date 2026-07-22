// Thin, isolated client for sunoapi.org. All vendor specifics live here so the
// rest of the app stays provider-agnostic (architecture: MusicProvider boundary).

const BASE_URL = "https://api.sunoapi.org";

export type SunoStatus =
  | "PENDING"
  | "TEXT_SUCCESS"
  | "FIRST_SUCCESS"
  | "SUCCESS"
  | "CREATE_TASK_FAILED"
  | "GENERATE_AUDIO_FAILED"
  | "CALLBACK_EXCEPTION"
  | "SENSITIVE_WORD_ERROR";

export type SunoTrack = {
  id: string;
  title: string;
  lyrics: string | null;
  audioUrl: string | null;
  streamAudioUrl: string | null;
  imageUrl: string | null;
  duration: number | null;
};

export type TaskResult = {
  taskId: string;
  status: SunoStatus | string;
  done: boolean;
  failed: boolean;
  errorMessage: string | null;
  tracks: SunoTrack[];
};

const FAILED_STATUSES = new Set([
  "CREATE_TASK_FAILED",
  "GENERATE_AUDIO_FAILED",
  "CALLBACK_EXCEPTION",
  "SENSITIVE_WORD_ERROR",
]);

function apiKey(): string {
  const key = process.env.SUNO_API_KEY;
  if (!key) throw new Error("SUNO_API_KEY is not set on the server.");
  return key;
}

export type GenerateInput = {
  prompt: string;
  instrumental?: boolean;
  model?: string;
  callBackUrl: string;
};

/** Kicks off a generation in simple (non-custom) mode. Returns the taskId. */
export async function generateMusic(input: GenerateInput): Promise<string> {
  const body = {
    prompt: input.prompt,
    customMode: false,
    instrumental: Boolean(input.instrumental),
    model: input.model || "V4_5",
    callBackUrl: input.callBackUrl,
  };

  const res = await fetch(`${BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.code !== 200) {
    throw new Error(json?.msg || `Suno generate failed (HTTP ${res.status}).`);
  }
  const taskId = json?.data?.taskId;
  if (!taskId) throw new Error("Suno did not return a taskId.");
  return taskId;
}

/** Polls a task and normalizes the response into our own shape. */
export async function getTask(taskId: string): Promise<TaskResult> {
  const url = `${BASE_URL}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey()}` },
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.code !== 200) {
    throw new Error(json?.msg || `Suno status check failed (HTTP ${res.status}).`);
  }

  const data = json?.data ?? {};
  const status: string = data?.status ?? "PENDING";
  const rawTracks: any[] = data?.response?.sunoData ?? [];

  const tracks: SunoTrack[] = rawTracks.map((t) => ({
    id: String(t?.id ?? ""),
    title: t?.title || "Untitled",
    // Suno returns the generated lyrics for each clip in the `prompt` field.
    lyrics: (t?.prompt ?? "").trim() || null,
    audioUrl: t?.audioUrl || null,
    streamAudioUrl: t?.streamAudioUrl || null,
    imageUrl: t?.imageUrl || null,
    duration: typeof t?.duration === "number" ? t.duration : null,
  }));

  return {
    taskId,
    status,
    done: status === "SUCCESS",
    failed: FAILED_STATUSES.has(status),
    errorMessage: data?.errorMessage ?? null,
    tracks,
  };
}
