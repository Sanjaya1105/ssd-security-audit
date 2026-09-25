import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { StarFilled, StarOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const Feedback = () => {
    const [feedback, setFeedback] = useState([]);
    const [newFeedback, setNewFeedback] = useState({ comment_: '', star_rating: 0 });
    const [editingId, setEditingId] = useState(null);
    const [hoverRating, setHoverRating] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchUserData();
        fetchFeedback();
    }, []);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('http://localhost:5000/api/user/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchFeedback = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/feedback');
            setFeedback(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching feedback:', error);
            toast.error('Failed to load feedback');
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to submit feedback');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/feedback', newFeedback, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Feedback submitted successfully');
            setNewFeedback({ comment_: '', star_rating: 0 });
            fetchFeedback();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Failed to submit feedback');
        }
    };

    const handleUpdate = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/feedback/${id}`, newFeedback, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Feedback updated successfully');
            setEditingId(null);
            setNewFeedback({ comment_: '', star_rating: 0 });
            fetchFeedback();
        } catch (error) {
            console.error('Error updating feedback:', error);
            toast.error('Failed to update feedback');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this feedback?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/feedback/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Feedback deleted successfully');
            fetchFeedback();
        } catch (error) {
            console.error('Error deleting feedback:', error);
            toast.error('Failed to delete feedback');
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
        <div className="min-h-screen bg-[#1a1d24] p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Customer Feedback
                    </h1>
                    <p className="text-gray-400">
                        Share your experience and help us improve our service
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Feedback Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#2a2d35] p-6 rounded-lg shadow-lg"
                    >
                        <h2 className="text-2xl font-semibold text-white mb-6">
                            {editingId ? 'Edit Your Feedback' : 'Share Your Experience'}
                        </h2>
                        <form onSubmit={(e) => editingId ? handleUpdate(editingId) : handleSubmit(e)} className="space-y-6">
                            <div>
                                <label className="block text-gray-300 mb-2">Rating</label>
                                <div className="flex space-x-2">
                                    {renderStars(newFeedback.star_rating, true)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2">Comment</label>
                                <textarea
                                    className="w-full bg-[#1a1d24] text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="4"
                                    value={newFeedback.comment_}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, comment_: e.target.value })}
                                    placeholder="Share your thoughts about your experience..."
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
                                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    {editingId ? 'Update Feedback' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    {/* Feedback List */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#2a2d35] p-6 rounded-lg shadow-lg"
                    >
                        <h2 className="text-2xl font-semibold text-white mb-6">
                            Recent Feedback
                        </h2>
                        {isLoading ? (
                            <div className="text-center text-gray-400">Loading feedback...</div>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                {feedback.map((item) => (
                                    <motion.div
                                        key={item.feedback_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-[#1a1d24] p-4 rounded-lg"
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
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => startEditing(item)}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        <EditOutlined className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.feedback_id)}
                                                        className="text-red-400 hover:text-red-300"
                                                    >
                                                        <DeleteOutlined className="text-lg" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-300 mt-2">{item.comment_}</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Feedback; 