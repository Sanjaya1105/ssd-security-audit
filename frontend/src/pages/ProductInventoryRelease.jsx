import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEye, FaDownload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { RangePicker } = DatePicker;

const ProductInventoryRelease = () => {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dateRange, setDateRange] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(null);
  const [releaseDetails, setReleaseDetails] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: ''
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
      // Fetch production inventory releases
      const releasesResponse = await axios.get(
        'http://localhost:3000/api/production-inventory-releases',
        getAuthHeaders()
      );
      setReleases(releasesResponse.data.data || []);

      // Fetch products
      const productsResponse = await axios.get(
        'http://localhost:3000/api/products',
        getAuthHeaders()
      );
      setProducts(productsResponse.data);

      // Fetch recipes for all products
      const productsWithRecipes = {};
      
      for (const product of productsResponse.data) {
        try {
          const recipeResponse = await axios.get(
            `http://localhost:3000/api/recipes/product/${product.product_id}`,
            getAuthHeaders()
          );
          productsWithRecipes[product.product_id] = recipeResponse.data;
        } catch (err) {
          console.error(`Error fetching recipe for product ${product.product_id}:`, err);
        }
      }
      
      setRecipes(productsWithRecipes);
      
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
      setLoading(true);
      const submitData = {
        product_id: parseInt(formData.product_id),
        quantity: parseFloat(formData.quantity)
      };

      // Validate inputs
      if (!submitData.product_id) {
        toast.error('Please select a product');
        return;
      }

      if (!submitData.quantity || submitData.quantity <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      // Create new production inventory release
      const response = await axios.post(
        'http://localhost:3000/api/production-inventory-releases',
        submitData,
        getAuthHeaders()
      );

      if (response.data.success) {
        toast.success('Production inventory released successfully');
        fetchData();
        resetForm();
      } else {
        toast.error(response.data.message || 'Failed to release inventory');
      }
    } catch (error) {
      console.error('Error creating production inventory release:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        handleError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (releaseId) => {
    if (window.confirm('Are you sure you want to delete this production inventory release? This will also restore the released inventory.')) {
      try {
        setLoading(true);
        const response = await axios.delete(
          `http://localhost:3000/api/production-inventory-releases/${releaseId}`,
          getAuthHeaders()
        );
        toast.success(response.data.message || 'Production inventory release deleted and inventory restored successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting production inventory release:', error);
        handleError(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewDetails = async (releaseId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/production-inventory-releases/${releaseId}`,
        getAuthHeaders()
      );
      
      if (response.data.success) {
        setReleaseDetails(response.data.data);
        setDetailsOpen(releaseId);
      } else {
        toast.error('Failed to fetch release details');
      }
    } catch (error) {
      console.error('Error fetching release details:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      quantity: ''
    });
    setShowForm(false);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
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
      doc.text('Production Inventory Release Report', 15, 30);
      
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

      doc.text(`Total Releases: ${totalReleases}`, 20, 67);
      doc.text(`Total Quantity Released: ${totalQuantity}`, 80, 67);

      // Prepare table data
      const tableData = releases.map(release => {
        const product = products.find(p => p.product_id === release.product_id);
        return [
          release.product_inventory_release_id,
          product ? product.product_name : 'Unknown Product',
          release.quantity,
          release.date,
          release.time
        ];
      });

      // Add release details table
      autoTable(doc, {
        startY: 80,
        head: [['Release ID', 'Product', 'Quantity', 'Date', 'Time']],
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
          1: { halign: 'left' },
          2: { halign: 'right' },
          3: { halign: 'center' },
          4: { halign: 'center' }
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

      // Add product-wise summary on new page
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Product-wise Release Summary', 15, 20);

      // Calculate product-wise summary
      const productSummary = releases.reduce((acc, release) => {
        const product = products.find(p => p.product_id === release.product_id);
        const productName = product ? product.product_name : 'Unknown Product';
        
        if (!acc[productName]) {
          acc[productName] = {
            totalQuantity: 0,
            releases: 0
          };
        }
        
        acc[productName].totalQuantity += release.quantity;
        acc[productName].releases += 1;
        
        return acc;
      }, {});

      const productSummaryData = Object.entries(productSummary).map(([productName, data]) => [
        productName,
        data.totalQuantity.toString(),
        data.releases.toString()
      ]);

      autoTable(doc, {
        startY: 30,
        head: [['Product Name', 'Total Quantity', 'Number of Releases']],
        body: productSummaryData,
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
          2: { halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Save the PDF
      const fileName = dateRange 
        ? `production_inventory_release_report_${dateRange[0].format('YYYY-MM-DD')}_to_${dateRange[1].format('YYYY-MM-DD')}.pdf`
        : `production_inventory_release_report_${dayjs().format('YYYY-MM-DD')}.pdf`;
      
      doc.save(fileName);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-800 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 p-8">
      <style>{style}</style>
      <div className="max-w-8xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-gray-800"
          >
            Production Inventory Release
          </motion.h1>
          <div className="flex items-center gap-4">
            <RangePicker
              value={dateRange}
              onChange={handleDateChange}
              className="bg-white border-gray-300 text-gray-800"
              allowClear={true}
            />
            <button
              onClick={generatePDF}
              disabled={releases.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaDownload className="text-sm" />
              Generate Report
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 font-medium"
            >
              <FaPlus className="text-sm" />
              {showForm ? 'Cancel' : 'New Release'}
            </button>
          </div>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg mb-8 text-gray-800 shadow-md"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Production Inventory Release</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-800"
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.product_id} value={product.product_id}>
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
                    required
                    step="0.01"
                    min="0.01"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-800"
                  />
                </div>
              </div>

              {formData.product_id && recipes[formData.product_id] && (
                <div className="mt-6 bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 text-gray-800">Recipe Information</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-4 text-gray-800 font-bold">Ingredient</th>
                          <th className="text-right py-2 px-4 text-gray-800 font-bold">Required Per Unit</th>
                          <th className="text-right py-2 px-4 text-gray-800 font-bold">Total Required</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipes[formData.product_id].map(item => (
                          <tr key={item.ingredient_item_id} className="border-b border-gray-200">
                            <td className="py-2 px-4 text-gray-800">{item.ingredient_name}</td>
                            <td className="text-right py-2 px-4 text-gray-800">{item.quantity_required_per_unit}</td>
                            <td className="text-right py-2 px-4 text-gray-800">
                              {formData.quantity ? (item.quantity_required_per_unit * formData.quantity).toFixed(2) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-gray-500/30 font-medium text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 font-medium text-white"
                >
                  Release Inventory
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Details Modal */}
        {detailsOpen && releaseDetails && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-3xl w-full rounded-lg shadow-xl text-gray-800">
              <div className="flex justify-between items-center border-b border-gray-300 p-5">
                <h3 className="text-xl font-bold">Release Details #{releaseDetails.production_inventory_release_id}</h3>
                <button 
                  onClick={() => {
                    setDetailsOpen(null);
                    setReleaseDetails(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-gray-500 text-sm">Product</p>
                    <p className="font-medium text-gray-800 text-lg">{releaseDetails.product_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Quantity</p>
                    <p className="font-medium text-gray-800 text-lg">{releaseDetails.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Date</p>
                    <p className="font-medium text-gray-800 text-lg">{releaseDetails.date}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Time</p>
                    <p className="font-medium text-gray-800 text-lg">{releaseDetails.time}</p>
                  </div>
                </div>

                <h4 className="font-medium text-xl mb-3 border-b border-gray-300 pb-2 text-gray-800">Released Ingredients</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-gray-800 font-semibold text-lg">Item</th>
                        <th className="px-4 py-2 text-right text-gray-800 font-semibold text-lg">Quantity</th>
                        <th className="px-4 py-2 text-left text-gray-800 font-semibold text-lg">Stock ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {releaseDetails.items && releaseDetails.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-800 text-lg">{item.item_name}</td>
                          <td className="px-4 py-2 text-right text-gray-800 text-lg">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-2 text-gray-800 text-lg">{item.stock_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-8">
                  <button 
                    onClick={() => {
                      setDetailsOpen(null);
                      setReleaseDetails(null);
                    }}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg overflow-hidden user-table shadow-md">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-gray-800 text-xl font-semibold">Release ID</th>
                <th className="px-6 py-3 text-left text-gray-800 text-xl font-semibold">Product</th>
                <th className="px-6 py-3 text-left text-gray-800 text-xl font-semibold">Quantity</th>
                <th className="px-6 py-3 text-left text-gray-800 text-xl font-semibold">Date</th>
                <th className="px-6 py-3 text-left text-gray-800 text-xl font-semibold">Time</th>
                <th className="px-6 py-3 text-left text-gray-800 text-xl font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {releases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 text-lg">
                    No production inventory releases found
                  </td>
                </tr>
              ) : (
                releases.map(release => (
                  <tr key={release.production_inventory_release_id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 text-gray-800 text-lg">{release.product_inventory_release_id}</td>
                    <td className="px-6 py-4 text-gray-800 text-lg">
                      {products.find(product => product.product_id === release.product_id)?.product_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-gray-800 text-lg">{release.quantity}</td>
                    <td className="px-6 py-4 text-gray-800 text-lg">{release.date}</td>
                    <td className="px-6 py-4 text-gray-800 text-lg">{release.time}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(release.product_inventory_release_id)}
                          title="View Details"
                          className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 transition-all duration-300"
                        >
                          <FaEye size={25} />
                        </button>
                        <button
                          onClick={() => handleDelete(release.product_inventory_release_id)}
                          title="Delete Release"
                          className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-all duration-300"
                        >
                          <FaTrash size={25} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductInventoryRelease; 

const style = `
  /* Main container styles */
  .custom-tabs .ant-tabs-nav {
    background-color: #ffffff;
    margin-bottom: 16px;
    border-radius: 8px;
  }

  .custom-tabs .ant-tabs-tab {
    font-size: 16px;
    color: #333333;
    padding: 12px 20px;
  }

  .custom-tabs .ant-tabs-tab.ant-tabs-tab-active {
    background-color: #f0f0f0;
    border-bottom: 2px solid #1890ff;
    color: #1890ff;
  }

  .custom-tabs .ant-tabs-content {
    background-color: #ffffff;
    border-radius: 8px;
    padding: 16px;
  }

  /* Date picker styles */
  .ant-picker {
    background-color: #ffffff !important;
    border: 1px solid #d9d9d9 !important;
    color: #333333 !important;
  }

  .ant-picker:hover {
    border-color: #1890ff !important;
  }

  .ant-picker-input > input {
    color: #333333 !important;
  }

  .ant-picker-suffix {
    color: #333333 !important;
  }

  /* Table styles */
  .user-table .ant-table {
    background-color: #ffffff;
    color: #333333;
  }

  .user-table .ant-table-thead > tr > th {
    background-color: #f0f0f0;
    color: #333333;
    font-size: 20px;
    font-weight: 600;
    padding: 16px;
  }

  .user-table .ant-table-tbody > tr > td {
    color: #333333;
    font-size: 18px;
    padding: 14px;
  }

  .user-table .ant-table-tbody > tr:hover > td {
    background-color: #f5f5f5;
  }

  /* Modal styles */
  .ant-modal-content {
    background-color: #ffffff;
    border-radius: 8px;
  }

  .ant-modal-header {
    background-color: #ffffff;
    border-bottom: 1px solid #f0f0f0;
    border-radius: 8px 8px 0 0;
  }

  .ant-modal-title {
    color: #333333;
    font-size: 20px;
    font-weight: bold;
  }

  .ant-modal-body {
    padding: 24px;
    font-size: 16px;
    color: #333333;
  }

  .ant-modal-footer {
    border-top: 1px solid #f0f0f0;
  }

  /* Form elements */
  .ant-select {
    background-color: #ffffff;
    color: #333333;
  }

  .ant-select-selector {
    background-color: #ffffff !important;
    border: 1px solid #d9d9d9 !important;
  }

  .ant-select-selection-item {
    color: #333333;
    font-size: 16px;
  }

  .ant-input, .ant-input-number {
    background-color: #ffffff;
    border: 1px solid #d9d9d9;
    color: #333333;
    font-size: 16px;
  }

  /* Button styles */
  .ant-btn {
    font-size: 16px;
    height: auto;
    padding: 8px 16px;
  }

  .ant-btn-primary {
    background-color: #1890ff;
    border-color: #1890ff;
  }

  .ant-btn-primary:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }

  .ant-btn-danger {
    background-color: #ff4d4f;
    border-color: #ff4d4f;
    color: #ffffff;
  }

  .ant-btn-danger:hover {
    background-color: #ff7875;
    border-color: #ff7875;
  }

  /* Message and notification styles */
  .ant-message-notice-content {
    background-color: #ffffff;
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08);
    font-size: 16px;
  }

  .ant-notification-notice {
    background-color: #ffffff;
    box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08);
  }

  .ant-notification-notice-message {
    color: #333333;
    font-size: 18px;
  }

  .ant-notification-notice-description {
    color: #666666;
    font-size: 16px;
  }
`; 