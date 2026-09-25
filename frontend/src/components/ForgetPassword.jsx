import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axios from 'axios';
import loginImg1 from '../assets/images/img 2.jpg';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/forget-password', 
        { email },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Verification code has been sent to your email!');
        sessionStorage.setItem('resetEmail', email);
        navigate('/verify-code');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process request');
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
              Forgot Password
            </motion.h2>
            <motion.p 
              className="text-gray-400 text-sm mt-2"
              variants={itemVariants}
            >
              Enter your email to receive a verification code
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
          >
            <motion.div
              variants={itemVariants}
              className="space-y-1"
            >
              <p className="text-sm text-gray-400">Email</p>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Enter your email"
                required
                whileFocus={{ scale: 1.01 }}
              />
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
              {isLoading ? 'Sending...' : 'Send Verification Code'}
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

export default ForgetPassword; 