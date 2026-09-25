import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axiosConfig';

const AuthGoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const finishGoogleLogin = async () => {
      try {
        const response = await axiosInstance.get('/users/me');
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));

        if (!active) return;

        if (user.role === 'admin' || user.role === 'manager') {
          navigate('/admin/dashboard', { replace: true });
        } else if (user.role === 'cashier') {
          navigate('/cashier/dashboard', { replace: true });
        } else {
          navigate('/homeafterlogging', { replace: true });
        }
      } catch (error) {
        console.error('Google session load failed:', error);
        localStorage.removeItem('user');
        if (active) {
          navigate('/login?oauth=error', { replace: true });
        }
      }
    };

    finishGoogleLogin();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1d24] text-white">
      Signing you in with Google...
    </div>
  );
};

export default AuthGoogleCallback;
