import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";

import transcriptions from "./routes/transcriptions.js";
import { attachTranscribeWS } from "./src/ws.js";
import { checkDBConnection, initializeDatabase } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_, res) => {
  res.json({ ok: true });
});

// API routes
app.use("/api/transcriptions", transcriptions);

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server
attachTranscribeWS(server);

// Start server after database initialization
async function startServer() {
  const connected = await checkDBConnection();

  if (!connected) {
    console.error("⛔ Server startup stopped: database unavailable.");
    process.exit(1);
  }

  await initializeDatabase();

  server.listen(PORT, () => {
    console.log(`🚀 BhashaVoice server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/ws/transcribe`);
  });
}

startServer().catch((error) => {
  console.error("⛔ Server startup failed:", error.message);
  process.exit(1);
});
