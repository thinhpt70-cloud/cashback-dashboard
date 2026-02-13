import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import {
    Calendar as CalendarIcon,
    Check,
    ChevronsUpDown,
    X,
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../../ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from '../../ui/command';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import useDebounce from '../../../hooks/useDebounce';

// --- Text Filter ---
export function TableFilterText({ value, onChange, placeholder = "Filter..." }) {
    const [localValue, setLocalValue] = useState(value || '');
    const debouncedValue = useDebounce(localValue, 300);

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    useEffect(() => {
        if (debouncedValue !== value) {
            onChange(debouncedValue);
        }
    }, [debouncedValue, onChange, value]);

    return (
        <div className="flex items-center relative">
            <Input
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="h-8 w-full text-xs"
            />
             {localValue && (
                <Button
                    variant="ghost"
                    onClick={() => setLocalValue('')}
                    className="h-6 w-6 p-0 absolute right-1"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}

// --- Date Range Filter ---
export function TableFilterDateRange({ value, onChange }) {
    // value is { from: Date, to: Date } or undefined
    const [date, setDate] = useState(value);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setDate(value);
    }, [value]);

    const handleSelect = (range) => {
        setDate(range);
        if (range?.from && range?.to) {
            onChange(range);
            setIsOpen(false);
        } else if (range === undefined) {
             onChange(undefined);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full h-8 justify-start text-left font-normal px-2 text-xs",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, "MMM dd, yyyy")} -{" "}
                                {format(date.to, "MMM dd, yyyy")}
                            </>
                        ) : (
                            format(date.from, "MMM dd, yyyy")
                        )
                    ) : (
                        <span>Pick dates</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <style>{`
                    .rdp-day_selected {
                        background-color: var(--primary) !important;
                        color: var(--primary-foreground) !important;
                    }
                    .rdp-button:hover:not([disabled]) {
                        background-color: var(--accent);
                        color: var(--accent-foreground);
                    }
                `}</style>
                <DayPicker
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={handleSelect}
                    numberOfMonths={2}
                    className="p-3"
                />
                 {/* Clear Button */}
                 <div className="p-2 border-t flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setDate(undefined);
                            onChange(undefined);
                            setIsOpen(false);
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// --- Multi-Select Filter ---
export function TableFilterMultiSelect({
    value = [], // Array of selected values
    options = [], // Array of { label, value }
    onChange,
    placeholder = "Select..."
}) {
    const [open, setOpen] = useState(false);

    // Derived count for display
    const selectedCount = value.length;

    const handleSelect = (optionValue) => {
        const newSelected = value.includes(optionValue)
            ? value.filter((item) => item !== optionValue)
            : [...value, optionValue];
        onChange(newSelected);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-8 justify-between px-2 text-xs"
                >
                    <span className="truncate">
                        {selectedCount > 0
                            ? `${selectedCount} selected`
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} className="h-8 text-xs" />
                    <CommandList>
                         <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                            {options.map((option) => {
                                const isSelected = value.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label} // Search by label
                                        onSelect={() => handleSelect(option.value)}
                                        className="text-xs"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-3 w-3 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className={cn("h-3 w-3")} />
                                        </div>
                                        <span>{option.label}</span>
                                        {/* Optional count or extra info could go here */}
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {selectedCount > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => onChange([])}
                                        className="justify-center text-center text-xs font-medium"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// --- Numeric Filter ---
export function TableFilterNumeric({ value, onChange }) {
    // value is { operator: 'gt' | 'lt' | 'eq', value: string }
    // Default operator to 'eq' if not set, but initially empty

    const [operator, setOperator] = useState(value?.operator || 'eq');
    const [numValue, setNumValue] = useState(value?.value || '');
    const debouncedNumValue = useDebounce(numValue, 300);

    useEffect(() => {
        if (value) {
            setOperator(value.operator);
            setNumValue(value.value);
        } else {
            setOperator('eq');
            setNumValue('');
        }
    }, [value]);

    useEffect(() => {
        // Only trigger change if value actually changed
        if ((value?.value !== debouncedNumValue) || (value?.operator !== operator)) {
             if (debouncedNumValue === '') {
                 onChange(undefined);
             } else {
                 onChange({ operator, value: debouncedNumValue });
             }
        }
    }, [debouncedNumValue, operator, onChange, value]);

    return (
        <div className="flex items-center gap-1">
            <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger className="h-8 w-[50px] px-1 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="gt">{'>'}</SelectItem>
                    <SelectItem value="lt">{'<'}</SelectItem>
                    <SelectItem value="eq">{'='}</SelectItem>
                </SelectContent>
            </Select>
            <Input
                type="number"
                value={numValue}
                onChange={(e) => setNumValue(e.target.value)}
                className="h-8 w-full px-2 text-xs"
                placeholder="0.00"
            />
        </div>
    );
}
