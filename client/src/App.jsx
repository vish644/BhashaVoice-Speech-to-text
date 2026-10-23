import { NavLink, Route, Routes } from "react-router-dom";
import RecordPage from "./pages/RecordPage";
import HistoryPage from "./pages/HistoryPage";

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-200"
  }`;

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <nav className="max-w-5xl mx-auto flex items-center gap-2 px-4 py-3">
          <span className="font-bold text-indigo-600 mr-4">🎙 VoiceScribe</span>
          <NavLink to="/" end className={linkClass}>
            Record
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<RecordPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route
            path="*"
            element={<p className="text-slate-500">Page not found.</p>}
          />
        </Routes>
      </main>
    </div>
  );
}
