import React, { useState, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Info, Search, ChevronDown, Activity, Settings, PieChart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function CardDetailsDialog({ card, rules, mccMap, isDesktop, onUpdateCard, onUpdateRule }) {
    // --- State for search and expansion ---
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRuleId, setExpandedRuleId] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [updatingRuleId, setUpdatingRuleId] = useState(null);

    const [analysisData, setAnalysisData] = useState([]);
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [hasFetchedAnalysis, setHasFetchedAnalysis] = useState(false);

    const currency = (n) => (n || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    // --- Helper function and memoized data ---
    const isFeeCovered = card.estYtdCashback >= card.annualFee;
    const representativeTxCapRule = rules.find(rule => rule.capPerTransaction > 0);
    const infoItems = [
        { label: "Credit Limit", value: currency(card.creditLimit) },
        { label: "Card Number", value: `**** **** **** ${card.last4}` },
        { label: "First 6 Digits", value: card.first6 },
        { label: "Network", value: card.network },
        { label: "Statement Day", value: `~ Day ${card.statementDay}` },
        { label: "Payment Due Day", value: `~ Day ${card.paymentDueDay}` },
        { label: "Monthly Interest", value: `${(card.interestRateMonthly * 100).toFixed(2)}%` },
        {
            label: "Annual Fee",
            value: currency(card.annualFee),
            valueClassName: isFeeCovered ? 'text-emerald-600' : 'text-red-500'
        },
        { label: "Fee Waiver Threshold", value: currency(card.feeWaiverThreshold) }
    ];

    // --- Filtering logic for the search functionality ---
    const filteredAndSortedRules = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const isMccSearch = /^\d+$/.test(searchTerm.trim());

        if (!searchTerm.trim()) {
            return [...rules].sort((a, b) => {
                if (a.status === 'Active' && b.status !== 'Active') return -1;
                if (a.status !== 'Active' && b.status === 'Active') return 1;
                return a.ruleName.localeCompare(b.ruleName);
            });
        }

        const filtered = rules.filter(rule => {
            const mccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()) : [];
            if (isMccSearch) {
                return mccList.some(code => code.includes(searchTerm.trim()));
            }
            const nameMatch = rule.ruleName.toLowerCase().includes(lowercasedFilter);
            if (nameMatch) return true;
            for (const code of mccList) {
                const mccName = mccMap[code]?.vn || '';
                if (mccName.toLowerCase().includes(lowercasedFilter)) {
                    return true;
                }
            }
            return false;
        });

        return filtered.sort((a, b) => {
            if (a.status === 'Active' && b.status !== 'Active') return -1;
            if (a.status !== 'Active' && b.status === 'Active') return 1;
            return a.ruleName.localeCompare(b.ruleName);
        });
    }, [rules, searchTerm, mccMap]);


    const handleToggleExpand = (ruleId) => {
        setExpandedRuleId(prevId => (prevId === ruleId ? null : ruleId));
    };

    const handleStatusChange = async (newStatus) => {
        setIsUpdatingStatus(true);
        try {
            const response = await fetch(`/api/cards/${card.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update card status');

            toast.success(`Card status updated to ${newStatus}`);
            if (onUpdateCard) {
                onUpdateCard({ ...card, status: newStatus });
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update card status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRuleStatusChange = async (ruleId, newStatus) => {
        setUpdatingRuleId(ruleId);
        try {
            const response = await fetch(`/api/rules/${ruleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update rule status');

            toast.success(`Rule status updated to ${newStatus}`);
            if (onUpdateRule) {
                onUpdateRule(ruleId, newStatus);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update rule status');
        } finally {
            setUpdatingRuleId(null);
        }
    };

    const fetchAnalysisData = async () => {
        if (hasFetchedAnalysis || isAnalysisLoading) return;
        setIsAnalysisLoading(true);
        try {
            const response = await fetch(`/api/cards/${card.id}/analysis`);
            if (!response.ok) throw new Error('Failed to fetch analysis');
            const data = await response.json();

            // Map rule IDs to Rule Names for the chart
            const mappedData = data.map(item => {
                const rule = rules.find(r => r.id === item.ruleId);
                return {
                    ...item,
                    ruleName: rule ? rule.ruleName : 'Unassigned/Other'
                };
            }).sort((a, b) => b.totalCashback - a.totalCashback); // Sort by highest cashback

            setAnalysisData(mappedData);
            setHasFetchedAnalysis(true);
        } catch (error) {
            console.error('Error fetching analysis:', error);
            toast.error('Failed to load analysis data');
        } finally {
            setIsAnalysisLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Info className="mr-1.5 h-3.5 w-3.5" /> More info
                </Button>
            </DialogTrigger>
            <DialogContent
                className={cn(
                    "flex flex-col p-0 gap-0",
                    isDesktop ? "max-w-2xl" : "h-[90vh] w-full"
                )}
            >
                <DialogHeader className="px-6 pt-6 shrink-0 border-b pb-4">
                    <DialogTitle className="text-2xl">{card.name}</DialogTitle>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{card.bank} &ndash; {card.cardType} Card</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Select
                                value={card.status}
                                onValueChange={handleStatusChange}
                                disabled={isUpdatingStatus}
                            >
                                <SelectTrigger className={cn(
                                    "h-8 w-[110px] text-xs font-medium border-0 focus:ring-0",
                                    card.status === 'Active' && "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
                                    card.status === 'Frozen' && "bg-sky-100 text-sky-800 hover:bg-sky-200",
                                    card.status === 'Closed' && "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                )}>
                                    {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin mx-auto"/> : <SelectValue />}
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Frozen">Frozen</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="info" className="flex flex-col grow overflow-hidden" onValueChange={(val) => {
                    if (val === 'analytics') fetchAnalysisData();
                }}>
                    <TabsList className="mx-6 mt-4 grid w-full max-w-md grid-cols-3 shrink-0">
                        <TabsTrigger value="info" className="flex items-center gap-2"><Settings className="h-4 w-4"/>Info</TabsTrigger>
                        <TabsTrigger value="rules" className="flex items-center gap-2"><Activity className="h-4 w-4"/>Rules</TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2"><PieChart className="h-4 w-4"/>Analytics</TabsTrigger>
                    </TabsList>

                    <div className="grow overflow-y-auto px-6 py-4">
                        <TabsContent value="info" className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                                {infoItems.map(item => item.value ? (
                                    <div key={item.label}>
                                        <p className="text-muted-foreground mb-1">{item.label}</p>
                                        <p className={cn("font-medium", item.valueClassName)}>{item.value}</p>
                                    </div>
                                ) : null)}
                            </div>

                            <div className="mt-6">
                                <h4 className="font-semibold text-sm mb-3">Cashback Limits</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border">
                                    {representativeTxCapRule && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Max per Tx</p>
                                            <p className="font-medium">{currency(representativeTxCapRule.capPerTransaction)}</p>
                                        </div>
                                    )}
                                    {card.limitPerCategory > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Max per Cat</p>
                                            <p className="font-medium">{currency(card.limitPerCategory)}</p>
                                        </div>
                                    )}
                                    {card.overallMonthlyLimit > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Max per Month</p>
                                            <p className="font-medium">{currency(card.overallMonthlyLimit)}</p>
                                        </div>
                                    )}
                                    {card.minimumMonthlySpend > 0 && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Min. Spending</p>
                                            <p className="font-medium">{currency(card.minimumMonthlySpend)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="rules" className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0">
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by name, MCC code, or category..."
                                    className="w-full pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 pb-4">
                                {filteredAndSortedRules.length > 0 ? filteredAndSortedRules.map(rule => {
                                    const isExpanded = expandedRuleId === rule.id;
                                    const fullMccList = rule.mccCodes ? rule.mccCodes.split(',').map(m => m.trim()).filter(Boolean) : [];
                                    const isMccSearch = /^\d+$/.test(searchTerm.trim());
                                    const mccsToDisplay = isMccSearch
                                        ? fullMccList.filter(code => code.includes(searchTerm.trim()))
                                        : fullMccList;

                                    return (
                                        <div key={rule.id} className="border rounded-lg overflow-hidden bg-card">
                                            <div
                                                onClick={() => handleToggleExpand(rule.id)}
                                                className={cn(
                                                    "flex justify-between items-center p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                                    rule.status !== 'Active' && "opacity-60"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("h-2.5 w-2.5 rounded-full", rule.status === 'Active' ? "bg-emerald-500" : "bg-slate-400")} />
                                                    <span className="font-medium text-[15px]">{rule.ruleName}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono text-[15px] font-semibold">{(rule.rate * 100).toFixed(1)}%</span>
                                                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isExpanded && "rotate-180")} />
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/20">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground font-medium">Status</span>
                                                        <Select
                                                            value={rule.status || 'Active'}
                                                            onValueChange={(val) => handleRuleStatusChange(rule.id, val)}
                                                            disabled={updatingRuleId === rule.id}
                                                        >
                                                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                                                {updatingRuleId === rule.id ? <Loader2 className="h-3 w-3 animate-spin mx-auto"/> : <SelectValue />}
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Active">Active</SelectItem>
                                                                <SelectItem value="Inactive">Inactive</SelectItem>
                                                                <SelectItem value="Deleted">Deleted</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium">Eligible MCC Codes</p>
                                                        {mccsToDisplay.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {mccsToDisplay.map(code => (
                                                                    <Badge key={code} variant="secondary" className="font-normal px-2.5 py-0.5 text-xs">
                                                                        <span className="font-mono mr-1.5">{code}</span>
                                                                        {mccMap[code]?.vn && (
                                                                            <span className="text-muted-foreground">{mccMap[code].vn}</span>
                                                                        )}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground italic">No specific MCC codes are linked to this rule.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">No rules match your search.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="analytics" className="mt-0 h-full focus-visible:outline-none focus-visible:ring-0 flex flex-col">
                            {isAnalysisLoading ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : analysisData.length > 0 ? (
                                <div className="space-y-6 pb-6">
                                    <h4 className="font-semibold text-sm">Performance by Cashback Rule</h4>
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tickFormatter={(val) => `₫${(val / 1000000).toFixed(1)}M`} />
                                                <YAxis dataKey="ruleName" type="category" width={150} tick={{ fontSize: 12 }} />
                                                <Tooltip
                                                    formatter={(value, name) => [currency(value), name === 'totalCashback' ? 'Cashback' : 'Spend']}
                                                    labelStyle={{ color: 'black' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="totalCashback" name="Cashback" fill="#10b981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="h-72 w-full mt-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tickFormatter={(val) => `₫${(val / 1000000).toFixed(1)}M`} />
                                                <YAxis dataKey="ruleName" type="category" width={150} tick={{ fontSize: 12 }} />
                                                <Tooltip
                                                    formatter={(value, name) => [currency(value), name === 'totalSpend' ? 'Spend' : 'Cashback']}
                                                    labelStyle={{ color: 'black' }}
                                                />
                                                <Legend />
                                                <Bar dataKey="totalSpend" name="Spend" fill="#3b82f6" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No transaction data available for analysis.</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}