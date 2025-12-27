import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';
import { cn } from '../../../lib/utils'; // Adjust path if needed
import {
  Search,
  Loader2,
  ChevronLeft,
  Sparkles,
  Wallet,
  DollarSign,
  AlertTriangle,
  History,
  Globe,
  ExternalLink,
} from 'lucide-react';

function RankingCard({ rank, item, currencyFn }) {
    const { card, rule, calculatedCashback, isMinSpendMet, isCategoryCapReached, isMonthlyCapReached, remainingCategoryCashback } = item;
    
    // Check for inactive or capped states
    const isCapped = isCategoryCapReached || isMonthlyCapReached;
    const isRuleInactive = rule.status !== 'Active';

    // NEW: Updated color logic for the rate badge
    const getRateBadgeClass = (rate) => {
        if (rate >= 0.15) return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Green for 15%+
        if (rate >= 0.10) return 'bg-sky-100 text-sky-800 border-sky-200'; // Blue for 10%-15%
        if (rate >= 0.05) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Yellow for 5%-10%
        return 'bg-slate-100 text-slate-800 border-slate-200'; // Gray for <5%
    };

    return (
        <div className={cn(
            "border rounded-lg p-3 transition-all",
            // Highlight #1 card only if its rule is active
            rank === 1 && !isRuleInactive && "bg-sky-50/70 border-sky-200",
            // Fade out the card if the rule is inactive OR the card is capped
            (isCapped || isRuleInactive) && "opacity-60 bg-slate-50"
        )}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <span className={cn("text-xl font-bold mt-0.5", rank === 1 && !isRuleInactive ? "text-sky-600" : "text-slate-400")}>#{rank}</span>
                    <div>
                        <p className="font-bold text-primary">{card.name}</p>
                        {/* NEW: Added a status dot next to the rule name */}
                        <div className="flex items-center gap-1.5">
                            <span className={cn(
                                "h-2 w-2 rounded-full",
                                isRuleInactive ? "bg-slate-400" : "bg-emerald-500"
                            )} />
                            <p className="text-xs text-muted-foreground">{rule.ruleName}</p>
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <Badge variant="outline" className={cn("text-base font-bold", getRateBadgeClass(rule.rate))}>
                        {(rule.rate * 100).toFixed(1)}%
                    </Badge>
                    {calculatedCashback !== null && (
                        <p className="text-sm font-semibold text-emerald-600 mt-1">
                            + {currencyFn(calculatedCashback)}
                        </p>
                    )}
                </div>
            </div>

            {(rule.capPerTransaction > 0 || isFinite(remainingCategoryCashback) || !isMinSpendMet) && (
                <div className="mt-2 pt-2 border-t flex items-center justify-between gap-x-4 gap-y-1 flex-wrap text-xs text-muted-foreground">
                    {!isMinSpendMet && (
                        <span className="flex items-center gap-1.5 font-medium text-orange-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Min. Spend Not Met
                        </span>
                    )}
                    {isFinite(remainingCategoryCashback) && (
                        <span className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" />
                            Cap Left: <span className="font-semibold text-slate-700">{currencyFn(remainingCategoryCashback)}</span>
                        </span>
                    )}
                    {rule.capPerTransaction > 0 && (
                        <span className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            Max/Tx: <span className="font-semibold text-slate-700">{currencyFn(rule.capPerTransaction)}</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function FinderOptionItem({ item, mccMap, onSelect, icon }) {
    return (
        <button onClick={() => onSelect(item.mcc, item.merchant)} className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
                {icon}
                <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.merchant}</p>
                    <p className="text-xs text-muted-foreground">{mccMap[item.mcc]?.vn || 'N/A'}</p>
                </div>
                <Badge variant="outline">{item.mcc}</Badge>
            </div>
        </button>
    );
}

function FinderOptionsView({ searchResult, searchedTerm, mccMap, onSelect }) {
    const hasInternalResults = searchResult.history?.length > 0 || searchResult.external?.length > 0;

    return (
        <div>
            <div className="text-center mb-4">
                <h3 className="font-semibold">Select a Category</h3>
                <p className="text-sm text-muted-foreground">Choose the best match for '{searchedTerm}' to see card rankings.</p>
            </div>
            {/* THE FIX: Removed max-h-[45vh] and overflow-y-auto from this div */}
            <div className="space-y-4 pr-2">
                {!hasInternalResults && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[150px]">
                        <Search className="h-8 w-8 mb-3 text-slate-400" />
                        <p className="font-semibold text-primary">No direct matches found in our system.</p>
                        <p className="text-xs mt-1">Try a more general term or search externally below.</p>
                    </div>
                )}
                
                {searchResult.history?.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 px-1">From Your History</h4>
                        {searchResult.history.map((item, index) => (
                            <FinderOptionItem key={`h-${index}`} item={item} mccMap={mccMap} onSelect={onSelect} icon={<History className="h-5 w-5 text-slate-500 flex-shrink-0" />} />
                        ))}
                    </div>
                )}
                {searchResult.external?.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-1 px-1">External Suggestions</h4>
                            {searchResult.external.map((item, index) => (
                            <FinderOptionItem key={`e-${index}`} item={item} mccMap={mccMap} onSelect={onSelect} icon={<Globe className="h-5 w-5 text-slate-500 flex-shrink-0" />} />
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t">
                <p className="text-center text-xs text-muted-foreground mb-2">Not finding what you need? Look it up externally:</p>
                <div className="flex items-center justify-center gap-2">
                    <Button asChild variant="outline" size="sm">
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(searchedTerm + ' mcc code')}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Google
                        </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <a href={`https://quanlythe.com/tien-ich/tra-cuu-mcc?query=${encodeURIComponent(searchedTerm)}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> QuanLyThe
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function BestCardFinderDialog({
    isOpen,
    onOpenChange,
    allCards,
    allRules,
    mccMap,
    monthlySummary,
    monthlyCategorySummary,
    activeMonth,
    getCurrentCashbackMonthForCard,
    isDesktop, // Assuming these props are passed down
}) {
    const side = isDesktop ? 'left' : 'bottom';

    // --- STATE MANAGEMENT ---
    const [view, setView] = useState('initial');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedTerm, setSearchedTerm] = useState('');
    const [amount, setAmount] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [selectedMcc, setSelectedMcc] = useState(null);
    const [selectedMerchantDetails, setSelectedMerchantDetails] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);

    // --- HOOKS & HELPERS ---
    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const cardMap = useMemo(() => new Map(allCards.map(c => [c.id, c])), [allCards]);

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setView('initial');
                setSearchTerm('');
                setSearchedTerm('');
                setSearchResult(null);
                setSelectedMcc(null);
                setAmount('');
            }, 300);
            return () => clearTimeout(timer);
        } else {
            const searches = JSON.parse(localStorage.getItem('cardFinderSearches') || '[]');
            setRecentSearches(searches);
        }
    }, [isOpen]);

    // --- CORE LOGIC (REFACTORED) ---

    // New helper function for direct MCC search
    const showResultsForMcc = (mcc) => {
        setIsLoading(true);
        setSelectedMcc(mcc);
        setSelectedMerchantDetails({
            merchant: `Category: ${mccMap[mcc]?.vn || 'Unknown'}`,
            vnDesc: `All merchants with MCC ${mcc}`,
        });
        setView('results');
        setIsLoading(false);
    };

    // New helper function for merchant name lookup via API
    const lookupMerchant = async (term) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/lookup-merchant?keyword=${encodeURIComponent(term)}`);
            if (!res.ok) throw new Error('Failed to fetch merchant data');
            const data = await res.json();
            setSearchResult(data);
            setView('options');
        } catch (err) {
            console.error(err);
            toast.error("Could not fetch suggestions.");
            setView('initial'); // Reset on error
        } finally {
            setIsLoading(false);
        }
    };

    // The main search handler now delegates to the helper functions
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        const term = searchTerm.trim();
        if (!term) return;

        // Update recent searches
        const updatedSearches = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
        localStorage.setItem('cardFinderSearches', JSON.stringify(updatedSearches));
        setRecentSearches(updatedSearches);

        // Reset state for new search
        setSearchedTerm(term);
        setSelectedMcc(null);
        setSelectedMerchantDetails(null);
        
        // Delegate based on search term format
        if (/^\d{4}$/.test(term)) {
            showResultsForMcc(term);
        } else {
            await lookupMerchant(term);
        }
    };


    const handleRecentSearchClick = (term) => {
        setSearchTerm(term);
        // Use a microtask to ensure the state updates before submitting the form
        setTimeout(() => {
            document.getElementById('card-finder-form')?.requestSubmit();
        }, 0);
    };

    const handleOptionSelect = (mcc, merchant) => {
        setSelectedMcc(mcc);
        setSelectedMerchantDetails({
            merchant: merchant,
            vnDesc: mccMap[mcc]?.vn || "Không rõ",
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

    const rankedSuggestions = useMemo(() => {
        if (!selectedMcc) return [];
        const numericAmount = parseFloat(String(amount).replace(/,/g, ''));
        const isLiveView = activeMonth === 'live';

        return allRules
            .filter(rule => rule.mccCodes && rule.mccCodes.split(',').map(c => c.trim()).includes(selectedMcc))
            .map(rule => {
                const card = cardMap.get(rule.cardId);
                if (!card || card.status !== 'Active') return null;

                const monthForCard = isLiveView ? getCurrentCashbackMonthForCard(card) : activeMonth;

                const cardMonthSummary = monthlySummary.find(s => s.cardId === card.id && s.month === monthForCard);
                const categorySummaryId = `${monthForCard} - ${rule.ruleName}`;
                const categoryMonthSummary = monthlyCategorySummary.find(s => s.summaryId === categorySummaryId && s.cardId === card.id);

                const categoryLimit = categoryMonthSummary?.categoryLimit || Infinity;
                const remainingCategoryCashback = categoryLimit - (categoryMonthSummary?.cashback || 0); // Use the direct value here

                let calculatedCashback = null;
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    calculatedCashback = numericAmount * rule.rate;
                    if (rule.capPerTransaction > 0) {
                        calculatedCashback = Math.min(calculatedCashback, rule.capPerTransaction);
                    }
                }

                const dynamicLimit = cardMonthSummary?.monthlyCashbackLimit;
                const effectiveMonthlyLimit = dynamicLimit > 0 ? dynamicLimit : card.overallMonthlyLimit;

                return { 
                    rule, 
                    card, 
                    calculatedCashback, 
                    isMinSpendMet: card.minimumMonthlySpend > 0 ? (cardMonthSummary?.spend || 0) >= card.minimumMonthlySpend : true,
                    isCategoryCapReached: isFinite(remainingCategoryCashback) && remainingCategoryCashback <= 0,
                    isMonthlyCapReached: effectiveMonthlyLimit > 0 ? (cardMonthSummary?.cashback || 0) >= effectiveMonthlyLimit : false,
                    remainingCategoryCashback,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const isAActive = a.rule.status === 'Active';
                const isBActive = b.rule.status === 'Active';
                if (isAActive !== isBActive) return isAActive ? -1 : 1;
                
                const isACapped = a.isMonthlyCapReached || a.isCategoryCapReached;
                const isBCapped = b.isMonthlyCapReached || b.isCategoryCapReached;
                if (isACapped !== isBCapped) return isACapped ? 1 : -1;

                if (a.isMinSpendMet !== b.isMinSpendMet) return a.isMinSpendMet ? -1 : 1;
                
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    const cashbackDiff = (b.calculatedCashback || 0) - (a.calculatedCashback || 0);
                    if (cashbackDiff !== 0) return cashbackDiff;
                }
                return b.rule.rate - a.rule.rate;
            })
    }, [selectedMcc, amount, allRules, cardMap, monthlySummary, monthlyCategorySummary, activeMonth, getCurrentCashbackMonthForCard]);
    
    // --- RENDER LOGIC ---
    const renderContent = () => {
        if (isLoading) {
            // Return a skeleton list instead of a spinner
            return (
                <div className="space-y-3 p-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                            <Skeleton className="h-6 w-24" />
                        </div>
                    ))}
                </div>
            );
        }
        if (view === 'results' && selectedMcc && selectedMerchantDetails) {
            return (
                <div>
                    <div className="p-3 mb-4 bg-slate-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Showing rankings for:</p>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setView('options')}>
                                <ChevronLeft className="h-3 w-3 mr-1" /> Choose a different category
                            </Button>
                        </div>
                        <div className="flex justify-between items-start gap-2 mt-1">
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight">{selectedMerchantDetails.merchant}</h3>
                                <p className="text-xs text-muted-foreground">{selectedMerchantDetails.vnDesc}</p>
                            </div>
                            <Badge variant="outline" className="font-mono text-sm">{selectedMcc}</Badge>
                        </div>
                    </div>
                    {rankedSuggestions.length > 0 ? (
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                            {rankedSuggestions.map((item, index) => (
                                <RankingCard 
                                    key={item.rule.id}
                                    rank={index + 1}
                                    item={item}
                                    currencyFn={currency}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No specific cashback rules found for this category.</p>
                        </div>
                    )}
                </div>
            );
        }
        if (view === 'options' && searchResult) {
            return <FinderOptionsView 
                        searchResult={searchResult} 
                        searchedTerm={searchedTerm}
                        mccMap={mccMap} 
                        onSelect={handleOptionSelect} 
                    />;
        }
        return (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 min-h-[300px]">
                <Sparkles className="h-10 w-10 mb-3 text-sky-500" />
                <p className="font-semibold text-primary">Find the best card for any purchase.</p>
                <p className="text-xs mt-1">
                    e.g., Shopee, Grab, Supermarket, or a 4-digit MCC like 5411...
                </p>
                {recentSearches.length > 0 && (
                    <div className="mt-6 w-full max-w-md">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Searches</h4>
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            {recentSearches.map(term => (
                                <button key={term} onClick={() => handleRecentSearchClick(term)} className="text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-full transition-colors">{term}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent 
                side={side} 
                className={cn(
                    "flex flex-col p-0 gap-0",
                    isDesktop 
                        ? "w-full max-w-md sm:max-w-lg"
                        : "h-[90dvh] rounded-t-xl"
                )}
            >
                <SheetHeader className="pb-4 text-left px-4 pt-4 sm:px-6 sm:pt-6">
                    <SheetTitle>Find the Best Card</SheetTitle>
                    <SheetDescription>
                        Enter a merchant and amount to see your best rewards.
                    </SheetDescription>
                </SheetHeader>
                
                <div className="flex-grow overflow-y-auto">
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                        <div className="flex flex-col gap-4">
                            <form id="card-finder-form" onSubmit={handleSearch} className="space-y-4 pt-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label htmlFor="finder-merchant" className="text-sm font-medium">Merchant or MCC</label>
                                        <Input
                                            id="finder-merchant"
                                            placeholder="e.g., Shopee, 5411, Grab..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="finder-amount" className="text-sm font-medium">Amount (Optional)</label>
                                        <Input
                                            id="finder-amount"
                                            placeholder="e.g., 1,000,000"
                                            value={amount}
                                            onChange={handleAmountChange}
                                            inputMode="numeric"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isLoading || !searchTerm.trim()} className="w-full">
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    {isLoading ? 'Searching...' : 'Find Best Card'}
                                </Button>
                            </form>
                            
                            <div className="mt-2">
                                {renderContent()}
                            </div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}