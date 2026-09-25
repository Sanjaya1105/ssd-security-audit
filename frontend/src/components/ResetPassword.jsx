import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import loginImg1 from '../assets/images/img 2.jpg';

const ResetPassword = () => {
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const resetEmail = sessionStorage.getItem('resetEmail');
    if (!resetEmail) {
      navigate('/forget-password');
      return;
    }
    setEmail(resetEmail);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/reset-password', 
        {
          email,
          newPassword: passwords.newPassword
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Password reset successfully!');
        sessionStorage.removeItem('resetEmail');
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `url(${loginImg1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      {/* Background Effects */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 backdrop-blur-[3px]" 
      />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-black/45" 
      />
      
      {/* Form Container */}
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-[400px] bg-[#1B2028]/90 backdrop-blur-sm rounded-[20px] p-8 relative z-10 shadow-2xl"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <motion.h1 
              className="text-2xl font-bold text-white"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              HOT-FAST
            </motion.h1>
            <motion.h2 
              className="text-white text-lg mt-2"
              variants={itemVariants}
            >
              Reset Password
            </motion.h2>
            <motion.p 
              className="text-gray-400 text-sm mt-2"
              variants={itemVariants}
            >
              Enter your new password
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
          >
            <motion.div
              variants={itemVariants}
              className="space-y-4"
            >
              <div className="space-y-1">
                <p className="text-sm text-gray-400">New Password</p>
                <motion.input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  whileFocus={{ scale: 1.01 }}
                />
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-400">Confirm Password</p>
                <motion.input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                isLoading ? 'bg-green-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              }`}
              whileHover={isLoading ? {} : { scale: 1.02, backgroundColor: "#22c55e" }}
              whileTap={isLoading ? {} : { scale: 0.98 }}
              variants={itemVariants}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </motion.button>

            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-green-500 hover:text-green-400 transition-colors"
              >
                Back to Login
              </button>
            </motion.div>
          </motion.form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ResetPassword; 