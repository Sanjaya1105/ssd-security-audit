import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    try {
      const cleanOrderId = id?.split('?')[0];
      
      if (!cleanOrderId) {
        setError('Order ID is required');
        setLoading(false);
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        setError('Please log in to view order details');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:3000/api/orders/user/orders', {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });

      const foundOrder = response.data.find(order => order.order_id.toString() === cleanOrderId);

      if (!foundOrder) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      setOrder(foundOrder);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching order:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch order details';
      setError(errorMessage);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1B2028]/90 p-8 rounded-lg"
        >
          <h1 className="text-3xl font-bold mb-6">Order Confirmation</h1>
          
          {order && (
            <div className="space-y-6">
              <div className="bg-[#2a3441]/50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Order Details</h2>
                <p className="text-gray-300">Order ID: {order.order_id}</p>
                <p className="text-gray-300">Status: {order.order_status}</p>
                <p className="text-gray-300">Date: {new Date(order.date).toLocaleDateString()}</p>
              </div>

              <div className="bg-[#2a3441]/50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Items</h2>
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-lg">Rs.{(item.quantity * (item.price || 0)).toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700">
                  <p className="text-xl font-bold">Total</p>
                  <p className="text-xl font-bold">Rs.{parseFloat(order.total_amount || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-[#2a3441]/50 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
                {order.address && typeof order.address === 'string' && (
                  <>
                    {(() => {
                      try {
                        const shippingAddress = JSON.parse(order.address);
                        return (
                          <>
                            <p className="text-gray-300">{shippingAddress.full_name}</p>
                            <p className="text-gray-300">{shippingAddress.address}</p>
                            <p className="text-gray-300">{shippingAddress.city}</p>
                            <p className="text-gray-300">{shippingAddress.postal_code}</p>
                            <p className="text-gray-300">{shippingAddress.email}</p>
                            <p className="text-gray-300">{shippingAddress.phone}</p>
                          </>
                        );
                      } catch (e) {
                        return <p className="text-gray-300">{order.address}</p>;
                      }
                    })()}
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => navigate('/product-store')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300"
                >
                  Back to Store
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 