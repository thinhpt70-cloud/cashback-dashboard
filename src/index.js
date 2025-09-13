import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // You may need to create this file for styling
import CashbackDashboard from './CashbackDashboard'; // Imports your main component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CashbackDashboard />
  </React.StrictMode>
);
