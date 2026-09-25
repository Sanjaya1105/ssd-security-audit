import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash } from 'react-icons/fa';

const ProductionOrder = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    order_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    
    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.product_id === parseInt(value));
      newItems[index] = {
        ...newItems[index],
        [field]: value,
        quantity: selectedProduct?.min_production_amount || 1
      };
    } else if (field === 'quantity') {
      const selectedProduct = products.find(p => p.product_id === parseInt(newItems[index].product_id));
      const minAmount = selectedProduct?.min_production_amount || 1;
      const newValue = parseInt(value) || minAmount;
      
      if (newValue < minAmount) {
        toast.warning(`Minimum production amount for ${selectedProduct.product_name} is ${minAmount}`);
        newItems[index] = {
          ...newItems[index],
          quantity: minAmount
        };
      } else {
        newItems[index] = {
          ...newItems[index],
          quantity: newValue
        };
      }
    }
    
    setOrderItems(newItems);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const product = products.find(p => p.product_id === parseInt(item.product_id));
      return total + (product ? product.selling_price * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to create a production order');
        navigate('/login');
        return;
      }

      // Filter out any items with empty product_id
      const validItems = orderItems.filter(item => item.product_id);
      
      if (validItems.length === 0) {
        toast.error('Please add at least one product');
        return;
      }

      setLoading(true);

      const orderData = {
        items: validItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        })),
        shipping_address: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code
        },
        order_type: 'PRODUCTION_ORDER',
        date: formData.order_date,
        payment_method:"CASH"
      };

      // Step 1: Create the order
      const orderResponse = await axios.post(
        'http://localhost:3000/api/orders',
        orderData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      if (!orderResponse.data || !orderResponse.data.order_id) {
        throw new Error('Failed to create order: No order ID received');
      }

      const orderId = orderResponse.data.order_id;

      // Step 2: Process the order
      await axios.post(
        `http://localhost:3000/api/orders/${orderId}/process-production-order`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }
      );

      toast.success('Order created and processed successfully!');
      navigate('/orders');

    } catch (error) {
      console.error('Error in order creation:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create production order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8"
        >
          Create Production Order
        </motion.h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Items */}
          <div className="bg-[#1B2028]/90 p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            {orderItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                  className="flex-1 bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name} - Rs.{product.selling_price}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={products.find(p => p.product_id === parseInt(item.product_id))?.min_production_amount || 1}
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-24 bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-500/10 transition-all duration-300"
                  disabled={orderItems.length === 1}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-500 mt-2 px-4 py-2 rounded-lg hover:bg-blue-500/10 transition-all duration-300"
            >
              <FaPlus className="text-sm" /> Add Another Item
            </button>
          </div>

          {/* Shipping Information */}
          <div className="bg-[#1B2028]/90 p-6 rounded-lg space-y-4">
            <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleInputChange}
                className="bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleInputChange}
                className="bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleInputChange}
                className="bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
              <input
                type="text"
                name="postal_code"
                placeholder="Postal Code"
                value={formData.postal_code}
                onChange={handleInputChange}
                className="bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                required
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#1B2028]/90 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="text-lg font-medium">
              Total Amount: Rs.{calculateTotal().toFixed(2)}
            </div>
          </div>

          {/* Production Date Selection */}
          <div className="bg-[#1B2028]/90 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Select Production Order Date</h2>
            <div>
              <input
                type="date"
                id="order_date"
                name="order_date"
                value={formData.order_date}
                onChange={handleInputChange}
                className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/30 font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Store
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 font-medium flex items-center gap-2"
            >
              {loading ? 'Processing...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductionOrder; 