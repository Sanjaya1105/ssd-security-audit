import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Table, Card, Spin, Tag, Row, Col, Statistic, Button } from 'antd';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { WarningOutlined, ArrowDownOutlined, ArrowUpOutlined, DownloadOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const InventoryStock = () => {
    const [loading, setLoading] = useState(true);
    const [inventoryItems, setInventoryItems] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchInventoryItems();
        fetchAnalytics();
    }, []);

    const fetchInventoryItems = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/inventory-items', {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            setInventoryItems(response.data);
            fetchStockData(response.data);
        } catch (error) {
            console.error('Error fetching inventory items:', error);
            toast.error('Failed to load inventory items');
            setLoading(false);
        }
    };

    const fetchStockData = async (items) => {
        try {
            const stockPromises = items.map(item => 
                axios.get(`http://localhost:3000/api/inventory-stocks/total/${item.item_id}`, {
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                })
            );

            const stockResponses = await Promise.all(stockPromises);
            const stockData = stockResponses.map(response => response.data);
            setStockData(stockData);
        } catch (error) {
            console.error('Error fetching stock data:', error);
            toast.error('Failed to load stock data');
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/inventory-stocks/analytics', {
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            setAnalytics(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics');
            setLoading(false);
        }
    };

    const generatePDF = () => {
        try {
            // Create new document
            const doc = new jsPDF();
            
            // Add company header
            doc.setFontSize(22);
            doc.setTextColor(41, 128, 185);
            doc.text('Hot & Fast', 15, 20);
            
            // Add report title
            doc.setFontSize(18);
            doc.setTextColor(0, 0, 0);
            doc.text('Inventory Stock Report', 15, 30);
            
            // Add date
            doc.setFontSize(12);
            doc.text(`Report Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 15, 40);
            
            // Add summary box
            doc.setDrawColor(41, 128, 185);
            doc.setFillColor(240, 248, 255);
            doc.rect(15, 45, 180, 25, 'F');
            doc.setFontSize(11);
            doc.text('Inventory Summary', 20, 53);
            doc.setFontSize(10);
            doc.text(`Total Items: ${inventoryItems.length}`, 20, 60);

            // Prepare inventory data for table
            const inventoryData = inventoryItems.map(item => {
                const stockInfo = stockData.find(s => s.item_id === item.item_id);
                const currentStock = stockInfo?.total_quantity || 0;
                return [
                    item.item_name,
                    item.category,
                    item.brand,
                    `${currentStock} ${item.unit}`,
                    `${item.restock_level} ${item.unit}`
                ];
            });

            // Add inventory table
            autoTable(doc, {
                startY: 75,
                head: [['Item Name', 'Category', 'Brand', 'Current Stock', 'Restock Level']],
                body: inventoryData,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 4,
                    lineColor: [220, 220, 220],
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'center',
                    cellPadding: 6
                },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'center' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 30, left: 15, right: 15 },
                didDrawPage: function(data) {
                    // Add footer on each page
                    doc.setFontSize(8);
                    doc.setTextColor(128, 128, 128);
                    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
                    const totalPages = doc.internal.getNumberOfPages();
                    doc.text(
                        `Generated on: ${dayjs().format('YYYY-MM-DD HH:mm:ss')} | Page ${pageNumber} of ${totalPages}`,
                        doc.internal.pageSize.width / 2,
                        doc.internal.pageSize.height - 10,
                        { align: 'center' }
                    );
                }
            });

            // Save the PDF
            doc.save(`inventory_stock_report_${dayjs().format('YYYY-MM-DD')}.pdf`);
            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate report');
        }
    };

    const columns = [
        {
          title: 'Item Name',
          dataIndex: 'item_name',
          key: 'item_name',
          sorter: (a, b) => a.item_name.localeCompare(b.item_name),
        },
        {
          title: 'Category',
          dataIndex: 'category',
          key: 'category',
          filters: [...new Set(inventoryItems.map(item => item.category))].map(cat => ({
            text: cat,
            value: cat,
          })),
          onFilter: (value, record) => record.category === value,
          render: (category) => (
            <Tag color="blue">{category}</Tag>
          ),
        },
        {
          title: 'Brand',
          dataIndex: 'brand',
          key: 'brand',
        },
        {
          title: 'Current Stock',
          key: 'current_stock',
          render: (_, record) => {
            const stockInfo = stockData.find(s => s.item_id === record.item_id);
            const currentStock = stockInfo?.total_quantity || 0;
            const isLowStock = currentStock < record.restock_level;
    
            return (
              <span style={{ color: isLowStock ? '#cf1322' : '#3f8600' }}>
                {currentStock} {record.unit}
              </span>
            );
          },
        },
        {
          title: 'Restock Level',
          dataIndex: 'restock_level',
          key: 'restock_level',
          render: (level, record) => `${level} ${record.unit}`,
        },
      ];
    
      if (loading) {
        return (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        );
      }
    
      return (
        <div className="min-h-screen bg-white text-black p-8">
          <div className="max-w-9xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold mb-8"
            >
              Inventory Stock Levels
            </motion.h1>
    
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg p-6 mb-8 shadow-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Stock Overview</h2>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={generatePDF}
                    className="bg-blue-500 hover:bg-blue-600 border-none"
                >
                    Generate Report
                </Button>
              </div>
    
              <Table
                columns={columns}
                dataSource={inventoryItems}
                rowKey="item_id"
                pagination={{ pageSize: 20 }}
                className="inventory-table"
              />
            </motion.div>
          </div>
    
          {/* Standard styles */}
          <style>{`
            .inventory-table .ant-table {
              background: white;
              color: #333;
            }
            .inventory-table .ant-table-thead > tr > th {
              background: #f0f0f0;
              color: #333;
              border-bottom: 1px solid #e8e8e8;
              font-size: 20px;
              font-weight: bold;
              padding: 12px 16px;
            }
            .inventory-table .ant-table-tbody > tr > td {
              background: white;
              border-bottom: 1px solid #f0f0f0;
              color: #333;
              font-size: 18px;
              padding: 12px 16px;
            }
            .inventory-table .ant-table-tbody > tr:hover > td {
              background: #f5f5f5 !important;
            }
            .inventory-table .ant-pagination {
              font-size: 16px;
            }
            .inventory-table .ant-tag {
              font-size: 16px;
              padding: 4px 8px;
            }
            .inventory-table .ant-table-filter-trigger {
              font-size: 18px;
            }
            .inventory-table .ant-empty-description {
              font-size: 18px;
            }
          `}</style>
        </div>
      );
    };

    export default InventoryStock;
