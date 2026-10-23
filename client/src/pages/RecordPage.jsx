import { useRef, useState } from "react";
import { createTranscription, errMsg } from "../api";
import { useTranscriber } from "../hooks/useTranscriber.js"; // your Phase 2 logic

export default function RecordPage() {
  const {
    text,
    setText,
    listening,
    start,
    stop,
    error: micError,
  } = useTranscriber();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const startedAt = useRef(null);
  const duration = useRef(0);

  const handleStart = () => {
    setStatus(null);
    startedAt.current = Date.now();
    start();
  };
  const handleStop = () => {
    duration.current = Math.round((Date.now() - startedAt.current) / 1000);
    stop();
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await createTranscription({
        title: title.trim() || `Recording ${new Date().toLocaleString()}`,
        text,
        duration_seconds: duration.current,
      });
      setStatus({ type: "ok", msg: "Saved! Find it in History." });
      setTitle("");
      setText("");
      duration.current = 0;
    } catch (e) {
      setStatus({ type: "err", msg: errMsg(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Record</h2>
      <p className="mt-1 text-sm text-slate-500">
        Speak in Hindi, English, or a mix. Your words appear live below.
      </p>

      <div className="my-6 flex flex-col items-center gap-3">
        <button
          onClick={listening ? handleStop : handleStart}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white shadow-lg transition focus:outline-none focus:ring-4 ${
            listening
              ? "bg-red-500 hover:bg-red-600 focus:ring-red-200"
              : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200"
          }`}
          aria-label={listening ? "Stop recording" : "Start recording"}
        >
          {listening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />
          )}
          <span className="relative">{listening ? "⏹" : "🎙"}</span>
        </button>
        <span className="text-sm font-medium text-slate-600">
          {listening ? "Listening… tap to stop" : "Tap to start recording"}
        </span>
      </div>

      {micError && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {micError}
        </p>
      )}

      <label className="mb-1 block text-sm font-medium text-slate-700">
        Transcription
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your transcription will appear here…"
        rows={8}
        className="w-full rounded-lg border border-slate-300 p-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />

      <label className="mb-1 mt-4 block text-sm font-medium text-slate-700">
        Title
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Team meeting notes"
        className="w-full rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />

      <button
        onClick={save}
        disabled={saving || listening || !text.trim()}
        className="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {saving ? "Saving…" : "Save transcription"}
      </button>

      {status && (
        <p
          className={`mt-3 rounded-md px-3 py-2 text-sm ${
            status.type === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.msg}
        </p>
      )}
    </section>
  );
}
