import React from 'react';
import { render, screen } from '@testing-library/react';
import AddTransactionForm from './AddTransactionForm';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../../../hooks/useCardRecommendations', () => ({
    __esModule: true,
    default: () => [],
}));

jest.mock('../../../hooks/useMediaQuery', () => ({
    __esModule: true,
    default: () => true, // Default to desktop
}));

describe('AddTransactionForm Edit Logic', () => {
    const mockCards = [
        { id: 'card1', name: 'Test Card', bank: 'Bank A' }
    ];
    const mockCategories = ['Food', 'Travel'];
    const mockRules = [];
    const mockMonthlyCategories = [];
    const mockMccMap = {};

    test('initializes Amount field with grossAmount if provided', () => {
        const initialData = {
            id: 'tx1',
            'Transaction Name': 'Test Merchant',
            'Amount': 80, // Final Amount
            'grossAmount': 100, // Base Amount
            'Transaction Date': '2023-10-01',
            'Card': ['card1'],
            'notes': '',
            'subCategory': [],
            'Category': 'Food'
        };

        render(
            <AddTransactionForm
                cards={mockCards}
                categories={mockCategories}
                rules={mockRules}
                monthlyCategories={mockMonthlyCategories}
                mccMap={mockMccMap}
                initialData={initialData}
                monthlySummary={[]}
                monthlyCategorySummary={[]}
                getCurrentCashbackMonthForCard={() => '202310'}
                onTransactionAdded={() => {}}
                onTransactionUpdated={() => {}}
                onClose={() => {}}
                needsSyncing={[]}
                setNeedsSyncing={() => {}}
                commonVendors={[]}
            />
        );

        // Check the Amount input value. It should be 100 (formatted).
        const amountInput = screen.getByPlaceholderText('0');
        expect(amountInput).toHaveValue('100');
    });

    test('initializes Amount field with Amount if grossAmount is missing (fallback)', () => {
        const initialData = {
            id: 'tx2',
            'Transaction Name': 'Test Merchant 2',
            'Amount': 50,
            // grossAmount missing
            'Transaction Date': '2023-10-01',
            'Card': ['card1'],
            'notes': '',
            'subCategory': [],
            'Category': 'Food'
        };

        render(
            <AddTransactionForm
                cards={mockCards}
                categories={mockCategories}
                rules={mockRules}
                monthlyCategories={mockMonthlyCategories}
                mccMap={mockMccMap}
                initialData={initialData}
                monthlySummary={[]}
                monthlyCategorySummary={[]}
                getCurrentCashbackMonthForCard={() => '202310'}
                onTransactionAdded={() => {}}
                onTransactionUpdated={() => {}}
                onClose={() => {}}
                needsSyncing={[]}
                setNeedsSyncing={() => {}}
                commonVendors={[]}
            />
        );

        const amountInput = screen.getByPlaceholderText('0');
        expect(amountInput).toHaveValue('50');
    });
});
