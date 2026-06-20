import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store';
import { setCredentials, logout, setLoading, updateProfile } from '../store/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const loginUser = async (credentials: any) => {
    dispatch(setLoading(true));
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user: userData } = response.data.data;
      dispatch(setCredentials({ token, user: userData }));
      toast.success('Logged in successfully!');
      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const registerUser = async (profileData: any) => {
    dispatch(setLoading(true));
    try {
      await api.post('/auth/register', profileData);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      dispatch(updateProfile(response.data.data));
      return response.data.data;
    } catch (error) {
      loggerError('Failed to fetch profile', error);
    }
  };

  const logoutUser = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginUser,
    register: registerUser,
    getProfile,
    logout: logoutUser,
  };
};

function loggerError(msg: string, err: any) {
  console.error(msg, err);
}

export default useAuth;
