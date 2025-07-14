import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export default function ActivationProcessor() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processActivation = async () => {
      try {
        const data = await apiFetch(
          `/api/accounts/activate/${uidb64}/${token}/`
        );

        if (data?.access && data?.refresh) {
          navigate(
            `/accounts/email-verify?status=success&access=${data.access}&refresh=${data.refresh}`
          );
        } else {
          navigate("/accounts/email-verify?status=error");
        }
      } catch (error) {
        navigate("/accounts/email-verify?status=error");
      }
    };

    processActivation();
  }, [uidb64, token, navigate]);

  return <div>Processing activation...</div>;
}
