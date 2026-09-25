import React from 'react';
import CashierSidebar from './CashierSidebar';

const CashierLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-white">
      <CashierSidebar />
      <div className="ml-72 p-8">
        {children}
      </div>
    </div>
  );
};

export default CashierLayout; 