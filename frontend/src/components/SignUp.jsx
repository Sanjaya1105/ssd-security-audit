import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import loginImg1 from '../assets/images/bgImg.jpeg';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    phone_number: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  // Validate passwords match
  if (formData.password !== formData.confirmPassword) {
    toast.error('Passwords do not match');
    setLoading(false);
    return;
  }

  // Validate password length
  if (formData.password.length < 8) {
    toast.error('Password must be at least 8 characters long');
    setLoading(false);
    return;
  }

  try {
    const { confirmPassword, ...signupData } = formData;
    const response = await axios.post('http://localhost:3000/api/users/register', signupData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data) {
      toast.success('Account created successfully!');
      navigate('/login');
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'An error occurred during signup');
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
      
      {/* SignUp Form Container */}
      <AnimatePresence>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-[500px] bg-[#1B2028]/90 backdrop-blur-sm rounded-[20px] p-8 relative z-10 shadow-2xl my-8"
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
              Create Account
            </motion.h2>
            <motion.p 
              className="text-gray-400 text-sm mt-2"
              variants={itemVariants}
            >
              Please fill in your information
            </motion.p>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
          >
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                variants={itemVariants}
                className="space-y-1"
              >
                <p className="text-sm text-gray-400">First Name</p>
                <motion.input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                  placeholder="First name"
                  required
                  whileFocus={{ scale: 1.01 }}
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="space-y-1"
              >
                <p className="text-sm text-gray-400">Last Name</p>
                <motion.input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                  placeholder="Last name"
                  required
                  whileFocus={{ scale: 1.01 }}
                />
              </motion.div>
            </div>

            {/* Contact Information */}
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
              <p className="text-sm text-gray-400">Phone Number</p>
              <motion.input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Enter your phone number"
                required
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-1"
            >
              <p className="text-sm text-gray-400">Address</p>
              <motion.textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Enter your address"
                required
                rows="2"
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            {/* Password Fields */}
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
                placeholder="Create a password"
                required
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="space-y-1"
            >
              <p className="text-sm text-gray-400">Confirm Password</p>
              <motion.input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-[#2a3441] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 transition-all duration-300"
                placeholder="Confirm your password"
                required
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-600 transition-all duration-300"
              whileHover={{ scale: 1.02, backgroundColor: "#22c55e" }}
              whileTap={{ scale: 0.98 }}
              variants={itemVariants}
            >
              {loading ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  Creating Account...
                </motion.span>
              ) : (
                "Sign Up"
              )}
            </motion.button>

            <motion.div 
              variants={itemVariants}
              className="text-center"
            >
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <motion.span whileHover={{ scale: 1.05 }} className="inline-block">
                  <Link to="/login" className="text-green-500 hover:text-green-400 transition-colors">
                    Sign in
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

export default SignUp; 