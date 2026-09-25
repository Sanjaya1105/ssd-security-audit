import React, { useState, useEffect } from 'react';
import { DatePicker, Table, Card, Statistic, Row, Col, message, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { RangePicker } = DatePicker;

const SalesReports = () => {
    const [loading, setLoading] = useState(false);
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({
        totalAmount: 0,
        saleCount: 0,
        totalItems: 0,
        totalQuantity: 0,
        averageOrderValue: 0
    });
    const [productSummary, setProductSummary] = useState([]);
    const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);

    const columns = [
        {
            title: 'Sale ID',
            dataIndex: 'sale_id',
            key: 'sale_id',
        },
        {
            title: 'Date',
            dataIndex: 'sale_date',
            key: 'sale_date',
            render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: 'Total Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount) => `Rs.${parseFloat(amount).toFixed(2)}`,
        },
        {
            title: 'Items Count',
            dataIndex: 'total_items',
            key: 'total_items',
        },
        {
            title: 'Quantity',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
        }
    ];

    const productColumns = [
        {
            title: 'Product Name',
            dataIndex: 'product_name',
            key: 'product_name',
            filterSearch: true,
            filters: productSummary
                .map(item => item.product_name)
                .filter((value, index, self) => self.indexOf(value) === index)
                .map(name => ({ text: name, value: name })),
            onFilter: (value, record) => record.product_name === value,
            sorter: (a, b) => a.product_name.localeCompare(b.product_name),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            filters: productSummary
                .map(item => item.category)
                .filter((value, index, self) => self.indexOf(value) === index)
                .map(cat => ({ text: cat, value: cat })),
            onFilter: (value, record) => record.category === value,
            sorter: (a, b) => a.category.localeCompare(b.category),
        },
        {
            title: 'Total Quantity',
            dataIndex: 'total_quantity',
            key: 'total_quantity',
            sorter: (a, b) => a.total_quantity - b.total_quantity,
        },
        {
            title: 'Total Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount) => `Rs.${parseFloat(amount).toFixed(2)}`,
            sorter: (a, b) => a.total_amount - b.total_amount,
        },
        {
            title: 'Sales Count',
            dataIndex: 'appearance_in_sales',
            key: 'appearance_in_sales',
            sorter: (a, b) => a.appearance_in_sales - b.appearance_in_sales,
        }
    ];

    const fetchSales = async () => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return;
        
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3000/api/sales/date-range', {
                params: {
                    startDate: dateRange[0].format('YYYY-MM-DD'),
                    endDate: dateRange[1].format('YYYY-MM-DD'),
                },
                withCredentials: true
            });

            if (response.data.success) {
                setSales(response.data.data.sales);
                setSummary(response.data.data.summary);
                setProductSummary(response.data.data.productSummary);
            }
        } catch (error) {
            message.error('Failed to fetch sales data');
            console.error('Error fetching sales:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [dateRange]);

    const handleDateChange = (dates) => {
        if (dates) {
            setDateRange(dates);
        } else {
            setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
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
            doc.text('Sales Report', 15, 30);
            
            // Add date range
            doc.setFontSize(12);
            doc.text(`Report Period: ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`, 15, 40);
            
            // Add summary box
            doc.setDrawColor(41, 128, 185);
            doc.setFillColor(240, 248, 255);
            doc.rect(15, 45, 180, 25, 'F');
            doc.setFontSize(11);
            doc.text('Summary', 20, 53);
            doc.setFontSize(10);
            doc.text(`Total Sales: Rs.${summary.saleCount}`, 20, 60);
            doc.text(`Total Amount: Rs.${summary.totalAmount.toFixed(2)}`, 80, 60);
            doc.text(`Average Order: Rs.${summary.averageOrderValue.toFixed(2)}`, 140, 60);

            // Add sales table
            const salesData = sales.map(sale => [
                sale.sale_id,
                dayjs(sale.sale_date).format('YYYY-MM-DD HH:mm:ss'),
                `Rs.${parseFloat(sale.total_amount).toFixed(2)}`,
                sale.total_items,
                sale.total_quantity
            ]);

            autoTable(doc, {
                startY: 75,
                head: [['Sale ID', 'Date', 'Amount', 'Items', 'Quantity']],
                body: salesData,
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
                    0: { halign: 'center' },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'center' },
                    4: { halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });

            // Add product summary table
            const productData = productSummary.map(product => [
                product.product_name,
                product.category,
                product.total_quantity,
                `Rs.${parseFloat(product.total_amount).toFixed(2)}`,
                product.appearance_in_sales
            ]);

            doc.addPage();
            doc.setFontSize(16);
            doc.text('Product Summary', 15, 20);

            autoTable(doc, {
                startY: 30,
                head: [['Product', 'Category', 'Total Qty', 'Total Amount', 'Sales Count']],
                body: productData,
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
                    3: { halign: 'right' },
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
            doc.save(`sales_report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.pdf`);
            message.success('PDF report generated successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            message.error('Failed to generate PDF report');
        }
    };

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Sales Reports</h1>
                <Button 
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={generatePDF}
                    disabled={sales.length === 0}
                    className="download-btn"
                >
                    Download PDF
                </Button>
            </div>
            
            <div id="report-content" className="bg-white rounded-lg p-6 shadow-md">
                <div className="mb-6">
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateChange}
                        className="sales-datepicker w-full md:w-auto"
                        allowClear={false}
                    />
                </div>

                <Row gutter={16} className="mb-6">
                    <Col span={6}>
                        <Card className="sales-card">
                            <Statistic
                                title={<span className="text-gray-600 text-lg">Total Sales</span>}
                                value={summary.saleCount}
                                className="sales-statistic"
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="sales-card">
                            <Statistic
                                title={<span className="text-gray-600 text-lg">Total Amount</span>}
                                value={summary.totalAmount}
                                prefix="Rs."
                                precision={2}
                                className="sales-statistic"
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="sales-card">
                            <Statistic
                                title={<span className="text-gray-600 text-lg">Total Items</span>}
                                value={summary.totalItems}
                                className="sales-statistic"
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card className="sales-card">
                            <Statistic
                                title={<span className="text-gray-600 text-lg">Average Order Value</span>}
                                value={summary.averageOrderValue}
                                prefix="Rs."
                                precision={2}
                                className="sales-statistic"
                            />
                        </Card>
                    </Col>
                </Row>

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Sales List</h2>
                    <Table
                        columns={columns}
                        dataSource={sales}
                        rowKey="sale_id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        className="sales-table"
                    />
                </div>

                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-800">Product Summary</h2>
                    <Table
                        columns={productColumns}
                        dataSource={productSummary}
                        rowKey="product_name"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                        className="product-table"
                    />
                </div>
            </div>

            <style>{`
                .sales-table .ant-table {
                    background: white;
                    color: #333;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .sales-table .ant-table-thead > tr > th {
                    background: #f8f9fa;
                    color: #333;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 20px;
                    font-weight: 600;
                    padding: 16px 12px;
                }
                
                .sales-table .ant-table-tbody > tr > td {
                    background: white;
                    border-bottom: 1px solid #f0f0f0;
                    color: #333;
                    font-size: 18px;
                    padding: 16px 12px;
                }
                
                .sales-table .ant-table-tbody > tr:hover > td {
                    background: #f5f8ff !important;
                }
                
                .sales-table .ant-pagination {
                    margin-top: 16px;
                    font-size: 16px;
                }
                
                .sales-table .ant-pagination-item a {
                    color: #333;
                }
                
                .sales-table .ant-pagination-item-active {
                    background: #1890ff;
                    border-color: #1890ff;
                }
                
                .sales-table .ant-pagination-item-active a {
                    color: white;
                }
                
                .product-table .ant-table {
                    background: white;
                    color: #333;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .product-table .ant-table-thead > tr > th {
                    background: #f8f9fa;
                    color: #333;
                    border-bottom: 1px solid #e0e0e0;
                    font-size: 20px;
                    font-weight: 600;
                    padding: 16px 12px;
                }
                
                .product-table .ant-table-tbody > tr > td {
                    background: white;
                    border-bottom: 1px solid #f0f0f0;
                    color: #333;
                    font-size: 18px;
                    padding: 16px 12px;
                }
                
                .product-table .ant-table-tbody > tr:hover > td {
                    background: #f5f8ff !important;
                }
                
                .sales-datepicker .ant-picker {
                    background-color: white !important;
                    border: 1px solid #d9d9d9 !important;
                    border-radius: 4px;
                    padding: 8px 12px;
                    font-size: 16px;
                }
                
                .sales-datepicker .ant-picker-input > input {
                    color: #333 !important;
                    font-size: 16px;
                }
                
                .sales-card {
                    background: white !important;
                    border: 1px solid #e0e0e0 !important;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .sales-card .ant-statistic-title {
                    color: #666 !important;
                    font-size: 18px !important;
                    margin-bottom: 8px;
                }
                
                .sales-card .ant-statistic-content {
                    color: #333 !important;
                    font-size: 24px !important;
                }
                
                .sales-card .ant-card-body {
                    padding: 24px;
                }
                
                .download-btn {
                    background: #1890ff !important;
                    border-color: #1890ff !important;
                    color: white !important;
                    font-size: 16px;
                    height: auto;
                    padding: 10px 16px;
                }
                
                .download-btn:hover {
                    background: #40a9ff !important;
                    border-color: #40a9ff !important;
                }
                
                .download-btn:disabled {
                    background: #f5f5f5 !important;
                    border-color: #d9d9d9 !important;
                    color: #bfbfbf !important;
                }
                
                .sales-table .ant-table-filter-trigger,
                .product-table .ant-table-filter-trigger {
                    color: #666;
                    font-size: 16px;
                }
                
                .sales-table .ant-table-filter-trigger:hover,
                .product-table .ant-table-filter-trigger:hover {
                    background: #f0f0f0;
                    color: #1890ff;
                }
                
                .sales-table .ant-table-filter-trigger.active,
                .product-table .ant-table-filter-trigger.active {
                    color: #1890ff;
                }
                
                .sales-statistic .ant-statistic-content-value {
                    font-size: 28px;
                    font-weight: 600;
                    color: #333;
                }
            `}</style>
        </div>
    );
};

export default SalesReports; 