import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { StarFilled, StarOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../config/axiosConfig';
import aboutHero from '../assets/images/about-hero.jpg';

const Feedback = () => {
    const navigate = useNavigate();
    const [feedback, setFeedback] = useState([]);
    const [fiveStarFeedback, setFiveStarFeedback] = useState([]);
    const [latestFeedback, setLatestFeedback] = useState([]);
    const [userFeedback, setUserFeedback] = useState([]);
    const [newFeedback, setNewFeedback] = useState({ comment_: '', star_rating: 0 });
    const [editingId, setEditingId] = useState(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showUserFeedback, setShowUserFeedback] = useState(false);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            fetchUserFeedback(userData.id);
        }
        fetchAllFeedback();
    }, []);

    const fetchAllFeedback = async () => {
        try {
            setIsLoading(true);
            // Fetch all types of feedback in parallel
            const [allResponse, fiveStarResponse, latestResponse] = await Promise.all([
                axiosInstance.get('/feedback'),
                axiosInstance.get('/feedback/five-star'),
                axiosInstance.get('/feedback/latest')
            ]);

            setFeedback(allResponse.data);
            setFiveStarFeedback(fiveStarResponse.data.data);
            setLatestFeedback(latestResponse.data.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching feedback:', error);
            toast.error('Failed to load feedback');
            setIsLoading(false);
        }
    };

    const fetchUserFeedback = async (userId) => {
        try {
            const response = await axiosInstance.get(`/feedback/user/${userId}`);
            setUserFeedback(response.data);
        } catch (error) {
            console.error('Error fetching user feedback:', error);
            toast.error('Failed to load your feedback');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!user) {
            toast.error('Please login to submit feedback');
            navigate('/login');
            return;
        }

        try {
            const response = await axiosInstance.post('/feedback', newFeedback);

            if (response.data.success) {
                toast.success(response.data.message);
                setNewFeedback({ comment_: '', star_rating: 0 });
                fetchAllFeedback();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                toast.error('Session expired. Please login again.');
                navigate('/login');
                return;
            }
            const errorMessage = error.response?.data?.message || 'Failed to submit feedback';
            toast.error(errorMessage);
        }
    };

    const handleUpdate = async (id) => {
        if (!user) {
            toast.error('Please login to update feedback');
            navigate('/login');
            return;
        }

        try {
            const response = await axiosInstance.put(`/feedback/${id}`, newFeedback);

            if (response.data.success) {
                toast.success(response.data.message);
                setEditingId(null);
                setNewFeedback({ comment_: '', star_rating: 0 });
                fetchAllFeedback();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error updating feedback:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                toast.error('Session expired. Please login again.');
                navigate('/login');
                return;
            }
            const errorMessage = error.response?.data?.message || 'Failed to update feedback';
            toast.error(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!user) {
            toast.error('Please login to delete feedback');
            navigate('/login');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this feedback?')) return;

        try {
            const response = await axiosInstance.delete(`/feedback/${id}`);

            if (response.data.success) {
                toast.success(response.data.message);
                fetchAllFeedback();
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Error deleting feedback:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                toast.error('Session expired. Please login again.');
                navigate('/login');
                return;
            }
            const errorMessage = error.response?.data?.message || 'Failed to delete feedback';
            toast.error(errorMessage);
        }
    };

    const startEditing = (feedback) => {
        setEditingId(feedback.feedback_id);
        setNewFeedback({
            comment_: feedback.comment_,
            star_rating: feedback.star_rating
        });
    };

    const renderStars = (rating, isInteractive = false) => {
        return [...Array(5)].map((_, index) => {
            const ratingValue = index + 1;
            return (
                <span
                    key={index}
                    className={`text-2xl cursor-pointer ${
                        ratingValue <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-400'
                    }`}
                    onMouseEnter={() => isInteractive && setHoverRating(ratingValue)}
                    onMouseLeave={() => isInteractive && setHoverRating(0)}
                    onClick={() => isInteractive && setNewFeedback({ ...newFeedback, star_rating: ratingValue })}
                >
                    {ratingValue <= (hoverRating || rating) ? <StarFilled /> : <StarOutlined />}
                </span>
            );
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0b1e]">
            {/* Hero Section */}
            <div className="relative h-[80vh]">
                <div className="absolute inset-0">
                    <img 
                        src={aboutHero}
                        alt="Restaurant Hero"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl pl-8 md:pl-16 lg:pl-32"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                            Your Voice Matters
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-xl">
                            Share your dining experience and help us serve you better
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-16">
                {/* Header Section with Toggle Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex justify-between items-center"
                >
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {showUserFeedback ? 'Your Feedback' : 'Share Your Experience'}
                        </h2>
                        <p className="text-gray-400">
                            {showUserFeedback 
                                ? 'View and manage your submitted feedback' 
                                : 'Your feedback helps us improve our service'}
                        </p>
                    </div>
                    {user && (
                        <button
                            onClick={() => setShowUserFeedback(!showUserFeedback)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/30"
                        >
                            {showUserFeedback ? 'Write Feedback' : 'View My Feedback'}
                        </button>
                    )}
                </motion.div>

                {/* Feedback Form */}
                {!showUserFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1B2028]/90 p-8 rounded-lg shadow-lg mb-12"
                    >
                        <form onSubmit={(e) => editingId ? handleUpdate(editingId) : handleSubmit(e)} className="space-y-6">
                            <div>
                                <label className="block text-gray-300 mb-2 text-lg">Your Rating</label>
                                <div className="flex space-x-2">
                                    {renderStars(newFeedback.star_rating, true)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2 text-lg">Your Comment</label>
                                <textarea
                                    className="w-full bg-[#0a0b1e] text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows="4"
                                    value={newFeedback.comment_}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, comment_: e.target.value })}
                                    placeholder="Tell us about your experience..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-4">
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setNewFeedback({ comment_: '', star_rating: 0 });
                                        }}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
                                >
                                    {editingId ? 'Update Feedback' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Feedback Display */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                            <p className="text-gray-400 mt-4">Loading feedback...</p>
                        </div>
                    ) : showUserFeedback ? (
                        userFeedback.length === 0 ? (
                            <div className="text-center py-12 bg-[#1B2028]/90 rounded-lg">
                                <p className="text-gray-400 text-lg">You haven't submitted any feedback yet</p>
                            </div>
                        ) : (
                            userFeedback.map((item) => (
                                <motion.div
                                    key={item.feedback_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[#1B2028]/90 p-6 rounded-lg shadow-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                {item.first_name} {item.last_name}
                                            </h3>
                                            <div className="flex mt-1">
                                                {renderStars(item.star_rating)}
                                            </div>
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => startEditing(item)}
                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                <EditOutlined className="text-xl" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.feedback_id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <DeleteOutlined className="text-xl" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 mt-4">{item.comment_}</p>
                                </motion.div>
                            ))
                        )
                    ) : (
                        fiveStarFeedback.map((item) => (
                            <motion.div
                                key={item.feedback_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[#1B2028]/90 p-6 rounded-lg shadow-lg"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            {item.first_name} {item.last_name}
                                        </h3>
                                        <div className="flex mt-1">
                                            {renderStars(item.star_rating)}
                                        </div>
                                    </div>
                                    {user && user.user_id === item.user_id && (
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() => startEditing(item)}
                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                <EditOutlined className="text-xl" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.feedback_id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <DeleteOutlined className="text-xl" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-300 mt-4">{item.comment_}</p>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Feedback; 