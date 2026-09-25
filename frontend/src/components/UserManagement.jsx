import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from 'react-toastify';
import {
  FaUserPlus,
  FaFilter,
  FaEdit,
  FaTrash,
  FaPrint,
  FaFilePdf,
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "customer",
    address: "",
    phone_number: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const fetchUsers = async () => {
    try {
      let response;
      if (selectedRole === "all") {
        response = await axios.get("http://localhost:3000/api/users/users", {
          withCredentials: true,
        });
      } else {
        response = await axios.get(
          `http://localhost:3000/api/users/users/role/${selectedRole}`,
          {
            withCredentials: true,
          }
        );
      }
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleRoleFilter = (role) => {
    setSelectedRole(role);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/register",
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          address: formData.address,
          phone_number: formData.phone_number,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      // Show success message
      toast.success("✅ User created successfully!");
      
      setShowAddUser(false);
      setFormData({
        first_name: "",
        last_name: "",
        address: "",
        phone_number: "",
        email: "",
        password: "",
        role: "customer",
      });

      fetchUsers();
    } catch (error) {
      // Handle specific error messages from the backend
      const errorMessage = error.response?.data?.message || "Error creating user";
      
      if (errorMessage.includes("Email already in use")) {
        toast.error("🚨 This email is already registered!");
      } else if (errorMessage.includes("Phone number already in use")) {
        toast.error("🚨 This phone number is already registered!");
      } else {
        toast.error(errorMessage);
      }
      
      console.error(
        "Error creating user:",
        error.response?.data || error.message
      );
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone_number: user.phone_number,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:3000/api/users/users/${editingUser.user_id}`,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          address: formData.address,
          phone_number: formData.phone_number,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      setShowEditModal(false);
      setEditingUser(null);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "customer",
        address: "",
        phone_number: "",
      });
      fetchUsers();
    } catch (error) {
      console.error(
        "Error updating user:",
        error.response?.data || error.message
      );
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:3000/api/users/users/${userId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        fetchUsers();
      } catch (error) {
        console.error(
          "Error deleting user:",
          error.response?.data || error.message
        );
      }
    }
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    printWindow.document.write(`
      <html>
        <head>
          <title>User Management Report</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: white;
            }
            .report-container {
              max-width: 100%;
              margin: 0 auto;
            }
            .report-header {
              text-align: center;
              margin-bottom: 20px;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .report-subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 5px;
            }
            .report-date {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .report-filter {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .table-container {
              width: 100%;
              overflow-x: auto;
              margin-top: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              background-color: white;
            }
            th {
              background-color: #f8f9fa;
              color: #333;
              font-weight: bold;
              text-align: left;
              padding: 12px;
              border: 1px solid #dee2e6;
            }
            td {
              padding: 12px;
              border: 1px solid #dee2e6;
              color: #333;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .role-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              color: white;
              text-transform: capitalize;
            }
            .admin { background-color: #dc3545; }
            .manager { background-color: #ffc107; color: #000; }
            .cashier { background-color: #28a745; }
            .customer { background-color: #17a2b8; }
            .report-footer {
              margin-top: 30px;
              text-align: right;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              .report-header {
                background-color: white;
                border: 1px solid #dee2e6;
              }
              th {
                background-color: #f8f9fa !important;
                color: #333 !important;
                -webkit-print-color-adjust: exact;
              }
              tr:nth-child(even) {
                background-color: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="report-header">
              <div class="report-title">User Management Report</div>
              <div class="report-subtitle">Hot & Fast Restaurant</div>
              <div class="report-date">Generated on: ${currentDate} at ${currentTime}</div>
              <div class="report-filter">Filter: ${
                selectedRole === "all"
                  ? "All Roles"
                  : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
              }</div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredUsers
                    .map(
                      (user) => `
                    <tr>
                      <td>${user.first_name} ${user.last_name}</td>
                      <td>${user.email}</td>
                      <td><span class="role-badge ${user.role}">${user.role}</span></td>
                      <td>${user.phone_number}</td>
                      <td>${user.address}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="report-footer">
              <div>Total Users: ${filteredUsers.length}</div>
              <div>Report generated by Hot & Fast Restaurant Management System</div>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const generatePDF = () => {
    try {
      // Create new document
      const doc = new jsPDF();

      // Add company header
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text("Hot & Fast", 15, 20);

      // Add report title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text("User Management Report", 15, 30);

      // Add date and filter info
      doc.setFontSize(12);
      doc.text(
        `Generated on: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`,
        15,
        40
      );
      doc.text(
        `Filter: ${
          selectedRole === "all"
            ? "All Roles"
            : selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)
        }`,
        15,
        47
      );

      // Add summary box
      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(240, 248, 255);
      doc.rect(15, 52, 180, 20, "F");
      doc.setFontSize(11);
      doc.text("Summary", 20, 60);
      doc.setFontSize(10);
      doc.text(`Total Users: ${filteredUsers.length}`, 20, 67);

      // Add user details table
      const tableData = filteredUsers.map((user) => [
        `${user.first_name} ${user.last_name}`,
        user.email,
        user.role,
        user.phone_number,
        user.address,
      ]);

      autoTable(doc, {
        startY: 75,
        head: [["Name", "Email", "Role", "Phone", "Address"]],
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
          0: { halign: "left" },
          1: { halign: "left" },
          2: {
            halign: "center",
            fontStyle: "bold",
            textColor: (cell) => {
              if (cell.text === "admin") return [220, 53, 69];
              if (cell.text === "manager") return [255, 193, 7];
              if (cell.text === "cashier") return [40, 167, 69];
              return [23, 162, 184];
            },
          },
          3: { halign: "left" },
          4: { halign: "left" },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: 75, left: 15, right: 15 },
        didDrawPage: function (data) {
          // Add footer on each page
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

      // Save the PDF
      doc.save(`user_report_${dayjs().format("YYYY-MM-DD")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-8xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <div className="flex gap-4">
            <button
              onClick={handlePrintReport}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-lg"
            >
              <FaPrint /> Print Report
            </button>
            <button
              onClick={generatePDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-lg"
            >
              <FaFilePdf /> Download PDF
            </button>
            <button
              onClick={() => setShowAddUser(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-lg"
            >
              <FaUserPlus /> Add User
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
          <div className="flex items-center gap-4 mb-4">
            <FaFilter className="text-gray-500" />
            <select
              value={selectedRole}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="bg-white text-black px-4 py-2 rounded-lg border border-gray-300 text-lg"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full user-table">
              <thead>
                <tr className="text-left border-b border-gray-300">
                  <th className="pb-4 text-xl font-semibold">Name</th>
                  <th className="pb-4 text-xl font-semibold">Email</th>
                  <th className="pb-4 text-xl font-semibold">Role</th>
                  <th className="pb-4 text-xl font-semibold">Phone</th>
                  <th className="pb-4 text-xl font-semibold">Address</th>
                  <th className="pb-4 text-xl font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.user_id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="py-4 text-lg">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-4 text-lg">{user.email}</td>
                    <td className="py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          user.role === "admin"
                            ? "bg-red-500"
                            : user.role === "manager"
                            ? "bg-yellow-500"
                            : user.role === "cashier"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        } text-white`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 text-lg">{user.phone_number}</td>
                    <td className="py-4 text-lg">{user.address}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit size={25} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash size={25} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAddUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-center mb-4 text-black">
                Add New User
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-6">
                  <label className="block text-lg font-medium mb-1 text-black">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    pattern="^[A-Za-z]+$"
                    title="Only letters are allowed"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    pattern="^[A-Za-z]+$"
                    title="Only letters are allowed"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    pattern="^0[0-9]{9}$"
                    title="Phone number must start with 0 and be exactly 10 digits"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 text-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-lg"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-black">Edit User</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1 text-black">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-black"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      setFormData({
                        first_name: "",
                        last_name: "",
                        email: "",
                        password: "",
                        role: "customer",
                        address: "",
                        phone_number: "",
                      });
                    }}
                    className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 text-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-lg"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </motion.div>

      <style>{`
        .user-table table {
          background-color: white;
          color: black;
          border-collapse: collapse;
          width: 100%;
        }
        
        .user-table th {
          background-color: #f8f9fa;
          color: #333;
          border-bottom: 1px solid #dee2e6;
          padding: 12px;
          font-size: 20px;
          font-weight: bold;
        }
        
        .user-table td {
          background-color: white;
          border-bottom: 1px solid #dee2e6;
          padding: 12px;
          font-size: 18px;
          color: #333;
        }
        
        .user-table tr:hover td {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default UserManagement;
