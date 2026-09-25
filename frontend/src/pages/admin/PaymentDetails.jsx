import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { motion } from "framer-motion";
import dayjs from "dayjs";

const PaymentDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.payment_id) {
      fetchPaymentDetails(params.payment_id);
    }
  }, [params.payment_id]);

  const fetchPaymentDetails = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/payments/details/${id}`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setPayment(response.data.payment);
      } else {
        toast.error("Failed to fetch payment details");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast.error("Failed to fetch payment details");
      navigate("/admin/dashboard");
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

  if (!payment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6"
        >
          <h1 className="text-3xl font-bold">Payment Details</h1>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#cacaca] rounded-lg p-6 mb-6 text-[18px]"
        >
          <h2 className="text-[19px] text-black font-semibold mb-4">
            Payment Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-black">Payment ID</p>
              <p className="font-medium text-black">{payment.payment_id}</p>
            </div>
            <div>
              <p className="text-black">Amount</p>
              <p className="font-medium text-black">
                Rs.{parseFloat(payment.amount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-black">Status</p>
              <span
                className={`px-2 py-1 rounded-md text-sm text-[18px] ${
                  payment.payment_status === "COMPLETED"
                    ? "bg-green-500/20 text-black font-bold"
                    : payment.payment_status === "PENDING"
                    ? "bg-yellow-500/20 text-black font-bold"
                    : "bg-red-500/20 text-red-400 font-bold"
                }`}
              >
                {payment.payment_status}
              </span>
            </div>
            <div>
              <p className="text-black">Transaction Date</p>
              <p className="font-medium text-black">
                {dayjs(payment.transaction_date).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </div>
            <div>
              <p className="text-black">Payment Method</p>
              <p className="font-medium text-black">
                {payment.payment_method || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-black">Stripe Payment Intent</p>
              <p className="font-medium text-black">
                {payment.stripe_payment_intent_id}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#cacaca] rounded-lg p-6 mb-6 text-[18px]"
        >
          <h2 className="text-[19px] text-black font-semibold mb-4">
            Order Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-black">Order ID</p>
              <p className="font-medium text-black">{payment.order_id}</p>
            </div>
            <div>
              <p className="text-black">Order Type</p>
              <span className="bg-blue-500/20 text-black px-2 py-1 rounded-md text-sm text-[18px]">
                {payment.order_type}
              </span>
            </div>
            <div>
              <p className="text-black">Order Status</p>
              <span
                className={`px-2 py-1 rounded-md text-sm text-[18px] ${
                  payment.order_status === "COMPLETED"
                    ? "bg-green-500/20 text-black font-bold"
                    : payment.order_status === "PENDING"
                    ? "bg-yellow-500/20 text-black"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {payment.order_status}
              </span>
            </div>
            <div>
              <p className="text-black">Order Date</p>
              <p className="font-medium text-black">
                {dayjs(payment.order_date).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </div>
            <div>
              <p className="text-black">Order Total</p>
              <p className="font-medium text-black">
                Rs.{parseFloat(payment.order_total).toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#cacaca] rounded-lg p-6 mb-6 text-[18px]"
        >
          <h2 className="text-[19px] text-black font-semibold mb-4">
            Customer Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-black">Name</p>
              <p className="font-medium text-black">
                {payment.first_name} {payment.last_name}
              </p>
            </div>
            <div>
              <p className="text-black">Email</p>
              <p className="font-medium text-black">{payment.email}</p>
            </div>
            <div>
              <p className="text-black">Phone</p>
              <p className="font-medium text-black">{payment.phone_number}</p>
            </div>
          </div>
        </motion.div>

        {payment.order_items && payment.order_items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#cacaca] rounded-lg p-6 text-[18px]"
          >
            <h2 className="text-[19px] text-black font-semibold mb-4">
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">
                      Product Name
                    </th>
                    <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">
                      Quantity
                    </th>
                    <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">
                      Unit Price
                    </th>
                    <th className="text-left py-4 px-6 text-black font-semibold text-[19px]">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payment.order_items.map((item, index) => {
                    const itemData =
                      typeof item === "string" ? JSON.parse(item) : item;
                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-700/50 hover:bg-white/5"
                      >
                        <td className="py-4 px-6">{itemData.product_name}</td>
                        <td className="py-4 px-6">{itemData.quantity}</td>
                        <td className="py-4 px-6 text-black font-bold">
                          Rs.{parseFloat(itemData.unit_price).toFixed(2)}
                        </td>
                        <td className="py-4 px-6 text-black font-bold">
                          Rs.{parseFloat(itemData.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;
