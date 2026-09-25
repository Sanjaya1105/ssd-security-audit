import React, { useState, useEffect } from 'react';
import { DatePicker, Table, Card, Statistic, Row, Col, message, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { RangePicker } = DatePicker;

const PaymentReports = () => {
    const [loading, setLoading] = useState(false);
    const [payments, setPayments] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [paymentCount, setPaymentCount] = useState(0);
    const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);

    const columns = [
        {
            title: 'Payment ID',
            dataIndex: 'payment_id',
            key: 'payment_id',
            sorter: (a, b) => a.payment_id - b.payment_id,
        },
        {
            title: 'Order ID',
            dataIndex: 'order_id',
            key: 'order_id',
            sorter: (a, b) => a.order_id - b.order_id,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `Rs.${parseFloat(amount).toFixed(2)}`,
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: 'Status',
            dataIndex: 'payment_status',
            key: 'payment_status',
            filters: [
                { text: 'Completed', value: 'COMPLETED' },
                { text: 'Pending', value: 'PENDING' },
                { text: 'Failed', value: 'FAILED' }
            ],
            onFilter: (value, record) => record.payment_status === value,
            render: (status) => (
                <span className={`px-2 py-1 rounded-md text-sm ${
                    status === 'COMPLETED' ? 'bg-green-500/20 text-green-700' :
                    status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-700' :
                    'bg-red-500/20 text-red-700'
                }`}>
                    {status}
                </span>
            ),
        },
        {
            title: 'Payment Method',
            dataIndex: 'payment_method',
            key: 'payment_method',
            filters: payments
                .map(item => item.payment_method)
                .filter((value, index, self) => self.indexOf(value) === index && value)
                .map(method => ({ text: method, value: method })),
            onFilter: (value, record) => record.payment_method === value,
        },
        {
            title: 'Transaction Date',
            dataIndex: 'transaction_date',
            key: 'transaction_date',
            render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
            sorter: (a, b) => dayjs(a.transaction_date).unix() - dayjs(b.transaction_date).unix(),
        },
    ];

    const fetchPayments = async () => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) return;
        
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:3000/api/payments/date-range', {
                params: {
                    startDate: dateRange[0].format('YYYY-MM-DD'),
                    endDate: dateRange[1].format('YYYY-MM-DD'),
                },
                withCredentials: true
            });

            if (response.data.success) {
                setPayments(response.data.data.payments);
                setTotalAmount(response.data.data.totalAmount);
                setPaymentCount(response.data.data.paymentCount);
            }
        } catch (error) {
            message.error('Failed to fetch payment data');
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
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
            doc.text('Payment Report', 15, 30);
            
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
            doc.text(`Total Payments: ${paymentCount}`, 20, 60);
            doc.text(`Total Amount: Rs.${totalAmount.toFixed(2)}`, 80, 60);
            doc.text(`Average Payment: Rs.${(paymentCount > 0 ? totalAmount / paymentCount : 0).toFixed(2)}`, 140, 60);

            // Add payment details table
            const tableData = payments.map(payment => [
                payment.payment_id,
                payment.order_id,
                `Rs.${parseFloat(payment.amount).toFixed(2)}`,
                payment.payment_status,
                payment.payment_method || 'N/A',
                dayjs(payment.transaction_date).format('YYYY-MM-DD HH:mm:ss')
            ]);

            autoTable(doc, {
                startY: 75,
                head: [['Payment ID', 'Order ID', 'Amount', 'Status', 'Method', 'Date']],
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
                    2: { halign: 'right' },
                    3: { halign: 'center', 
                         fontStyle: 'bold',
                         textColor: (cell) => {
                             if (cell.text === 'COMPLETED') return [46, 204, 113];
                             if (cell.text === 'PENDING') return [243, 156, 18];
                             return [231, 76, 60];
                         }
                    },
                    4: { halign: 'left' },
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
            doc.save(`payment_report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.pdf`);
            message.success('PDF report generated successfully!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            message.error('Failed to generate PDF report');
        }
    };

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Payment Reports</h1>
                <Button 
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={generatePDF}
                    disabled={payments.length === 0}
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
                        className="payment-datepicker w-full md:w-auto"
                        allowClear={false}
                    />
                </div>

                <Row gutter={16} className="mb-6">
                    <Col span={8}>
                        <Card className="payment-card">
                            <Statistic
                                title={<span className="text-gray-700 text-lg">Total Payments</span>}
                                value={paymentCount}
                                className="payment-statistic"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card className="payment-card">
                            <Statistic
                                title={<span className="text-gray-700 text-lg">Total Amount</span>}
                                value={totalAmount}
                                prefix="Rs."
                                precision={2}
                                className="payment-statistic"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card className="payment-card">
                            <Statistic
                                title={<span className="text-gray-700 text-lg">Average Payment</span>}
                                value={paymentCount > 0 ? totalAmount / paymentCount : 0}
                                prefix="Rs."
                                precision={2}
                                className="payment-statistic"
                            />
                        </Card>
                    </Col>
                </Row>

                <div className="bg-white rounded-lg shadow-sm">
                    <Table
                        columns={columns}
                        dataSource={payments}
                        loading={loading}
                        rowKey="payment_id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} payments`,
                        }}
                        className="payment-table"
                    />
                </div>
            </div>

            <style>{`
                .payment-table .ant-table {
                    background: white;
                }
                
                .payment-table .ant-table-thead > tr > th {
                    background: #f8fafc;
                    color: #1e293b;
                    border-bottom: 1px solid #e2e8f0;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .payment-table .ant-table-tbody > tr > td {
                    background: white;
                    border-bottom: 1px solid #f1f5f9;
                    color: #334155;
                    font-size: 18px;
                }
                
                .payment-table .ant-table-tbody > tr:hover > td {
                    background: #f8fafc !important;
                }
                
                .payment-table .ant-pagination {
                    color: #334155;
                    font-size: 16px;
                }
                
                .payment-table .ant-pagination-item a {
                    color: #334155;
                }
                
                .payment-table .ant-pagination-item-active {
                    background: #3b82f6;
                    border-color: #3b82f6;
                }
                
                .payment-table .ant-pagination-item-active a {
                    color: white;
                }
                
                .payment-datepicker .ant-picker {
                    background-color: white !important;
                    border-color: #e2e8f0 !important;
                    font-size: 16px;
                }
                
                .payment-datepicker .ant-picker-input > input {
                    color: #334155 !important;
                }
                
                .payment-card {
                    background: white !important;
                    border-color: #e2e8f0 !important;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .payment-card .ant-statistic-title {
                    color: #64748b !important;
                    font-size: 18px !important;
                    margin-bottom: 8px;
                }
                
                .payment-card .ant-statistic-content {
                    color: #1e293b !important;
                    font-size: 24px !important;
                }
                
                .payment-statistic .ant-statistic-content-value {
                    font-size: 28px;
                    font-weight: 600;
                    color: #0f172a;
                }
                
                .payment-statistic .ant-statistic-content-prefix {
                    font-size: 22px;
                }
                
                .payment-table .ant-table-filter-trigger {
                    color: #64748b;
                }
                
                .payment-table .ant-table-filter-trigger:hover {
                    background: #f1f5f9;
                    color: #3b82f6;
                }
                
                .payment-table .ant-table-filter-trigger.active {
                    color: #3b82f6;
                }
                
                .download-btn {
                    background: #3b82f6;
                    font-size: 16px;
                    height: auto;
                    padding: 8px 16px;
                }
                
                .download-btn:hover {
                    background: #2563eb;
                }
                
                .download-btn:disabled {
                    background: #e2e8f0;
                    color: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default PaymentReports; 