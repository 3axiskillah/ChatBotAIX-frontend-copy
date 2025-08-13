import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { apiFetch } from "../utils/api";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiFetch("/api/accounts/me/");
        setUser(data);
        setFormData({
          username: data.username,
          email: data.email,
          password: "",
        });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      await apiFetch("/api/accounts/me/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      // Clear password field after save
      setFormData((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you absolutely sure? This will permanently delete your account and all data."
      )
    )
      return;

    setIsDeleting(true);
    try {
      await apiFetch("/api/accounts/delete-account/", { method: "DELETE" });
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting account");
    } finally {
      setIsDeleting(false);
    }
  };

  const resendVerification = async () => {
    try {
      await apiFetch("/api/accounts/resend-verification/", { method: "POST" });
      toast.success("Verification email sent. Please check your inbox.");
    } catch {
      toast.error("Failed to resend verification email");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#4B1F1F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D1A75D]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#4B1F1F] text-[#E7D8C1] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 bg-[#3A1818] rounded-xl p-4 h-fit sticky top-4">
            <h1 className="text-2xl font-bold text-[#D1A75D] mb-6">Settings</h1>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === "profile"
                    ? "bg-[#D1A75D] text-[#4B1F1F] font-medium"
                    : "hover:bg-[#4B1F1F]"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("subscription")}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === "subscription"
                    ? "bg-[#D1A75D] text-[#4B1F1F] font-medium"
                    : "hover:bg-[#4B1F1F]"
                }`}
              >
                Subscription
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === "security"
                    ? "bg-[#D1A75D] text-[#4B1F1F] font-medium"
                    : "hover:bg-[#4B1F1F]"
                }`}
              >
                Security
              </button>
            </nav>

            <button
              onClick={() => navigate("/chat")}
              className="w-full mt-6 px-4 py-3 bg-[#4B1F1F] text-[#E7D8C1] rounded-lg hover:bg-[#D1A75D] hover:text-[#4B1F1F] transition flex items-center gap-2 justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Chat
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-[#3A1818] rounded-xl p-6 md:p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-[#D1A75D]">
                    Profile Information
                  </h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-[#D1A75D] text-[#4B1F1F] rounded-lg hover:bg-[#c49851] font-medium"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            username: user.username,
                            email: user.email,
                            password: "",
                          });
                        }}
                        className="px-4 py-2 bg-[#4B1F1F] text-[#E7D8C1] rounded-lg hover:bg-[#5B2F2F] font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-[#D1A75D] text-[#4B1F1F] rounded-lg hover:bg-[#c49851] font-medium"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Username
                    </label>
                    <input
                      name="username"
                      className="w-full p-3 bg-[#4B1F1F] border border-[#D1A75D]/30 rounded-lg text-[#E7D8C1] disabled:opacity-70"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full p-3 bg-[#4B1F1F] border border-[#D1A75D]/30 rounded-lg text-[#E7D8C1] disabled:opacity-70"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                    {!user.is_verified && (
                      <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Email not verified.{" "}
                        <button
                          onClick={resendVerification}
                          className="underline text-[#D1A75D] hover:text-[#c49851]"
                        >
                          Resend Verification
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="w-full p-3 bg-[#4B1F1F] border border-[#D1A75D]/30 rounded-lg text-[#E7D8C1] pr-10"
                          value={formData.password}
                          onChange={handleInputChange}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 text-[#D1A75D] hover:text-[#c49851]"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path
                                fillRule="evenodd"
                                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                                clipRule="evenodd"
                              />
                              <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-[#E7D8C1]/70">
                        Leave blank to keep current password
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === "subscription" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#D1A75D]">
                  Subscription Plan
                </h2>

                <div className="bg-[#4B1F1F] rounded-xl p-6 border border-[#D1A75D]/30">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">Time Credits System</h3>
                      <p className="text-[#E7D8C1]/80">
                        Pay for time credits to chat with Amber
                      </p>
                    </div>

                    <div className="flex flex-col md:items-end">
                      <span className="text-2xl font-bold text-[#D1A75D]">
                        Pay per use
                      </span>
                      <button
                        onClick={() => navigate("/addons")}
                        className="mt-2 px-4 py-2 bg-[#D1A75D] text-[#4B1F1F] rounded-lg hover:bg-[#c49851] font-medium"
                      >
                        Buy Time Credits
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-[#D1A75D]/20">
                    <h4 className="font-medium mb-3">How It Works</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Buy time credits to chat
                      </li>
                      <li className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Pay $4.99 to unlock images
                      </li>
                      <li className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        No recurring subscriptions
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-[#D1A75D]">
                  Security Settings
                </h2>

                <div className="bg-[#4B1F1F] rounded-xl p-6 border border-[#D1A75D]/30">
                  <h3 className="font-medium mb-4">Account Actions</h3>

                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#3A1818] rounded-lg">
                      <div>
                        <h4 className="font-medium">Delete Account</h4>
                        <p className="text-sm text-[#E7D8C1]/70">
                          Permanently remove your account and all associated
                          data
                        </p>
                      </div>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center gap-2 justify-center"
                      >
                        {isDeleting ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          "Delete Account"
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#3A1818] rounded-lg">
                      <div>
                        <h4 className="font-medium">Log Out of All Devices</h4>
                        <p className="text-sm text-[#E7D8C1]/70">
                          Sign out of all active sessions except this one
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await apiFetch("/api/accounts/logout-all/", {
                              method: "POST",
                            });
                            toast.success("Logged out of all other devices");
                          } catch (err) {
                            toast.error("Failed to log out of all devices");
                          }
                        }}
                        className="px-4 py-2 bg-[#4B1F1F] text-[#E7D8C1] rounded-lg hover:bg-[#5B2F2F] font-medium border border-[#D1A75D]/30"
                      >
                        Log Out Everywhere
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
