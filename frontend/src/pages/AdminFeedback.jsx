import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaStar, FaTrash, FaUser } from 'react-icons/fa';
import bgImage from '../assets/images/bgImg.jpeg';
import { useNavigate } from 'react-router-dom';

const AdminFeedback = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !['admin', 'manager'].includes(user.role)) {
          navigate('/login');
          return;
        }
        fetchFeedbacks();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/feedback', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
    } else {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await axios.delete(`http://localhost:3000/api/feedback/${feedbackId}`, {
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Feedback deleted successfully');
        fetchFeedbacks(); // Refresh the list
      } catch (error) {
        console.error('Error deleting feedback:', error);
        handleError(error);
      }
    }
  };

  const getUserFullName = (feedback) => {
    const firstName = feedback.first_name || '';
    const lastName = feedback.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return `User #${feedback.user_id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[30vh]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={bgImage}
            alt="Feedback Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto px-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Customer Feedbacks
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl">
              Manage and review customer feedbacks
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Feedback List */}
        <div className="grid grid-cols-1 gap-6">
          {feedbacks.map((feedback) => (
            <motion.div
              key={feedback.feedback_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 p-6"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-3 rounded-full">
                      <FaUser className="text-green-500 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {getUserFullName(feedback)}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, index) => (
                            <FaStar
                              key={index}
                              className={`text-lg ${
                                index < feedback.star_rating
                                  ? 'text-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedback(feedback.feedback_id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-300"
                  >
                    <FaTrash />
                  </button>
                </div>
                <p className="text-gray-700 text-lg">
                  {feedback.comment_}
                </p>
                <div className="text-sm text-gray-500 flex items-center justify-between">
                  <span>Feedback ID: {feedback.feedback_id}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {feedbacks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-xl">No feedbacks available</p>
          </div>
        )}
      </div>
    </div>
  );
};

const style = {
  container: {
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  heading: {
    color: '#333333',
    fontWeight: 'bold',
  },
  text: {
    color: '#666666',
  },
  userIcon: {
    backgroundColor: '#f5f5f5',
    color: '#389e0d',
  },
  deleteButton: {
    backgroundColor: '#ff4d4f',
    color: '#ffffff',
  }
};

export default AdminFeedback;
