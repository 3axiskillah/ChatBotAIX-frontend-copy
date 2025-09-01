import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api"; // ← relative path adjusted, no alias
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const links = [
  { name: "Dashboard", path: "/admin/dashboard" },
  { name: "Users", path: "/admin/users" },
  { name: "Chat Sessions", path: "/admin/sessions" },
  { name: "Billing", path: "/admin/billing" },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const userData = await apiFetch("/api/accounts/me/");
        if (userData && userData.is_admin) {
          setIsAdmin(true);
        } else {
          toast.error("Access denied. Admin privileges required.");
          navigate("/");
        }
      } catch (error) {
        console.error("Admin check failed:", error);
        toast.error("Authentication failed. Please log in.");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/accounts/logout/", {
        method: "POST",
        credentials: "include",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect to home
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-6 border-r border-gray-800 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold text-red-500">Admin</h1>
          <nav className="flex flex-col space-y-2 mt-4">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-2 rounded font-semibold ${
                  location.pathname.startsWith(link.path)
                    ? "bg-red-600 text-white"
                    : "hover:bg-red-600 hover:text-white text-gray-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Sign Out Button */}
        <div className="mt-4">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded font-semibold text-gray-300 hover:bg-red-600 hover:text-white"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto bg-gray-900">
        <Outlet />
      </main>
    </div>
  );
}
