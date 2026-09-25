import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEdit, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductionLogsList = ({ logs, onUpdate }) => {
  const [expandedLogId, setExpandedLogId] = useState(null);

  const toggleLogDetails = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-gray-600 text-lg">
        No production logs found.
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-100 rounded-lg p-6"
    >
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
      `}</style>
      <h2 className="text-2xl font-semibold mb-4 text-black">Production Logs</h2>
      
      <div className="space-y-4 production-log-table">
        {logs.map((log) => (
          <div 
            key={log.production_id} 
            className="border border-gray-300 rounded-lg overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 bg-gray-200">
              <div className="flex-1">
                <h3 className="font-semibold text-xl text-black">{log.product_name || 'Unnamed Product'}</h3>
                <div className="text-base text-gray-600">
                  {formatDate(log.date_time)}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                  <div className="text-base">
                    <span className="text-gray-600">Planned:</span> <span className="text-black">{log.planned_quantity}</span>
                  </div>
                  <div className="text-base">
                    <span className="text-gray-600">Actual:</span>{' '}
                    <span className={
                      log.actual_quantity > log.planned_quantity 
                        ? 'text-green-600' 
                        : log.actual_quantity < log.planned_quantity 
                        ? 'text-red-600' 
                        : 'text-black'
                    }>
                      {log.actual_quantity}
                    </span>
                  </div>
                  <div className="text-base">
                    <span className="text-gray-600">Variance:</span>{' '}
                    <span className={
                      log.actual_quantity > log.planned_quantity 
                        ? 'text-green-600' 
                        : log.actual_quantity < log.planned_quantity 
                        ? 'text-red-600' 
                        : 'text-black'
                    }>
                      {log.actual_quantity - log.planned_quantity}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <button 
                    onClick={() => toggleLogDetails(log.production_id)}
                    className="p-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaInfoCircle />
                  </button>
                  
                  {onUpdate && (
                    <button 
                      onClick={() => onUpdate(log)}
                      className="p-2 text-yellow-500 hover:text-yellow-700"
                    >
                      <FaEdit />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {expandedLogId === log.production_id && (
              <div className="p-4 bg-white border-t border-gray-300">
                <div className="grid grid-cols-2 gap-3 text-base">
                  <div className="text-gray-600">Production ID:</div>
                  <div className="text-black">{log.production_id}</div>
                  
                  <div className="text-gray-600">Product:</div>
                  <div className="text-black">{log.product_name}</div>
                  
                  <div className="text-gray-600">Inventory Release:</div>
                  <div className="text-black">{log.product_inventory_release_id}</div>
                  
                  <div className="text-gray-600">Planned Quantity:</div>
                  <div className="text-black">{log.planned_quantity}</div>
                  
                  <div className="text-gray-600">Actual Quantity:</div>
                  <div className="text-black">{log.actual_quantity}</div>
                  
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
                  
                  <div className="text-gray-600">Date & Time:</div>
                  <div className="text-black">{formatDate(log.date_time)}</div>
                  
                  {log.notes && (
                    <>
                      <div className="text-gray-600">Notes:</div>
                      <div className="text-black">{log.notes}</div>
                    </>
                  )}
                </div>
                
                {onUpdate && (
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => onUpdate(log)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center text-base"
                    >
                      <FaEdit className="mr-1" /> Edit Log
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProductionLogsList; 