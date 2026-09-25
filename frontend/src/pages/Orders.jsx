import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";
import { DatePicker, Select, Button } from "antd";
import { FaFilePdf, FaEye, FaEdit, FaTrash } from "react-icons/fa";

const { RangePicker } = DatePicker;

const Orders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    order_status: "",
    order_type: "",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/api/orders/admin/orders",
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.data)
      ) {
        setOrders(response.data.data);
        calculateStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      toast.error("Please select a date range");
      return;
    }

    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const response = await axios.get(
        "http://localhost:3000/api/orders/by-date",
        {
          params: {
            startDate,
            endDate,
          },
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        setOrders(response.data.data.orders);
        calculateStats(response.data.data.orders);
        toast.success("Report generated successfully");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    }
  };

  const generatePDF = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      toast.error("Please select a date range");
      return;
    }

    try {
      const doc = new jsPDF();

      // Add company header
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Hot & Fast", 15, 20);

      // Add report title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text("Order Report", 15, 30);

      // Add date range
      doc.setFontSize(12);
      doc.text(
        `Report Period: ${dateRange[0].format(
          "YYYY-MM-DD"
        )} to ${dateRange[1].format("YYYY-MM-DD")}`,
        15,
        40
      );

      // Add summary box
      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(240, 248, 255);
      doc.rect(15, 45, 180, 25, "F");
      doc.setFontSize(11);
      doc.text("Summary", 20, 53);
      doc.setFontSize(10);
      doc.text(`Total Orders: ${stats.totalOrders}`, 20, 60);
      doc.text(`Completed Orders: ${stats.completedOrders}`, 80, 60);
      doc.text(`Processing Orders: ${stats.pendingOrders}`, 140, 60);

      // Add orders table
      const tableData = orders.map((order) => [
        order.order_id,
        dayjs(order.date).format("YYYY-MM-DD HH:mm:ss"),
        order.order_type,
        order.order_status,
        `$${parseFloat(order.total_amount).toFixed(2)}`,
        order.payment_status || "N/A",
      ]);

      autoTable(doc, {
        startY: 75,
        head: [["Order ID", "Date", "Type", "Status", "Amount", "Payment"]],
        body: tableData,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [220, 220, 220],
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
          cellPadding: 6,
        },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "center" },
          2: { halign: "center" },
          3: {
            halign: "center",
            fontStyle: "bold",
            textColor: (cell) => {
              if (cell.text === "COMPLETED") return [46, 204, 113];
              if (cell.text === "PENDING") return [243, 156, 18];
              return [52, 152, 219];
            },
          },
          4: { halign: "right" },
          5: { halign: "center" },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 75, left: 15, right: 15 },
        didDrawPage: function (data) {
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
          const totalPages = doc.internal.getNumberOfPages();
          doc.text(
            `Generated on: ${dayjs().format(
              "YYYY-MM-DD HH:mm:ss"
            )} | Page ${pageNumber} of ${totalPages}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        },
      });

      doc.save(
        `order_report_${dateRange[0].format(
          "YYYY-MM-DD"
        )}_to_${dateRange[1].format("YYYY-MM-DD")}.pdf`
      );
      toast.success("PDF report generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const calculateStats = (ordersData) => {
    if (!Array.isArray(ordersData)) return;

    const total = ordersData.length;
    const processing = ordersData.filter(
      (order) => order.order_status === "PROCESSING"
    ).length;
    const completed = ordersData.filter(
      (order) => order.order_status === "COMPLETED"
    ).length;

    setStats({
      totalOrders: total,
      processingOrders: processing,
      completedOrders: completed,
    });
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const response = await axios.delete(
        `http://localhost:3000/api/orders/${orderId}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        toast.success(response.data.message);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const fetchOrderDetails = async (orderId) => {
    setLoadingOrder(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/orders/admin/orders`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data && response.data.success) {
        const order = response.data.data.find((o) => o.order_id === orderId);
        if (order) {
          setSelectedOrder(order);
          setShowModal(true);
        } else {
          toast.error("Order not found");
        }
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/orders/${selectedOrder.order_id}`,
        updateFormData,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Order updated successfully");
        setShowUpdateModal(false);
        fetchOrders(); // Refresh the orders list
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const openUpdateModal = (order) => {
    setSelectedOrder(order);
    setUpdateFormData({
      order_status: order.order_status,
      order_type: order.order_type,
    });
    setShowUpdateModal(true);
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-8xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8"
        >
          Order Management
        </motion.h1>

        <div className="bg-white rounded-lg p-6 mb-8 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Orders</h2>
            <div className="flex gap-4">
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                className="orders-datepicker"
              />
              <Button
                type="primary"
                onClick={generateReport}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-lg"
              >
                Generate Report
              </Button>
              <Button
                type="primary"
                onClick={generatePDF}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center gap-2 text-lg"
              >
                <FaFilePdf /> Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totalOrders}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 text-sm">Processing Orders</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.processingOrders}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 text-sm">Completed Orders</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.completedOrders}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto orders-table">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-300">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.order_id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4">{order.order_id}</td>
                      <td className="py-3 px-4">
                        {dayjs(order.date).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                          {order.order_type === "PRODUCTION_ORDER"
                            ? "Production"
                            : "Direct Sale"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-md text-sm ${
                            order.order_status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        Rs.{parseFloat(order.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchOrderDetails(order.order_id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Order"
                          >
                            <FaEye size={25} />
                          </button>
                          <button
                            onClick={() => openUpdateModal(order)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Edit Order"
                          >
                            <FaEdit size={25} />
                          </button>
                          <button
                            onClick={() => handleDelete(order.order_id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Order"
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

        {showUpdateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Update Order</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium mb-1 text-gray-700">
                    Order Status
                  </label>
                  <Select
                    value={updateFormData.order_status}
                    onChange={(value) =>
                      setUpdateFormData({
                        ...updateFormData,
                        order_status: value,
                      })
                    }
                    className="w-full"
                    options={[
                      { value: "PROCESSING", label: "Processing" },
                      { value: "COMPLETED", label: "Completed" },
                    ]}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 text-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-lg"
                  >
                    Update Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              
              {loadingOrder ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedOrder ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-gray-600">Order ID</p>
                      <p className="text-xl font-medium">
                        {selectedOrder?.order_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="text-xl font-medium">
                        {dayjs(selectedOrder?.date).format("YYYY-MM-DD HH:mm:ss")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Order Type</p>
                      <p className="text-xl font-medium">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                          {selectedOrder?.order_type === "PRODUCTION_ORDER"
                            ? "Production"
                            : "Direct Sale"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="text-xl font-medium">
                        <span
                          className={`px-2 py-1 rounded-md text-sm ${
                            selectedOrder?.order_status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : selectedOrder?.order_status === "PROCESSING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {selectedOrder?.order_status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="text-xl font-medium">
                        Rs.{parseFloat(selectedOrder?.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Status</p>
                      <p className="text-xl font-medium">
                        <span
                          className={`px-2 py-1 rounded-md text-sm ${
                            selectedOrder?.payment_status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedOrder?.payment_status || "Not Paid"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Customer Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Full Name</p>
                        <p className="text-lg">
                          {selectedOrder?.first_name} {selectedOrder?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="text-lg">{selectedOrder?.email}</p>
                      </div>
                      {selectedOrder?.address &&
                        typeof selectedOrder.address === "string" && (
                          <>
                            {JSON.parse(selectedOrder.address).phone && (
                              <div>
                                <p className="text-gray-600">Phone</p>
                                <p className="text-lg">
                                  {JSON.parse(selectedOrder.address).phone}
                                </p>
                              </div>
                            )}
                            {JSON.parse(selectedOrder.address).address && (
                              <div>
                                <p className="text-gray-600">Address</p>
                                <p className="text-lg">
                                  {JSON.parse(selectedOrder.address).address}
                                </p>
                              </div>
                            )}
                            {JSON.parse(selectedOrder.address).city && (
                              <div>
                                <p className="text-gray-600">City</p>
                                <p className="text-lg">
                                  {JSON.parse(selectedOrder.address).city}
                                </p>
                              </div>
                            )}
                            {JSON.parse(selectedOrder.address).postal_code && (
                              <div>
                                <p className="text-gray-600">Postal Code</p>
                                <p className="text-lg">
                                  {JSON.parse(selectedOrder.address).postal_code}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                    </div>
                  </div>

                  {selectedOrder?.items && selectedOrder.items.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4">Order Items</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-300">
                              <th className="text-left py-3 px-4">Item</th>
                              <th className="text-left py-3 px-4">Quantity</th>
                              <th className="text-left py-3 px-4">Price</th>
                              <th className="text-left py-3 px-4">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item, index) => (
                              <tr
                                key={index}
                                className="border-b border-gray-200"
                              >
                                <td className="py-3 px-4">{item.product_name}</td>
                                <td className="py-3 px-4">{item.quantity}</td>
                                <td className="py-3 px-4">
                                  Rs.{parseFloat(item.selling_price || 0).toFixed(2)}
                                </td>
                                <td className="py-3 px-4">
                                  Rs.
                                  {parseFloat(
                                    item.quantity * (item.selling_price || 0)
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedOrder?.order_type === "PRODUCTION_ORDER" &&
                    selectedOrder?.inventory_releases &&
                    selectedOrder.inventory_releases.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold mb-4">
                          Inventory Releases
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-300">
                                <th className="text-left py-3 px-4">Item</th>
                                <th className="text-left py-3 px-4">Quantity</th>
                                <th className="text-left py-3 px-4">Unit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.inventory_releases.map(
                                (release, index) => (
                                  <tr
                                    key={index}
                                    className="border-b border-gray-200"
                                  >
                                    <td className="py-3 px-4">
                                      {release.item_name}
                                    </td>
                                    <td className="py-3 px-4">
                                      {release.quantity}
                                    </td>
                                    <td className="py-3 px-4">{release.unit}</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No order details available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .orders-table table {
          background-color: white;
          color: black;
          border-collapse: collapse;
          width: 100%;
        }
        
        .orders-table th {
          background-color: #f8f9fa;
          color: #333;
          border-bottom: 1px solid #dee2e6;
          padding: 12px;
          font-size: 20px;
          font-weight: bold;
        }
        
        .orders-table td {
          background-color: white;
          border-bottom: 1px solid #dee2e6;
          padding: 12px;
          font-size: 18px;
          color: #333;
        }
        
        .orders-table tr:hover td {
          background-color: #f8f9fa;
        }

        .orders-datepicker {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background-color: white;
        }
      `}</style>
    </div>
  );
};

export default Orders;
