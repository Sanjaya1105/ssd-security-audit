import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import aboutHeroImage from '../assets/images/about-hero.jpg'; // You'll need to add this image
import restaurantInterior1 from '../assets/images/restaurant-interior-1.jpg'; // First interior image
import restaurantInterior2 from '../assets/images/restaurant-interior-2.jpg'; // Second interior image
import { Row, Col, Card, Typography, Divider } from 'antd';
import { 
    ShopOutlined, 
    TeamOutlined, 
    HistoryOutlined, 
    HeartOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const About = () => {
    const [count1, setCount1] = useState(0);
    const [count2, setCount2] = useState(0);
    const [count3, setCount3] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            if (count1 < 15) setCount1(prev => Math.min(prev + 1, 15));
            if (count2 < 1000) setCount2(prev => Math.min(prev + 50, 1000));
            if (count3 < 100) setCount3(prev => Math.min(prev + 5, 100));
        }, 50);

        return () => clearInterval(interval);
    }, [count1, count2, count3]);

    return (
        <div className="min-h-screen bg-[#0a0b1e]">
            {/* Hero Section */}
            <div className="relative h-screen">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img 
                        src={restaurantInterior1}
                        alt="Restaurant Interior"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
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
                            Welcome to Hot & Fast
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-xl">
                            Experience elegant dining in a modern atmosphere
                        </p>
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

            {/* Our Space Section */}
            <div className="py-20 bg-[#0d0e24]">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
                    >
                        Our Space
                    </motion.h2>
                    <div className="grid md:grid-cols-2 gap-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="relative overflow-hidden rounded-lg"
                        >
                            <img 
                                src={restaurantInterior1} 
                                alt="Restaurant Interior View 1"
                                className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col justify-center"
                        >
                            <h3 className="text-2xl font-semibold text-white mb-6">Modern Comfort</h3>
                            <p className="text-white/60 mb-6">
                                Step into our thoughtfully designed space where modern aesthetics meet comfortable dining. 
                                Our restaurant features elegant lighting, comfortable seating, and an atmosphere perfect for 
                                both casual meals and special occasions.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col justify-center md:order-3"
                        >
                            <h3 className="text-2xl font-semibold text-white mb-6">Elegant Atmosphere</h3>
                            <p className="text-white/60 mb-6">
                                Our dining area is designed with your comfort in mind, featuring premium wooden furniture 
                                and ambient lighting that creates the perfect environment for enjoying our delicious cuisine.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative overflow-hidden rounded-lg md:order-4"
                        >
                            <img 
                                src={restaurantInterior2} 
                                alt="Restaurant Interior View 2"
                                className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
                            />
                        </motion.div>
                    </div>
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
                            <div className="text-white/60">Years of Excellence</div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-center"
                        >
                            <div className="text-5xl font-bold text-white mb-2">{count2}+</div>
                            <div className="text-white/60">Satisfied Customers</div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-center"
                        >
                            <div className="text-5xl font-bold text-white mb-2">{count3}%</div>
                            <div className="text-white/60">Customer Satisfaction</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Our Journey Section */}
            <div className="py-20 bg-[#0a0b1e]">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
                    >
                        Our Journey
                    </motion.h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { year: '2020', title: 'The Beginning', desc: 'Started as a small local restaurant with big dreams' },
                            { year: '2021', title: 'Digital Innovation', desc: 'Launched our online ordering platform' },
                            { year: '2022', title: 'Expansion', desc: 'Grew our delivery network across the city' },
                            { year: '2023', title: 'Customer Focus', desc: 'Implemented advanced customer feedback system' },
                            { year: '2024', title: 'Sustainability', desc: 'Introduced eco-friendly packaging' },
                            { year: 'Future', title: 'Looking Ahead', desc: 'Continuing to innovate and grow' }
                        ].map((milestone, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-[#12133a] p-6 rounded-lg hover:bg-[#1a1b4b] transition-all duration-300"
                            >
                                <div className="text-green-500 text-sm font-semibold mb-2">{milestone.year}</div>
                                <h3 className="text-xl font-semibold mb-2 text-white">{milestone.title}</h3>
                                <p className="text-white/60">{milestone.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Our Values Section */}
            <div className="py-20 bg-[#0d0e24]">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold text-white text-center mb-16"
                    >
                        Our Values
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-white">Quality First</h3>
                            <p className="text-white/60">We never compromise on the quality of our food and service</p>
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
                            <h3 className="text-xl font-semibold mb-4 text-white">Customer Satisfaction</h3>
                            <p className="text-white/60">Your satisfaction is our top priority</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="text-center"
                        >
                            <div className="text-green-500 mb-6">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-4 text-white">Innovation</h3>
                            <p className="text-white/60">Constantly improving our services</p>
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
                            Join Our Journey
                        </h2>
                        <p className="text-xl text-white/60 mb-8">
                            Experience the best food delivery service in town
                        </p>
                        <button 
                            onClick={() => navigate('/product-store')}
                            className="bg-green-500 text-white px-8 py-3 rounded hover:bg-green-600 transform hover:scale-105 transition-all duration-300"
                        >
                            Order Now
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default About; 