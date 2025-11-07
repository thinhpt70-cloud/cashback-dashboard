import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // You may need to create this file for styling
import CashbackDashboard from './CashbackDashboard'; // Imports your main component
import { ThemeProvider } from "./components/ui/theme-provider"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <CashbackDashboard />
    </ThemeProvider>
  </React.StrictMode>
);
