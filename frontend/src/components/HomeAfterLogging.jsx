import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import bgImage from '../assets/images/Homepg.jpg';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';

const Home = () => {
  const [count1, setCount1] = useState(0);
  const [count2, setCount2] = useState(0);
  const [count3, setCount3] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const navigate = useNavigate();

  const handleOrderNowClick = () => {
    setShowInfoModal(true);
  };

  const handleModalClose = (destination) => {
    setShowInfoModal(false);
    if (destination) {
      navigate(destination);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (count1 < 1000) setCount1(prev => Math.min(prev + 20, 1000));
      if (count2 < 50) setCount2(prev => Math.min(prev + 1, 50));
      if (count3 < 95) setCount3(prev => Math.min(prev + 2, 95));
    }, 50);

    return () => clearInterval(interval);
  }, [count1, count2, count3]);

  return (
    <div className="min-h-screen bg-[#0a0b1e] pt-20">
      {/* Hero Section */}
      <div className="relative h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={bgImage}
            alt="Hero Background"
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
            className="max-w-3xl pl-8 md:pl-16 lg:pl-32"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              DELICIOUS FOOD <br />DELIVERED FAST
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-xl">
              Experience the best local cuisine delivered right to your doorstep
            </p>
            <div className="flex gap-6">
              <button 
                onClick={handleOrderNowClick}
                className="bg-green-500 text-white px-8 py-3 rounded hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
              >
                Order Now
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="border border-white text-white px-8 py-3 rounded hover:bg-white/10 transition-all duration-300"
              >
                View Menu
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-[#0d0e24]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-white mb-2">{count1}+</div>
              <div className="text-white/60">Happy Customers</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-white mb-2">{count2}+</div>
              <div className="text-white/60">Restaurant Partners</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="text-5xl font-bold text-white mb-2">{count3}%</div>
              <div className="text-white/60">On-time Delivery</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20 bg-[#0a0b1e]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
          >
            Our Services
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Fast Delivery', desc: 'Quick and reliable food delivery' },
              { title: 'Wide Selection', desc: 'Variety of cuisines to choose from' },
              { title: 'Live Tracking', desc: 'Real-time order tracking' },
              { title: 'Special Offers', desc: 'Regular discounts and deals' },
              { title: 'Secure Payment', desc: 'Safe and easy payment options' },
              { title: '24/7 Support', desc: 'Round-the-clock customer service' }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#12133a] p-6 rounded-lg hover:bg-[#1a1b4b] transition-all duration-300"
              >
                <h3 className="text-xl font-semibold mb-2 text-white">{service.title}</h3>
                <p className="text-white/60">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-20 bg-[#0d0e24]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
          >
            Why Choose Us?
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-green-500 mb-6">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Fast Delivery</h3>
              <p className="text-white/60">Quick and efficient delivery to your doorstep</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-green-500 mb-6">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Quality Food</h3>
              <p className="text-white/60">Partner with the best restaurants in town</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="text-green-500 mb-6">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Best Prices</h3>
              <p className="text-white/60">Competitive pricing with great deals</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-[#0a0b1e]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Order?
            </h2>
            <p className="text-xl text-white/60 mb-8">
              Get your favorite food delivered to your doorstep
            </p>
            <button 
              onClick={handleOrderNowClick}
              className="bg-green-500 text-white px-8 py-3 rounded hover:bg-green-600 transform hover:scale-105 transition-all duration-300"
            >
              Order Now
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#080919] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">HOT-FAST</h3>
              <p className="text-white/60">Delicious food delivered fast</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300">About</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Services</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Food Delivery</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Restaurants</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors duration-300">Special Offers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-white/60">
                <li>123 Food Street</li>
                <li>Colombo, Sri Lanka</li>
                <li>+94 11 234 5678</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/60">
            <p>&copy; 2024 Hot-Fast. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-[#12133a] rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/10"
          >
            <h3 className="text-2xl font-bold text-white mb-4">Choose Your Order Type</h3>
            <p className="text-gray-300 mb-6">
              For larger orders or custom requirements, we recommend using our Production Order system. 
              Otherwise, you can browse our available items in our product store.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleModalClose('/production-order')}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20"
              >
                Production Order
              </button>
              <button
                onClick={() => handleModalClose('/product-store')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20"
              >
                Browse Product Store
              </button>
              <button
                onClick={() => handleModalClose()}
                className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-[1.02]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Home; 