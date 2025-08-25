import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

type User = {
  id: number;
  username: string;
};

type ChatSession = {
  id: number;
  user?: User;
  anon_id?: string;
  started_at: string;
  ended_at?: string | null;
};

export default function ChatSessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/chat/admin/chat-sessions/", { credentials: "include" })
      .then((data) => setSessions(data))
      .catch((error) => console.error("Failed to fetch sessions:", error));
  }, []);

  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = sessions.slice(indexOfFirstSession, indexOfLastSession);
  const totalPages = Math.ceil(sessions.length / sessionsPerPage);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-500">Chat Sessions</h1>
      <div className="mt-6 overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white text-left text-sm font-bold tracking-wide">
              <th className="px-5 py-3">Session ID</th>
              <th className="px-5 py-3">User / Anon ID</th>
              <th className="px-5 py-3">Started At</th>
              <th className="px-5 py-3">Ended At</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentSessions.map((session) => (
              <tr
                key={session.id}
                onClick={() => navigate(`/admin/sessions/${session.id}`)}
                className="bg-gray-900 text-white hover:bg-red-600 hover:text-white cursor-pointer rounded transition-colors"
              >
                <td className="px-5 py-4">{session.id}</td>
                <td className="px-5 py-4">
                  {session.user?.username ?? session.anon_id ?? "Anonymous"}
                </td>
                <td className="px-5 py-4">{new Date(session.started_at).toLocaleString()}</td>
                <td className="px-5 py-4">
                  {session.ended_at ? new Date(session.ended_at).toLocaleString() : "Active"}
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      session.ended_at
                        ? "bg-gray-600 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {session.ended_at ? "Ended" : "Active"}
                  </span>
                </td>
              </tr>
            ))}
            {currentSessions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-white">
                  No chat sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-3">
          <button
            className={`px-3 py-1 rounded font-bold ${
              currentPage === 1
                ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ← Prev
          </button>
          <span className="text-white flex items-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={`px-3 py-1 rounded font-bold ${
              currentPage === totalPages
                ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
