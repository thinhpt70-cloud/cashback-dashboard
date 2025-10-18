import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Sparkles, CalendarClock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import QuickAddButtons from './QuickAddButtons';
import CardRecommendations from './CardRecommendations';
import { useIOSKeyboardGapFix } from '../../hooks/useIOSKeyboardGapFix';
import MccSearchResultsDialog from './MccSearchResultsDialog';

export default function AddTransactionForm({ cards, categories, rules, monthlyCategories, mccMap, onTransactionAdded, commonVendors, monthlySummary, monthlyCategorySummary, getCurrentCashbackMonthForCard, onTransactionUpdated, initialData, onClose }) {
    // --- State Management ---
    const [merchant, setMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [cardId, setCardId] = useState('');
    const [category, setCategory] = useState('');
    const [mccCode, setMccCode] = useState('');
    const [merchantLookup, setMerchantLookup] = useState('');
    const [applicableRuleId, setApplicableRuleId] = useState('');
    const [cardSummaryCategoryId, setCardSummaryCategoryId] = useState('new');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupResults, setLookupResults] = useState([]);
    const [isLookupDialogOpen, setIsLookupDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLookupButton, setShowLookupButton] = useState(false);
    const [mccName, setMccName] = useState(''); 

    // --- NEW STATE FOR THE NEW FIELDS ---
    const [notes, setNotes] = useState('');
    const [otherDiscounts, setOtherDiscounts] = useState('');
    const [otherFees, setOtherFees] = useState('');
    const [foreignCurrencyAmount, setForeignCurrencyAmount] = useState('');
    const [conversionFee, setConversionFee] = useState('');
    const [paidFor, setPaidFor] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [billingDate, setBillingDate] = useState('');

    useIOSKeyboardGapFix();

    const amountInputRef = useRef(null);

    useEffect(() => {
        if (mccMap && mccCode && mccMap[mccCode]) {
            setMccName(mccMap[mccCode].vn);
        } else {
            setMccName('');
        }
    }, [mccCode, mccMap]);

    useEffect(() => {
        if (initialData) {
            // Automatically clean the "Email_" prefix for a better user experience
            let initialMerchant = initialData['Transaction Name'] || '';
            if (initialMerchant.startsWith('Email_')) {
                initialMerchant = initialMerchant.substring(6); // Remove "Email_"
            }

            setMerchant(initialData['Transaction Name'] || '');
            setAmount((initialData['Amount'] || '').toLocaleString('en-US'));
            setDate(initialData['Transaction Date'] || new Date().toISOString().slice(0, 10));
            setCardId(initialData['Card'] ? initialData['Card'][0] : '');
            setApplicableRuleId(initialData['Applicable Rule'] ? initialData['Applicable Rule'][0] : '');
            setCategory(initialData['Category'] || '');
            setMccCode(initialData['MCC Code'] || '');
            setMerchantLookup(initialData['merchantLookup'] || '');
            setNotes(initialData['notes'] || '');
            setOtherDiscounts((initialData['otherDiscounts'] || '').toLocaleString('en-US'));
            setOtherFees((initialData['otherFees'] || '').toLocaleString('en-US'));
            setForeignCurrencyAmount((initialData['foreignCurrencyAmount'] || '').toLocaleString('en-US'));
            setConversionFee((initialData['conversionFee'] || '').toLocaleString('en-US'));
            setPaidFor(initialData['paidFor'] || '');
            setSubCategory(initialData['subCategory'] || '');
            setBillingDate(initialData['billingDate'] || '');
            // Note: Rule and Summary Category IDs are not pre-filled as they are complex relations
            // and often need to be re-evaluated upon edit.
        }
    }, [initialData]);

    const handleVendorSelect = (vendor) => {
        setMerchant(vendor.transactionName || '');
        setMerchantLookup(vendor.merchant || '');
        setMccCode(vendor.mcc || '');
        setCategory(vendor.category || '');
        if (vendor.preferredCardId) setCardId(vendor.preferredCardId);
        if (vendor.preferredRuleId) setApplicableRuleId(vendor.preferredRuleId);
        else setApplicableRuleId('');
        setShowLookupButton(false);
        amountInputRef.current?.focus();
    };

    // --- Memoized Calculations ---
    const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cardId, cards]);
    const filteredRules = useMemo(() => {
        if (!cardId) return [];
        return rules.filter(rule => rule.cardId === cardId && rule.status === 'Active').sort((a, b) => a.name.localeCompare(b.name));
    }, [cardId, rules]);
    const selectedRule = useMemo(() => rules.find(r => r.id === applicableRuleId), [applicableRuleId, rules]);
    const cashbackMonth = useMemo(() => {
        if (!selectedCard || !date) return null;
        const transactionDate = new Date(date);
        const statementDay = selectedCard.statementDay;
        if (selectedCard.useStatementMonthForPayments) {
            const year = transactionDate.getFullYear();
            const month = transactionDate.getMonth() + 1;
            return `${year}${String(month).padStart(2, '0')}`;
        }
        let year = transactionDate.getFullYear();
        let month = transactionDate.getMonth();
        if (transactionDate.getDate() >= statementDay) month += 1;
        if (month > 11) { month = 0; year += 1; }
        const finalMonth = month + 1;
        return `${year}${String(finalMonth).padStart(2, '0')}`;
    }, [selectedCard, date]);
    
    const filteredSummaries = useMemo(() => {
        if (!selectedRule || !cardId || !cashbackMonth) return [];
        const targetSummaryId = `${cashbackMonth} - ${selectedRule.name}`;
        return monthlyCategories.filter(summary => summary.cardId === cardId && summary.summaryId === targetSummaryId);
    }, [cardId, monthlyCategories, selectedRule, cashbackMonth]);

    const estimatedCashbackAndWarnings = useMemo(() => {
        const result = { cashback: 0, warnings: [] };
        if (!selectedRule || !amount) return result;

        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        if (isNaN(numericAmount)) return result;
        
        const cardMonthSummary = monthlySummary.find(s => s.cardId === cardId && s.month === cashbackMonth);
        const categoryMonthSummary = monthlyCategorySummary.find(s => 
            s.cardId === cardId && 
            s.month === cashbackMonth && 
            s.summaryId.endsWith(selectedRule.name)
        );

        const dynamicLimit = cardMonthSummary?.monthlyCashbackLimit;
        const effectiveMonthlyLimit = dynamicLimit > 0 ? dynamicLimit : selectedCard?.overallMonthlyLimit;
        const isMonthlyCapReached = effectiveMonthlyLimit > 0 ? (cardMonthSummary?.cashback || 0) >= effectiveMonthlyLimit : false;
        
        const categoryLimit = categoryMonthSummary?.categoryLimit || Infinity;
        const isCategoryCapReached = isFinite(categoryLimit) && (categoryMonthSummary?.cashback || 0) >= categoryLimit;

        const isMinSpendMet = selectedCard?.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= selectedCard.minimumMonthlySpend : true;

        if (!isMinSpendMet) result.warnings.push("Minimum monthly spend not met for this card.");
        if (isMonthlyCapReached) result.warnings.push("Card's overall monthly cashback limit has been reached.");
        if (isCategoryCapReached) result.warnings.push("This specific category's cashback limit has been reached.");

        if (isMonthlyCapReached || isCategoryCapReached || !isMinSpendMet) {
            return result;
        }
        
        const calculatedCashback = numericAmount * selectedRule.rate;
        const cap = selectedRule.capPerTransaction;
        result.cashback = (cap > 0 && calculatedCashback > cap) ? cap : calculatedCashback;
        
        return result;
    }, [amount, selectedRule, cardId, cashbackMonth, monthlySummary, monthlyCategorySummary, selectedCard]);

    // --- Effects ---
    useEffect(() => {
        if (filteredSummaries.length > 0) setCardSummaryCategoryId(filteredSummaries[0].id);
        else setCardSummaryCategoryId('new');
    }, [filteredSummaries]);

    useEffect(() => {
        if (!initialData && cards.length > 0 && !cardId) {
            const lastUsedCardId = localStorage.getItem('lastUsedCardId');
            if (lastUsedCardId && cards.some(c => c.id === lastUsedCardId)) {
                setCardId(lastUsedCardId);
            } else {
                setCardId(cards[0].id);
            }
        }
    }, [cards, cardId, initialData]);

    const currencyFn = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        const cardMap = useMemo(() => new Map(cards.map(c => [c.id, c])), [cards]);

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
                
                const categoryLimit = categoryMonthSummary?.categoryLimit || Infinity;
                const remainingCategoryCashback = categoryLimit - (categoryMonthSummary?.cashback || 0);

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
                    isCategoryCapReached: (categoryMonthSummary?.categoryLimit || 0) > 0 ? (categoryMonthSummary?.cashback || 0) >= categoryMonthSummary.categoryLimit : false,
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

    // --- Handlers ---
    const resetForm = () => {
        setMerchant('');
        setAmount('');
        setCategory('');
        setMccCode('');
        setMerchantLookup('');
        setApplicableRuleId('');
        setCardSummaryCategoryId('new');
        setShowLookupButton(false);
        setNotes('');
        setOtherDiscounts('');
        setOtherFees('');
        setForeignCurrencyAmount('');
        setConversionFee('');
        setPaidFor('');
        setSubCategory('');
        setBillingDate('');
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) setAmount(Number(value).toLocaleString('en-US'));
        else if (value === '') setAmount('');
    };
    
    const handleFormattedNumericInput = (value, setter, allowDecimal = false) => {
        const cleanValue = String(value).replace(/,/g, '');

        if (cleanValue === '' || cleanValue === '-') {
            setter(cleanValue);
            return;
        }

        const regex = allowDecimal ? /^-?\d*\.?\d*$/ : /^-?\d+$/;
        if (regex.test(cleanValue) && cleanValue.length <= 15) {
            if (allowDecimal && cleanValue.endsWith('.')) {
                setter(cleanValue);
                return;
            }
            const num = parseFloat(cleanValue);
            if (!isNaN(num)) {
                setter(num.toLocaleString('en-US', { maximumFractionDigits: 2 }));
            }
        }
    };
    
    const handleMerchantLookup = async () => {
        if (!merchant) return;
        setIsLookingUp(true);
        setLookupResults([]);
        setShowLookupButton(false);

        try {
            const res = await fetch(`/api/lookup-merchant?keyword=${encodeURIComponent(merchant)}`);
            if (!res.ok) throw new Error("Server responded with an error.");
            
            const data = await res.json();
            const allResults = [...(data.history || []).map(item => (["Your History", item.merchant, item.mcc, mccMap[item.mcc]?.en || "Unknown", mccMap[item.mcc]?.vn || "Không rõ"])), ...(data.external || []).map(item => (["External Suggestion", item.merchant, item.mcc, mccMap[item.mcc]?.en || "Unknown", mccMap[item.mcc]?.vn || "Không rõ"]))];
            setLookupResults(allResults);

            if (data.bestMatch?.mcc && data.bestMatch?.merchant) {
                setMccCode(data.bestMatch.mcc);
                setMerchantLookup(data.bestMatch.merchant);
                toast.info("Auto-filled details based on best match.");
                if (allResults.length > 0) setShowLookupButton(true);
            } else if (allResults.length > 0) {
                setIsLookupDialogOpen(true);
            } else {
                toast.info("No transaction history or suggestions found.");
            }
        } catch (error) {
            console.error("Merchant Lookup Error:", error);
            toast.error("Could not perform merchant lookup.");
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // This data object is built once and used for both adding and editing.
        const transactionData = {
            merchant,
            amount: parseFloat(String(amount).replace(/,/g, '')),
            date,
            cardId,
            category: category || null,
            mccCode: mccCode || null,
            merchantLookup: merchantLookup || null,
            applicableRuleId: applicableRuleId || null,
            notes: notes || null,
            otherDiscounts: otherDiscounts ? parseFloat(String(otherDiscounts).replace(/,/g, '')) : null,
            otherFees: otherFees ? parseFloat(String(otherFees).replace(/,/g, '')) : null,
            foreignCurrencyAmount: foreignCurrencyAmount ? parseFloat(String(foreignCurrencyAmount).replace(/,/g, '')) : null,
            conversionFee: conversionFee ? parseFloat(String(conversionFee).replace(/,/g, '')) : null,
            paidFor: paidFor || null,
            subCategory: subCategory || null,
            billingDate: billingDate || null,
        };

        try {
            let response;
            let resultTransaction;

            if (initialData) {
                // --- EDIT MODE ---
                // If `initialData` exists, we send a PATCH request to update.
                response = await fetch(`/api/transactions/${initialData.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData),
                });

                if (!response.ok) {
                    throw new Error('Failed to update transaction');
                }

                resultTransaction = await response.json();
                toast.success("Transaction updated successfully!");
                onTransactionUpdated(resultTransaction); // Call the update handler

            } else {
                // --- ADD MODE ---
                // If `initialData` is null, we proceed with the logic to add a new transaction.
                let finalSummaryId = null;
                if (applicableRuleId && cardSummaryCategoryId === 'new') {
                    const summaryResponse = await fetch('/api/summaries', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cardId: cardId, month: cashbackMonth, ruleId: applicableRuleId }),
                    });
                    if (!summaryResponse.ok) throw new Error('Failed to create new monthly summary.');
                    const newSummary = await summaryResponse.json();
                    finalSummaryId = newSummary.id;
                } else if (applicableRuleId && cardSummaryCategoryId !== 'new') {
                    finalSummaryId = cardSummaryCategoryId;
                }
                
                response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...transactionData, cardSummaryCategoryId: finalSummaryId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to add transaction');
                }

                resultTransaction = await response.json();
                toast.success("Transaction added successfully!");
                onTransactionAdded(resultTransaction); // Call the add handler
                resetForm(); // Only reset the form on a new submission
            }

        } catch (error) {
            console.error('Error during transaction submission:', error);
            toast.error(`Failed to ${initialData ? 'update' : 'add'} transaction. Please try again.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCardSelect = (selectedCardId, selectedRuleId) => {
        setCardId(selectedCardId);
        setApplicableRuleId(selectedRuleId || ''); 
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                <QuickAddButtons vendors={commonVendors} onSelect={handleVendorSelect} />
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="merchant">Transaction Name</label>
                        <div className="relative flex items-center">
                            <Input id="merchant" value={merchant} onChange={(e) => { setMerchant(e.target.value); setShowLookupButton(false); }} required className="pr-12" />
                            <div className="absolute right-2 flex items-center gap-2">
                                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={handleMerchantLookup} disabled={!merchant || isLookingUp}>
                                    {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        {showLookupButton && (
                            <div className="pt-2">
                                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setIsLookupDialogOpen(true)}>
                                    View Other Suggestions
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="merchantLookup">Merchant Name</label>
                            <Input 
                                id="merchantLookup" 
                                value={merchantLookup} 
                                onChange={(e) => setMerchantLookup(e.target.value)} 
                                placeholder="e.g., GRAB, SHOPEE" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="mcc">MCC Code</label>
                            <Input 
                                id="mcc" 
                                value={mccCode} 
                                onChange={(e) => setMccCode(e.target.value)} 
                                placeholder="e.g., 5411" 
                            />
                            {mccName && <p className="text-xs text-muted-foreground pt-1">{mccName}</p>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="amount">Amount</label>
                            <Input ref={amountInputRef} id="amount" type="text" inputMode="numeric" value={amount} onChange={handleAmountChange} required />
                        </div>
                        {/* MODIFIED: Adopted the working code structure for the date field */}
                        <div className="space-y-2">
                            <label htmlFor="date">Date</label>
                            <div className="relative flex items-center">
                                <CalendarClock className="absolute left-3 z-10 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    id="date" 
                                    type="date" 
                                    className="w-full pl-10" 
                                    value={date} 
                                    onChange={(e) => setDate(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>
                    </div>

                    <CardRecommendations 
                        recommendations={rankedCards} 
                        onSelectCard={handleCardSelect}
                        currencyFn={currencyFn}
                        selectedCardId={cardId}
                    />
                </div>

                <div className="space-y-4 border-t pt-6">
                    <div className="space-y-2">
                        <label htmlFor="card">Card</label>
                        <select id="card" value={cardId} onChange={(e) => { setCardId(e.target.value); setApplicableRuleId(''); }} className="w-full p-2 border rounded cursor-pointer" required>
                            {[...cards].sort((a, b) => a.name.localeCompare(b.name)).map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="rule">Applicable Cashback Rule</label>
                        <select id="rule" value={applicableRuleId} onChange={(e) => setApplicableRuleId(e.target.value)} className="w-full p-2 border rounded cursor-pointer" disabled={filteredRules.length === 0}>
                            <option value="">{filteredRules.length === 0 ? 'No active rules for this card' : 'None'}</option>
                            {filteredRules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                        </select>
                        {selectedRule && (
                            <div className="flex items-center gap-2 pt-2">
                                <Badge variant="secondary">Rate: {(selectedRule.rate * 100).toFixed(1)}%</Badge>
                                {estimatedCashbackAndWarnings.cashback > 0 && (
                                    <Badge variant="outline" className="text-emerald-600">
                                        Est: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedCashbackAndWarnings.cashback)}
                                    </Badge>
                                )}
                                {estimatedCashbackAndWarnings.warnings.length > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild><button type="button"><AlertTriangle className="h-4 w-4 text-orange-500" /></button></TooltipTrigger>
                                            <TooltipContent>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {estimatedCashbackAndWarnings.warnings.map((warning, i) => (<li key={i}>{warning}</li>))}
                                                </ul>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="more-details">
                        <AccordionTrigger className="text-sm font-semibold">More Details</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4 px-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><label htmlFor="category">Internal Category</label><select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded cursor-pointer"><option value="">None</option>{[...categories].sort().map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                                <div className="space-y-2"><label htmlFor="subCategory">Sub Category</label><Input id="subCategory" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="e.g., Groceries, Utilities" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="paidFor">Paid For</label>
                                    <Input id="paidFor" value={paidFor} onChange={(e) => setPaidFor(e.target.value)} placeholder="e.g., Personal, Family, Work" list="paidFor-options" />
                                    <datalist id="paidFor-options">
                                        <option value="Personal" />
                                        <option value="Family" />
                                        <option value="Work" />
                                    </datalist>
                                </div>
                                {/* MODIFIED: Adopted the working code structure for the billing date field */}
                                <div className="space-y-2">
                                    <label htmlFor="billingDate">Billing Date</label>
                                    <div className="relative flex items-center">
                                        <CalendarClock className="absolute left-3 z-10 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            id="billingDate" 
                                            type="date" 
                                            className="w-full pl-10" 
                                            value={billingDate} 
                                            onChange={(e) => setBillingDate(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><label htmlFor="foreignCurrency">Foreign Currency Amount</label><Input id="foreignCurrency" type="text" inputMode="decimal" value={foreignCurrencyAmount} onChange={(e) => handleFormattedNumericInput(e.target.value, setForeignCurrencyAmount, true)} placeholder="e.g., 100.00" /></div>
                                <div className="space-y-2"><label htmlFor="conversionFee">Conversion Fee (VND)</label><Input id="conversionFee" type="text" inputMode="numeric" value={conversionFee} onChange={(e) => handleFormattedNumericInput(e.target.value, setConversionFee)} /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2"><label htmlFor="otherDiscounts">Other Discounts (VND)</label><Input id="otherDiscounts" type="text" inputMode="numeric" value={otherDiscounts} onChange={(e) => handleFormattedNumericInput(e.target.value, setOtherDiscounts)} /></div>
                                <div className="space-y-2"><label htmlFor="otherFees">Other Fees (VND)</label><Input id="otherFees" type="text" inputMode="numeric" value={otherFees} onChange={(e) => handleFormattedNumericInput(e.target.value, setOtherFees)} /></div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="notes">Notes</label>
                                <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded min-h-[80px]" placeholder="Add any relevant notes here..."/>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                
                <div className="pt-2">
                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (initialData ? "Update Transaction" : "Add Transaction")}
                    </Button>
                </div>
            </form>
            <MccSearchResultsDialog
                open={isLookupDialogOpen}
                onOpenChange={setIsLookupDialogOpen}
                results={lookupResults}
                onSelect={(selectedResult) => {
                    setMccCode(selectedResult[2]);
                    setMerchantLookup(selectedResult[1]);
                    setIsLookupDialogOpen(false);
                }}
            />
        </>
    );
}