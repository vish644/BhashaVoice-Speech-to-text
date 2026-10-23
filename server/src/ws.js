import { WebSocketServer } from "ws";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function attachTranscribeWS(server) {
  const wss = new WebSocketServer({ server, path: "/ws/transcribe" });

  wss.on("connection", async (client) => {
    let session;
    try {
      session = await ai.live.connect({
        model: process.env.GEMINI_LIVE_MODEL,
        config: {
          responseModalities: ["AUDIO"],
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg) => {
            const t = msg.serverContent?.inputTranscription?.text;
            if (t) client.send(JSON.stringify({ type: "transcript", text: t }));
          },
          onerror: (e) =>
            client.send(JSON.stringify({ type: "error", message: e.message })),
          onclose: () => client.close(),
        },
      });
    } catch (e) {
      client.send(
        JSON.stringify({
          type: "error",
          message: "Could not connect to STT provider",
        }),
      );
      return client.close();
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
