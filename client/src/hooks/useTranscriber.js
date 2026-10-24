import { useCallback, useEffect, useRef, useState } from "react";

function disposeSession(session) {
  if (!session) return;

  session.active = false;
  session.node?.port.close();
  session.node?.disconnect();
  session.source?.disconnect();
  session.stream?.getTracks().forEach((track) => track.stop());

  if (session.ws && session.ws.readyState < WebSocket.CLOSING) {
    session.ws.close();
  }
  if (session.context && session.context.state !== "closed") {
    session.context.close().catch((closeError) => {
      console.error("Could not close the audio context:", closeError);
    });
  }
}

export default function useTranscriber() {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const sessionRef = useRef(null);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    disposeSession(session);
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    if (sessionRef.current?.active) return;

    setError(null);
    const session = { active: true };
    sessionRef.current = session;
    setRecording(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access requires HTTPS or localhost.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      session.stream = stream;
      if (!session.active) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const context = new AudioContext({ sampleRate: 16000 });
      session.context = context;
      await context.audioWorklet.addModule("/pcm-processor.js");
      if (!session.active) {
        context.close().catch((closeError) => {
          console.error("Could not close the audio context:", closeError);
        });
        return;
      }

      const source = context.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(context, "pcm-processor");
      session.source = source;
      session.node = node;

      const url = import.meta.env.VITE_WS_URL;
      if (!url) throw new Error("VITE_WS_URL is not configured.");

      const ws = new WebSocket(url);
      session.ws = ws;
      ws.onopen = () => {
        if (!session.active) {
          ws.close();
          return;
        }

        node.port.onmessage = (event) => {
          if (session.active && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };
        source.connect(node);
        node.connect(context.destination);
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "transcript" && message.text) {
            setText((current) => current + message.text);
          } else if (message.type === "error") {
            setError(message.message || "The transcription service failed.");
            stop();
          }
        } catch (parseError) {
          setError(`Invalid response from transcription service: ${parseError.message}`);
          stop();
        }
      };
      ws.onerror = () => {
        if (session.active) {
          setError("Could not connect to the transcription service.");
          stop();
        }
      };
      ws.onclose = () => {
        if (session.active) {
          setError("The transcription service disconnected.");
          stop();
        }
      };
    } catch (startError) {
      if (session.active) {
        const message =
          startError.name === "NotAllowedError"
            ? "Microphone permission denied. Allow mic access in the address bar."
            : startError.name === "NotFoundError"
              ? "No microphone found."
              : startError.message;
        setError(message);
        stop();
      }
    }
  }, [stop]);

  useEffect(
    () => () => {
      disposeSession(sessionRef.current);
      sessionRef.current = null;
    },
    [],
  );

  return { text, setText, start, stop, recording, error };
}
