import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function EmailActivationHandler() {
  const { uidb64, token } = useParams();

  useEffect(() => {
    if (uidb64 && token) {
      // Immediately redirect to backend for processing
      window.location.href = `https://chatbotaix-backend.onrender.com/api/accounts/activate/${uidb64}/${token}/`;
    }
  }, [uidb64, token]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#4B1F1F]">
      <div className="text-[#E7D8C1]">
        <p>Processing activation...</p>
      </div>
    </div>
  );
}