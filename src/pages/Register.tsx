import { apiFetch } from './api';
import { toast } from 'react-toastify';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  anon_id?: string | null;
}

export async function registerUser(data: RegisterData): Promise<boolean> {
  try {
    const response = await apiFetch('/api/accounts/register/', {
      method: 'POST',
      body: data,
    });

    // Handle both possible success responses:
    // 1. Explicit success message from backend
    if (response?.detail) {
      toast.success(response.detail);
    } 
    // 2. Empty response (204)
    else {
      toast.success('Registration successful! Check your email.');
    }

    return true;
  } catch (error) {
    // Handle both Error objects and string messages
    const message = error instanceof Error ? error.message : String(error);
    toast.error(message || 'Registration failed');
    return false;
  }
}

// Example usage in a component:
/*
const handleSubmit = async (formData: RegisterData) => {
  const success = await registerUser(formData);
  if (success) {
    // Redirect or clear form
  }
}
*/
