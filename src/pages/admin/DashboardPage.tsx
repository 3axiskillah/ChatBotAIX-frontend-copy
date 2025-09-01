import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api"; // adjust path if needed

type User = {
  id: number;
  username: string;
  email: string;
  time_credits_seconds?: number;
};

type ChatSession = {
  id: number;
  user?: User | null;
  started_at: string;
  ended_at?: string | null;
};

export default function DashboardPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [premiumCount, setPremiumCount] = useState(0);
  const [activeUserSessions, setActiveUserSessions] = useState(0);

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
        // Remove anonymous count - not needed
      } catch (error) {
        console.error("Error loading chat sessions:", error);
      }

      try {
        // User Stats
        const users = await apiFetch("/api/accounts/admin/users/", {
          credentials: "include",
        });
        setUserCount(users.length);
        setPremiumCount(
          users.filter((user: User) => (user.time_credits_seconds || 0) > 0)
            .length
        );
      } catch (error) {
        console.error("Error loading user stats:", error);
      }

      try {
        // Get revenue from billing API
        const billingStats = await apiFetch("/api/billing/admin/dashboard/", {
          credentials: "include",
        });
        setRevenue(billingStats.total_revenue || 0);
      } catch (error) {
        console.error("Error loading revenue:", error);
        setRevenue(0);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-500">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-gray-900 p-4 rounded text-center border border-gray-800">
          <div className="text-white">Total Users</div>
          <div className="text-2xl font-bold text-red-500">{userCount}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded text-center border border-gray-800">
          <div className="text-white">Premium Users</div>
          <div className="text-2xl font-bold text-red-500">{premiumCount}</div>
        </div>
        <div className="bg-gray-900 p-4 rounded text-center border border-gray-800">
          <div className="text-white">Active Chat Sessions</div>
          <div className="text-2xl font-bold text-red-500">
            {activeUserSessions}
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded text-center border border-gray-800">
          <div className="text-white">Total Revenue</div>
          <div className="text-2xl font-bold text-red-500">
            ${revenue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Recent Chat Sessions */}
      <h2 className="text-2xl font-bold text-red-500 mt-8">
        Recent Chat Sessions
      </h2>
      <div className="mt-4 overflow-x-auto rounded-lg shadow-lg">
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
            {chatSessions.slice(0, 10).map((session) => (
              <tr
                key={session.id}
                onClick={() => navigate(`/admin/sessions/${session.id}`)}
                className="bg-gray-900 text-white hover:bg-red-600 hover:text-white cursor-pointer rounded transition-colors"
              >
                <td className="px-5 py-4">{session.id}</td>
                <td className="px-5 py-4">
                  {session.user?.username ?? session.user?.email ?? "Unknown"}
                </td>
                <td className="px-5 py-4">
                  {new Date(session.started_at).toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  {session.ended_at
                    ? new Date(session.ended_at).toLocaleString()
                    : "Active"}
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
                <td colSpan={5} className="text-center py-8 text-white">
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
