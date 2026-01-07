import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '../../ui/drawer';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { cn } from '../../../lib/utils';
import {
  Search,
  Loader2,
  Sparkles,
  Wallet,
  DollarSign,
  AlertTriangle,
  History,
  Globe,
  ExternalLink,
  Store,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Layers,
  X,
  Plane
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENTS ---

function MethodSelector({ method, setMethod }) {
    const methods = [
        { id: 'All', label: 'All', icon: Layers },
        { id: 'POS', label: 'POS', icon: Store },
        { id: 'eCom', label: 'eCom', icon: Globe },
        { id: 'International', label: 'Int.', icon: Plane },
    ];

    return (
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {methods.map((m) => {
                const Icon = m.icon;
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-all",
                            method === m.id
                                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {m.label}
                    </button>
                );
            })}
        </div>
    );
}

function QuickAmounts({ selected, onSelect }) {
    const amounts = [
        { label: '100k', value: '100,000' },
        { label: '200k', value: '200,000' },
        { label: '500k', value: '500,000' },
        { label: '1m', value: '1,000,000' },
        { label: 'Other', value: 'other' },
    ];

    return (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">
            {amounts.map((amt) => {
                const isActive = selected === amt.value || (amt.value === 'other' && selected === 'other');
                return (
                    <button
                        key={amt.label}
                        type="button"
                        onClick={() => onSelect(amt.value)}
                        className={cn(
                            "flex-shrink-0 px-2.5 py-1 text-xs font-medium rounded-md transition-colors border",
                            isActive
                                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-transparent"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                    >
                        {amt.label}
                    </button>
                );
            })}
        </div>
    );
}


function CapProgressBar({ current, limit, label, icon: Icon, currencyFn, rate }) {
    if (!limit || limit === Infinity) return null;
    const remainingCashback = Math.max(0, limit - current);
    const percent = Math.min(100, Math.max(0, (current / limit) * 100));
    const isNearCap = percent > 85;

    // If rate is provided, show spend left. Otherwise show cashback left.
    let displayText = `${currencyFn(remainingCashback)} left`;
    if (rate && rate > 0) {
        const remainingSpend = remainingCashback / rate;
        displayText = `${currencyFn(remainingSpend)} spend left`;
    }

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    {Icon && <Icon className="h-3 w-3" />}
                    {label}
                </span>
                <span className={cn("font-medium", isNearCap ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-300")}>
                    {displayText}
                </span>
            </div>
            <Progress value={percent} className="h-1.5" indicatorClassName={isNearCap ? "bg-red-500" : "bg-sky-500"} />
        </div>
    );
}

function RankingCard({ rank, item, currencyFn, isExpanded, onToggle }) {
    // UPDATED: Destructure isInactive and isCapped from item to be explicit, though local calculation also works
    const { card, rule, calculatedCashback, isMinSpendMet, remainingCategoryCashback, monthlyLimit, monthlyCashback, isInactive, isMonthlyCapReached, isCategoryCapReached, effectiveMethod } = item;

    // Fallback if not passed in item (safety)
    const _isInactive = isInactive ?? (rule.status !== 'Active');
    const _isCapped = (isMonthlyCapReached || isCategoryCapReached);

    const isWinner = rank === 1;

    // Rate Badge Color Logic
    const getRateColor = (rate) => {
        if (rate >= 0.15) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        if (rate >= 0.10) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800';
        if (rate >= 0.05) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    };

    // Construct match description
    let matchDesc = "Match: Payment Method";
    if (rule.mccCodes?.length > 0) {
        matchDesc = "Match: MCC Code";
    } else if (rule.isDefault) {
        matchDesc = "Match: Default Cashback";
    }

    // Append method info if relevant
    if (effectiveMethod && effectiveMethod !== 'All') {
        matchDesc += ` (${effectiveMethod})`;
    }

    return (
        <div className={cn(
            "rounded-xl border transition-all overflow-hidden",
            isWinner
                ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 shadow-sm"
                : "bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700",
            (_isCapped || _isInactive) && !isWinner && "opacity-70 bg-slate-100 dark:bg-slate-900"
        )}>
            {/* --- CARD HEADER --- */}
            <div
                className={cn("p-4 flex items-center justify-between cursor-pointer select-none", isWinner ? "py-5" : "py-3")}
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 flex-1">
                    {/* Visual Hierarchy: Rank Indicator */}
                    {!isWinner && (
                         <div className="w-6 text-center text-sm font-bold text-slate-300 dark:text-slate-600 shrink-0">
                             {rank}
                         </div>
                    )}
                    {isWinner && (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="h-5 w-5 fill-current" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className={cn("font-bold text-slate-900 dark:text-slate-100 leading-tight", isWinner ? "text-lg" : "text-base")}>
                                {card.name}
                            </h3>
                            {isWinner && <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none text-white text-[10px] px-1.5 h-5 shrink-0">Best Choice</Badge>}

                            {/* Status Badges */}
                            {_isInactive && (
                                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 shrink-0">Inactive</Badge>
                            )}
                            {_isCapped && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">Maxed Out</Badge>
                            )}
                            {!isMinSpendMet && (
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800 shrink-0">Min Spend</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                           <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", rule.status === 'Active' ? "bg-emerald-500" : "bg-slate-300")} />
                           <span className="truncate">{rule.ruleName}</span>
                        </p>
                    </div>
                </div>

                <div className="text-right pl-2 shrink-0">
                    <Badge variant="outline" className={cn("font-extrabold text-sm border", getRateColor(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                    {calculatedCashback !== null && (
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            +{currencyFn(calculatedCashback)}
                        </p>
                    )}
                </div>
            </div>

            {/* --- EXPANDABLE DETAILS --- */}
            <AnimatePresence initial={false}>
                {(isWinner || isExpanded) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    >
                        <div className="p-4 space-y-4">
                             {/* Criteria Display (Simplified) */}
                             <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-700">
                                {matchDesc}
                             </div>

                             {/* Warnings */}
                            {!isMinSpendMet && (
                                <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md border border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="h-4 w-4" />
                                    Warning: Monthly minimum spend not yet met.
                                </div>
                            )}

                            {/* Caps & Limits */}
                            <div className="grid grid-cols-1 gap-3">
                                {isFinite(remainingCategoryCashback) && (
                                    <CapProgressBar
                                        label="Category Cap"
                                        current={(item.categoryLimit || 0) - remainingCategoryCashback}
                                        limit={item.categoryLimit}
                                        icon={Wallet}
                                        currencyFn={currencyFn}
                                        rate={rule.rate}
                                    />
                                )}
                                {monthlyLimit > 0 && (
                                    <CapProgressBar
                                        label="Monthly Card Cap"
                                        current={monthlyCashback}
                                        limit={monthlyLimit}
                                        icon={CreditCard}
                                        currencyFn={currencyFn}
                                        rate={rule.rate}
                                    />
                                )}
                                {rule.capPerTransaction > 0 && (
                                    <div className="flex justify-between items-center text-xs pt-1">
                                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <DollarSign className="h-3 w-3" /> Max per Tx
                                        </span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                            {currencyFn(rule.capPerTransaction)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button for non-winners */}
            {!isWinner && (
                 <div
                    className="w-full flex justify-center py-1 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={onToggle}
                 >
                     {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                 </div>
            )}
        </div>
    );
}

function FinderOptionItem({ item, mccMap, onSelect, icon }) {
    const mccInfo = mccMap[item.mcc];

    // Updated Badge Logic: Blue(POS), Green(eCom), Red(International)
    const getMethodBadgeClass = (method) => {
        const m = method?.toLowerCase();
        if (m === 'pos') return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800";
        if (m === 'ecom') return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
        if (m === 'international') return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800";
        return "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
    }

    return (
        <button
            onClick={() => onSelect(item.mcc, item.merchant, item.method)} // UPDATED: Pass method
            className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
        >
            <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{item.merchant}</p>
                        <div className="flex items-center gap-2">
                            {/* Display Method Badge if available */}
                            {item.method && (
                                <Badge variant="secondary" className={cn("text-[10px] h-5 px-1.5 border", getMethodBadgeClass(item.method))}>
                                    {item.method === 'International' ? 'Int.' : item.method}
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono text-slate-500">{item.mcc}</Badge>
                        </div>
                    </div>
                    {mccInfo ? (
                        <div className="text-xs text-muted-foreground">
                            <p className="line-clamp-1">{mccInfo.en}</p>
                            <p className="line-clamp-1 text-slate-400 dark:text-slate-500 italic">{mccInfo.vn}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">Unknown Category</p>
                    )}
                </div>
            </div>
        </button>
    );
}

// --- MAIN CONTENT WRAPPER ---
function CardFinderContent({
    allCards,
    allRules,
    mccMap,
    monthlySummary,
    monthlyCategorySummary,
    activeMonth,
    getCurrentCashbackMonthForCard,
    isDesktop
}) {
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('All');
    const [view, setView] = useState('initial'); // 'initial', 'options', 'results'
    const [isLoading, setIsLoading] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [selectedMcc, setSelectedMcc] = useState(null);
    const [selectedMerchantDetails, setSelectedMerchantDetails] = useState(null);
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);

    const [selectedQuickAmount, setSelectedQuickAmount] = useState(null); // 'other' or value
    const [showAmountInput, setShowAmountInput] = useState(false);

    const inputRef = useRef(null);
    const amountInputRef = useRef(null);

    // --- EFFECT: Load Recent Searches & Focus ---
    useEffect(() => {
        const searches = JSON.parse(localStorage.getItem('cardFinderSearches') || '[]');
        setRecentSearches(searches);
        const timer = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(timer);
    }, []);

    // --- HELPERS ---
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const cardMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]);

    // --- LOGIC: Quick Amount Selection ---
    const handleQuickAmountSelect = (value) => {
        // Toggle off if same amount selected
        if (selectedQuickAmount === value) {
            setShowAmountInput(false);
            setAmount('');
            setSelectedQuickAmount(null);
            return;
        }

        if (value === 'other') {
            setShowAmountInput(true);
            setSelectedQuickAmount('other');
            setTimeout(() => amountInputRef.current?.focus(), 50);
        } else {
            setShowAmountInput(false);
            setAmount(value);
            setSelectedQuickAmount(value);
        }
    };

    const handleClearAmount = () => {
        setAmount('');
        // Keep input visible and focused if cleared manually
        amountInputRef.current?.focus();
    }

    // --- LOGIC: Handle Search ---
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        const term = searchTerm.trim();
        if (!term) return;

        const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        localStorage.setItem('cardFinderSearches', JSON.stringify(updatedSearches));
        setRecentSearches(updatedSearches);

        setSelectedMcc(null);
        setSelectedMerchantDetails(null);

        if (/^\d{4}$/.test(term)) {
            setIsLoading(true);
            setSelectedMcc(term);
            const info = mccMap[term];
            setSelectedMerchantDetails({
                merchant: info ? info.en : `MCC ${term}`,
                vnDesc: info ? info.vn : 'Unknown Category',
                isDirectMcc: true,
                method: null // Direct MCC has no inherent method
            });
            setView('results');
            setIsLoading(false);
        } else {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/lookup-merchant?keyword=${encodeURIComponent(term)}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setSearchResult(data);
                setView('options');
            } catch (err) {
                console.error(err);
                toast.error("Could not fetch suggestions.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleOptionSelect = (mcc, merchantName, merchantMethod = null) => { // UPDATED: Accept method
        setSelectedMcc(mcc);
        const info = mccMap[mcc];
        setSelectedMerchantDetails({
            merchant: merchantName,
            enDesc: info?.en,
            vnDesc: info?.vn,
            method: merchantMethod // Store method from history
        });
        setView('results');
    };

    const handleAmountChange = (e) => {
        const value = e.target.value.replace(/,/g, '');
        if (!isNaN(value) && value.length <= 15) {
            setAmount(value ? Number(value).toLocaleString('en-US') : '');
        } else if (value === '') {
            setAmount('');
        }
    };

    // --- CALCULATION ENGINE ---
    const { rankedSuggestions, otherSuggestions } = useMemo(() => {
        if (!selectedMcc) return { rankedSuggestions: [], otherSuggestions: [] };
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        const isLiveView = activeMonth === 'live';

        // Determine Effective Method
        // If UI method is 'All', use the merchant's method if available.
        // If UI method is specific (POS/eCom/Int), it overrides everything.
        let effectiveMethod = 'All';
        if (method !== 'All') {
            effectiveMethod = method;
        } else if (selectedMerchantDetails?.method) {
            effectiveMethod = selectedMerchantDetails.method;
        }

        const allCandidates = allRules
            .filter(rule => {
                const ruleMethodsRaw = Array.isArray(rule.method) ? rule.method : (rule.method ? [rule.method] : []);
                const ruleMethods = ruleMethodsRaw.map(m => m.toLowerCase());

                // Use effectiveMethod for matching
                const targetMethod = effectiveMethod.toLowerCase();

                const isMethodValid =
                    targetMethod === 'all' || // Should effectively never happen for strict rules unless rule allows All
                    ruleMethods.length === 0 ||
                    ruleMethods.includes('all') ||
                    ruleMethods.includes(targetMethod);

                // Note: If effectiveMethod is 'eCom', and rule is 'POS', isMethodValid is false.
                // If effectiveMethod is 'All' (no history, UI All), and rule is 'POS', isMethodValid is true (matches 'all' logic in current code? wait)

                // Re-evaluating existing logic:
                // Old logic: currentMethod === 'all' || ... || ruleMethods.includes(currentMethod)
                // If I select 'All' in UI, I want to see everything.
                // But the user says: "if I search... Shopee & method is 'All', then... should be shown for corresponding method"
                // This means we are FILTERING by the historical method implicitly.
                // So if history says 'eCom', we act as if 'eCom' was selected.

                if (!isMethodValid) return false;

                const ruleMccCodes = Array.isArray(rule.mccCodes) ? rule.mccCodes : (rule.mccCodes ? rule.mccCodes.split(',').map(c => c.trim()) : []);
                const ruleExcludedCodes = Array.isArray(rule.excludedMccCodes) ? rule.excludedMccCodes : (rule.excludedMccCodes ? rule.excludedMccCodes.split(',').map(c => c.trim()) : []);
                const isSpecificMatch = ruleMccCodes.includes(selectedMcc);
                const isBroadRule = rule.isDefault || ruleMccCodes.length === 0;

                const isBroadMatch = isBroadRule && !ruleExcludedCodes.includes(selectedMcc);

                return isSpecificMatch || isBroadMatch;
            })
            .map(rule => {
                const card = cardMap.get(rule.cardId);
                if (!card || card.status !== 'Active') return null;

                const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;
                const cardMonthSummary = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);

                const categorySummaryId = `${monthForCard} - ${rule.ruleName}`;
                const categoryMonthSummary = monthlyCategorySummary.find(s => s.summaryId === categorySummaryId && s.cardId === card.id);
                const categoryLimit = categoryMonthSummary?.categoryLimit || Infinity;
                const remainingCategoryCashback = categoryLimit - (categoryMonthSummary?.cashback || 0);

                const dynamicLimit = cardMonthSummary?.monthlyCashbackLimit;
                const effectiveMonthlyLimit = dynamicLimit > 0 ? dynamicLimit : card.overallMonthlyLimit;
                const monthlyCashback = cardMonthSummary?.cashback || 0;

                // Calculate remaining monthly cashback cap
                const remainingMonthlyCashback = effectiveMonthlyLimit > 0 ? (effectiveMonthlyLimit - monthlyCashback) : Infinity;

                let calculatedCashback = null;
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    calculatedCashback = numericAmount * rule.rate;

                    // Cap per transaction
                    if (rule.capPerTransaction > 0) {
                        calculatedCashback = Math.min(calculatedCashback, rule.capPerTransaction);
                    }

                    // Cap by remaining category limit
                    if (isFinite(remainingCategoryCashback)) {
                         calculatedCashback = Math.min(calculatedCashback, Math.max(0, remainingCategoryCashback));
                    }

                    // Cap by remaining monthly limit
                    if (isFinite(remainingMonthlyCashback)) {
                        calculatedCashback = Math.min(calculatedCashback, Math.max(0, remainingMonthlyCashback));
                    }
                }

                const isCategoryCapReached = isFinite(remainingCategoryCashback) && remainingCategoryCashback <= 0;
                const isMonthlyCapReached = effectiveMonthlyLimit > 0 && remainingMonthlyCashback <= 0; // Updated logic

                return { 
                    rule, 
                    card, 
                    calculatedCashback, 
                    isMinSpendMet: card.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= card.minimumMonthlySpend : true,
                    isCategoryCapReached,
                    isMonthlyCapReached,
                    isInactive: rule.status !== 'Active', // Explicitly passed
                    remainingCategoryCashback,
                    categoryLimit,
                    monthlyLimit: effectiveMonthlyLimit,
                    monthlyCashback,
                    effectiveMethod // Pass this down for display
                };
            })
            .filter(Boolean);

        // NO Grouping by Card - Show all applicable rules
        const sorted = allCandidates
            .sort((a, b) => {
                const isAActive = a.rule.status === 'Active';
                const isBActive = b.rule.status === 'Active';
                if (isAActive !== isBActive) return isAActive ? -1 : 1;
                
                const isACapped = a.isMonthlyCapReached || a.isCategoryCapReached;
                const isBCapped = b.isMonthlyCapReached || b.isCategoryCapReached;
                if (isACapped !== isBCapped) return isACapped ? 1 : -1;

                if (!isNaN(numericAmount) && numericAmount > 0) {
                    const diff = (b.calculatedCashback || 0) - (a.calculatedCashback || 0);
                    if (diff !== 0) return diff;
                }
                return b.rule.rate - a.rule.rate;
            });

        // Split into "Main" and "Other" (Inactive/Capped)
        const activeAndGood = [];
        const others = [];

        sorted.forEach(item => {
            if (item.rule.status !== 'Active' || item.isMonthlyCapReached || item.isCategoryCapReached) {
                others.push(item);
            } else {
                activeAndGood.push(item);
            }
        });

        return { rankedSuggestions: activeAndGood, otherSuggestions: others };

    }, [selectedMcc, amount, method, allRules, cardMap, monthlySummary, monthlyCategorySummary, activeMonth, getCurrentCashbackMonthForCard, selectedMerchantDetails]); // Added selectedMerchantDetails to deps


    // --- RENDERING ---

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold bg-white dark:bg-slate-900">
                Card Lookup
            </div>

            {/* --- TOP: QUERY BAR --- */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm z-10 sticky top-0">
                <form onSubmit={handleSearch} className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            ref={inputRef}
                            placeholder="Search merchant (e.g., Shopee)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
                        />
                         {searchTerm && (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(''); setView('initial'); setSearchResult(null); inputRef.current?.focus(); }}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="sr-only">Clear</span>
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {/* 1. Payment Method First */}
                        <MethodSelector method={method} setMethod={setMethod} />

                        {/* 2. Amount and Quick Amounts */}
                        <div>
                            <AnimatePresence>
                                {showAmountInput && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden pb-1"
                                    >
                                        <div className="relative">
                                            <Input
                                                ref={amountInputRef}
                                                placeholder="Enter amount (e.g., 1,000,000)"
                                                value={amount}
                                                onChange={handleAmountChange}
                                                inputMode="numeric"
                                                className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-8 focus-visible:ring-emerald-500"
                                            />
                                            {amount && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearAmount}
                                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <QuickAmounts selected={selectedQuickAmount} onSelect={handleQuickAmountSelect} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={isLoading || !searchTerm.trim()}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? 'Searching...' : 'Find Best Card'}
                    </Button>
                </form>
            </div>

            {/* --- MIDDLE: CONTENT AREA --- */}
            <div className="flex-grow overflow-y-auto p-4">
                {/* STATE: INITIAL (Empty / History) */}
                {view === 'initial' && (
                    <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 py-10">
                        <Sparkles className="h-12 w-12 mb-4 text-emerald-200 dark:text-emerald-900" />
                        <p className="font-medium text-slate-600 dark:text-slate-300">Where are you spending?</p>
                        <p className="text-sm mt-1 mb-8">Enter a merchant name to compare your cards.</p>

                        {recentSearches.length > 0 && (
                            <div className="w-full max-w-sm">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Recent Searches</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {recentSearches.map(term => (
                                        <button
                                            key={term}
                                            onClick={() => { setSearchTerm(term); setTimeout(() => handleSearch(), 0); }}
                                            className="text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STATE: OPTIONS (Search Results) */}
                {view === 'options' && searchResult && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between text-sm text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                             <span>Select a category for "{searchTerm}"</span>
                             <Button variant="ghost" size="sm" onClick={() => setView('initial')} className="h-auto p-0 hover:bg-transparent">Cancel</Button>
                        </div>

                        {/* Internal Matches */}
                        {searchResult.history?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-1">From Your History</h4>
                                {searchResult.history.map((item, i) => (
                                    <FinderOptionItem key={`h-${i}`} item={item} mccMap={mccMap} onSelect={handleOptionSelect} icon={<History className="h-4 w-4" />} />
                                ))}
                            </div>
                        )}

                        {/* External Matches */}
                        {searchResult.external?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider px-1">Suggested Categories</h4>
                                {searchResult.external.map((item, i) => (
                                    <FinderOptionItem key={`e-${i}`} item={item} mccMap={mccMap} onSelect={handleOptionSelect} icon={<Globe className="h-4 w-4" />} />
                                ))}
                            </div>
                        )}

                        {!searchResult.history?.length && !searchResult.external?.length && (
                            <div className="text-center py-8">
                                <p className="text-slate-500">No direct matches found.</p>
                                <div className="mt-4 flex justify-center gap-2">
                                    <Button asChild variant="outline" size="sm">
                                        <a href={`https://www.google.com/search?q=${encodeURIComponent(searchTerm + ' mcc code')}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Google It
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* STATE: RESULTS (Rankings) */}
                {view === 'results' && selectedMerchantDetails && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Context Header */}
                        <div className="flex items-start justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white leading-tight">
                                    {selectedMerchantDetails.merchant}
                                </h2>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                                    {selectedMerchantDetails.enDesc && <p>{selectedMerchantDetails.enDesc}</p>}
                                    {selectedMerchantDetails.vnDesc && <p className="italic">{selectedMerchantDetails.vnDesc}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="secondary" className="font-mono">{selectedMcc}</Badge>
                                <Button variant="link" size="sm" onClick={() => setView('options')} className="h-auto px-0 text-xs block text-slate-400 hover:text-primary mt-1">
                                    Change
                                </Button>
                            </div>
                        </div>

                        {/* ACTIVE / GOOD RESULTS */}
                        {rankedSuggestions.length > 0 && (
                            <div className="space-y-3 pb-4">
                                {rankedSuggestions.map((item, index) => (
                                    <RankingCard
                                        key={item.rule.id}
                                        rank={index + 1}
                                        item={item}
                                        currencyFn={currency}
                                        isExpanded={expandedCardId === item.card.id}
                                        onToggle={() => setExpandedCardId(expandedCardId === item.card.id ? null : item.card.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* OTHER (Capped/Inactive) RESULTS */}
                        {otherSuggestions.length > 0 && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <details className="group">
                                    <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                        <span>Other Cards ({otherSuggestions.length})</span>
                                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="space-y-3 pt-3">
                                        {otherSuggestions.map((item, index) => (
                                            <RankingCard
                                                key={item.rule.id}
                                                rank={rankedSuggestions.length + index + 1}
                                                item={item}
                                                currencyFn={currency}
                                                isExpanded={expandedCardId === item.card.id}
                                                onToggle={() => setExpandedCardId(expandedCardId === item.card.id ? null : item.card.id)}
                                            />
                                        ))}
                                    </div>
                                </details>
                            </div>
                        )}

                        {rankedSuggestions.length === 0 && otherSuggestions.length === 0 && (
                            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500">No active cashback rules found for this category.</p>
                                <p className="text-xs text-slate-400 mt-1">Try changing the payment method or amount.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// --- TOP LEVEL WRAPPER ---
export default function BestCardFinderDialog(props) {
    const { isOpen, onOpenChange, isDesktop } = props;

    // --- DESKTOP: SHEET ---
    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent className="p-0 w-full max-w-md sm:max-w-lg border-l border-slate-200 dark:border-slate-800" side="right">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Card Finder</SheetTitle>
                        <SheetDescription>Search for the best card</SheetDescription>
                    </SheetHeader>
                    <CardFinderContent {...props} />
                </SheetContent>
            </Sheet>
        );
    }

    // --- MOBILE: DRAWER ---
    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="h-[92dvh] rounded-t-xl overflow-hidden flex flex-col">
                <DrawerHeader className="sr-only">
                    <DrawerTitle>Card Finder</DrawerTitle>
                    <DrawerDescription>Search for the best card</DrawerDescription>
                </DrawerHeader>
                <div className="flex-1 overflow-hidden relative">
                    <CardFinderContent {...props} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
