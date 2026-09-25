import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import axiosInstance from '../config/axiosConfig';
import loginImg1 from '../assets/images/img 2.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log("METHANA RUN WENW");
    try {
      console.log('Attempting login...');
      console.log("METHANA RUN WENW ATHULA");
      const response = await axiosInstance.post('/users/login', formData);

      console.log('Login response:', response.data);
      
      if (response.data && response.data.user) {
        // Store user data
        const userData = response.data.user;
        console.log('Storing user data:', userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Show success message
        toast.success('Login successful!');
        
        // Redirect based on user role
        const role = userData.role;
        console.log('User role:', role);
        if (role === 'admin') {
          navigate('/admin-dashboard');
        } else if (role === 'manager') {
          navigate('/admin-dashboard');
        } else if(role ==='cashier'){
          navigate('/cashier-dashboard');
        } else {
          navigate('/homeafterlogging'); // Default route for customers
        }
      } else {
        console.error('Invalid response format:', response.data);
        setError('Login failed: Invalid response from server');
        toast.error('Login failed: Invalid response from server');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Invalid credentials';
      setError(errorMessage);
      toast.error(errorMessage);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
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
      
      {/* Login Form Container */}
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
              Welcome Back
            </motion.h2>
            <motion.p 
              className="text-gray-400 text-sm mt-2"
              variants={itemVariants}
            >
              Please enter your details
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 text-red-500 text-sm rounded-lg p-3 text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.div
              variants={itemVariants}
              className="space-y-1"
            >
              <p className="text-sm text-gray-400">Email</p>
              <motion.input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Enter your email"
                required
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-1"
            >
              <p className="text-sm text-gray-400">Password</p>
              <motion.input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Enter your password"
                required
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <motion.input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 bg-[#2a3441] rounded"
                  whileHover={{ scale: 1.1 }}
                />
                <label htmlFor="remember" className="ml-2 text-gray-400 text-sm">
                  Remember me
                </label>
              </div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link to="/forget-password" className="text-green-500 text-sm hover:text-green-400 transition-colors">
                  Forgot password?
                </Link>
              </motion.div>
            </motion.div>

            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full text-white rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                loading ? 'bg-green-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              }`}
              whileHover={loading ? {} : { scale: 1.02, backgroundColor: "#22c55e" }}
              whileTap={loading ? {} : { scale: 0.98 }}
              variants={itemVariants}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </motion.button>

            <motion.div 
              variants={itemVariants}
              className="text-center space-y-4"
            >
              <p className="text-gray-400 text-sm">Or continue with</p>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  className="py-2 px-4 bg-[#2a3441] rounded-lg text-sm text-gray-400 hover:bg-[#343d4a] transition-all duration-300"
                  whileHover={{ scale: 1.02, backgroundColor: "#343d4a" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Google
                </motion.button>
                <motion.button
                  type="button"
                  className="py-2 px-4 bg-[#2a3441] rounded-lg text-sm text-gray-400 hover:bg-[#343d4a] transition-all duration-300"
                  whileHover={{ scale: 1.02, backgroundColor: "#343d4a" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Apple
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                  <Link to="/signup" className="text-green-500 hover:text-green-400 transition-colors">
                    Sign up
                  </Link>
                </motion.span>
              </p>
            </motion.div>
          </motion.form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login; 