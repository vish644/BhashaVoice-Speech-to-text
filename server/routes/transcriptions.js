import { Router } from "express";
import { pool } from "../config/db.js";
const r = Router();

r.get("/", async (req, res) => {
  const { search = "", page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const q = `%${search}%`;
  const rows = await pool.query(
    `SELECT * FROM transcriptions WHERE text ILIKE $1 OR title ILIKE $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [q, limit, offset],
  );
  const total = await pool.query(
    `SELECT COUNT(*) FROM transcriptions WHERE text ILIKE $1 OR title ILIKE $1`,
    [q],
  );
  res.json({ items: rows.rows, total: Number(total.rows[0].count) });
});

r.get("/:id", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM transcriptions WHERE id=$1",
    [req.params.id],
  );
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});

r.post("/", async (req, res) => {
  const { title, text, duration_seconds } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: "text is required" });
  const { rows } = await pool.query(
    `INSERT INTO transcriptions (title, text, duration_seconds) VALUES ($1,$2,$3) RETURNING *`,
    [title || "Untitled", text, duration_seconds || 0],
  );
  res.status(201).json(rows[0]);
});

r.put("/:id", async (req, res) => {
  const { title, text } = req.body;
  const { rows } = await pool.query(
    `UPDATE transcriptions SET title=$1, text=$2, updated_at=now() WHERE id=$3 RETURNING *`,
    [title, text, req.params.id],
  );
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});

r.delete("/:id", async (req, res) => {
  const { rowCount } = await pool.query(
    "DELETE FROM transcriptions WHERE id=$1",
    [req.params.id],
  );
  rowCount
    ? res.status(204).end()
    : res.status(404).json({ error: "Not found" });
});

export default r;
