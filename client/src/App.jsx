import { useTranscriber } from "./hooks/useTranscriber";

export default function App() {
  const { text, recording, error, start, stop } = useTranscriber();
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <button
        onClick={recording ? stop : start}
        className={`px-4 py-2 rounded text-white ${recording ? "bg-red-600" : "bg-blue-600"}`}
      >
        {recording ? "Stop" : "Record"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
      <p className="whitespace-pre-wrap border rounded p-3 min-h-24">{text}</p>
    </div>
  );
}
