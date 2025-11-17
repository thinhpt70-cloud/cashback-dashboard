import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReviewControls({ sort, setSort, filter, setFilter, group, setGroup }) {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b gap-4">
            <div className="flex-1 w-full md:w-auto">
                <Input 
                    placeholder="Filter by name..." 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)} 
                    className="max-w-sm"
                />
            </div>
            <div className="flex items-center gap-2">
                <Select value={sort.key} onValueChange={(value) => setSort({ ...sort, key: value })}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Transaction Date">Date</SelectItem>
                        <SelectItem value="Amount">Amount</SelectItem>
                        <SelectItem value="Transaction Name">Name</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={sort.order} onValueChange={(value) => setSort({ ...sort, order: value })}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Order" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="asc">Asc</SelectItem>
                        <SelectItem value="desc">Desc</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={group} onValueChange={setGroup}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="MCC Code">MCC</SelectItem>
                        <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}