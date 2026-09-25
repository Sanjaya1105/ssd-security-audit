import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

const SalesDashboard = () => {
    const [detailedSales, setDetailedSales] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [filters, setFilters] = useState({
        category: '',
        minAmount: '',
        maxAmount: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [salesResponse, paymentsResponse] = await Promise.all([
                axios.get('http://localhost:3000/api/sales/detailed', {
                    params: { 
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate,
                        ...filters 
                    },
                    withCredentials: true
                }),
                axios.get('http://localhost:3000/api/payments/all', {
                    params: { 
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate
                    },
                    withCredentials: true
                })
            ]);

            // Parse sales data
            if (salesResponse.data && salesResponse.data.success) {
                const formattedSales = (salesResponse.data.sales || []).map(sale => ({
                    ...sale,
                    total_amount: parseFloat(sale.total_amount) || 0,
                    total_items: parseInt(sale.total_items) || 0
                }));
                setDetailedSales(formattedSales);
            }

            // Parse payments data
            if (paymentsResponse.data && paymentsResponse.data.success) {
                const formattedPayments = paymentsResponse.data.payments.map(payment => ({
                    ...payment,
                    amount: parseFloat(payment.amount) || 0
                }));
                setPayments(formattedPayments);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
            setDetailedSales([]);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const applyFilters = () => {
        fetchData();
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'text-green-600';
            case 'pending':
                return 'text-yellow-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-500';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black p-8">
            <div className="max-w-8xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold"
                    >
                        Sales & Payments Dashboard
                    </motion.h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/sales-reports')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors text-xl"
                        >
                            View Sales Reports
                        </button>
                        <button
                            onClick={() => navigate('/payment-reports')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors text-xl"
                        >
                            View Payment Reports
                        </button>
                    </div>
                </div>

                {/* Date Range Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-100 p-6 rounded-lg mb-8 shadow-md"
                >
                    <h2 className="text-2xl font-semibold mb-4">Date Range</h2>
                    <div className="flex gap-4">
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="bg-white text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-lg"
                        />
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="bg-white text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-lg"
                        />
                    </div>
                </motion.div>

                {/* Sales Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-100 p-6 rounded-lg mb-8 shadow-md"
                >
                    <h3 className="text-2xl font-semibold mb-4">Sales List</h3>
                    
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        <input
                            type="text"
                            name="category"
                            placeholder="Category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            className="bg-white text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-lg"
                        />
                        <input
                            type="number"
                            name="minAmount"
                            placeholder="Min Amount"
                            value={filters.minAmount}
                            onChange={handleFilterChange}
                            className="bg-white text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-lg"
                        />
                        <input
                            type="number"
                            name="maxAmount"
                            placeholder="Max Amount"
                            value={filters.maxAmount}
                            onChange={handleFilterChange}
                            className="bg-white text-black border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-lg"
                        />
                        <button
                            onClick={applyFilters}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-lg"
                        >
                            Apply Filters
                        </button>
                    </div>

                    {/* Sales Table */}
                    <div className="overflow-x-auto">
                        <table className="sales-table w-full">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="text-left py-4 px-6 font-semibold">Sale ID</th>
                                    <th className="text-left py-4 px-6 font-semibold">Date</th>
                                    <th className="text-left py-4 px-6 font-semibold">Total Amount</th>
                                    <th className="text-left py-4 px-6 font-semibold">Items</th>
                                    <th className="text-left py-4 px-6 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailedSales.length > 0 ? (
                                    detailedSales.map((sale) => (
                                        <tr key={sale.sale_id} className="border-b border-gray-300 hover:bg-gray-200">
                                            <td className="py-4 px-6">{sale.sale_id}</td>
                                            <td className="py-4 px-6">
                                                {dayjs(sale.sale_date).format("YYYY-MM-DD HH:mm:ss")}
                                            </td>
                                            <td className="py-4 px-6 text-green-600">
                                                Rs.{sale.total_amount.toFixed(2)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
                                                    {sale.total_items} items
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => navigate(`/admin/sale/${sale.sale_id}`)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-600">
                                            No sales data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Payments Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-100 p-6 rounded-lg shadow-md"
                >
                    <h3 className="text-2xl font-semibold mb-4">Payments List</h3>
                    
                    <div className="overflow-x-auto">
                        <table className="payments-table w-full">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    <th className="text-left py-4 px-6 font-semibold">Order ID</th>
                                    <th className="text-left py-4 px-6 font-semibold">Date</th>
                                    <th className="text-left py-4 px-6 font-semibold">Customer</th>
                                    <th className="text-left py-4 px-6 font-semibold">Amount</th>
                                    <th className="text-left py-4 px-6 font-semibold">Status</th>
                                    <th className="text-left py-4 px-6 font-semibold">Order Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? (
                                    payments.map((payment) => (
                                        <tr 
                                            key={payment.payment_id} 
                                            className="border-b border-gray-300 hover:bg-gray-200 cursor-pointer"
                                            onClick={() => navigate(`/admin/payment/${payment.payment_id}`)}
                                        >
                                            <td className="py-4 px-6">{payment.order_id}</td>
                                            <td className="py-4 px-6">
                                                {dayjs(payment.transaction_date).format("YYYY-MM-DD HH:mm:ss")}
                                            </td>
                                            <td className="py-4 px-6">{payment.customer_name}</td>
                                            <td className="py-4 px-6 text-green-600">
                                                Rs.{payment.amount.toFixed(2)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-2 py-1 rounded-md ${
                                                    payment.status === 'COMPLETED' 
                                                        ? 'bg-green-100 text-green-600'
                                                        : payment.status === 'PENDING'
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : 'bg-red-100 text-red-600'
                                                }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md">
                                                    {payment.order_type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 text-center text-gray-600">
                                            No payments data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SalesDashboard;

const style = {
    ".sales-table th, .payments-table th": {
        fontSize: "20px",
        fontWeight: "600",
        color: "#333333",
        padding: "12px 16px"
    },
    ".sales-table td, .payments-table td": {
        fontSize: "18px",
        color: "#444444",
        padding: "10px 16px"
    },
    ".sales-table": {
        borderCollapse: "separate",
        borderSpacing: "0",
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    },
    ".payments-table": {
        borderCollapse: "separate",
        borderSpacing: "0",
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
    },
    ".sales-table tr:hover, .payments-table tr:hover": {
        backgroundColor: "#f5f5f5"
    },
    ".sales-table th:first-child, .payments-table th:first-child": {
        borderTopLeftRadius: "8px"
    },
    ".sales-table th:last-child, .payments-table th:last-child": {
        borderTopRightRadius: "8px"
    }
} 