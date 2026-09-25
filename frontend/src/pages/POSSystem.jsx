import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaShoppingCart, FaSearch, FaMinus, FaPlus, FaTrash, FaReceipt, FaPrint } from 'react-icons/fa';
import { Modal } from 'antd';
import dayjs from 'dayjs';

const Receipt = ({ visible, onClose, saleData, cart = [], total = 0 }) => {
    const receiptRef = useRef();
    const user = JSON.parse(localStorage.getItem('user'));

    const handlePrint = () => {
        const content = receiptRef.current;
        const printWindow = window.open('', '', 'height=600,width=400');
        
        printWindow.document.write('<html><head><title>Print Receipt</title>');
        // Add styles for printing
        printWindow.document.write(`
            <style>
                body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; font-size: 16px; }
                .receipt { width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .items { margin: 20px 0; }
                .item { margin: 5px 0; }
                .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
                .footer { text-align: center; margin-top: 20px; font-size: 14px; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(content.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    // Auto-close after 30 seconds
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 30000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <Modal
            title={<div className="text-center font-bold text-lg">Sale Receipt</div>}
            open={visible}
            onCancel={onClose}
            footer={[
                <button
                    key="print"
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full text-base"
                    disabled={!cart || cart.length === 0}
                >
                    <FaPrint /> Print Receipt
                </button>
            ]}
            width={400}
        >
            <div ref={receiptRef} className="bg-white text-black p-4 text-base">
                <div className="header text-center">
                    <h2 className="text-2xl font-bold mb-1">Hot & Fast Restaurant</h2>
                    <p className="text-base text-gray-600 mb-1">123 Food Street, Cuisine City</p>
                    <p className="text-base text-gray-600 mb-1">Tel: (123) 456-7890</p>
                    <p className="text-base text-gray-600">
                        {dayjs().format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                    <p className="text-base text-gray-600">
                        Sale ID: {saleData?.sale_id || 'N/A'}
                    </p>
                    <p className="text-base text-gray-600">
                        Cashier: {user?.username || 'N/A'}
                    </p>
                </div>

                <div className="items border-t border-b border-gray-200 py-4 my-4">
                    <div className="flex justify-between font-bold mb-2 text-base">
                        <span className="w-1/3">Item</span>
                        <span className="w-1/6 text-center">Qty</span>
                        <span className="w-1/4 text-right">Price</span>
                        <span className="w-1/4 text-right">Total</span>
                    </div>
                    {cart && cart.map((item) => (
                        <div key={item.product_id} className="flex justify-between text-base mb-1">
                            <span className="w-1/3 truncate">{item.product_name}</span>
                            <span className="w-1/6 text-center">{item.quantity}</span>
                            <span className="w-1/4 text-right">Rs. {item.unit_price.toFixed(2)}</span>
                            <span className="w-1/4 text-right">Rs. {(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="total">
                    <div className="flex justify-between font-bold text-xl">
                        <span>Total</span>
                        <span>Rs. {total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="footer text-center mt-4">
                    <p className="text-base text-gray-600">Thank you for dining with us!</p>
                    <p className="text-sm text-gray-500">Please come again</p>
                </div>
            </div>
        </Modal>
    );
};

const POSSystem = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [productStock, setProductStock] = useState({});
    const [categories, setCategories] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    // Authentication check on component mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user) {
                    navigate('/login');
                    return;
                }
                fetchProducts();
                fetchCategories();
            } catch (error) {
                console.error('Auth check error:', error);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3000/api/products', {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setProducts(response.data);
            
            // Fetch stock information for each product
            const stockData = {};
            for (const product of response.data) {
                try {
                    const stockResponse = await axios.get(`http://localhost:3000/api/products/${product.product_id}/stock`, {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    stockData[product.product_id] = stockResponse.data.quantity_available;
                } catch (error) {
                    console.error(`Error fetching stock for product ${product.product_id}:`, error);
                    stockData[product.product_id] = 0; // Default to 0 if error
                }
            }
            setProductStock(stockData);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/products/categories', {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const addToCart = (product) => {
        // Check if there's enough stock
        const availableStock = productStock[product.product_id] || 0;
        const currentInCart = cart.find(item => item.product_id === product.product_id)?.quantity || 0;
        
        if (currentInCart >= availableStock) {
            toast.error(`Sorry, only ${availableStock} items available in stock`);
            return;
        }
        
        const existingItem = cart.find(item => item.product_id === product.product_id);
        
        if (existingItem) {
            setCart(cart.map(item =>
                item.product_id === product.product_id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.product_id,
                product_name: product.product_name,
                quantity: 1,
                unit_price: product.selling_price,
                category: product.category,
                image_url: product.image_url
            }]);
        }
        
        toast.success(`Added ${product.product_name} to cart`);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
        toast.success('Item removed from cart');
    };

    const updateQuantity = (productId, change) => {
        const newQuantity = cart.find(item => item.product_id === productId).quantity + change;
        
        if (newQuantity < 1) return;
        
        // Check if there's enough stock when increasing quantity
        if (change > 0) {
            const availableStock = productStock[productId] || 0;
            if (newQuantity > availableStock) {
                toast.error(`Sorry, only ${availableStock} items available in stock`);
                return;
            }
        }
        
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            
            const orderData = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                order_type: 'DIRECT_SALE'
            };

            const response = await axios.post('http://localhost:3000/api/sales', orderData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                }
            });

            // Calculate total from cart items for receipt
            const cartTotal = calculateTotal();
            
            // Store both the sale data and cart with total for receipt
            setReceiptData({
                saleData: response.data,
                cart: cart,
                total: cartTotal
            });
            
            // Update local stock data after successful sale
            const updatedStock = { ...productStock };
            for (const item of cart) {
                const currentStock = updatedStock[item.product_id] || 0;
                updatedStock[item.product_id] = Math.max(0, currentStock - item.quantity);
            }
            setProductStock(updatedStock);
            
            setShowReceipt(true);
            setCart([]);
            toast.success('Sale completed successfully');
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to process sale');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProductionOrder = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            
            const orderData = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                order_type: 'PRODUCTION_ORDER'
            };

            const response = await axios.post('http://localhost:3000/api/orders', orderData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                }
            });

            setCart([]);
            toast.success('Production order created successfully');
        } catch (error) {
            console.error('Production order creation error:', error);
            toast.error('Failed to create production order');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             product.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const renderProductCard = (product) => {
        const stockAvailable = productStock[product.product_id] > 0;
        
        return (
            <motion.div
                key={product.product_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-white rounded-lg overflow-hidden ${stockAvailable ? 'cursor-pointer hover:shadow-lg' : 'opacity-75 cursor-not-allowed'} transition-all border border-gray-200`}
                onClick={() => stockAvailable && addToCart(product)}
            >
                <div className="w-full h-40 relative">
                    <img
                        src={product.image_url || 'https://via.placeholder.com/200x200?text=No+Image'}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                        }}
                    />
                    {!stockAvailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="bg-red-600 text-white px-2 py-1 rounded-md font-bold text-base">Out of Stock</span>
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="text-xl font-semibold mb-1 text-gray-800">{product.product_name}</h3>
                    <div className="flex justify-between items-center">
                        <p className="text-green-600 font-bold text-base">Rs. {product.selling_price.toFixed(2)}</p>
                        <p className={`text-base ${stockAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {stockAvailable ? `Stock: ${productStock[product.product_id]}` : 'Out of Stock'}
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
            <div className="w-full px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-gray-800"
                    >
                        Point of Sale
                    </motion.h1>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-base text-gray-800"
                            />
                        </div>
                        <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 text-base"
                            onClick={() => navigate('/production-order-at-shop')}
                        >
                            <FaReceipt />
                            Create Production Order
                        </button>
                        <button
                            onClick={() => setShowCart(!showCart)}
                            className="relative bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 text-base"
                        >
                            <FaShoppingCart className="text-lg" />
                            Cart
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-base font-bold">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Product Section */}
                    <div className="lg:col-span-3">
                        {/* Categories */}
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-lg text-base ${
                                    selectedCategory === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-100'
                                } whitespace-nowrap`}
                            >
                                All Categories
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`px-4 py-2 rounded-lg text-base ${
                                        selectedCategory === category
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-100'
                                    } whitespace-nowrap`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {loading ? (
                                <div className="col-span-full flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                filteredProducts.map(product => renderProductCard(product))
                            )}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <motion.div
                        initial={{ x: showCart ? 0 : '100%' }}
                        animate={{ x: showCart ? 0 : '100%' }}
                        transition={{ type: 'tween' }}
                        className={`fixed right-120 top-0 h-full w-[550px] max-w-md bg-white text-gray-800 p-6 shadow-xl overflow-y-auto transform lg:relative lg:transform-none ${
                            showCart ? 'translate-x-0' : 'translate-x-full'
                        } lg:translate-x-0 z-50 border-l border-gray-200`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                                <FaShoppingCart /> Cart
                            </h2>
                            <button
                                onClick={() => setShowCart(false)}
                                className="lg:hidden text-gray-600 hover:text-gray-800 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 text-lg">
                                Your cart is empty
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 mb-6">
                                    {cart.map(item => (
                                        <div
                                            key={item.product_id}
                                            className="bg-gray-100 p-4 rounded-lg flex gap-4 border border-gray-200"
                                        >
                                            <img
                                                src={item.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                                                alt={item.product_name}
                                                className="w-20 h-20 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold mb-1 text-lg">{item.product_name}</h3>
                                                <div className="text-base text-gray-600 mb-2">{item.category}</div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-green-600 font-bold text-lg">
                                                        Rs. {(item.unit_price * item.quantity).toFixed(2)}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => updateQuantity(item.product_id, -1)}
                                                            className="p-1 hover:text-red-500 transition-colors text-lg"
                                                        >
                                                            <FaMinus />
                                                        </button>
                                                        <span className="w-8 text-center text-lg">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.product_id, 1)}
                                                            className="p-1 hover:text-green-500 transition-colors text-lg"
                                                        >
                                                            <FaPlus />
                                                        </button>
                                                        <button
                                                            onClick={() => removeFromCart(item.product_id)}
                                                            className="p-1 text-red-500 hover:text-red-600 transition-colors text-lg"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-gray-300 pt-4">
                                    <div className="flex justify-between text-xl font-bold mb-6">
                                        <span>Total:</span>
                                        <span className="text-green-600">Rs. {calculateTotal().toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={loading}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                <FaReceipt />
                                                Complete Sale
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>

                {/* Receipt Modal */}
                <Receipt
                    visible={showReceipt}
                    onClose={() => setShowReceipt(false)}
                    saleData={receiptData?.saleData}
                    cart={receiptData?.cart || []}
                    total={receiptData?.total || 0}
                />
            </div>
        </div>
    );
};

export default POSSystem; 