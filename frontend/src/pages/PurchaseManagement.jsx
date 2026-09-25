import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  DatePicker
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

const PurchaseManagement = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [summary, setSummary] = useState(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState([]);
  const [form] = Form.useForm();

  // Authentication check on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !['admin', 'manager'].includes(user.role)) {
          navigate('/login');
          return;
        }
        fetchPurchases();
        fetchInventoryItems();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/purchases', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      let filteredPurchases = response.data;
      
      // Apply date range filter if selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].startOf('day');
        const endDate = dateRange[1].endOf('day');
        
        filteredPurchases = response.data.filter(purchase => {
          const purchaseDate = dayjs(purchase.purchase_date);
          return purchaseDate.isAfter(startDate) || purchaseDate.isSame(startDate, 'day') &&
                 (purchaseDate.isBefore(endDate) || purchaseDate.isSame(endDate, 'day'));
        });
      }

      // Calculate summary data from filtered purchases
      const summaryData = {
        totalPurchases: filteredPurchases.length,
        totalCost: filteredPurchases.reduce((sum, p) => sum + (p.buying_price * p.purchased_quantity), 0),
        totalWasted: filteredPurchases.reduce((sum, p) => sum + (p.wasted_quantity || 0), 0),
        totalPurchased: filteredPurchases.reduce((sum, p) => sum + p.purchased_quantity, 0)
      };

      summaryData.wastePercentage = summaryData.totalPurchased > 0 
        ? ((summaryData.totalWasted / summaryData.totalPurchased) * 100).toFixed(2)
        : 0;

      setPurchases(filteredPurchases);
      setSummary(summaryData);

      // Calculate category analysis from filtered purchases
      const categoryGroups = filteredPurchases.reduce((groups, purchase) => {
        const item = inventoryItems.find(i => i.item_id === purchase.item_id);
        const category = item?.category || 'Uncategorized';
        
        if (!groups[category]) {
          groups[category] = {
            category,
            totalPurchases: 0,
            totalAmount: 0,
            totalQuantity: 0
          };
        }
        
        groups[category].totalPurchases++;
        groups[category].totalAmount += purchase.buying_price * purchase.purchased_quantity;
        groups[category].totalQuantity += purchase.purchased_quantity;
        return groups;
      }, {});

      const categoryAnalysisData = Object.values(categoryGroups).map(group => ({
        ...group,
        averageAmount: group.totalPurchases > 0 ? group.totalAmount / group.totalPurchases : 0
      }));

      setCategoryAnalysis(categoryAnalysisData);
    } catch (err) {
      console.error('Fetch purchases error:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Fetch inventory items error:', err);
      handleError(err);
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 401) {
      navigate('/login');
    } else if (err.response?.status === 403) {
      setError('You do not have permission to access purchases');
      toast.error('Permission denied');
    } else if (err.code === 'ERR_NETWORK') {
      setError('Unable to connect to server');
      toast.error('Network connection error');
    } else {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const showModal = (purchase = null) => {
    setEditingPurchase(purchase);
    if (purchase) {
      form.setFieldsValue({
        ...purchase,
        purchase_date: dayjs(purchase.purchase_date)
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        purchase_date: dayjs(),
        wasted_quantity: 0,
        useful_quantity: 0
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingPurchase(null);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const purchaseData = {
        ...values,
        purchase_date: values.purchase_date.format('YYYY-MM-DD HH:mm:ss')
      };

      // Create new purchase
      await axios.post('http://localhost:3000/api/purchases/with-stock', purchaseData, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Purchase created successfully and stock updated');
      
      handleCancel();
      fetchPurchases();
    } catch (err) {
      console.error('Submit error:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (purchaseId) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:3000/api/purchases/${purchaseId}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Purchase deleted successfully');
      fetchPurchases();
    } catch (err) {
      console.error('Delete error:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    if (dates) {
      // Set start time to beginning of first day and end time to end of last day
      const [start, end] = dates;
      setDateRange([
        start.startOf('day'),
        end.endOf('day')
      ]);
    } else {
      setDateRange(null);
    }
    // Fetch purchases will be triggered by the useEffect when dateRange changes
  };

  // Add useEffect to handle date range changes
  useEffect(() => {
    fetchPurchases();
  }, [dateRange]);

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
      doc.text('Purchase Report', 15, 30);
      
      // Add date range if selected
      doc.setFontSize(12);
      if (dateRange && dateRange[0] && dateRange[1]) {
        doc.text(`Period: ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`, 15, 40);
        doc.text(`Report Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 15, 47);
      } else {
        doc.text(`Report Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 15, 40);
      }
      
      // Add summary box
      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(240, 248, 255);
      doc.rect(15, 52, 180, 35, 'F');
      doc.setFontSize(11);
      doc.text('Purchase Summary', 20, 60);
      doc.setFontSize(10);
      
      if (summary) {
        doc.text(`Total Purchases: ${summary.totalPurchases}`, 20, 67);
        doc.text(`Total Cost: Rs.${summary.totalCost.toFixed(2)}`, 20, 74);
        doc.text(`Total Quantity Purchased: ${summary.totalPurchased}`, 20, 81);
        doc.text(`Waste Percentage: ${summary.wastePercentage}%`, 110, 67);
        doc.text(`Total Wasted Quantity: ${summary.totalWasted}`, 110, 74);
      }

      // Prepare purchase data for table - using the filtered data from the table
      const purchaseData = purchases.map(purchase => {
        const item = inventoryItems.find(i => i.item_id === purchase.item_id);
        return [
          item?.item_name || 'Unknown Item',
          dayjs(purchase.purchase_date).format('YYYY-MM-DD'),
          purchase.purchased_quantity.toString(),
          purchase.wasted_quantity.toString(),
          purchase.useful_quantity.toString(),
          `Rs.${purchase.buying_price.toFixed(2)}`,
          `Rs.${(purchase.buying_price * purchase.purchased_quantity).toFixed(2)}`,
          purchase.supplier || 'N/A'
        ];
      });

      // Add purchase table
      autoTable(doc, {
        startY: 95,
        head: [['Item', 'Date', 'Purchased', 'Wasted', 'Useful', 'Unit Price', 'Total', 'Supplier']],
        body: purchaseData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 4
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' },
          7: { halign: 'left' }
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

      // Add category analysis on new page
      if (categoryAnalysis.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Category Analysis', 15, 20);

        const categoryData = categoryAnalysis.map(cat => [
          cat.category,
          cat.totalPurchases.toString(),
          cat.totalQuantity.toString(),
          `Rs.${cat.totalAmount.toFixed(2)}`,
          `Rs.${cat.averageAmount.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: 30,
          head: [['Category', 'Total Purchases', 'Total Quantity', 'Total Amount', 'Avg. Amount/Purchase']],
          body: categoryData,
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
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' }
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          }
        });
      }

      // Save the PDF with appropriate filename
      const fileName = dateRange 
        ? `purchase_report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.pdf`
        : `purchase_report_${dayjs().format('YYYY-MM-DD')}.pdf`;
      
      doc.save(fileName);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    }
  };

  const columns = [
    {
      title: 'Item',
      dataIndex: 'item_id',
      key: 'item_id',
      render: (itemId) => {
        const item = inventoryItems.find(i => i.item_id === itemId);
        return item ? item.item_name : 'Unknown Item';
      }
    },
    {
      title: 'Purchase Date',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.purchase_date) - new Date(b.purchase_date)
    },
    {
      title: 'Purchased Qty',
      dataIndex: 'purchased_quantity',
      key: 'purchased_quantity',
      sorter: (a, b) => a.purchased_quantity - b.purchased_quantity
    },
    {
      title: 'Wasted Qty',
      dataIndex: 'wasted_quantity',
      key: 'wasted_quantity'
    },
    {
      title: 'Useful Qty',
      dataIndex: 'useful_quantity',
      key: 'useful_quantity'
    },
    {
      title: 'Buying Price',
      dataIndex: 'buying_price',
      key: 'buying_price',
      render: (price) => `Rs.${price.toFixed(2)}`
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this purchase?"
            onConfirm={() => handleDelete(record.purchase_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              className="hover:bg-red-600 border-none"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const renderPurchaseForm = () => (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        purchase_date: dayjs(),
        purchased_quantity: 0,
        wasted_quantity: 0,
        useful_quantity: 0
      }}
    >
      <Form.Item
        name="item_id"
        label="Item"
        rules={[{ required: true, message: 'Please select an item' }]}
      >
        <Select placeholder="Select an item">
          {inventoryItems.map(item => (
            <Option key={item.item_id} value={item.item_id}>
              {item.item_name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Purchase Date"
        name="purchase_date"
        rules={[{ required: true, message: 'Please select purchase date' }]}
      >
        <DatePicker
          showTime={{ format: 'HH:mm:ss' }}
          format="YYYY-MM-DD HH:mm:ss"
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="purchased_quantity"
        label="Purchased Quantity"
        rules={[
          { required: true, message: 'Please enter purchased quantity' },
          { type: 'number', min: 0, message: 'Quantity must be positive' }
        ]}
      >
        <InputNumber 
          style={{ width: '100%' }} 
          min={0} 
          onChange={(value) => {
            const wastedQty = form.getFieldValue('wasted_quantity') || 0;
            const usefulQty = (value || 0) - wastedQty;
            form.setFieldsValue({ useful_quantity: usefulQty >= 0 ? usefulQty : 0 });
          }}
        />
      </Form.Item>

      <Form.Item
        name="wasted_quantity"
        label="Wasted Quantity"
        rules={[
          { required: true, message: 'Please enter wasted quantity' },
          { type: 'number', min: 0, message: 'Quantity must be positive' }
        ]}
      >
        <InputNumber
          style={{ width: '100%' }} 
          min={0}
          onChange={(value) => {
            const purchasedQty = form.getFieldValue('purchased_quantity') || 0;
            if (value > purchasedQty) {
              form.setFieldsValue({ wasted_quantity: purchasedQty });
              toast.warning('Wasted quantity cannot exceed purchased quantity');
              value = purchasedQty;
            }
            const usefulQty = purchasedQty - (value || 0);
            form.setFieldsValue({ useful_quantity: usefulQty >= 0 ? usefulQty : 0 });
          }}
        />
      </Form.Item>

      <Form.Item
        name="useful_quantity"
        label="Useful Quantity"
        rules={[
          { required: true, message: 'Useful quantity is required' },
          { type: 'number', min: 0, message: 'Quantity must be positive' }
        ]}
      >
        <InputNumber style={{ width: '100%' }} min={0} disabled />
      </Form.Item>

      <Form.Item
        name="buying_price"
        label="Buying Price"
        rules={[
          { required: true, message: 'Please enter buying price' },
          { type: 'number', min: 0, message: 'Price must be positive' }
        ]}
      >
        <InputNumber style={{ width: '100%' }} min={0} prefix="Rs." />
      </Form.Item>

      <Form.Item
        name="supplier"
        label="Supplier"
        rules={[{ required: true, message: 'Please enter supplier name' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {editingPurchase ? 'Update' : 'Create'} Purchase
          </Button>
          <Button onClick={handleCancel}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  return (
    <div className="min-h-screen bg-white text-gray-800 p-8">
      <div className="max-w-9xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8 text-gray-900"
        >
          Purchase Management
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg p-6 mb-8 shadow-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Purchase Records</h2>
            <div className="flex items-center gap-4">
              <RangePicker
                value={dateRange}
                onChange={handleDateChange}
                className="purchase-date-picker"
                allowClear={false}
              />
              <Button 
                type="primary"
                icon={<DownloadOutlined />}
                onClick={generatePDF}
                disabled={purchases.length === 0}
                className="purchase-button"
              >
                Download PDF
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
                className="purchase-button bg-blue-500 hover:bg-blue-600 border-none"
              >
                New Purchase
              </Button>
            </div>
          </div>

          {summary && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600">Total Purchases</p>
                  <p className="text-xl font-semibold text-gray-900">{summary.totalPurchases}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Cost</p>
                  <p className="text-xl font-semibold text-gray-900">Rs.{summary.totalCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Waste Percentage</p>
                  <p className="text-xl font-semibold text-gray-900">{summary.wastePercentage}%</p>
                </div>
              </div>
            </div>
          )}

          <Table
            columns={columns}
            dataSource={purchases}
            loading={loading}
            rowKey="purchase_id"
            className="purchase-table"
          />
        </motion.div>

        <Modal
          title={editingPurchase ? "Edit Purchase" : "Add Purchase"}
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          width={600}
          className="purchase-modal"
        >
          {renderPurchaseForm()}
        </Modal>
      </div>

      <style>{`
        /* Table Styles */
        .purchase-table .ant-table {
          background: white;
          color: #333;
        }
        
        .purchase-table .ant-table-thead > tr > th {
          background: #f8f9fa;
          color: #333;
          border-bottom: 1px solid #dee2e6;
          font-size: 20px;
          font-weight: 600;
          padding: 16px;
        }
        
        .purchase-table .ant-table-tbody > tr > td {
          background: white;
          border-bottom: 1px solid #dee2e6;
          color: #333;
          font-size: 18px;
          padding: 16px;
        }
        
        .purchase-table .ant-table-tbody > tr:hover > td {
          background: #f1f5f9 !important;
        }
        
        /* Modal Styles */
        .purchase-modal .ant-modal-content {
          background: white;
          color: #333;
          border-radius: 8px;
        }
        
        .purchase-modal .ant-modal-header {
          background: white;
          border-bottom: 1px solid #dee2e6;
          border-radius: 8px 8px 0 0;
        }
        
        .purchase-modal .ant-modal-title {
          color: #333;
          font-size: 22px;
        }
        
        .purchase-modal .ant-form-item-label > label {
          color: #333;
          font-size: 16px;
        }
        
        .purchase-modal .ant-input,
        .purchase-modal .ant-select-selector,
        .purchase-modal .ant-picker {
          background: white;
          border: 1px solid #d1d5db;
          color: #333;
          font-size: 16px;
        }
        
        /* Button Styles */
        .purchase-button {
          height: auto;
          padding: 8px 16px;
          font-size: 16px;
        }
        
        /* Date Picker Styles */
        .purchase-date-picker {
          background: white;
          border: 1px solid #d1d5db;
        }
        
        .purchase-date-picker .ant-picker-input > input {
          color: #333 !important;
          font-size: 16px;
        }
        
        .purchase-date-picker .ant-picker-input > input::placeholder {
          color: #9ca3af !important;
        }
        
        /* Form Styles */
        .ant-form-item {
          margin-bottom: 20px;
        }
        
        .ant-select-dropdown {
          background: white;
          color: #333;
        }
        
        .ant-select-item {
          color: #333;
          font-size: 16px;
        }
        
        .ant-select-item-option-selected {
          background: #e6f7ff;
        }
        
        /* Summary Section */
        .summary-section {
          background: white;
          color: #333;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .summary-section h3 {
          font-size: 20px;
        }
        
        .summary-section p {
          color: #333;
        }
        
        /* Pagination Styles */
        .ant-pagination-item {
          background: white;
          border: 1px solid #d1d5db;
        }
        
        .ant-pagination-item a {
          color: #333;
        }
        
        .ant-pagination-item-active {
          background: #1890ff;
          border-color: #1890ff;
        }
        
        .ant-pagination-item-active a {
          color: white;
        }
        
        /* Delete Button */
        .ant-btn-dangerous {
          background: #ff4d4f;
          border-color: #ff4d4f;
          color: white;
        }
        
        .ant-btn-dangerous:hover {
          background: #ff7875;
          border-color: #ff7875;
        }
      `}</style>
    </div>
  );
};

export default PurchaseManagement;