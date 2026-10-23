import { useRef, useState } from "react";

export function useTranscriber() {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const refs = useRef({});

  const start = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 16kHz context so no manual resampling is needed
      const ctx = new AudioContext({ sampleRate: 16000 });
      await ctx.audioWorklet.addModule("/pcm-processor.js");
      const source = ctx.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(ctx, "pcm-processor");

      const ws = new WebSocket(import.meta.env.VITE_WS_URL);
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.type === "transcript") setText((p) => p + m.text);
        if (m.type === "error") setError(m.message);
      };
      ws.onopen = () => {
        node.port.onmessage = (e) => ws.readyState === 1 && ws.send(e.data);
        source.connect(node);
        setRecording(true);
      };
      ws.onerror = () => setError("Connection failed");
      refs.current = { stream, ctx, ws, startedAt: Date.now() };
    } catch (e) {
      setError(
        e.name === "NotAllowedError"
          ? "Microphone permission denied"
          : e.message,
      );
    }
  };

  const stop = () => {
    const { stream, ctx, ws, startedAt } = refs.current;
    stream?.getTracks().forEach((t) => t.stop());
    ctx?.close();
    ws?.close();
    setRecording(false);
    return Math.round((Date.now() - startedAt) / 1000); // duration
  };

  return { text, setText, recording, error, start, stop };
}
