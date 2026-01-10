import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// import CashbackDashboard from './CashbackDashboard';
import { ThemeProvider } from "./components/ui/theme-provider"
import CashbackTracker from './components/dashboard/cashback/CashbackTracker';

// Mock Data
const mockCards = [
    { id: 'c1', name: 'Test Visa', bank: 'HSBC', overallMonthlyLimit: 1000000, statementDay: 15 },
    { id: 'c2', name: 'Test Master', bank: 'Citi', overallMonthlyLimit: 2000000, statementDay: 1 }
];
const mockMonthlySummary = [
    {
        id: 's1', cardId: 'c1', month: '2023-10',
        actualCashback: 150000, adjustment: 0,
        amountRedeemed: 0, notes: ''
    },
    {
        id: 's2', cardId: 'c2', month: '2023-10',
        actualCashback: 50000, adjustment: 0,
        amountRedeemed: 50000, notes: ''
    }
];

// 1. Lifetime Earnings = 150k + 50k = 200k
// 2. Total Redeemed = 50k
// 3. Cash Pending = 150k
// 4. Points Available = 0 (assuming these are cash cards)

const TestWrapper = () => {
    return (
         <div className="p-10">
            <h1 className="text-2xl font-bold mb-5">Verification Mode</h1>
            <CashbackTracker
                cards={mockCards}
                monthlySummary={mockMonthlySummary}
                rules={[]}
                monthlyCategorySummary={[]}
            />
         </div>
    )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TestWrapper />
    </ThemeProvider>
  </React.StrictMode>
);
