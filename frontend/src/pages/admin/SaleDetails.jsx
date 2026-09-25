import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

const SaleDetails = () => {
    const params = useParams();
    const navigate = useNavigate();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchSaleDetails(params.id);
        }
    }, [params.id]);

    const fetchSaleDetails = async (id) => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:3000/api/sales/details/${id}`, {
                withCredentials: true
            });

            if (response.data.success) {
                setSale(response.data.sale);
            } else {
                toast.error('Failed to fetch sale details');
                navigate('/admin/dashboard');
            }
        } catch (error) {
            console.error('Error fetching sale details:', error);
            toast.error('Failed to fetch sale details');
            navigate('/admin/dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0b1e] text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!sale) {
        return null;
    }

    return (
<div className="min-h-screen bg-[#ffffff] text-black p-8">
  <div className="max-w-4xl mx-auto text-[18px]">
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-between items-center mb-6"
    >
      <h1 className="text-[25px] font-bold">Sale Details</h1>
    </motion.div>

    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-100 rounded-lg text-black p-6 mb-6"
    >
      <h2 className="text-[19px] font-semibold mb-4">Sale Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-black">Sale ID</p>
          <p className="font-medium text-black">{sale.sale_id}</p>
        </div>
        <div>
          <p className="text-black">Total Amount</p>
          <p className="font-medium text-black">Rs.{parseFloat(sale.total_amount).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-black">Sale Date</p>
          <p className="font-medium text-black">
            {dayjs(sale.sale_date).format("YYYY-MM-DD HH:mm:ss")}
          </p>
        </div>
        <div>
          <p className="text-black">Total Items</p>
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-sm text-[18px]">
            {sale.sale_items?.length || 0} items
          </span>
        </div>
      </div>
    </motion.div>

    {sale.sale_items && sale.sale_items.length > 0 && (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-100 rounded-lg p-6"
      >
        <h2 className="text-[19px] font-semibold mb-4">Sale Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">Product Name</th>
                <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">Category</th>
                <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">Quantity</th>
                <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">Unit Price</th>
                <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_items.map((item, index) => {
                const itemData = typeof item === 'string' ? JSON.parse(item) : item;
                return (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-white/5">
                    <td className="py-4 px-6">{itemData.product_name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-sm text-[18px]">
                        {itemData.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">{itemData.quantity}</td>
                    <td className="py-4 px-6 text-green-400">Rs.{parseFloat(itemData.unit_price).toFixed(2)}</td>
                    <td className="py-4 px-6 text-green-400">Rs.{parseFloat(itemData.subtotal).toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-gray-700 font-semibold">
                <td colSpan="4" className="py-4 px-6 text-right text-[19px]">Total:</td>
                <td className="py-4 px-6 text-green-400 text-[18px]">Rs.{parseFloat(sale.total_amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    )}
  </div>
</div>

    );
};

export default SaleDetails; 