import { WebSocket, WebSocketServer } from "ws";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sendErrorAndClose(client, message) {
  if (client.readyState !== WebSocket.OPEN) {
    client.close();
    return;
  }

  client.send(JSON.stringify({ type: "error", message }), (error) => {
    if (error) {
      client.terminate();
      return;
    }
    client.close(1011, "Transcription service unavailable");
  });
}

export function attachTranscribeWS(server) {
  const wss = new WebSocketServer({ server, path: "/ws/transcribe" });

  wss.on("connection", async (client) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_LIVE_MODEL;
    if (!apiKey || apiKey === "your_key" || !model || /^<.*>$/.test(model)) {
      sendErrorAndClose(
        client,
        "Speech-to-text is not configured. Set GEMINI_API_KEY and GEMINI_LIVE_MODEL in server/.env, then restart the server.",
      );
      return;
    }

    let session;
    try {
      session = await ai.live.connect({
        model,
        config: {
          responseModalities: ["TEXT"],
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg) => {
            const t = msg.serverContent?.inputTranscription?.text;
            if (t) client.send(JSON.stringify({ type: "transcript", text: t }));
          },
          onerror: () =>
            sendErrorAndClose(
              client,
              "The speech-to-text provider reported an error. Check the server logs and Gemini configuration.",
            ),
          onclose: () => {
            if (client.readyState === WebSocket.OPEN) {
              sendErrorAndClose(
                client,
                "The speech-to-text provider disconnected unexpectedly.",
              );
            }
          },
        },
      });
    } catch (error) {
      console.error("Could not connect to STT provider:", error.message);
      sendErrorAndClose(
        client,
        "Could not connect to the speech-to-text provider. Check GEMINI_API_KEY, GEMINI_LIVE_MODEL, and server connectivity.",
      );
      return;
    }

    client.on("message", (data) => {
      session.sendRealtimeInput({
        audio: {
          data: Buffer.from(data).toString("base64"),
          mimeType: "audio/pcm;rate=16000",
        },
      });
    });
    client.on("close", () => session?.close());
  });
}
