import { useMemo } from 'react';

export default function useCardRecommendations({
    mccCode,
    amount,
    date,
    rules,
    cards, // Pass cards directly
    monthlySummary,
    monthlyCategorySummary,
    getCurrentCashbackMonthForCard
}) {
    // 1. Move cardMap logic inside the hook
    const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

    // 2. Move rankedCards logic inside the hook
    const rankedCards = useMemo(() => {
        if (!mccCode || !/^\d{4}$/.test(mccCode)) return [];

        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));

        return rules
            .filter(rule => rule.mccCodes && rule.mccCodes.split(',').map(c => c.trim()).includes(mccCode))
            .map(rule => {
                const card = cardMap.get(rule.cardId);
                if (!card || card.status !== 'Active') return null;

                const monthForCard = getCurrentCashbackMonthForCard(card, date);
                const cardMonthSummary = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);
                const categorySummaryId = `${monthForCard} - ${rule.ruleName}`;
                const categoryMonthSummary = monthlyCategorySummary.find(s => s.summaryId === categorySummaryId && s.cardId === card.id);

                // --- NEW TIERED LOGIC ---
                const currentMonthSpend = cardMonthSummary?.spend || 0;
                const isTier2Met = card.cashbackType === '2 Tier' && card.tier2MinSpend > 0 && currentMonthSpend >= card.tier2MinSpend;

                // Determine effective rate and limits based on tier
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
                    
                    // NEW Transaction Limit Logic
                    let cap = rule.transactionLimit;
                    // Check for secondary criteria (e.g., "Max 10k, but max 5k for txns > 1M")
                    if (rule.secondaryTransactionCriteria > 0 && numericAmount >= rule.secondaryTransactionCriteria) {
                        cap = rule.secondaryTransactionLimit;
                    }
                    // Apply the determined cap
                    if (cap > 0) {
                        calculatedCashback = Math.min(calculatedCashback, cap);
                    }
                }

                return {
                    rule,
                    card,
                    calculatedCashback,
                    isMinSpendMet: isMinSpendMet,
                    isCategoryCapReached: isCategoryCapReached,
                    isMonthlyCapReached: isMonthlyCapReached,
                    remainingCategoryCashback,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                // Sorting logic remains the same
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

    // 3. Return the calculated data
    return rankedCards;
}