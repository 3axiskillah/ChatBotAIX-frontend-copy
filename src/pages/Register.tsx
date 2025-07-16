import { apiFetch } from './api';
import { toast } from 'react-toastify';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  anon_id?: string | null;
}

export const registerUser = async (data: RegisterData) => {
  try {
    // ============== SIMPLIFIED API CALL ==============
    const response = await apiFetch('/api/accounts/register/', {
      method: 'POST',
      body: data
    });

    // ============== EXPLICIT SUCCESS HANDLING ==============
    if (response === null || response?.detail) {
      toast.success(response?.detail || 'Registration successful! Check your email.');
      return true;
    }

    throw new Error('Unexpected response format');

  } catch (error) {
    // ============== ERROR HANDLING ==============
    const message = error instanceof Error 
      ? error.message 
      : 'Registration failed';

    toast.error(message.includes('JSON') 
      ? 'Server response error' 
      : message);

    return false;
  }
};

// ============== USAGE EXAMPLE ==============
/*
const handleSubmit = async (data: RegisterData) => {
  const success = await registerUser(data);
  if (success) {
    // Redirect or clear form
    navigate('/verify-email');
  }
}
*/
