import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaChevronDown, FaChevronUp, FaPlus, FaEdit } from 'react-icons/fa';
import ProductionLogForm from '../components/ProductionLogForm';
import ProductionLogsList from '../components/ProductionLogsList';

const ProductLog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inventoryReleases, setInventoryReleases] = useState([]);
  const [expandedReleaseId, setExpandedReleaseId] = useState(null);
  const [productionLogs, setProductionLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedReleaseForLog, setSelectedReleaseForLog] = useState(null);
  const [editingLog, setEditingLog] = useState(null);

  useEffect(() => {
    fetchInventoryReleases();
    fetchProductionLogs();
  }, []);

  const fetchInventoryReleases = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/production-inventory-releases', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setInventoryReleases(response.data.data);
    } catch (err) {
      console.error('Fetch inventory releases error:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/production-logs', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setProductionLogs(response.data.data || []);
    } catch (err) {
      console.error('Fetch production logs error:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 401) {
      navigate('/login');
    } else if (err.response?.status === 403) {
      setError('You do not have permission to perform this action');
      toast.error('Permission denied');
    } else if (err.code === 'ERR_NETWORK') {
      setError('Unable to connect to server. Please check your internet connection.');
      toast.error('Network connection error');
    } else {
      const errorMessage = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const toggleReleaseDetails = (id) => {
    setExpandedReleaseId(expandedReleaseId === id ? null : id);
  };

  const handleCreateLog = (releaseId) => {
    // Check if log already exists for this release
    const existingLog = productionLogs.find(
      log => log.product_inventory_release_id === releaseId
    );
    
    if (existingLog) {
      toast.info('A log already exists for this inventory release. Please edit the existing log instead.');
      return;
    }
    
    setSelectedReleaseForLog(releaseId);
    setShowForm(true);
    setEditingLog(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setShowForm(true);
    setSelectedReleaseForLog(log.product_inventory_release_id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogCreated = (newLog) => {
    setShowForm(false);
    setSelectedReleaseForLog(null);
    setEditingLog(null);
    fetchProductionLogs();
    toast.success('Production log created successfully');
  };

  const handleLogUpdated = (updatedLog) => {
    setShowForm(false);
    setSelectedReleaseForLog(null);
    setEditingLog(null);
    fetchProductionLogs();
    toast.success('Production log updated successfully');
  };

  const formatDate = (dateStr, timeStr) => {
    if (!dateStr) return 'N/A';
    
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return timeStr 
      ? `${formattedDate} at ${timeStr}` 
      : formattedDate;
  };

  // Find production logs associated with a release
  const findAssociatedLogs = (releaseId) => {
    return productionLogs.filter(log => 
      log.product_inventory_release_id === releaseId
    );
  };

  // Check if a release already has a log
  const hasLog = (releaseId) => {
    return productionLogs.some(log => log.product_inventory_release_id === releaseId);
  };

  if (loading && inventoryReleases.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <style>{`
        .production-log-table.ant-table {
          background-color: #ffffff;
          color: #333333;
        }
        .production-log-table .ant-table-thead > tr > th {
          background-color: #f5f5f5 !important;
          color: #333333;
          font-size: 22px;
          font-weight: bold;
          padding: 16px;
        }
        .production-log-table .ant-table-tbody > tr > td {
          font-size: 20px;
          padding: 14px;
          background-color: #ffffff;
          color: #333333;
        }
        .production-log-table .ant-table-tbody > tr:hover > td {
          background-color: #f0f0f0 !important;
        }
        .production-log-table .ant-pagination {
          font-size: 18px;
        }
        .production-log-table .ant-pagination-item {
          border-radius: 4px;
        }
        .production-log-table .ant-pagination-item-active {
          background-color: #1890ff;
          border-color: #1890ff;
        }
        .production-log-table .ant-pagination-item-active a {
          color: #ffffff;
        }
        .production-log-table .ant-select {
          font-size: 18px;
        }
        .production-log-table .ant-select-selection-item {
          font-size: 18px;
        }
        .production-log-table .ant-empty-description {
          font-size: 20px;
        }
        .production-log-form.ant-form .ant-form-item-label > label {
          font-size: 20px;
          color: #333333;
        }
        .production-log-form.ant-form .ant-form-item-control-input {
          font-size: 20px;
        }
        .production-log-form.ant-form .ant-input {
          font-size: 20px;
          padding: 10px;
          background-color: #ffffff;
          color: #333333;
        }
        .production-log-form.ant-form .ant-select {
          font-size: 20px;
        }
        .production-log-form.ant-form .ant-select-selection-item {
          font-size: 20px;
          color: #333333;
        }
        .production-log-form.ant-form .ant-btn {
          font-size: 20px;
          height: auto;
          padding: 10px 20px;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8 text-black"
        >
          Product Inventory Log
        </motion.h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-700 p-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Production Log Form */}
        {showForm && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-semibold text-black">
                {editingLog ? 'Edit Production Log' : 'Create Production Log'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedReleaseForLog(null);
                  setEditingLog(null);
                }}
                className="text-gray-600 hover:text-black"
              >
                Cancel
              </button>
            </div>
            <ProductionLogForm
              onLogCreated={handleLogCreated}
              onLogUpdated={handleLogUpdated}
              selectedReleaseId={selectedReleaseForLog}
              editingLog={editingLog}
              className="production-log-form"
            />
          </div>
        )}

        {/* All Production Logs Section */}
        <div className="mb-8">
          <ProductionLogsList
            logs={productionLogs}
            onUpdate={handleEditLog}
            className="production-log-table"
            // Not passing onDelete prop to disable deletion
          />
        </div>

        {/* Product Inventory Releases Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-100 rounded-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4 text-black">Product Inventory Releases</h2>
          
          {inventoryReleases.length === 0 ? (
            <p className="text-gray-600 text-lg">No product inventory releases found.</p>
          ) : (
            <div className="space-y-4 production-log-table">
              {inventoryReleases.map((release) => {
                const releaseHasLog = hasLog(release.product_inventory_release_id);
                const logForRelease = releaseHasLog 
                  ? productionLogs.find(log => log.product_inventory_release_id === release.product_inventory_release_id)
                  : null;
                
                return (
                  <div key={release.product_inventory_release_id} className="border border-gray-300 rounded-lg overflow-hidden">
                    <div 
                      className="flex justify-between items-center p-4 bg-gray-200 cursor-pointer hover:bg-gray-300 transition-colors"
                      onClick={() => toggleReleaseDetails(release.product_inventory_release_id)}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl text-black">{release.product_name}</h3>
                        <div className="text-base text-gray-600">
                          Released: {formatDate(release.date, release.time)}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full mr-4 text-base">
                          Qty: {release.quantity}
                        </span>
                        {releaseHasLog ? (
                          <button
                            className="mr-4 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLog(logForRelease);
                            }}
                          >
                            <FaEdit className="mr-1" size={10} /> Edit Log
                          </button>
                        ) : (
                          <button
                            className="mr-4 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateLog(release.product_inventory_release_id);
                            }}
                          >
                            <FaPlus className="mr-1" size={10} /> Log
                          </button>
                        )}
                        {expandedReleaseId === release.product_inventory_release_id ? 
                          <FaChevronUp className="text-gray-600" /> : 
                          <FaChevronDown className="text-gray-600" />
                        }
                      </div>
                    </div>
                    
                    {expandedReleaseId === release.product_inventory_release_id && (
                      <div className="p-4 bg-white border-t border-gray-300">
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-xl text-black">Release Details</h4>
                          <div className="grid grid-cols-2 gap-3 text-base">
                            <div className="text-gray-600">Product:</div>
                            <div className="text-black">{release.product_name}</div>
                            <div className="text-gray-600">Release ID:</div>
                            <div className="text-black">{release.product_inventory_release_id}</div>
                            <div className="text-gray-600">Quantity:</div>
                            <div className="text-black">{release.quantity}</div>
                            <div className="text-gray-600">Date & Time:</div>
                            <div className="text-black">{formatDate(release.date, release.time)}</div>
                          </div>
                        </div>
                        
                        {/* Associated Production Logs */}
                        <div>
                          <h4 className="font-medium mb-2 text-xl text-black">Associated Production Logs</h4>
                          {findAssociatedLogs(release.product_inventory_release_id).length > 0 ? (
                            <div className="space-y-2">
                              {findAssociatedLogs(release.product_inventory_release_id).map(log => (
                                <div key={log.production_id} className="p-3 bg-gray-100 rounded">
                                  <div className="grid grid-cols-2 gap-1 text-base">
                                    <div className="text-gray-600">Production ID:</div>
                                    <div className="text-black">{log.production_id}</div>
                                    <div className="text-gray-600">Planned Qty:</div>
                                    <div className="text-black">{log.planned_quantity}</div>
                                    <div className="text-gray-600">Actual Qty:</div>
                                    <div className={
                                      log.actual_quantity > log.planned_quantity 
                                        ? 'text-green-600' 
                                        : log.actual_quantity < log.planned_quantity 
                                        ? 'text-red-600' 
                                        : 'text-black'
                                    }>
                                      {log.actual_quantity}
                                    </div>
                                    <div className="text-gray-600">Variance:</div>
                                    <div className={
                                      log.actual_quantity > log.planned_quantity 
                                        ? 'text-green-600' 
                                        : log.actual_quantity < log.planned_quantity 
                                        ? 'text-red-600' 
                                        : 'text-black'
                                    }>
                                      {log.actual_quantity - log.planned_quantity}
                                    </div>
                                    <div className="text-gray-600">Date:</div>
                                    <div className="text-black">{new Date(log.date_time).toLocaleDateString()}</div>
                                  </div>
                                  {log.notes && (
                                    <div className="mt-2 text-base">
                                      <span className="text-gray-600">Notes:</span> <span className="text-black">{log.notes}</span>
                                    </div>
                                  )}
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={() => handleEditLog(log)}
                                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 text-base rounded flex items-center"
                                    >
                                      <FaEdit className="mr-1" size={12} /> Edit Log
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600 text-base">No production logs associated with this release.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProductLog; 