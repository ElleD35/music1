"use client";

import { useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  audioUrl: string | null;
  streamAudioUrl: string | null;
  imageUrl: string | null;
  duration: number | null;
};

type TaskResult = {
  taskId: string;
  status: string;
  done: boolean;
  failed: boolean;
  errorMessage: string | null;
  tracks: Track[];
};

const MODELS = [
  { value: "V4_5", label: "V4.5 — balanced (recommended)" },
  { value: "V5", label: "V5 — newest" },
  { value: "V4_5PLUS", label: "V4.5 Plus" },
];

const WAITING_LINES = [
  "Listening to what you shared…",
  "Finding the melody in your words…",
  "Writing your verses…",
  "Shaping the sound…",
  "Almost there — mixing your song…",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState("V4_5");

  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [tracks, setTracks] = useState<Track[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitIdx = useRef(0);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleGenerate() {
    setError("");
    setTracks([]);
    if (!prompt.trim()) {
      setError("Please describe the music you want.");
      return;
    }

    setBusy(true);
    waitIdx.current = 0;
    setStatusLine(WAITING_LINES[0]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), instrumental, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");

      startPolling(data.taskId);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function startPolling(taskId: string) {
    stopPolling();
    let ticks = 0;
    const MAX_TICKS = 60; // ~5 min at 5s

    pollRef.current = setInterval(async () => {
      ticks += 1;

      // rotate the warm waiting copy
      waitIdx.current = Math.min(
        WAITING_LINES.length - 1,
        Math.floor(ticks / 3),
      );
      setStatusLine(WAITING_LINES[waitIdx.current]);

      try {
        const res = await fetch(`/api/status?taskId=${encodeURIComponent(taskId)}`);
        const data: TaskResult = await res.json();
        if (!res.ok) throw new Error((data as any)?.error || "Status check failed.");

        if (data.tracks.length > 0) setTracks(data.tracks);

        if (data.failed) {
          stopPolling();
          setBusy(false);
          setError(
            data.status === "SENSITIVE_WORD_ERROR"
              ? "That description couldn't be used. Try rephrasing it gently."
              : data.errorMessage || "The song couldn't be created. Please try again.",
          );
          return;
        }

        if (data.done) {
          stopPolling();
          setBusy(false);
          setStatusLine("");
          return;
        }
      } catch (err) {
        // transient errors: keep trying until MAX_TICKS
        if (ticks >= MAX_TICKS) {
          stopPolling();
          setBusy(false);
          setError(err instanceof Error ? err.message : "Status check failed.");
          return;
        }
      }

      if (ticks >= MAX_TICKS) {
        stopPolling();
        setBusy(false);
        setStatusLine("");
        if (tracks.length === 0) {
          setError("This is taking longer than usual. Please try again in a moment.");
        }
      }
    }, 5000);
  }

  return (
    <main className="wrap">
      <p className="brand">Anthem</p>
      <h1>Tell me what you carried.</h1>
      <p className="subtitle">
        Describe a feeling, a story, or someone you love — and I&apos;ll make you an
        original song that says you were seen.
      </p>

      <div className="card">
        <label htmlFor="prompt">Your song, in your words</label>
        <textarea
          id="prompt"
          value={prompt}
          maxLength={500}
          placeholder="e.g. A tender, hopeful song for my mom, who raised three kids alone and never heard thank you…"
          onChange={(e) => setPrompt(e.target.value)}
          disabled={busy}
        />

        <div className="row">
          <div className="field">
            <label htmlFor="model">Style engine</label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={busy}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={instrumental}
              onChange={(e) => setInstrumental(e.target.checked)}
              disabled={busy}
            />
            Instrumental (no vocals)
          </label>

          <span className="count">{prompt.length}/500</span>
        </div>

        <button className="primary" onClick={handleGenerate} disabled={busy}>
          {busy ? "Creating your song…" : "Create my song"}
        </button>
      </div>

      {busy && (
        <div className="status" role="status" aria-live="polite">
          <span className="spinner" aria-hidden="true" />
          <span>{statusLine} This usually takes 1–3 minutes.</span>
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="results">
          {tracks.map((t) => {
            const src = t.audioUrl || t.streamAudioUrl || "";
            return (
              <div className="track" key={t.id}>
                {t.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt="" />
                )}
                <div className="track-body">
                  <p className="track-title">{t.title}</p>
                  {src && <audio controls preload="none" src={src} />}
                  <div className="track-meta">
                    {t.duration != null && <span>{Math.round(t.duration)}s</span>}
                    {t.audioUrl && (
                      <a href={t.audioUrl} download target="_blank" rel="noreferrer">
                        Download
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <footer>
        <p className="credit">Designed &amp; built by Eve D.</p>
        <p>
          Songs are generated with AI. Anthem is a prototype — please make music about
          your own life, not real artists.
        </p>
      </footer>
    </main>
  );
}
