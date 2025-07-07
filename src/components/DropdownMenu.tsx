// src/components/DropdownMenu.jsx
import { useState } from "react";
import { useNavigate, type To } from "react-router-dom";

export default function DropdownMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: To) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setOpen(false);
    // Add your auth clear logic here if needed
    navigate("/");
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="text-[#E7D8C1] font-semibold hover:text-[#D1A75D]"
      >
        ☰ Menu
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[#2B1A1A] border border-[#D1A75D] rounded-md shadow-lg z-50">
          <button
            onClick={() => handleNavigate("/settings")}
            className="block w-full px-4 py-2 text-left text-[#E7D8C1] hover:bg-[#4B1F1F]"
          >
            Settings
          </button>
          <button
            onClick={() => handleNavigate("/subscriptions")}
            className="block w-full px-4 py-2 text-left text-[#E7D8C1] hover:bg-[#4B1F1F]"
          >
            Subscriptions
          </button>
          <button
            onClick={handleLogout}
            className="block w-full px-4 py-2 text-left text-[#E7D8C1] hover:bg-[#4B1F1F]"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
