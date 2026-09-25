import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment Form Component
const PaymentForm = ({ onSuccess, amount, orderId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      setError("Stripe has not been initialized");
      setProcessing(false);
      return;
    }

    if (!orderId) {
      setError("Order ID is missing");
      setProcessing(false);
      return;
    }

    try {
      // Construct the return URL carefully to avoid query parameter issues
      const baseUrl = window.location.origin;
      const returnUrl = new URL(`${baseUrl}/order-confirmation/${orderId}`);

      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl.toString(),
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message);
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing || !orderId}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: ''
  });

  useEffect(() => {
    if (location.state?.cart) {
      setCart(location.state.cart);
    } else {
      navigate('/product-store');
    }
  }, [location, navigate]);

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!formData.postal_code.trim()) {
      toast.error('Postal code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to complete your purchase');
        navigate('/login');
        return;
      }

      const today = new Date().toISOString().slice(0, 19).replace('T', ' '); // format: YYYY-MM-DD HH:MM:SS

      // First create the order
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        shipping_address: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code
        },
        order_type: 'DIRECT_SALE',
        payment_method: 'CARD',  // Add this default
        date: today // ✅ send this to backen
      };

      // Create order first
      const orderResponse = await axios.post(
        'http://localhost:3000/api/orders',
        orderData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!orderResponse.data.order_id) {
        throw new Error('No order ID received from server');
      }

      setOrderId(orderResponse.data.order_id);

      // Then create payment intent
      const total = calculateTotal();
      const response = await axios.post(
        'http://localhost:3000/api/payments/create-payment-intent',
        {
          amount: Math.round(total * 100), // Convert to cents and ensure it's an integer
          order_id: orderResponse.data.order_id, // Pass the order ID to link payment with order
          currency: 'usd',
          payment_method_types: ['card']
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.clientSecret) {
        throw new Error('No client secret received from server');
      }

      setClientSecret(response.data.clientSecret);
    } catch (err) {
      console.error('Error in checkout process:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        toast.error('Please log in to complete your purchase');
        navigate('/login');
        return;
      }

      toast.success('Payment completed successfully!');
      navigate(`/order-confirmation/${orderId}`, { 
        state: { 
          orderId: orderId,
          paymentId: paymentIntent.id,
          orderDetails: {
            items: cart,
            total: calculateTotal(),
            address: `${formData.full_name}, ${formData.email}, ${formData.phone}, ${formData.address}, ${formData.city}, ${formData.postal_code}`
          }
        } 
      });
    } catch (err) {
      console.error('Error in payment process:', err);
      toast.error('There was an issue with the payment process. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0b1e] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8"
        >
          Checkout
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1B2028]/90 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {cart.map(item => (
              <div key={item.product_id} className="flex items-center gap-4 mb-4 p-4 bg-[#2a3441] rounded-lg">
                <img
                  src={item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={item.product_name}
                  className="w-20 h-20 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product_name}</h3>
                  <p className="text-gray-400">Quantity: {item.quantity}</p>
                  <p className="text-green-500">Rs.{(item.selling_price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>Rs.{calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-green-500">Rs.{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1B2028]/90 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
            {clientSecret ? (
              <div className="mt-6">
                <Elements stripe={stripePromise} options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#22c55e',
                      colorBackground: '#1B2028',
                      colorText: '#ffffff',
                      colorDanger: '#df1b41',
                    }
                  }
                }}>
                  <PaymentForm 
                    onSuccess={handlePaymentSuccess}
                    amount={calculateTotal()}
                    orderId={orderId}
                  />
                </Elements>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    required
                  />
                </div>

                <div>
  <label className="block text-sm font-medium mb-2">Phone</label>
  <input
    type="tel"
    name="phone"
    value={formData.phone}
    onChange={handleInputChange}
    pattern="0[0-9]{9}"
    maxLength="10"
    title="Phone number must start with 0 and be exactly 10 digits long"
    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
    required
  />
</div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className="w-full bg-[#2a3441] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 