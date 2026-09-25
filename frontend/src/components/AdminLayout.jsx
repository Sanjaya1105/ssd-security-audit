import React from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar />
      <div className="ml-72 p-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout; 