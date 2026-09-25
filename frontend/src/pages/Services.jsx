import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import menuBoard from '../assets/images/restaurant-interior-2.jpg'; // You'll need to add this image

const Services = () => {
    const navigate = useNavigate();
    const [showInfoModal, setShowInfoModal] = useState(false);

    const handleOrderNowClick = () => {
        setShowInfoModal(true);
    };

    const handleModalClose = (destination) => {
        setShowInfoModal(false);
        if (destination) {
            navigate(destination);
        }
    };

    const menuCategories = [
        {
            title: "PASTA",
            items: [
                "Srilankan Style Chicken Pasta",
                "Creamy Tomato Seafood Pasta",
                "Creamy Chicken Cheese Pasta"
            ]
        },
        {
            title: "NOODLES",
            items: [
                "Spicy Chicken Noodles",
                "Seafood Mi Goreng",
                "Vegetable And Egg Noodles"
            ]
        },
        {
            title: "RICE",
            items: [
                "Chicken Biryani",
                "Mixed Fried Rice",
                "Seafood Nasi Goreng",
                "Chicken Malaysian Rice",
                "Egg And Vegetable Rice With Chilli Chicken"
            ]
        },
        {
            title: "BITES",
            items: [
                "Roasted Chicken BBQ SAUCE",
                "Fish Devilled",
                "Chicken Sausage Devilled",
                "Hot Butter Calamari",
                "Cheese & Egg Omelet",
                "Fried Garlic"
            ]
        }
    ];

    const beverages = [
        {
            title: "FRUIT JUICE",
            items: [
                "Orange Juice",
                "Papaya Juice",
                "Pineapple Juice",
                "Mango Juice",
                "Woodapple Juice",
                "Mixed Fruit Juice",
                "Avocado Juice",
                "Watermelon Juice",
                "Passion Fruit Juice",
                "Fruits Salad",
                "Fruits Salad With Ice Cream",
                "Ice Cream"
            ]
        },
        {
            title: "MILKSHAKE",
            items: [
                "Vanilla Milkshake",
                "Chocolate Milkshake",
                "Strawberry Milkshake",
                "Banana Smoothie"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0b1e]">
            {/* Hero Section */}
            <div className="relative h-screen">
                <div className="absolute inset-0">
                    <img 
                        src={menuBoard}
                        alt="Hot & Fast Menu Board"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-3xl pl-8 md:pl-16 lg:pl-32"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                            Our Menu
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-xl">
                            Discover our delicious selection of dishes
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Dishes Section */}
            <div className="py-20 bg-[#0d0e24]">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
                    >
                        Main Dishes
                    </motion.h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {menuCategories.map((category, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-[#12133a] p-8 rounded-lg hover:bg-[#1a1b4b] transition-all duration-300"
                            >
                                <h3 className="text-2xl font-bold text-green-500 mb-6">{category.title}</h3>
                                <ul className="space-y-3">
                                    {category.items.map((item, itemIndex) => (
                                        <li 
                                            key={itemIndex}
                                            className="text-white/80 hover:text-white transition-colors duration-200"
                                        >
                                            • {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Beverages Section */}
            <div className="py-20 bg-[#0a0b1e]">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
                    >
                        Beverages
                    </motion.h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {beverages.map((category, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-[#12133a] p-8 rounded-lg hover:bg-[#1a1b4b] transition-all duration-300"
                            >
                                <h3 className="text-2xl font-bold text-green-500 mb-6">{category.title}</h3>
                                <ul className="space-y-3">
                                    {category.items.map((item, itemIndex) => (
                                        <li 
                                            key={itemIndex}
                                            className="text-white/80 hover:text-white transition-colors duration-200"
                                        >
                                            • {item}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Special Lunch Section */}
            <div className="py-20 bg-[#0d0e24]">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="bg-[#12133a] p-8 rounded-lg text-center"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Lunch Special
                        </h2>
                        <div className="text-white/80 space-y-4">
                            <p className="text-xl">Traditional Rice & Curry</p>
                            <p className="text-xl">Egg and Corn Rice with Chilli Chicken</p>
                        </div>
                    </motion.div>
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
                            Experience our delicious menu today
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

            {/* Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
                    >
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Choose Your Order Type</h3>
                        <p className="text-gray-600 mb-6">
                            For larger orders or custom requirements, we recommend using our Production Order system. 
                            Otherwise, you can browse our available items in our product store.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleModalClose('/production-order')}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300"
                            >
                                Production Order
                            </button>
                            <button
                                onClick={() => handleModalClose('/product-store')}
                                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300"
                            >
                                Browse Product Store
                            </button>
                            <button
                                onClick={() => handleModalClose()}
                                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300"
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

export default Services; 