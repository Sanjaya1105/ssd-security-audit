import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { Table, Card, Spin, Tag, Row, Col, Statistic, Space, Image } from 'antd';
import { ShopOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const Sales = () => {
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState([]);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0
    });
    const [expandedSaleId, setExpandedSaleId] = useState(null);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/sales/admin/sales', {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success) {
                setSales(response.data.data);
                calculateStats(response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sales:', error);
            toast.error('Failed to load sales');
            setLoading(false);
        }
    };

    const calculateStats = (salesData) => {
        const total = salesData.length;
        const revenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
        const average = total > 0 ? revenue / total : 0;

        setStats({
            totalSales: total,
            totalRevenue: revenue,
            averageOrderValue: average
        });
    };

    // Expandable row render function for sale items
    const expandedRowRender = (record) => {
        const itemColumns = [
            {
                title: 'Product',
                dataIndex: 'product_name',
                key: 'product_name',
                render: (text, item) => (
                    <Space>
                        {item.image_url && (
                            <Image src={item.image_url} alt={text} width={50} height={50} />
                        )}
                        {text}
                    </Space>
                )
            },
            {
                title: 'Category',
                dataIndex: 'category',
                key: 'category',
                render: (category) => (
                    <Tag color="blue">{category}</Tag>
                )
            },
            {
                title: 'Quantity',
                dataIndex: 'quantity',
                key: 'quantity'
            },
            {
                title: 'Unit Price',
                dataIndex: 'unit_price',
                key: 'unit_price',
                render: (price) => `$${parseFloat(price).toFixed(2)}`
            },
            {
                title: 'Subtotal',
                dataIndex: 'subtotal',
                key: 'subtotal',
                render: (subtotal) => `$${parseFloat(subtotal).toFixed(2)}`
            }
        ];

        return (
            <Card title="Sale Items" size="small">
                <Table
                    columns={itemColumns}
                    dataSource={record.items}
                    pagination={false}
                    rowKey="sale_item_id"
                />
            </Card>
        );
    };

    const columns = [
        {
            title: 'Sale ID',
            dataIndex: 'sale_id',
            key: 'sale_id',
            sorter: (a, b) => a.sale_id - b.sale_id
        },
        {
            title: 'Date',
            dataIndex: 'sale_date',
            key: 'sale_date',
            render: (date) => new Date(date).toLocaleString()
        },
        {
            title: 'Products',
            dataIndex: 'products',
            key: 'products',
            render: (products) => (
                <span>{products}</span>
            )
        },
        {
            title: 'Items',
            key: 'items_count',
            render: (_, record) => (
                <Space>
                    <span>{record.total_items} items</span>
                    <span>({record.total_quantity} units)</span>
                </Space>
            )
        },
        {
            title: 'Total Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount) => {
                const numAmount = parseFloat(amount);
                return isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
            }
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0b1e] text-white p-8">
            <div className="max-w-8xl mx-auto">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold mb-8"
                >
                    Sales Management
                </motion.h1>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1B2028]/90 rounded-lg p-6"
                    >
                        <p className="text-gray-400 text-sm">Total Sales</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.totalSales}</p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#1B2028]/90 rounded-lg p-6"
                    >
                        <p className="text-gray-400 text-sm">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-400 mt-1">
                            ${stats.totalRevenue.toFixed(2)}
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#1B2028]/90 rounded-lg p-6"
                    >
                        <p className="text-gray-400 text-sm">Average Order Value</p>
                        <p className="text-2xl font-bold text-blue-400 mt-1">
                            ${stats.averageOrderValue.toFixed(2)}
                        </p>
                    </motion.div>
                </div>

                {/* Sales Table */}
                <div className="bg-[#1B2028]/90 rounded-lg p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Sale ID</th>
                                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Date</th>
                                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Items</th>
                                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Total Amount</th>
                                    <th className="text-left py-4 px-6 text-gray-300 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale) => (
                                    <React.Fragment key={sale.sale_id}>
                                        <tr className="border-b border-gray-700/50 hover:bg-white/5">
                                            <td className="py-4 px-6">{sale.sale_id}</td>
                                            <td className="py-4 px-6">
                                                {dayjs(sale.sale_date).format("YYYY-MM-DD HH:mm:ss")}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-sm">
                                                    {sale.total_items} items ({sale.total_quantity} units)
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-green-400">
                                                ${parseFloat(sale.total_amount).toFixed(2)}
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => setExpandedSaleId(expandedSaleId === sale.sale_id ? null : sale.sale_id)}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                                                >
                                                    {expandedSaleId === sale.sale_id ? 'Hide Details' : 'View Details'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedSaleId === sale.sale_id && (
                                            <tr className="bg-[#2a3441]">
                                                <td colSpan="5" className="py-4 px-6">
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-semibold mb-2">Sale Items</h3>
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-gray-700">
                                                                    <th className="text-left py-2 px-4 text-gray-300">Product</th>
                                                                    <th className="text-left py-2 px-4 text-gray-300">Category</th>
                                                                    <th className="text-left py-2 px-4 text-gray-300">Quantity</th>
                                                                    <th className="text-left py-2 px-4 text-gray-300">Unit Price</th>
                                                                    <th className="text-left py-2 px-4 text-gray-300">Subtotal</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {sale.items.map((item, index) => (
                                                                    <tr key={index} className="border-b border-gray-700/50">
                                                                        <td className="py-2 px-4">{item.product_name}</td>
                                                                        <td className="py-2 px-4">
                                                                            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs">
                                                                                {item.category}
                                                                            </span>
                                                                        </td>
                                                                        <td className="py-2 px-4">{item.quantity}</td>
                                                                        <td className="py-2 px-4">${parseFloat(item.unit_price).toFixed(2)}</td>
                                                                        <td className="py-2 px-4">${parseFloat(item.subtotal).toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sales; 