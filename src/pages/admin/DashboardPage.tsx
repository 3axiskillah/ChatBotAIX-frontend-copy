import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api"; // adjust path if needed

type User = {
  id: number;
  username: string;
  is_premium?: boolean;
};

type ChatSession = {
  id: number;
  user?: User | null;
  anon_id?: string;
  started_at: string;
  ended_at?: string | null;
};

export default function DashboardPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [premiumCount, setPremiumCount] = useState(0);
  const [activeUserSessions, setActiveUserSessions] = useState(0);
  const [anonCount, setAnonCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Chat Sessions
        const sessions = await apiFetch("/api/chat/admin/chat-sessions/", {
          credentials: "include",
        });
        setChatSessions(sessions);
        setActiveUserSessions(
          sessions.filter(
            (sess: ChatSession) => !sess.ended_at && sess.user !== null
          ).length
        );
        setAnonCount(sessions.filter((sess: ChatSession) => sess.user === null).length);
      } catch (error) {
        console.error("Error loading chat sessions:", error);
      }

      try {
        // User Stats
        const users = await apiFetch("/api/accounts/admin/users/", {
          credentials: "include",
        });
        setUserCount(users.length);
        setPremiumCount(users.filter((user: User) => user.is_premium).length);
      } catch (error) {
        console.error("Error loading user stats:", error);
      }

      // Placeholder for revenue (hook up billing API later)
      setRevenue(0);
    };

    loadDashboardData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#D1A75D]">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mt-6">
        <div className="bg-[#3A1818] p-4 rounded text-center">
          <div className="text-[#E7D8C1]">Total Users</div>
          <div className="text-2xl font-bold text-[#D1A75D]">{userCount}</div>
        </div>
        <div className="bg-[#3A1818] p-4 rounded text-center">
          <div className="text-[#E7D8C1]">Premium Users</div>
          <div className="text-2xl font-bold text-[#D1A75D]">{premiumCount}</div>
        </div>
        <div className="bg-[#3A1818] p-4 rounded text-center">
          <div className="text-[#E7D8C1]">Active Chat Sessions</div>
          <div className="text-2xl font-bold text-[#D1A75D]">{activeUserSessions}</div>
        </div>
        <div className="bg-[#3A1818] p-4 rounded text-center">
          <div className="text-[#E7D8C1]">Anonymous Chats</div>
          <div className="text-2xl font-bold text-[#D1A75D]">{anonCount}</div>
        </div>
        <div className="bg-[#3A1818] p-4 rounded text-center">
          <div className="text-[#E7D8C1]">Revenue</div>
          <div className="text-2xl font-bold text-[#D1A75D]">${revenue}</div>
        </div>
      </div>

      {/* Recent Chat Sessions */}
      <h2 className="text-2xl font-bold text-[#D1A75D] mt-8">Recent Chat Sessions</h2>
      <div className="mt-4 overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#4B1F1F] text-[#E7D8C1] text-left text-sm font-bold tracking-wide">
              <th className="px-5 py-3">Session ID</th>
              <th className="px-5 py-3">User / Anon ID</th>
              <th className="px-5 py-3">Started At</th>
              <th className="px-5 py-3">Ended At</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {chatSessions.slice(0, 10).map((session) => (
              <tr
                key={session.id}
                onClick={() => navigate(`/admin/sessions/${session.id}`)}
                className="bg-[#3A1818] text-[#E7D8C1] hover:bg-[#c49851] hover:text-[#4B1F1F] cursor-pointer rounded transition-colors"
              >
                <td className="px-5 py-4">{session.id}</td>
                <td className="px-5 py-4">{session.user?.username ?? "Anonymous"}</td>
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
            {chatSessions.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#E7D8C1]">
                  No chat sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
