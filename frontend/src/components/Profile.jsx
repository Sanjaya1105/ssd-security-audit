import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEdit, FaSave, FaTimes, FaBox } from "react-icons/fa";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser) {
          navigate("/login");
          return;
        }

        // Fetch user details
        const userResponse = await axios.get(
          `http://localhost:3000/api/users/users/${storedUser.id}`,
          { withCredentials: true }
        );
        setUser(userResponse.data);
        setEditedUser(userResponse.data);

        // Fetch user orders
        const ordersResponse = await axios.get(
          `http://localhost:3000/api/orders/user/orders`,
          { withCredentials: true }
        );
        setOrders(ordersResponse.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedUser({ ...user });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/api/users/users/${user.user_id}`,
        editedUser,
        { withCredentials: true }
      );
      setUser(editedUser);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white pt-20 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1B2028]/90 rounded-lg p-8 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Profile Information</h2>
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all duration-300"
            >
              {isEditing ? (
                <>
                  <FaTimes /> Cancel
                </>
              ) : (
                <>
                  <FaEdit /> Edit Profile
                </>
              )}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={editedUser.first_name}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={editedUser.last_name}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editedUser.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    value={editedUser.phone_number}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={editedUser.address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-all duration-300"
              >
                <FaSave /> Save Changes
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm">First Name</p>
                <p className="text-xl">{user.first_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Last Name</p>
                <p className="text-xl">{user.last_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-xl">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Phone Number</p>
                <p className="text-xl">{user.phone_number}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-400 text-sm">Address</p>
                <p className="text-xl">{user.address}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Order History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1B2028]/90 rounded-lg p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <FaBox className="text-2xl text-green-500" />
            <h2 className="text-3xl font-bold">Order History</h2>
          </div>

          {orders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No orders found</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-[#2a3441] rounded-lg p-6 hover:bg-[#2a3441]/80 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Order #{order.order_id}
                      </h3>
                      <p className="text-gray-400">
                        {new Date(order.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-500">
                        Rs. {parseFloat(order.total_amount || 0).toFixed(2)}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm ${
                          order.order_status === "COMPLETED"
                            ? "bg-green-500/20 text-green-500"
                            : order.order_status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {order.order_status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">
                      Delivery Address
                    </h4>
                    <p className="text-sm">
                      {JSON.parse(order.address).address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
