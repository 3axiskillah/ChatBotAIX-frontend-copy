import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function ActivationProcessor() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processActivation = async () => {
      try {
        const response = await api.get(
          `https://chatbotax-backend.onrender.com/api/accounts/activate/${uidb64}/${token}/`
        );
        
        if (response.status === 'success') {
          navigate(
            `/accounts/email-verify?status=success&access=${response.access}&refresh=${response.refresh}`
          );
        } else {
          navigate('/accounts/email-verify?status=error');
        }
      } catch (error) {
        navigate('/accounts/email-verify?status=error');
      }
    };
    
    processActivation();
  }, [uidb64, token, navigate]);

  return <div>Processing activation...</div>;
}