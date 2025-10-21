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

                // This is your updated logic from our last conversation
                const categoryLimit = categoryMonthSummary?.categoryLimit || rule.categoryLimit || Infinity;
                const currentCategoryCashback = categoryMonthSummary?.cashback || 0;
                const remainingCategoryCashback = categoryLimit - currentCategoryCashback;
                const isCategoryCapReached = isFinite(categoryLimit) && currentCategoryCashback >= categoryLimit;

                let calculatedCashback = null;
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    calculatedCashback = numericAmount * rule.rate;
                    if (rule.capPerTransaction > 0) {
                        calculatedCashback = Math.min(calculatedCashback, rule.capPerTransaction);
                    }
                }

                return {
                    rule,
                    card,
                    calculatedCashback,
                    isMinSpendMet: card.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= card.minimumMonthlySpend : true,
                    isCategoryCapReached: isCategoryCapReached,
                    isMonthlyCapReached: (card.overallMonthlyLimit || 0) > 0 ? (cardMonthSummary?.cashback || 0) >= card.overallMonthlyLimit : false,
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

    // 3. Return the calculated data
    return rankedCards;
}