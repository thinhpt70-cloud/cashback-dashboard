
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import CashbackDashboard from './CashbackDashboard';
import { ThemeProvider } from './components/ui/theme-provider';

// Mock the API calls
jest.mock('./hooks/useCashbackData', () => ({
  __esModule: true,
  default: () => ({
    cards: [],
    rules: [],
    monthlySummary: [],
    mccMap: {},
    monthlyCategorySummary: [],
    recentTransactions: [],
    allCategories: [],
    commonVendors: [],
    reviewTransactions: [],
    loading: false,
    error: null,
    refreshData: jest.fn(),
    setRecentTransactions: jest.fn(),
    setReviewTransactions: jest.fn(),
    cashbackRules: [],
    monthlyCashbackCategories: [],
    liveSummary: {},
  }),
}));

describe('CashbackDashboard', () => {
  it('should toggle dark mode when the theme toggle button is clicked', () => {
    render(
      <ThemeProvider>
        <CashbackDashboard />
      </ThemeProvider>
    );

    // Check that the toggle button is rendered
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();

    // Check that the html element does not have the dark class by default
    expect(document.documentElement).not.toHaveClass('dark');

    // Click the toggle button to open the dropdown
    fireEvent.click(toggleButton);

    // Click the "Dark" menu item
    const darkMenuItem = screen.getByText('Dark');
    fireEvent.click(darkMenuItem);

    // Check that the html element now has the dark class
    expect(document.documentElement).toHaveClass('dark');

    // Click the toggle button again to open the dropdown
    fireEvent.click(toggleButton);

    // Click the "Light" menu item
    const lightMenuItem = screen.getByText('Light');
    fireEvent.click(lightMenuItem);

    // Check that the html element no longer has the dark class
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
