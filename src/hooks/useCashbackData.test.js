import { renderHook, act } from '@testing-library/react';
import useCashbackData from './useCashbackData';

// Mock global fetch
global.fetch = jest.fn();

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock lib/date
jest.mock('../lib/date', () => ({
  getCurrentCashbackMonthForCard: jest.fn(),
  getTodaysMonth: () => '2023-10',
  getPastNMonths: () => ['2023-09', '2023-08', '2023-07'],
}));

describe('useCashbackData', () => {
    beforeEach(() => {
        fetch.mockClear();
        fetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });
    });

    it('should fetch all data when skipStatic is false (default)', async () => {
        const { result } = renderHook(() => useCashbackData(true));

        // Wait for initial fetch to settle?
        // We can just trigger a manual refresh to be sure we capture the call we want.

        await act(async () => {
            await result.current.refreshData(true, false);
        });

        // Check if static endpoints were called
        const calls = fetch.mock.calls.map(call => call[0]);
        const hasStatic = calls.some(url => url.includes('/cards?includeClosed=true'));
        expect(hasStatic).toBe(true);
    });

    it('should NOT fetch static data when skipStatic is true', async () => {
        const { result } = renderHook(() => useCashbackData(true));

        fetch.mockClear();

        await act(async () => {
            await result.current.refreshData(true, true);
        });

        const calls = fetch.mock.calls.map(call => call[0]);
        const hasStatic = calls.some(url => url.includes('/cards?includeClosed=true'));
        expect(hasStatic).toBe(false);

        // Should still fetch dashboard content
        const hasDashboard = calls.some(url => url.includes('/monthly-summary'));
        expect(hasDashboard).toBe(true);
    });
});
