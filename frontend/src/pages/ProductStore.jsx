import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import bgImage from '../assets/images/ProductStore.jpg';

const ProductStore = () => {
  const [products, setProducts] = useState([]);
  const [productStock, setProductStock] = useState({});
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching products...');
        // Fetch products
        const response = await axios.get('http://localhost:3000/api/products');
        console.log('Products response:', response.data);
        setProducts(response.data);

        // Fetch categories
        console.log('Fetching categories...');
        const categoryResponse = await axios.get('http://localhost:3000/api/products/categories');
        console.log('Categories response:', categoryResponse.data);
        setCategories(categoryResponse.data);
        
        // Fetch stock information for each product
        const stockData = {};
        for (const product of response.data) {
          try {
            const stockResponse = await axios.get(`http://localhost:3000/api/products/${product.product_id}/stock`);
            stockData[product.product_id] = stockResponse.data.quantity_available;
          } catch (error) {
            console.error(`Error fetching stock for product ${product.product_id}:`, error);
            stockData[product.product_id] = 0; // Default to 0 if error
          }
        }
        setProductStock(stockData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToCart = (product) => {
    // Check if there's enough stock
    const availableStock = productStock[product.product_id] || 0;
    const currentInCart = cart.find(item => item.product_id === product.product_id)?.quantity || 0;
    
    if (currentInCart >= availableStock) {
      toast.error(`Sorry, only ${availableStock} items available in stock`);
      return;
    }
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product_id === product.product_id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    toast.success('Added to cart');
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
    toast.success('Removed from cart');
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // Check if there's enough stock
    const availableStock = productStock[productId] || 0;
    if (newQuantity > availableStock) {
      toast.error(`Sorry, only ${availableStock} items available in stock`);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    navigate('/checkout', { state: { cart } });
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    console.log('Filtering product:', product.product_name, { matchesCategory, matchesSearch, selectedCategory, category: product.category });
    return matchesCategory && matchesSearch;
  });

  console.log('Filtered products:', filteredProducts);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b1e] text-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b1e]">
      {/* Hero Section */}
      <div className="relative h-[40vh]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={bgImage}
            alt="Store Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-7xl mx-auto px-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our Products
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl">
              Discover our wide selection of delicious dishes and beverages
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white"
          >
            Our Products
          </motion.h1>
          
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/production-order')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Production Order
            </button>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/30 font-medium"
            >
              <FaShoppingCart className="text-lg" />
              Cart ({cart.length})
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#2a3441] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#2a3441] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

       {/* Products Grid */}
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 p-4">
  {filteredProducts.map(product => (
    <motion.div
      key={product.product_id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-[#1B2028]/80 to-[#1B2028]/95 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 border border-gray-800/50"
    >
      <div className="relative group">
        <img
          src={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.product_name}
          className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            console.log('Image failed to load for:', product.product_name);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-5 space-y-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-white truncate">{product.product_name}</h3>
          <p className="text-gray-300 text-sm line-clamp-2">{product.description}</p>
          <div className="flex items-center">
            <span className={`text-sm ${productStock[product.product_id] > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {productStock[product.product_id] > 0 ? `In Stock: ${productStock[product.product_id]}` : 'Out of Stock'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-green-400 font-bold text-lg">
            Rs.{product.selling_price.toFixed(2)}
          </span>
          <button
            onClick={() => addToCart(product)}
            disabled={productStock[product.product_id] <= 0}
            className={`${
              productStock[product.product_id] > 0 
                ? 'bg-green-600 hover:bg-green-500' 
                : 'bg-gray-600 cursor-not-allowed'
            } text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg hover:shadow-green-500/20 flex items-center gap-2 text-sm font-medium`}
          >
            <FaShoppingCart className="text-sm" />
            {productStock[product.product_id] > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </motion.div>
  ))}
</div>

        {/* Edit Product Modal */}

        {/* Shopping Cart Sidebar */}
        {showCart && (
          <div className="fixed inset-0 bg-[#0a0b1e] bg-opacity-0 flex items-center justify-end z-50">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-[#1B2028] w-full max-w-md h-full p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl text-white font-bold">Shopping Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-400 text-center">Your cart is empty</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center gap-4 mb-4 p-4 bg-[#2a3441] rounded-lg">
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{item.product_name}</h3>
                        <p className="text-green-500">Rs.{item.selling_price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="bg-[#1B2028] text-white px-2 py-1 rounded"
                          >
                            -
                          </button>
                          <span className="text-white" >{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="bg-[#1B2028] text-white px-2 py-1 rounded"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product_id)}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 border-t border-gray-700 pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="font-semibold text-white">Total:</span>
                      <span className="text-green-500 font-bold">
                        Rs.{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition duration-300"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductStore; 