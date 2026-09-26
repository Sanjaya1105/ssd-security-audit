import React from 'react';
import CashierSidebar from './CashierSidebar';
import RequireRole from './RequireRole';

const CashierLayout = ({ children }) => {
  return (
    <RequireRole roles={['cashier', 'admin', 'manager']}>
      <div className="min-h-screen bg-white">
        <CashierSidebar />
        <div className="ml-72 p-8">
          {children}
        </div>
      </div>
    </RequireRole>
  );
};

export default CashierLayout;
