import { useCallback, useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import {
  listTranscriptions,
  updateTranscription,
  deleteTranscription,
  errMsg,
} from "../api";
import Modal from "../components/Modal";

const LIMIT = 10;
const fmtDur = (s) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const btnBase =
  "rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-indigo-600 text-white hover:bg-indigo-700`;
const btnGhost = `${btnBase} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100`;
const btnDanger = `${btnBase} bg-red-600 text-white hover:bg-red-700`;
const inputCls =
  "w-full rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => setPage(1), [debounced]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    listTranscriptions({ search: debounced, page, limit: LIMIT })
      .then((res) => {
        if (!ignore) {
          setRows(res.items ?? []);
          setTotal(res.total ?? 0);
        }
      })
      .catch((e) => !ignore && setError(errMsg(e)))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [debounced, page, reload]);

  const refresh = useCallback(() => setReload((n) => n + 1), []);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const onDeleted = () => {
    if (rows.length === 1 && page > 1) setPage(page - 1);
    else refresh();
  };

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">History</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or text…"
          className={`${inputCls} sm:max-w-xs`}
        />
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={refresh} className={btnGhost}>
            Retry
          </button>
        </div>
      )}

      {loading && rows.length === 0 && (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
          Loading…
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">
          {debounced
            ? `No results for “${debounced}”.`
            : "No transcriptions yet. Record one first!"}
        </div>
      )}

      {!error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 transition-opacity ${
                loading ? "opacity-50" : ""
              }`}
            >
              {rows.map((r) => {
                const text = r.text ?? "";
                return (
                  <tr
                    key={r.id}
                    onClick={() => setViewing(r)}
                    className="cursor-pointer hover:bg-indigo-50/50"
                  >
                    <td className="px-4 py-3 font-medium">{r.title}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                      {text.length > 60 ? text.slice(0, 60) + "…" : text}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-slate-500">
                      {fmtDur(r.duration_seconds ?? 0)}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setEditing(r)}
                        className={`${btnGhost} mr-2`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(r)}
                        className={`${btnBase} border border-red-200 text-red-600 hover:bg-red-50`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {total} {total === 1 ? "record" : "records"}
        </span>
        <div className="flex items-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className={btnGhost}
          >
            Prev
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className={btnGhost}
          >
            Next
          </button>
        </div>
      </div>

      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)}>
          <p className="mb-3 text-xs text-slate-500">
            {viewing.created_at
              ? new Date(viewing.created_at).toLocaleString()
              : ""}{" "}
            · {fmtDur(viewing.duration_seconds ?? 0)}
          </p>
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-800">
            {viewing.text}
          </p>
        </Modal>
      )}
      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
      {deleting && (
        <DeleteConfirm
          item={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            onDeleted();
          }}
        />
      )}
    </section>
  );
}

function EditModal({ item, onClose, onSaved }) {
  const [title, setTitle] = useState(item.title);
  const [text, setText] = useState(item.text);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await updateTranscription(item.id, { title, text });
      onSaved();
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Modal title="Edit transcription" onClose={onClose}>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Title
      </label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`${inputCls} mb-3`}
      />
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Text
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className={inputCls}
      />
      {err && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className={btnGhost}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={busy || !title.trim() || !text.trim()}
          className={btnPrimary}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}

function DeleteConfirm({ item, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const confirm = async () => {
    setBusy(true);
    setErr(null);
    try {
      await deleteTranscription(item.id);
      onDeleted();
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <Modal title="Delete transcription?" onClose={onClose}>
      <p className="text-slate-600">
        “{item.title}” will be permanently deleted. This can't be undone.
      </p>
      {err && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className={btnGhost}>
          Cancel
        </button>
        <button onClick={confirm} disabled={busy} className={btnDanger}>
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </Modal>
  );
}
