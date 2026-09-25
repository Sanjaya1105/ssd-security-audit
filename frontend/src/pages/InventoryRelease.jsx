import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit, FaCheckCircle, FaTimesCircle, FaDownload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { RangePicker } = DatePicker;

const InventoryRelease = () => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [editingRelease, setEditingRelease] = useState(null);
  const [formData, setFormData] = useState({
    order_id: '',
    item_id: '',
    quantity: '',
    date_time: new Date().toISOString().slice(0, 16),
    status: 'pending'
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          navigate('/login');
          return;
        }
        fetchData();
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    };
  };

  const handleError = (error) => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
    } else {
      toast.error(error.response?.data?.message || 'An error occurred');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:3000/api/inventory-releases';
      
      // Add date range parameters if selected
      if (dateRange && dateRange[0] && dateRange[1]) {
        url += `?startDate=${dateRange[0].format('YYYY-MM-DD')}&endDate=${dateRange[1].format('YYYY-MM-DD')}`;
      }

      // Fetch inventory releases
      const releasesResponse = await axios.get(url, getAuthHeaders());
      setReleases(releasesResponse.data);

      // Fetch only production orders
      const ordersResponse = await axios.get(
        'http://localhost:3000/api/orders',
        getAuthHeaders()
      );
      const productionOrders = ordersResponse.data.filter(order => order.order_type === 'PRODUCTION_ORDER');
      setOrders(productionOrders);

      // Fetch inventory items
      const itemsResponse = await axios.get(
        'http://localhost:3000/api/inventory-items',
        getAuthHeaders()
      );
      setInventoryItems(itemsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format date_time to MySQL compatible format (YYYY-MM-DD HH:MM:SS)
      let formattedDateTime;
      if (formData.date_time) {
        const date = new Date(formData.date_time);
        formattedDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
      } else {
        formattedDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      const submitData = {
        order_id: formData.order_id || null,
        item_id: parseInt(formData.item_id),
        quantity: parseFloat(formData.quantity),
        date_time: formattedDateTime,
        status: formData.status || 'pending'
      };

      if (editingRelease) {
        await axios.put(
          `http://localhost:3000/api/inventory-releases/${editingRelease.release_id}`,
          submitData,
          getAuthHeaders()
        );
        toast.success('Inventory release updated successfully');
      } else {
        await axios.post(
          'http://localhost:3000/api/inventory-releases',
          submitData,
          getAuthHeaders()
        );
        toast.success('Inventory release created successfully');
      }
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving inventory release:', error);
      handleError(error);
    }
  };

  const handleEdit = (release) => {
    setEditingRelease(release);
    setFormData({
      order_id: release.order_id || '',
      item_id: release.item_id,
      quantity: release.quantity,
      date_time: new Date(release.date_time).toISOString().slice(0, 16),
      status: release.status || 'pending'
    });
    setShowForm(true);
  };

  const handleDelete = async (releaseId) => {
    if (window.confirm('Are you sure you want to delete this release?')) {
      try {
        await axios.delete(
          `http://localhost:3000/api/inventory-releases/${releaseId}`,
          getAuthHeaders()
        );
        toast.success('Inventory release deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting inventory release:', error);
        handleError(error);
      }
    }
  };

  const handleStatusChange = async (releaseId, newStatus) => {
    try {
      const releaseToUpdate = releases.find(r => r.release_id === releaseId);
      if (!releaseToUpdate) return;

      // Format date_time to MySQL compatible format (YYYY-MM-DD HH:MM:SS)
      let formattedDateTime;
      if (releaseToUpdate.date_time) {
        const date = new Date(releaseToUpdate.date_time);
        formattedDateTime = date.toISOString().slice(0, 19).replace('T', ' ');
      } else {
        formattedDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      // Update status
      await axios.put(
        `http://localhost:3000/api/inventory-releases/${releaseId}`,
        {
          order_id: releaseToUpdate.order_id,
          item_id: releaseToUpdate.item_id,
          quantity: releaseToUpdate.quantity,
          date_time: formattedDateTime,
          status: newStatus
        },
        getAuthHeaders()
      );
      
      // If status is "released", also update inventory stock
      if (newStatus === 'released') {
        // Check inventory availability
        try {
          const inventoryResponse = await axios.get(
            `http://localhost:3000/api/inventory-stocks/item/${releaseToUpdate.item_id}`,
            getAuthHeaders()
          );
          
          const totalAvailable = inventoryResponse.data.reduce(
            (sum, stock) => sum + stock.quantity_available, 0
          );
          
          if (totalAvailable < releaseToUpdate.quantity) {
            toast.warning(`Warning: Not enough inventory available (${totalAvailable} available, ${releaseToUpdate.quantity} needed)`);
          }
        } catch (error) {
          console.error('Error checking inventory:', error);
        }
      }
      
      toast.success(`Status updated to ${newStatus}`);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      handleError(error);
    }
  };

  const resetForm = () => {
    setEditingRelease(null);
    setFormData({
      order_id: '',
      item_id: '',
      quantity: '',
      date_time: new Date().toISOString().slice(0, 16),
      status: 'pending'
    });
    setShowForm(false);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'released':
        return 'bg-green-100 text-green-800 border border-green-500';
      case 'not released':
        return 'bg-red-100 text-red-800 border border-red-500';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border border-yellow-500';
    }
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
    if (!dates) {
      fetchData();
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
      doc.text('Inventory Release Report', 15, 30);
      
      // Add date range if selected
      doc.setFontSize(12);
      if (dateRange && dateRange[0] && dateRange[1]) {
        doc.text(`Report Period: ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`, 15, 40);
      }
      doc.text(`Report Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, 15, 47);
      
      // Add summary box
      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(240, 248, 255);
      doc.rect(15, 52, 180, 25, 'F');
      doc.setFontSize(11);
      doc.text('Release Summary', 20, 60);
      doc.setFontSize(10);

      // Calculate summary data
      const totalReleases = releases.length;
      const totalQuantity = releases.reduce((sum, release) => sum + release.quantity, 0);
      const releasedCount = releases.filter(r => r.status === 'released').length;
      const pendingCount = releases.filter(r => r.status === 'pending').length;

      doc.text(`Total Releases: ${totalReleases}`, 20, 67);
      doc.text(`Total Quantity: ${totalQuantity}`, 80, 67);
      doc.text(`Released: ${releasedCount}`, 140, 67);
      doc.text(`Pending: ${pendingCount}`, 180, 67);

      // Prepare table data
      const tableData = releases.map(release => {
        const item = inventoryItems.find(i => i.item_id === release.item_id);
        return [
          release.release_id,
          release.order_id || 'N/A',
          item ? item.item_name : 'Unknown Item',
          release.quantity.toString(),
          dayjs(release.date_time).format('YYYY-MM-DD HH:mm:ss'),
          release.status.toUpperCase()
        ];
      });

      // Add release details table
      autoTable(doc, {
        startY: 80,
        head: [['Release ID', 'Order ID', 'Item', 'Quantity', 'Date', 'Status']],
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
          2: { halign: 'left' },
          3: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'center',
               fontStyle: 'bold',
               textColor: (cell) => {
                 if (cell.text === 'RELEASED') return [46, 204, 113];
                 if (cell.text === 'PENDING') return [243, 156, 18];
                 return [231, 76, 60];
               }
          }
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

      // Add item-wise summary on new page
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Item-wise Release Summary', 15, 20);

      // Calculate item-wise summary
      const itemSummary = releases.reduce((acc, release) => {
        const item = inventoryItems.find(i => i.item_id === release.item_id);
        const itemName = item ? item.item_name : 'Unknown Item';
        
        if (!acc[itemName]) {
          acc[itemName] = {
            totalQuantity: 0,
            releasedQuantity: 0,
            pendingQuantity: 0
          };
        }
        
        acc[itemName].totalQuantity += release.quantity;
        if (release.status === 'released') {
          acc[itemName].releasedQuantity += release.quantity;
        } else if (release.status === 'pending') {
          acc[itemName].pendingQuantity += release.quantity;
        }
        
        return acc;
      }, {});

      const itemSummaryData = Object.entries(itemSummary).map(([itemName, data]) => [
        itemName,
        data.totalQuantity.toString(),
        data.releasedQuantity.toString(),
        data.pendingQuantity.toString()
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Item Name', 'Total Quantity', 'Released', 'Pending']],
        body: itemSummaryData,
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
          3: { halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Save the PDF
      const fileName = dateRange 
        ? `inventory_release_report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.pdf`
        : `inventory_release_report_${dayjs().format('YYYY-MM-DD')}.pdf`;
      
      doc.save(fileName);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <style>{customStyles}</style>
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
            Inventory Release Management
          </motion.h1>
          <div className="flex items-center gap-4">
            <RangePicker
              value={dateRange}
              onChange={handleDateChange}
              className="inventory-rangepicker"
              allowClear={true}
            />
            <button
              onClick={generatePDF}
              disabled={releases.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              <FaDownload className="text-lg" />
              Generate Report
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 font-medium text-lg"
            >
              <FaPlus className="text-lg" />
              {showForm ? 'Cancel' : 'New Release'}
            </button>
          </div>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-100 p-6 rounded-lg mb-8 shadow-md"
          >
            <h2 className="text-2xl font-semibold mb-4">
              {editingRelease ? 'Edit Release' : 'Create New Release'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-lg font-medium text-gray-700">Production Order</label>
                  <select
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  >
                    <option value="">Select Production Order</option>
                    {orders.map(order => (
                      <option key={order.order_id} value={order.order_id}>
                        Order #{order.order_id} - {order.order_status} ({new Date(order.date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-lg font-medium text-gray-700">Inventory Item</label>
                  <select
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  >
                    <option value="">Select Inventory Item</option>
                    {inventoryItems.map(item => (
                      <option key={item.item_id} value={item.item_id}>
                        {item.item_name} ({item.category} - {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-lg font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Enter quantity"
                      required
                      step="0.01"
                      min="0.01"
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    />
                    <span className="ml-2 text-gray-600 text-lg">
                      {inventoryItems.find(item => item.item_id === parseInt(formData.item_id))?.unit || ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-lg font-medium text-gray-700">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date_time"
                    value={formData.date_time}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-lg font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="released">Released</option>
                    <option value="not released">Not Released</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/30 font-medium text-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 font-medium text-lg"
                >
                  {editingRelease ? 'Update' : 'Create'} Release
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="inventory-table bg-white rounded-lg overflow-hidden shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-6 py-3 text-left text-black">Release ID</th>
                <th className="px-6 py-3 text-left text-black">Order ID</th>
                <th className="px-6 py-3 text-left text-black">Item</th>
                <th className="px-6 py-3 text-left text-black">Quantity</th>
                <th className="px-6 py-3 text-left text-black">Date & Time</th>
                <th className="px-6 py-3 text-left text-black">Status</th>
                <th className="px-6 py-3 text-left text-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {releases.map(release => (
                <tr key={release.release_id} className="hover:bg-gray-100">
                  <td className="px-6 py-4">{release.release_id}</td>
                  <td className="px-6 py-4">{release.order_id || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {inventoryItems.find(item => item.item_id === release.item_id)?.item_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4">{release.quantity}</td>
                  <td className="px-6 py-4">
                    {new Date(release.date_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-lg ${getStatusBadgeClass(release.status)}`}>
                      {release.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {release.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(release.release_id, 'released')}
                          title="Mark as Released"
                          className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-100 transition-all duration-300 text-xl"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      {release.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(release.release_id, 'not released')}
                          title="Mark as Not Released"
                          className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-all duration-300 text-xl"
                        >
                          <FaTimesCircle />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(release)}
                        title="Edit Release"
                        className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-all duration-300 text-xl"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(release.release_id)}
                        title="Delete Release"
                        className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-all duration-300 text-xl"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{customStyles}</style>
    </div>
  );
};

export default InventoryRelease; 

const customStyles = `
  .inventory-table th {
    font-size: 20px;
    font-weight: bold;
    color: #333;
    background-color: #f3f4f6;
    padding: 16px;
  }

  .inventory-table td {
    font-size: 18px;
    padding: 14px;
    color: #444;
  }

  .inventory-table tbody tr:hover {
    background-color: #f9fafb;
  }

  .inventory-rangepicker {
    height: 44px;
    font-size: 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: white;
  }

  .inventory-rangepicker .ant-picker-input > input {
    font-size: 16px;
    color: #333;
  }

  .inventory-rangepicker .ant-picker-suffix {
    color: #6b7280;
  }

  .inventory-rangepicker:hover {
    border-color: #93c5fd;
  }

  .inventory-rangepicker.ant-picker-focused {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`; 