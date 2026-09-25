import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  DatePicker,
} from "antd";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

const InventoryManagement = () => {
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [isReleaseModalVisible, setIsReleaseModalVisible] = useState(false);
  const [releaseForm] = Form.useForm();
  const [productionOrders, setProductionOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [createForm] = Form.useForm();

  // Authentication check on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !["admin", "manager"].includes(user.role)) {
          navigate("/login");
          return;
        }
        fetchInventoryItems();
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchInventoryItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:3000/api/inventory-items",
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setInventoryItems(response.data);
    } catch (err) {
      console.error("Fetch inventory items error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 401) {
      navigate("/login");
    } else if (err.response?.status === 403) {
      setError("You do not have permission to access inventory");
      toast.error("Permission denied");
    } else if (err.code === "ERR_NETWORK") {
      setError("Unable to connect to server");
      toast.error("Network connection error");
    } else {
      const errorMessage = err.response?.data?.message || "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const showModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingItem(null);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingItem) {
        await axios.put(
          `http://localhost:3000/api/inventory-items/${editingItem.item_id}`,
          values,
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );
        toast.success("Inventory item updated successfully");
      } else {
        await axios.post("http://localhost:3000/api/inventory-items", values, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Inventory item created successfully");
      }
      handleCancel();
      fetchInventoryItems();
    } catch (err) {
      console.error("Submit error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      setLoading(true);
      await axios.delete(
        `http://localhost:3000/api/inventory-items/${itemId}`,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast.success("Inventory item deleted successfully");
      fetchInventoryItems();
    } catch (err) {
      console.error("Delete error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const showReleaseModal = () => {
    setIsReleaseModalVisible(true);
    releaseForm.resetFields();
    // Set default date to current date and time
    releaseForm.setFieldsValue({
      releaseDate: dayjs(),
      status: "Pending",
    });
  };

  const handleReleaseCancel = () => {
    setIsReleaseModalVisible(false);
    releaseForm.resetFields();
  };

  const handleReleaseSubmit = async (values) => {
    try {
      setLoading(true);
      // Add your API call here to create a new release
      console.log("Release values:", values);
      toast.success("Release created successfully");
      setIsReleaseModalVisible(false);
    } catch (err) {
      console.error("Create release error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const showCreateModal = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
  };

  const handleCreateCancel = () => {
    setIsCreateModalVisible(false);
    createForm.resetFields();
  };

  const handleCreateSubmit = async (values) => {
    try {
      setLoading(true);
      await axios.post("http://localhost:3000/api/inventory-items", values, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Inventory item created successfully");
      handleCreateCancel();
      fetchInventoryItems();
    } catch (err) {
      console.error("Submit error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "item_name",
      key: "item_name",
      sorter: (a, b) => a.item_name.localeCompare(b.item_name),
    },
    {
      title: "Description",
      dataIndex: "item_description",
      key: "item_description",
      ellipsis: true,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: [...new Set(inventoryItems.map((item) => item.category))].map(
        (cat) => ({
          text: cat,
          value: cat,
        })
      ),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "Unit",
      dataIndex: "unit",
      key: "unit",
    },
    {
      title: "Restock Level",
      dataIndex: "restock_level",
      key: "restock_level",
      sorter: (a, b) => a.restock_level - b.restock_level,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => showModal(record)}
            className="bg-blue-500 hover:bg-blue-600 border-none text-white"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this item?"
            onConfirm={() => handleDelete(record.item_id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="primary"
              danger
              className="hover:bg-red-600 border-none"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-9xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-8"
        >
          Inventory Management
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg p-6 mb-8 shadow-md"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Inventory Items</h2>
            <div className="flex gap-4">
              <Button
                type="primary"
                onClick={showCreateModal}
                className="!bg-blue-500 hover:!bg-blue-600 !border-none !text-white !px-6 !py-6 !text-lg !rounded-md"
              >
                Add New Item
              </Button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg"
            >
              <p className="text-red-500">{error}</p>
            </motion.div>
          )}

          <Table
            columns={columns}
            dataSource={inventoryItems}
            loading={loading}
            rowKey="item_id"
            className="inventory-table"
          />
        </motion.div>

        <Modal
          title={
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-black">
                Create New Inventory Item
              </h3>
              <button
                onClick={handleCreateCancel}
                className="text-gray-500 hover:text-black"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
          }
          open={isCreateModalVisible}
          onCancel={handleCreateCancel}
          footer={null}
          closable={false}
          className="inventory-modal"
          width={850}
          styles={{
            content: {
              background: "#ffffff",
              padding: "24px",
              borderRadius: "8px",
            },
          }}
        >
          <Form
            form={createForm}
            onFinish={handleCreateSubmit}
            layout="vertical"
            className="pt-4"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <Form.Item
                  name="item_name"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Item Name{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please enter item name" },
                  ]}
                >
                  <Input
                    placeholder="Enter item name"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>

                <Form.Item
                  name="brand"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Brand{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[{ required: true, message: "Please enter brand" }]}
                >
                  <Input
                    placeholder="Enter brand"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="item_description"
                label={
                  <div className="flex text-black">
                    <span className="text-red-500"></span> Description{" "}
                    <span className="text-red-500 ml-1"></span>
                  </div>
                }
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <TextArea
                  placeholder="Enter item description"
                  className="bg-white rounded-lg px-4 py-2 border border-gray-300"
                  rows={4}
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-6">
                <Form.Item
                  name="unit"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Unit{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please enter unit" },
                    {
                      pattern: /^[A-Za-z]+$/,
                      message:
                        "Unit must contain only letters (no numbers or symbols)",
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g., kg, pcs"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>

                <Form.Item
                  name="restock_level"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Restock Level{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please enter restock level" },
                  ]}
                >
                  <Input
                    type="number"
                    placeholder="Enter restock level"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="category"
                label={
                  <div className="flex text-black">
                    <span className="text-red-500"></span> Category{" "}
                    <span className="text-red-500 ml-1"></span>
                  </div>
                }
                rules={[{ required: true, message: "Please enter category" }]}
              >
                <Input
                  placeholder="Enter category"
                  className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                />
              </Form.Item>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={handleCreateCancel}
                className="h-11 px-6 bg-white hover:bg-gray-100 text-black border border-gray-300 !py-6 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                htmlType="submit"
                loading={loading}
                className="h-11 px-6 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg"
              >
                Create Item
              </Button>
            </div>
          </Form>
        </Modal>

        <Modal
          title={
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold text-black">
                Update Inventory Item
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-black"
              >
                <span className="text-2xl"></span>
              </button>
            </div>
          }
          open={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          className="inventory-modal"
          width={800}
          styles={{
            content: {
              background: "#ffffff",
              padding: "24px",
              borderRadius: "8px",
            },
          }}
        >
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            className="pt-4"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <Form.Item
                  name="item_name"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Item Name{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please enter item name" },
                  ]}
                >
                  <Input
                    placeholder="Enter item name"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>

                <Form.Item
                  name="brand"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Brand{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[{ required: true, message: "Please enter brand" }]}
                >
                  <Input
                    placeholder="Enter brand"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="item_description"
                label={
                  <div className="flex text-black">
                    <span className="text-red-500"></span> Description{" "}
                    <span className="text-red-500 ml-1"></span>
                  </div>
                }
                rules={[
                  { required: true, message: "Please enter description" },
                ]}
              >
                <TextArea
                  placeholder="Enter item description"
                  className="bg-white rounded-lg px-4 py-2 border border-gray-300"
                  rows={4}
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-6">
                <Form.Item
                  name="unit"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Unit{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please enter unit" },
                    {
                      pattern: /^[A-Za-z]+$/,
                      message:
                        "Unit must contain only letters (no numbers or symbols)",
                    },
                  ]}
                >
                  <Input
                    placeholder="e.g., kg, pcs"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>

                <Form.Item
                  name="restock_level"
                  label={
                    <div className="flex text-black">
                      <span className="text-red-500"></span> Restock Level{" "}
                      <span className="text-red-500 ml-1"></span>
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please enter restock level" },
                  ]}
                >
                  <Input
                    type="number"
                    placeholder="Enter restock level"
                    className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="category"
                label={
                  <div className="flex text-black">
                    <span className="text-red-500"></span> Category{" "}
                    <span className="text-red-500 ml-1"></span>
                  </div>
                }
                rules={[{ required: true, message: "Please enter category" }]}
              >
                <Input
                  placeholder="Enter category"
                  className="h-12 bg-white rounded-lg px-4 border border-gray-300"
                />
              </Form.Item>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={handleCancel}
                className="h-11 px-6 bg-white hover:bg-gray-100 text-black border border-gray-300 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                htmlType="submit"
                loading={loading}
                className="h-11 px-6 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg"
              >
                Update Item
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Release Modal */}
      </div>

      <style>{`
        .inventory-table .ant-table {
          background: white;
          color: #333;
        }
        .inventory-table .ant-table-thead > tr > th {
          background: #f5f5f5;
          color: #333;
          border-bottom: 1px solid #e8e8e8;
          font-size: 20px;
          font-weight: 600;
        }
        .inventory-table .ant-table-tbody > tr > td {
          background: white;
          border-bottom: 1px solid #f0f0f0;
          color: #333;
          font-size: 18px;
        }
        .inventory-table .ant-table-tbody > tr:hover > td {
          background: #f9f9f9 !important;
        }
        .inventory-modal .ant-modal-content {
          background: white;
          color: #333;
          border-radius: 8px;
        }
        .inventory-modal .ant-modal-header {
          background: white;
          border-bottom: 1px solid #f0f0f0;
        }
        .inventory-modal .ant-modal-title {
          color: #333;
          font-size: 22px;
        }
        .inventory-modal .ant-modal-close {
          color: #333;
        }
        .inventory-modal label {
          color: #333 !important;
          font-size: 18px !important;
          font-weight: 500;
        }
        .inventory-modal .ant-form-item-explain-error {
          color: #ff4d4f;
          margin-top: 4px;
          font-size: 14px;
        }
        .inventory-modal .ant-input-number-handler-wrap {
          background: white;
          border-left: 1px solid #e5e7eb;
        }
        .inventory-modal .ant-input-number-handler {
          border-color: #e5e7eb;
        }
        .inventory-modal .ant-input-number-handler-up-inner,
        .inventory-modal .ant-input-number-handler-down-inner {
          color: #333;
        }
        .inventory-modal .ant-input::placeholder,
        .inventory-modal .ant-input-number-input::placeholder,
        .inventory-modal .ant-input-textarea::placeholder {
          color: #999 !important;
          opacity: 1;
          font-size:18px !important;
        }
        .inventory-modal .ant-input-number {
          width: 100% !important;
        }
        .inventory-modal .ant-input-number-input {
          height: 48px !important;
          padding: 0 16px !important;
          font-size: 16px;
        }
        .inventory-modal .ant-select-selector {
          background-color: white !important;
          border-color: #d9d9d9 !important;
          color: #333 !important;
          height: 48px !important;
          padding: 8px 16px !important;
          border-radius: 8px !important;
          font-size: 16px;
        }
        .inventory-modal .ant-select-selection-placeholder {
          color: #999 !important;
          line-height: 32px !important;
        }
        .inventory-modal .ant-select-selection-item {
          color: #333 !important;
          line-height: 32px !important;
        }
        .inventory-modal .ant-picker {
          background-color: white !important;
          border-color: #d9d9d9 !important;
          height: 48px;
          font-size: 16px;
        }
        .inventory-modal .ant-picker-input > input {
          color: #333 !important;
          font-size: 16px;
        }
        .inventory-modal .ant-picker-suffix {
          color: #999 !important;
        }
        .inventory-modal .ant-input {
          height: 48px;
          font-size: 16px;
          padding: 0 16px;
        }
        .inventory-modal .ant-input-number {
          background-color: white !important;
          border-color: #d9d9d9 !important;
        }
        .inventory-modal .ant-input-number-input {
          color: #333 !important;
        }
        .inventory-modal .ant-btn {
          font-size: 16px;
          height: 48px;
        }
        .inventory-modal .ant-form-item-label > label {
          color: #333 !important;
          font-weight: 500;
          font-size: 16px;
        }
        .inventory-modal .ant-textarea {
          font-size: 16px;
          padding: 12px 16px;
        }
      `}</style>
    </div>
  );
};

export default InventoryManagement;
