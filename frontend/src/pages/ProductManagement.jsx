import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ImageUpload from "../components/ImageUpload";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInactiveProducts, setShowInactiveProducts] = useState(false);
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    selling_price: "",
    category: "",
    unit: "",
    image_url: "",
    isActive: true,
    min_production_amount: 1
  });
  const [editFormData, setEditFormData] = useState({
    product_name: "",
    description: "",
    selling_price: "",
    category: "",
    unit: "",
    image_url: "",
    isActive: true,
    min_production_amount: 1
  });

  // Authentication check on component mount
  useEffect(() => {
    fetchProducts();
  }, [showInactiveProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/products?showInactive=${showInactiveProducts}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      setProducts(response.data);
    } catch (err) {
      console.error("Fetch products error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 401) {
      navigate("/login");
    } else if (err.response?.status === 403) {
      setError("You do not have permission to perform this action");
      toast.error("Permission denied");
    } else if (err.code === "ERR_NETWORK") {
      setError(
        "Unable to connect to server. Please check your internet connection."
      );
      toast.error("Network connection error");
    } else {
      const errorMessage =
        err.response?.data?.message || "An error occurred. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleImageUpload = (uploadedImageUrl) => {
    if (uploadedImageUrl) {
      setImageUrl(uploadedImageUrl);
      setFormData((prev) => ({
        ...prev,
        image_url: uploadedImageUrl,
      }));
    } else {
      toast.error("Failed to upload image");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.product_name.trim()) return "Product name is required";
    if (!formData.description.trim()) return "Description is required";
    if (!formData.selling_price || formData.selling_price <= 0)
      return "Valid selling price is required";
    if (!formData.category.trim()) return "Category is required";
    if (!formData.unit.trim()) return "Unit is required";
    if (!imageUrl && !formData.image_url)
      return "Please upload a product image";
    if (!formData.min_production_amount || formData.min_production_amount < 1)
      return "Minimum production amount must be at least 1";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:3000/api/products",
        formData,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        toast.success("Product created successfully");
        resetForm();
        fetchProducts();
      }
    } catch (err) {
      console.error("Product creation error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (productId, updatedData) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:3000/api/products/${productId}`,
        updatedData,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        toast.success(response.data.message);
        setShowEditModal(false);
        setEditingProduct(null);
        resetForm();
        fetchProducts();
      }
    } catch (err) {
      console.error("Update product error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (product) => {
    try {
      setLoading(true);
      await handleUpdateProduct(product.product_id, {
        isActive: !product.isActive,
      });
    } catch (err) {
      console.error("Toggle status error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      description: "",
      selling_price: "",
      category: "",
      unit: "",
      image_url: "",
      isActive: true,
      min_production_amount: 1
    });
    setEditFormData({
      product_name: "",
      description: "",
      selling_price: "",
      category: "",
      unit: "",
      image_url: "",
      isActive: true,
      min_production_amount: 1
    });
    setImageUrl("");
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8"
        >
          Product Management
        </motion.h1>

        {/* Toggle for showing inactive products */}
        <div className="mb-6 flex items-center gap-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showInactiveProducts}
              onChange={(e) => setShowInactiveProducts(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                showInactiveProducts ? "bg-green-500" : "bg-gray-400"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transform transition-transform duration-300 ${
                  showInactiveProducts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
            <span className="ml-3 text-lg">Show Inactive Products</span>
          </label>
        </div>

        {/* Add Product Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-md"
        >
          <h2 className="text-2xl font-semibold mb-4">Add New Product</h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  pattern="[A-Za-z\s]+"
                  title="Only letters are allowed"
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  Selling Price
                </label>
                <input
                  type="number"
                  name="selling_price"
                  value={formData.selling_price}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  required
                  min="25"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  Minimum Production Amount
                </label>
                <input
                  type="number"
                  name="min_production_amount"
                  value={formData.min_production_amount}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  required
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium mb-2">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  pattern="[A-Za-z\s]+"
                  title="Only letters are allowed"
                  onChange={handleInputChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-2">
                  Product Image
                </label>
                <ImageUpload onImageUpload={handleImageUpload} />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Product preview"
                    className="mt-2 w-32 h-32 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Products List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md product-table">
          <h2 className="text-2xl font-semibold mb-4">Products List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <motion.div
                key={product.product_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border border-gray-200 rounded-lg p-4 relative shadow-sm ${
                  !product.isActive ? "opacity-75" : ""
                }`}
              >
                <img
                  src={product.image_url}
                  alt={product.product_name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => toggleProductStatus(product)}
                    className={`p-2 rounded-full ${
                      product.isActive
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    } hover:bg-opacity-30 transition-all duration-300`}
                    title={
                      product.isActive
                        ? "Deactivate Product"
                        : "Activate Product"
                    }
                  >
                    {product.isActive ? (
                      <FaToggleOn size={20} />
                    ) : (
                      <FaToggleOff size={20} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setEditFormData(product);
                      setShowEditModal(true);
                    }}
                    className="p-2 rounded-full bg-blue-500/20 text-blue-500 hover:bg-opacity-30 transition-all duration-300"
                  >
                    <FaEdit size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">
                    {product.product_name}
                  </h3>
                  <p className="text-gray-600 text-lg line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-semibold text-lg">
                      Rs.{Math.floor(product.selling_price)}
                    </span>
                    <span className="text-lg text-gray-600">
                      {product.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg text-gray-600">
                      {product.category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-base ${
                        product.isActive
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold mb-4">Edit Product</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateProduct(editingProduct.product_id, editFormData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-lg font-medium mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={editFormData.product_name}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lg font-medium mb-2">
                      Selling Price
                    </label>
                    <input
                      type="number"
                      name="selling_price"
                      value={editFormData.selling_price}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-medium mb-2">
                      Minimum Production Amount
                    </label>
                    <input
                      type="number"
                      name="min_production_amount"
                      value={editFormData.min_production_amount}
                      onChange={(e) =>
                        setEditFormData((prev) => ({
                          ...prev,
                          [e.target.name]: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      required
                      min="1"
                      step="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editFormData.category}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium mb-2">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={editFormData.unit}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        [e.target.name]: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium mb-2">
                    Product Image
                  </label>
                  <ImageUpload
                    onImageUpload={(url) =>
                      setEditFormData((prev) => ({ ...prev, image_url: url }))
                    }
                  />
                  {editFormData.image_url && (
                    <img
                      src={editFormData.image_url}
                      alt="Product preview"
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProduct(null);
                      resetForm();
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-black transition-colors duration-300 text-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300 text-lg"
                  >
                    {loading ? "Updating..." : "Update Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </div>

      <style>{`
        .product-table .ant-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .product-table .ant-table-thead > tr > th {
          background-color: #f8f9fa;
          color: #333;
          font-size: 20px;
          font-weight: 600;
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .product-table .ant-table-tbody > tr > td {
          font-size: 18px;
          padding: 16px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .product-table .ant-table-tbody > tr:hover {
          background-color: #f1f3f5;
        }
        
        .product-table .ant-pagination {
          margin: 16px 0;
        }
        
        .product-table .ant-pagination-item {
          border-radius: 4px;
          font-size: 16px;
        }
        
        .product-table .ant-pagination-item-active {
          background-color: #1890ff;
          border-color: #1890ff;
        }
        
        .product-table .ant-pagination-item-active a {
          color: white;
        }
        
        .product-table .ant-select {
          font-size: 16px;
        }
        
        .product-table .ant-empty-description {
          font-size: 18px;
          color: #6c757d;
        }
      `}</style>
    </div>
  );
};

export default ProductManagement;
