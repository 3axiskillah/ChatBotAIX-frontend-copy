import React, { useEffect, useState } from "react";

type AnonymousSession = {
  id: number;
  started_at: string;
  ended_at?: string | null;
};

export default function AnonymousActivityPage() {
  const [sessions, setSessions] = useState<AnonymousSession[]>([]);

  useEffect(() => {
    // Placeholder fetch call:
    // Replace this with actual endpoint when available
    fetch("http://localhost:8000/api/chat/admin/anonymous-sessions/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Error loading anonymous sessions");
        }
        return res.json();
      })
      .then((data) => setSessions(data))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#D1A75D]">Anonymous Chat Activity</h1>
      <div className="mt-6 overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#4B1F1F] text-[#E7D8C1] text-left text-sm font-bold tracking-wide">
              <th className="px-5 py-3">Session ID</th>
              <th className="px-5 py-3">Started At</th>
              <th className="px-5 py-3">Ended At</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <tr
                  key={session.id}
                  className="bg-[#3A1818] text-[#E7D8C1] hover:bg-[#c49851] hover:text-[#4B1F1F] rounded transition-colors"
                >
                  <td className="px-5 py-4">{session.id}</td>
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
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${session.ended_at
                        ? "bg-gray-600 text-white"
                        : "bg-green-600 text-white"
                      }`}
                    >
                      {session.ended_at ? "Ended" : "Active"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-[#E7D8C1]">
                  No anonymous activity found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
