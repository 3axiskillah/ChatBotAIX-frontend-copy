import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api"; // adjust path if needed

type User = {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  time_credits_seconds?: number;
  last_active?: string;
  date_joined?: string;
  last_purchase_date?: string;
  total_purchases?: number;
  total_chat_time?: number;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/accounts/admin/users/", { credentials: "include" })
      .then((data) => setUsers(data))
      .catch((error) => console.error("Failed to fetch users:", error));
  }, []);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleUserAction = async (
    action: string,
    userId: number,
    data?: any
  ) => {
    setLoading(true);
    try {
      await apiFetch(`/api/accounts/admin/users/${userId}/`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action === "delete" ? undefined : JSON.stringify(data),
        credentials: "include",
      });

      if (action === "delete") {
        setUsers(users.filter((user) => user.id !== userId));
      } else {
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, ...data } : user
          )
        );
      }

      setShowUserModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-red-500">Users</h1>
      <div className="mt-6 overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white text-left text-sm font-bold tracking-wide">
              <th className="px-5 py-3">Username</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-center">Has Credits</th>
              <th className="px-5 py-3 text-center">Staff</th>
              <th className="px-5 py-3 text-center">Last Active</th>
              <th className="px-5 py-3 text-center">Registered</th>
              <th className="px-5 py-3 text-center">Last Purchase</th>
              <th className="px-5 py-3 text-center">Total Spent</th>
              <th className="px-5 py-3 text-center">Chat Time</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr
                key={user.id}
                className="bg-gray-900 text-white hover:bg-gray-800 rounded transition-colors"
              >
                <td className="px-5 py-4">{user.username}</td>
                <td className="px-5 py-4">{user.email}</td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      (user.time_credits_seconds || 0) > 0
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {(user.time_credits_seconds || 0) > 0 ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      user.is_staff
                        ? "bg-yellow-600 text-white"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    {user.is_staff ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  {user.last_active
                    ? new Date(user.last_active).toLocaleString()
                    : "Never"}
                </td>
                <td className="px-5 py-4 text-center">
                  {user.date_joined
                    ? new Date(user.date_joined).toLocaleDateString()
                    : "Unknown"}
                </td>
                <td className="px-5 py-4 text-center">
                  {user.last_purchase_date
                    ? new Date(user.last_purchase_date).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-green-400 font-medium">
                    ${(user.total_purchases || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-blue-400 font-medium">
                    {user.total_chat_time || 0}m
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => openUserModal(user)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-white">
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

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-red-500 mb-4">
              Manage User: {selectedUser.username}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Add Time Credits (seconds)
                </label>
                <input
                  type="number"
                  id="credits"
                  className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700"
                  placeholder="Enter seconds to add"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isStaff"
                  checked={selectedUser.is_staff}
                  onChange={(e) => {
                    setSelectedUser({
                      ...selectedUser,
                      is_staff: e.target.checked,
                    });
                  }}
                  className="mr-2"
                />
                <label htmlFor="isStaff" className="text-white">
                  Make Staff Member
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  const creditsInput = document.getElementById(
                    "credits"
                  ) as HTMLInputElement;
                  const credits = parseInt(creditsInput.value) || 0;
                  if (credits > 0) {
                    handleUserAction("update", selectedUser.id, {
                      time_credits_seconds:
                        (selectedUser.time_credits_seconds || 0) + credits,
                    });
                  }
                }}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Add Credits
              </button>

              <button
                onClick={() =>
                  handleUserAction("update", selectedUser.id, {
                    is_staff: selectedUser.is_staff,
                  })
                }
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Update Staff
              </button>

              <button
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete user ${selectedUser.username}?`
                    )
                  ) {
                    handleUserAction("delete", selectedUser.id);
                  }
                }}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Delete User
              </button>
            </div>

            <button
              onClick={() => {
                setShowUserModal(false);
                setSelectedUser(null);
              }}
              className="w-full mt-3 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
