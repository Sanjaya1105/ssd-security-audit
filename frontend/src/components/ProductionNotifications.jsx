import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoNotifications } from 'react-icons/io5';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProductionNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/orders/recent-production', {
        withCredentials: true
      });

      if (response.data.success) {
        const newOrders = response.data.orders;
        
        // Check if there are new orders since last check
        if (lastChecked) {
          const newNotifications = newOrders.filter(order => 
            new Date(order.date) > new Date(lastChecked)
          );

          if (newNotifications.length > 0) {
            // Show toast for each new order
            newNotifications.forEach(order => {
              toast.info(`New Production Order #${order.order_id} created by ${order.created_by}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
            });
          }
        }

        setNotifications(newOrders);
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (orderId) => {
    setNotifications(prev => prev.filter(n => n.order_id !== orderId));
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
      >
        <IoNotifications className="w-6 h-6 text-gray-700" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-800">Recent Production Orders</h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No recent production orders
                </div>
              ) : (
                notifications.map((order) => (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-4 border-b hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">
                          Order #{order.order_id}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created by: {order.created_by}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.date).toLocaleString()}
                        </p>
                        <div className="mt-2">
                          {order.items.map((item, index) => (
                            <p key={index} className="text-sm text-gray-600">
                              {item.product_name} x {item.quantity}
                            </p>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeNotification(order.order_id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ×
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductionNotifications; 