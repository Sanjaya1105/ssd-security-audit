// App.js or YourComponent.js
import React from 'react';
import { Table } from 'antd';
import '../styles/tableStyle.css'; // ✅ Adjust path if file is in a subfolder like ./styles/


const SimpleAntTable = () => {
  // Table Data
  const dataSource = [
    {
      key: '1',
      name: 'John Doe',
      age: 32,
      address: 'Colombo, Sri Lanka',
    },
    {
      key: '2',
      name: 'Jane Smith',
      age: 28,
      address: 'Kandy, Sri Lanka',
    },
  ];

  // Table Columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
        title: 'Imesh',
        dataIndex: 'address',
        key: 'address',
      },
  ];

  return (
    <div className="custom-table">
      <Table dataSource={dataSource} columns={columns} pagination={false} />
    </div>
  );
};

export default SimpleAntTable;