import React from 'react';
import AdminSidebar from './AdminSidebar';
import RequireRole from './RequireRole';

const AdminLayout = ({ children }) => {
  return (
    <RequireRole roles={['admin', 'manager']}>
      <div className="min-h-screen bg-white">
        <AdminSidebar />
        <div className="ml-72 p-8">
          {children}
        </div>
      </div>
    </RequireRole>
  );
};

export default AdminLayout;
