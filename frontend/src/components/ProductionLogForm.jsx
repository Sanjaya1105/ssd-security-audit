import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductionLogForm = ({ onLogCreated, onLogUpdated, selectedReleaseId = null, editingLog = null }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [inventoryReleases, setInventoryReleases] = useState([]);
  const [formData, setFormData] = useState({
    product_id: '',
    product_inventory_release_id: '',
    planned_quantity: '',
    actual_quantity: '',
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchInventoryReleases();
  }, []);

  useEffect(() => {
    // If editing an existing log, populate the form with its data
    if (editingLog) {
      setFormData({
        product_id: editingLog.product_id.toString(),
        product_inventory_release_id: editingLog.product_inventory_release_id.toString(),
        planned_quantity: editingLog.planned_quantity.toString(),
        actual_quantity: editingLog.actual_quantity.toString(),
        notes: editingLog.notes || ''
      });
    } else {
      // If selectedReleaseId is provided, fetch and set the release details
      if (selectedReleaseId) {
        const fetchReleaseDetails = async () => {
          try {
            const response = await axios.get(`http://localhost:3000/api/production-inventory-releases/${selectedReleaseId}`, {
              withCredentials: true,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            const releaseData = response.data.data;
            
            if (releaseData) {
              setFormData(prev => ({
                ...prev,
                product_inventory_release_id: selectedReleaseId,
                product_id: releaseData.product_id.toString(),
                planned_quantity: releaseData.quantity.toString()
              }));
            }
          } catch (err) {
            console.error('Error fetching release details:', err);
            toast.error('Failed to load release details');
          }
        };
        
        fetchReleaseDetails();
      }
    }
  }, [selectedReleaseId, editingLog]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/products', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to load products');
    }
  };

  const fetchInventoryReleases = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/production-inventory-releases', {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setInventoryReleases(response.data.data || []);
    } catch (err) {
      console.error('Error fetching inventory releases:', err);
      toast.error('Failed to load inventory releases');
    }
  };

  const handleInventoryReleaseChange = (e) => {
    const releaseId = e.target.value;
    
    if (!releaseId) {
      setFormData(prev => ({
        ...prev,
        product_inventory_release_id: '',
        planned_quantity: ''
      }));
      return;
    }
    
    const selectedRelease = inventoryReleases.find(
      release => release.product_inventory_release_id.toString() === releaseId
    );
    
    if (selectedRelease) {
      setFormData(prev => ({
        ...prev,
        product_inventory_release_id: releaseId,
        product_id: selectedRelease.product_id.toString(),
        planned_quantity: selectedRelease.quantity.toString()
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if ((name === 'planned_quantity' || name === 'actual_quantity') && value !== '') {
      if (isNaN(value) || parseInt(value) <= 0) {
        return; // Don't update state for invalid number inputs
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const { product_id, product_inventory_release_id, planned_quantity, actual_quantity } = formData;
    
    if (!product_id) return "Product is required";
    if (!product_inventory_release_id) return "Inventory release is required";
    if (!planned_quantity || parseInt(planned_quantity) <= 0) return "Planned quantity must be greater than zero";
    if (!actual_quantity || parseInt(actual_quantity) <= 0) return "Actual quantity must be greater than zero";
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    try {
      setLoading(true);
      
      if (editingLog) {
        // Update existing log
        const response = await axios.put(
          `http://localhost:3000/api/production-logs/${editingLog.production_id}`, 
          formData,
          {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (onLogUpdated && typeof onLogUpdated === 'function') {
          onLogUpdated(response.data.data);
        }
      } else {
        // Create new log
        const response = await axios.post(
          'http://localhost:3000/api/production-logs',
          formData, 
          {
            withCredentials: true,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (onLogCreated && typeof onLogCreated === 'function') {
          onLogCreated(response.data.data);
        }
      }
      
    } catch (err) {
      console.error('Error with production log:', err);
      const errorMsg = err.response?.data?.message || `Failed to ${editingLog ? 'update' : 'create'} production log`;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Find the selected product
  const selectedProduct = products.find(p => p.product_id.toString() === formData.product_id);

  // Find the selected inventory release
  const selectedRelease = inventoryReleases.find(
    r => r.product_inventory_release_id.toString() === formData.product_inventory_release_id.toString()
  );

  const isEditing = !!editingLog;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-100 rounded-lg p-6"
    >
      <style>{`
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
      `}</style>
      <h2 className="text-2xl font-semibold mb-4 text-black">
        {isEditing ? 'Edit Production Log' : 'Create Production Log'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 production-log-form">
        {!selectedReleaseId && !isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inventory Release Selection */}
            <div>
              <label className="block text-gray-600 mb-1 text-base">Inventory Release</label>
              <select
                name="product_inventory_release_id"
                value={formData.product_inventory_release_id}
                onChange={handleInventoryReleaseChange}
                className="w-full bg-white border border-gray-300 rounded p-2 text-black text-base"
                required
              >
                <option value="">Select Inventory Release</option>
                {inventoryReleases.map(release => (
                  <option 
                    key={release.product_inventory_release_id} 
                    value={release.product_inventory_release_id}
                  >
                    {release.product_name || 'Unknown Product'} - Qty: {release.quantity} - {new Date(release.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {/* Selected Item Details */}
        {(selectedProduct || selectedRelease || isEditing) && (
          <div className="bg-white border border-gray-300 p-3 rounded mb-4">
            <h4 className="text-base font-medium text-black mb-2">Selected Details</h4>
            <div className="grid grid-cols-2 gap-2 text-base">
              {selectedProduct && (
                <>
                  <div className="text-gray-600">Product:</div>
                  <div className="text-black">{selectedProduct.product_name}</div>
                </>
              )}
              
              {isEditing && (
                <>
                  <div className="text-gray-600">Production Log ID:</div>
                  <div className="text-black">{editingLog.production_id}</div>
                </>
              )}
              
              {(selectedRelease || isEditing) && (
                <>
                  <div className="text-gray-600">Release ID:</div>
                  <div className="text-black">{selectedRelease?.product_inventory_release_id || formData.product_inventory_release_id}</div>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Planned Quantity */}
          <div>
            <label className="block text-gray-600 mb-1 text-base">Planned Quantity</label>
            <input
              type="number"
              name="planned_quantity"
              value={formData.planned_quantity}
              onChange={handleInputChange}
              min="1"
              className="w-full bg-white border border-gray-300 rounded p-2 text-black text-base"
              required
              readOnly={!isEditing && selectedRelease !== null}
            />
          </div>
          
          {/* Actual Quantity */}
          <div>
            <label className="block text-gray-600 mb-1 text-base">Actual Quantity</label>
            <input
              type="number"
              name="actual_quantity"
              value={formData.actual_quantity}
              onChange={handleInputChange}
              min="1"
              className="w-full bg-white border border-gray-300 rounded p-2 text-black text-base"
              required
            />
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label className="block text-gray-600 mb-1 text-base">Notes (Optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full bg-white border border-gray-300 rounded p-2 text-black text-base"
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className={`bg-blue-600 hover:bg-blue-700 text-white rounded px-6 py-2 text-base flex items-center justify-center ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="mr-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                Processing...
              </>
            ) : (
              <>{isEditing ? 'Update Log' : 'Create Log'}</>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ProductionLogForm; 