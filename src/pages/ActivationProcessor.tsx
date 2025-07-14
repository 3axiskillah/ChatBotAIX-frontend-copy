import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { toast } from "react-toastify";

export default function ActivationProcessor() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processActivation = async () => {
      try {
        // Call the activation endpoint
        const response = await apiFetch(`/api/accounts/activate/${uidb64}/${token}/`, {
          method: "GET",
          credentials: "include"
        });

        if (response?.access) {
          // Store tokens in cookies automatically via credentials: "include"
          toast.success("Account activated successfully!");
          
          // Redirect to chat or appropriate page
          navigate("/chat");
        } else {
          navigate("/accounts/email-verify?status=invalid");
        }
      } catch (error) {
        console.error("Activation failed:", error);
        navigate("/accounts/email-verify?status=error");
      }
    };

    processActivation();
  }, [uidb64, token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#4B1F1F]">
      <div className="p-8 max-w-md w-full bg-[#3A1A1A] rounded-lg border border-[#D1A75D] text-center">
        <h2 className="text-2xl font-bold text-[#D1A75D] mb-4">
          Activating your account...
        </h2>
        <p className="text-[#E7D8C1]">Please wait while we verify your email</p>
      </div>
    </div>
  );
}