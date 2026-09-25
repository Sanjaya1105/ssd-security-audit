import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FaCashRegister,
  FaShoppingBag,
  FaListAlt,
  FaChartLine,
  FaBell
} from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductionNotifications from './ProductionNotifications';

const CashierDashboard = () => {
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0
  });

  const fetchStats = async () => {
    try {
      // Fetch orders
      const ordersResponse = await axios.get('http://localhost:3000/api/orders/recent-production', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const orders = ordersResponse.data.orders;

      // Calculate statistics
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => order.order_status === 'PENDING').length;

      setStats({
        totalOrders,
        pendingOrders
      });

      // Set recent orders
      const formattedOrders = orders.map(order => ({
        id: order.order_id,
        customer: order.address.full_name,
        items: order.items.reduce((total, item) => total + item.quantity, 0),
        total: `Rs.${parseFloat(order.total_amount).toFixed(2)}`,
        status: order.order_status
      }));

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  useEffect(() => {
    fetchStats();
    // Set up an interval to fetch stats every minute
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (path) => {
    switch(path) {
      case 'pos':
        navigate('/cashier/pos');
        break;
      case 'orders':
        navigate('/cashier/orders');
        break;
      case 'sales':
        navigate('/cashier/sales-dashboard');
        break;
      case 'product-log':
        navigate('/cashier/product-log');
        break;
      case 'sales-reports':
        navigate('/cashier/sales-reports');
        break;
      case 'payment-reports':
        navigate('/cashier/payment-reports');
        break;
      case 'order-reports':
        navigate('/cashier/order-reports');
        break;
      default:
        break;
    }
  };

  const statsCards = [
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toString(), 
      change: '+12%', 
      trend: 'up' 
    },
    { 
      title: 'Pending Orders', 
      value: stats.pendingOrders.toString(), 
      change: stats.pendingOrders > 10 ? '-2%' : '+2%', 
      trend: stats.pendingOrders > 10 ? 'down' : 'up' 
    }
  ];

  const managementOptions = [
    {
      icon: <FaCashRegister className="text-3xl text-emerald-500 mb-4" />,
      title: "POS System",
      description: "Process sales and manage transactions",
      onClick: () => handleNavigation('pos'),
    },
    {
      icon: <FaShoppingBag className="text-3xl text-blue-500 mb-4" />,
      title: "Orders",
      description: "View and manage orders",
      onClick: () => handleNavigation('orders'),
    },
    {
      icon: <FaListAlt className="text-3xl text-amber-500 mb-4" />,
      title: "Product Logs",
      description: "View product inventory releases",
      onClick: () => handleNavigation('product-log'),
    },
    {
      icon: <FaChartLine className="text-3xl text-green-500 mb-4" />,
      title: "Sales Overview",
      description: "View sales data and reports",
      onClick: () => handleNavigation('sales'),
    }
  ];

  return (
    <>
      <ProductionNotifications />
      {/* Main Content */}
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl text-gray-800 font-bold">Dashboard Overview</h2>
          <div className="flex items-center space-x-4">
            <button 
              className="relative bg-white p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 text-gray-600 hover:text-gray-800 border border-gray-200"
            >
              <FaBell className="w-6 h-6" />
              {stats.pendingOrders > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {stats.pendingOrders}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white text-gray-800 p-6 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-gray-600 mb-2">{stat.title}</h3>
              <div className="flex justify-between items-end">
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  stat.trend === 'up' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-md"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
            <button
              onClick={fetchStats}
              className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="pb-4">Order ID</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Items</th>
                    <th className="pb-4">Total</th>
                    <th className="pb-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-200 text-gray-800">
                      <td className="py-4">#{order.id}</td>
                      <td className="py-4">{order.customer}</td>
                      <td className="py-4">{order.items}</td>
                      <td className="py-4">{order.total}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Management Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {managementOptions.map((option, index) => (
            <motion.div
              key={option.title}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={option.onClick}
            >
              {option.icon}
              <h3 className="text-xl text-gray-800 font-semibold mb-2">{option.title}</h3>
              <p className="text-gray-600 text-base">{option.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CashierDashboard; 