import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch } from 'react-icons/fa';
import bgImage from '../assets/images/Menu.jpg';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products
        const response = await axios.get('http://localhost:3000/api/products');
        setProducts(response.data);

        // Fetch categories
        const categoryResponse = await axios.get('http://localhost:3000/api/products/categories');
        setCategories(categoryResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            alt="Menu Background"
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
              Our Menu
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl">
              Explore our delicious selection of dishes and beverages
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white" />
              <input
                type="text"
                placeholder="Search menu items..."
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

        {/* Menu Items Grid */}
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
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold text-white truncate">{product.product_name}</h3>
                  <p className="text-gray-300 text-sm line-clamp-2">{product.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-green-400 font-bold text-lg">
                    Rs.{product.selling_price.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Menu; 