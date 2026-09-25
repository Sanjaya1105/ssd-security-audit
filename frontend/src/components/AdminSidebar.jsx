import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaBox, 
  FaClipboardList, 
  FaShoppingCart, 
  FaWarehouse, 
  FaReceipt, 
  FaBoxOpen, 
  FaCashRegister, 
  FaChartLine,
  FaHome,
  FaShoppingBag,
  FaUsers,
  FaBoxes,
  FaClipboard,
  FaComments,
  FaIndustry,
  FaListAlt,
  FaBrain,
  FaSignOutAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminSidebar = () => {
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
    if (path === 'products') {
      navigate('/admin/products');
    } else if (path === 'inventory') {
      navigate('/admin/inventory');
    } else if (path === 'purchase') {
      navigate('/admin/purchases');
    } else if (path === 'inventory-stock') {
      navigate('/admin/inventory-stock');
    } else if (path === 'receipe') {
      navigate('/admin/recipes');
    } else if (path === 'inventory-release') {
      navigate('/admin/inventory-release');
    } else if (path === 'production-inventory-release') {
      navigate('/admin/production-release');
    } else if (path === 'product-log') {
      navigate('/admin/product-log');
    } else if (path === 'pos') {
      navigate('/admin/pos');
    } else if (path === 'sales') {
      navigate('/admin/sales-dashboard');
    } else if (path === 'orders') {
      navigate('/admin/orders');
    } else if (path === 'users') {
      navigate('/admin/users');
    } else if (path === 'feedback') {
      navigate('/admin/feedback');
    } else if (path === 'ai-prediction') {
      navigate('/admin/ai-prediction');
    } else if (path === 'overview') {
      navigate('/admin/dashboard');
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <FaHome className="w-6 h-6" /> },
    { id: 'orders', label: 'Orders', icon: <FaShoppingBag className="w-6 h-6" /> },
    { id: 'products', label: 'Products', icon: <FaBox className="w-6 h-6" /> },
    { id: 'sales', label: 'Sales Management', icon: <FaChartLine className="w-6 h-6" /> },
    { id: 'users', label: 'Users', icon: <FaUsers className="w-6 h-6" /> },
    { id: 'inventory', label: 'Inventory Items', icon: <FaBoxes className="w-6 h-6" /> },
    { id: 'purchase', label: 'Purchases', icon: <FaShoppingCart className="w-6 h-6" /> },
    { id: 'inventory-stock', label: 'Current Inventory Stock', icon: <FaWarehouse className="w-6 h-6" /> },
    { id: 'receipe', label: 'Recipes', icon: <FaClipboard className="w-6 h-6" /> },
    { id: 'inventory-release', label: 'Inventory Release', icon: <FaBoxOpen className="w-6 h-6" /> },
    { id: 'production-inventory-release', label: 'Production Inventory Release', icon: <FaIndustry className="w-6 h-6" /> },
    { id: 'product-log', label: 'Product Logs', icon: <FaListAlt className="w-6 h-6" /> },
    { id: 'pos', label: 'POS System', icon: <FaCashRegister className="w-6 h-6" /> },
    { id: 'feedback', label: 'Feedback', icon: <FaComments className="w-6 h-6" /> },
    { id: 'ai-prediction', label: 'AI Sales Prediction', icon: <FaBrain className="w-6 h-6" /> },
  ];

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'overview';
    if (path === '/admin/products') return 'products';
    if (path === '/admin/inventory') return 'inventory';
    if (path === '/admin/purchases') return 'purchase';
    if (path === '/admin/inventory-stock') return 'inventory-stock';
    if (path === '/admin/recipes') return 'receipe';
    if (path === '/admin/inventory-release') return 'inventory-release';
    if (path === '/admin/production-release') return 'production-inventory-release';
    if (path === '/admin/product-log') return 'product-log';
    if (path === '/admin/pos') return 'pos';
    if (path === '/admin/sales-dashboard') return 'sales';
    if (path === '/admin/orders') return 'orders';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/feedback') return 'feedback';
    if (path === '/admin/ai-prediction') return 'ai-prediction';
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
        <p className="text-gray-600">Admin Dashboard</p>
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

export default AdminSidebar; 