import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api"; // ✅ make sure this path is correct

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiFetch("/api/accounts/me/");
        setUser(data);
        setUsername(data.username);
        setEmail(data.email);
      } catch (err) {
        console.error(err);
        toast.error("Unable to load user info");
        navigate("/accounts/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSave = async () => {
    try {
      await apiFetch("/api/accounts/me/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });
      toast.success("Profile updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;
    try {
      await apiFetch("/api/accounts/delete/", {
        method: "DELETE",
      });
      toast.success("Account deleted");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting account");
    }
  };

  const resendVerification = async () => {
    try {
      await apiFetch("/api/accounts/resend-verification/", {
        method: "POST",
      });
      toast.success("Verification email sent");
    } catch {
      toast.error("Failed to resend verification email");
    }
  };

  if (loading) return <div className="text-center text-[#D1A75D] mt-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] p-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-[#D1A75D] mb-6">Profile Settings</h1>

      <div className="bg-[#2B1A1A] border border-[#D1A75D] p-6 rounded-xl w-full max-w-xl space-y-6 shadow-xl">
        {/* Username */}
        <div>
          <label className="text-sm">Username</label>
          <input
            className="w-full p-3 mt-1 bg-[#4B1F1F] border border-[#D1A75D] rounded text-[#E7D8C1]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm">Email</label>
          <input
            className="w-full p-3 mt-1 bg-[#4B1F1F] border border-[#D1A75D] rounded text-[#E7D8C1]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {!user.is_verified && (
            <div className="text-sm mt-2 text-red-400">
              Email not verified.{" "}
              <button onClick={resendVerification} className="underline text-[#D1A75D]">
                Resend Verification
              </button>
            </div>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="text-sm">Password</label>
          <div className="flex mt-1">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full p-3 bg-[#4B1F1F] border border-[#D1A75D] rounded-l text-[#E7D8C1]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="bg-[#D1A75D] text-[#4B1F1F] px-4 rounded-r"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Plan Info */}
        <div>
          <p className="text-sm text-[#D1A75D]">Current Plan</p>
          <p className="text-lg font-bold">{user.is_premium ? "Premium" : "Free Trial"}</p>
          {!user.is_premium && (
            <button
              onClick={() => navigate("/subscriptions")}
              className="mt-3 bg-[#D1A75D] text-[#4B1F1F] px-5 py-2 rounded font-semibold hover:bg-[#c49851]"
            >
              Upgrade to Premium
            </button>
          )}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleSave}
            className="bg-[#D1A75D] text-[#4B1F1F] px-6 py-2 rounded hover:bg-[#c49851] font-semibold"
          >
            Save Changes
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold"
          >
            Delete Account
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate("/chat")}
        className="mt-10 px-6 py-3 bg-[#D1A75D] text-[#4B1F1F] rounded-xl font-semibold hover:bg-[#c49851]"
      >
        ← Back to Chat
      </button>
    </div>
  );
}
