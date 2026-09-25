import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome,
  FaShoppingBag,
  FaCashRegister,
  FaChartLine,
  FaListAlt,
  FaSignOutAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const CashierSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear all data from localStorage
    localStorage.clear();
    // Show success message
    toast.success('Logged out successfully!');
    // Redirect to login page
    navigate('/login');
  };

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
      case 'overview':
        navigate('/cashier/dashboard');
        break;
      default:
        break;
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <FaHome className="w-6 h-6" /> },
    { id: 'orders', label: 'Orders', icon: <FaShoppingBag className="w-6 h-6" /> },
    { id: 'pos', label: 'POS System', icon: <FaCashRegister className="w-6 h-6" /> },
    { id: 'product-log', label: 'Product Logs', icon: <FaListAlt className="w-6 h-6" /> },
    { id: 'sales', label: 'Sales Overview', icon: <FaChartLine className="w-6 h-6" /> }
  ];

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/cashier/dashboard') return 'overview';
    if (path === '/cashier/orders') return 'orders';
    if (path === '/cashier/pos') return 'pos';
    if (path === '/cashier/product-log') return 'product-log';
    if (path === '/cashier/sales-dashboard') return 'sales';
    return '';
  };

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-72 bg-white p-6 shadow-lg flex flex-col"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-green-600">HOT-FAST</h1>
        <p className="text-gray-600">Cashier Dashboard</p>
      </div>
      <nav className="space-y-2 flex-grow overflow-y-auto">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-all duration-300 ${
              getCurrentTab() === item.id
                ? 'bg-green-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="mr-3 flex-shrink-0">{item.icon}</span>
            <span className="text-base break-words">{item.label}</span>
          </button>
        ))}
      </nav>
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-4 w-full flex items-center text-left px-4 py-3 rounded-lg transition-all duration-300 text-red-600 hover:bg-red-50"
      >
        <span className="mr-3 flex-shrink-0"><FaSignOutAlt className="w-6 h-6" /></span>
        <span className="text-base break-words">Logout</span>
      </button>
    </motion.div>
  );
};

export default CashierSidebar; 