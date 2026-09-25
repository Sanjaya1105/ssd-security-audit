import React, { useState, useEffect } from 'react';
import { DatePicker, Table, Card, Statistic, Row, Col, message, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { RangePicker } = DatePicker;

const OrderReports = () => {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState({
        totalOrders: 0,
        totalAmount: 0,
        completedOrders: 0,
        pendingOrders: 0
    });
    const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'order_id',
            key: 'order_id',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: 'Order Type',
            dataIndex: 'order_type',
            key: 'order_type',
        },
        {
            title: 'Status',
            dataIndex: 'order_status',
            key: 'order_status',
            render: (status) => (
                <span style={{
                    color: status === 'COMPLETED' ? 'green' : 
                           status === 'PROCESSING' ? 'orange' : 'blue'
                }}>
                    {status}
                </span>
            ),
        },
        {
            title: 'Total Amount',
            dataIndex: 'total_amount',
            key: 'total_amount',
            render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
        },
        {
            title: 'Payment Status',
            dataIndex: 'payment_status',
            key: 'payment_status',
            render: (status) => (
                <span style={{
                    color: status === 'COMPLETED' ? 'green' : 
                           status === 'PENDING' ? 'orange' : 'red'
                }}>
                    {status}
                </span>
            ),
        }
    ];

    const fetchOrders = async () => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return;
        
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3000/api/orders/by-date', {
                params: {
                    startDate: dateRange[0].format('YYYY-MM-DD'),
                    endDate: dateRange[1].format('YYYY-MM-DD'),
                },
                withCredentials: true
            });

            if (response.data.success) {
                setOrders(response.data.data.orders);
                setSummary(response.data.data.summary);
            }
        } catch (error) {
            message.error('Failed to fetch orders data');
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
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
            doc.text('Order Report', 15, 30);
            
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
            doc.text(`Total Orders: ${summary.totalOrders}`, 20, 60);
            doc.text(`Total Amount: $${summary.totalAmount.toFixed(2)}`, 80, 60);
            doc.text(`Completed Orders: ${summary.completedOrders}`, 140, 60);

            // Add orders table
            const tableData = orders.map(order => [
                order.order_id,
                dayjs(order.date).format('YYYY-MM-DD HH:mm:ss'),
                order.order_type,
                order.order_status,
                `$${parseFloat(order.total_amount).toFixed(2)}`,
                order.payment_status || 'N/A'
            ]);

            autoTable(doc, {
                startY: 75,
                head: [['Order ID', 'Date', 'Type', 'Status', 'Amount', 'Payment']],
                body: tableData,
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
                    2: { halign: 'center' },
                    3: { halign: 'center', 
                         fontStyle: 'bold',
                         textColor: (cell) => {
                             if (cell.text === 'COMPLETED') return [46, 204, 113];
                             if (cell.text === 'PROCESSING') return [243, 156, 18];
                             return [52, 152, 219];
                         }
                    },
                    4: { halign: 'right' },
                    5: { halign: 'center' }
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { top: 75, left: 15, right: 15 },
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
            doc.save(`order_report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.pdf`);
            message.success('PDF report generated successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            message.error('Failed to generate PDF report');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Order Reports</h1>
                <Button 
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={generatePDF}
                    disabled={orders.length === 0}
                >
                    Download PDF
                </Button>
            </div>
            
            <div id="report-content">
                <div className="mb-6">
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateChange}
                        className="w-full md:w-auto"
                        allowClear={false}
                    />
                </div>

                <Row gutter={16} className="mb-6">
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Total Orders"
                                value={summary.totalOrders}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Total Amount"
                                value={summary.totalAmount}
                                prefix="$"
                                precision={2}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Completed Orders"
                                value={summary.completedOrders}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Pending Orders"
                                value={summary.pendingOrders}
                            />
                        </Card>
                    </Col>
                </Row>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Orders List</h2>
                    <Table
                        columns={columns}
                        dataSource={orders}
                        rowKey="order_id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </div>
            </div>
        </div>
    );
};

export default OrderReports; 