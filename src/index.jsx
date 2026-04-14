import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css'; // You may need to create this file for styling
import TestApp from './TestApp'; // Imports your main component
import { ThemeProvider } from "./components/ui/theme-provider"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TestApp />
    </ThemeProvider>
  </React.StrictMode>
);
