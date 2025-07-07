import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  id: number;
  username: string;
  email: string;
  is_premium: boolean;
  is_admin: boolean;
  last_active?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/accounts/admin/users", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#D1A75D]">Users</h1>
      <div className="mt-6 overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#4B1F1F] text-[#E7D8C1] text-left text-sm font-bold tracking-wide">
              <th className="px-5 py-3">Username</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-center">Premium</th>
              <th className="px-5 py-3 text-center">Admin</th>
              <th className="px-5 py-3 text-center">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() =>
                  navigate(
                    `/admin/chat-sessions?user=${user.id}&username=${encodeURIComponent(
                      user.username
                    )}&email=${encodeURIComponent(user.email)}`
                  )
                }
                className="bg-[#3A1818] text-[#E7D8C1] hover:bg-[#c49851] hover:text-[#4B1F1F] cursor-pointer rounded transition-colors"
              >
                <td className="px-5 py-4">{user.username}</td>
                <td className="px-5 py-4">{user.email}</td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      user.is_premium
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {user.is_premium ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      user.is_admin
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    {user.is_admin ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  {user.last_active
                    ? new Date(user.last_active).toLocaleString()
                    : "Never"}
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#E7D8C1]">
                  No users found.
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
                ? "bg-[#3A1818] text-[#777] cursor-not-allowed"
                : "bg-[#D1A75D] text-[#4B1F1F] hover:bg-[#c49851]"
            }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ← Prev
          </button>
          <span className="text-[#E7D8C1] flex items-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={`px-3 py-1 rounded font-bold ${
              currentPage === totalPages
                ? "bg-[#3A1818] text-[#777] cursor-not-allowed"
                : "bg-[#D1A75D] text-[#4B1F1F] hover:bg-[#c49851]"
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
