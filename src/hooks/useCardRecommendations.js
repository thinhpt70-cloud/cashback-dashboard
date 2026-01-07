import { useMemo } from 'react';

export default function useCardRecommendations({
    mccCode,
    amount,
    date,
    rules,
    cards,
    monthlySummary,
    monthlyCategorySummary,
    getCurrentCashbackMonthForCard
}) {
    // 1. Map setup
    const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

    // 2. Main Logic
    const rankedCards = useMemo(() => {
        // Basic validation
        if (!mccCode || !/^\d{4}$/.test(mccCode)) return [];

        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));

        // Helper: Safely parse "1234, 5678" strings or single numbers into an array
        const safeSplit = (val) => {
            if (typeof val === 'string') return val.split(',').map(c => c.trim());
            if (typeof val === 'number') return [String(val)]; // Handle single numeric codes
            return []; // Return empty array for null/undefined
        };

        return rules
            .filter(rule => {
                // --- UPDATED SAFE PARSING ---
                const ruleMccCodes = safeSplit(rule.mccCodes);
                const ruleExcludedCodes = safeSplit(rule.excludedMccCodes);
                // ----------------------------

                const isSpecificMatch = ruleMccCodes.includes(mccCode);
                const isBroadRule = rule.isDefault || ruleMccCodes.length === 0;

                // Match specific code OR broad rule (unless excluded)
                return isSpecificMatch || (isBroadRule && !ruleExcludedCodes.includes(mccCode));
            })
            .map(rule => {
                const card = cardMap.get(rule.cardId);
                if (!card || card.status !== 'Active') return null;

                const monthForCard = getCurrentCashbackMonthForCard(card, date);
                const cardMonthSummary = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);
                const categorySummaryId = `${monthForCard} - ${rule.ruleName}`;
                const categoryMonthSummary = monthlyCategorySummary.find(s => s.summaryId === categorySummaryId && s.cardId === card.id);

                // --- TIERED LOGIC ---
                const currentMonthSpend = cardMonthSummary?.spend || 0;
                const isTier2Met = card.cashbackType === '2 Tier' && card.tier2MinSpend > 0 && currentMonthSpend >= card.tier2MinSpend;

                // Effective Rates & Limits
                const effectiveRate = isTier2Met && rule.tier2Rate ? rule.tier2Rate : rule.rate;
                const effectiveCategoryLimit = (isTier2Met && rule.tier2CategoryLimit) ? rule.tier2CategoryLimit : rule.categoryLimit;
                const effectiveMonthlyLimit = (isTier2Met && card.tier2Limit) ? card.tier2Limit : card.overallMonthlyLimit;

                // Category Cap
                const currentCategoryCashback = categoryMonthSummary?.cashback || 0;
                const remainingCategoryCashback = (effectiveCategoryLimit > 0) ? effectiveCategoryLimit - currentCategoryCashback : Infinity;
                const isCategoryCapReached = (effectiveCategoryLimit > 0) && currentCategoryCashback >= effectiveCategoryLimit;

                // Overall Card Cap
                const isMonthlyCapReached = (effectiveMonthlyLimit > 0) ? (cardMonthSummary?.cashback || 0) >= effectiveMonthlyLimit : false;

                // Min Spend
                const isMinSpendMet = card.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= card.minimumMonthlySpend : true;
                
                // Calculate Cashback
                let calculatedCashback = null;
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    calculatedCashback = numericAmount * effectiveRate;
                    
                    let cap = rule.transactionLimit;
                    if (rule.secondaryTransactionCriteria > 0 && numericAmount >= rule.secondaryTransactionCriteria) {
                        cap = rule.secondaryTransactionLimit;
                    }
                    if (cap > 0) {
                        calculatedCashback = Math.min(calculatedCashback, cap);
                    }
                }

                return {
                    rule,
                    card,
                    calculatedCashback,
                    isMinSpendMet,
                    isCategoryCapReached,
                    isMonthlyCapReached,
                    remainingCategoryCashback,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const isACapped = a.isMonthlyCapReached || a.isCategoryCapReached;
                const isBCapped = b.isMonthlyCapReached || b.isCategoryCapReached;
                if (isACapped !== isBCapped) return isACapped ? 1 : -1;
                if (a.isMinSpendMet !== b.isMinSpendMet) return a.isMinSpendMet ? -1 : 1;
                if (!isNaN(numericAmount)) {
                    const cashbackDiff = (b.calculatedCashback || 0) - (a.calculatedCashback || 0);
                    if (cashbackDiff !== 0) return cashbackDiff;
                }
                return b.rule.rate - a.rule.rate;
            });
    }, [mccCode, amount, rules, cardMap, monthlySummary, monthlyCategorySummary, getCurrentCashbackMonthForCard, date]);

    return rankedCards;
}