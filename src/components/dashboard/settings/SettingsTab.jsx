import React, { useState, useEffect, useMemo } from 'react';
import { Settings } from 'lucide-react';
import { getTimezone, setTimezone } from '../../../lib/timezone';

export default function SettingsTab() {
    const [selectedTimezone, setSelectedTimezone] = useState('');

    useEffect(() => {
        setSelectedTimezone(getTimezone());
    }, []);

    const timezones = useMemo(() => {
        if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
            return Intl.supportedValuesOf('timeZone');
        }
        // Fallback for older environments
        return ['Asia/Ho_Chi_Minh', 'UTC'];
    }, []);

    const handleTimezoneChange = (e) => {
        const newTz = e.target.value;
        setSelectedTimezone(newTz);
        setTimezone(newTz);
        // Force a reload to apply the new timezone across the app instantly
        window.location.reload();
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col space-y-1.5">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">Settings</h3>
                <p className="text-sm text-muted-foreground">Manage your dashboard preferences and application settings.</p>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="p-6">
                    <h3 className="font-semibold leading-none tracking-tight mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                        Localization
                    </h3>

                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="timezone-select">
                                Timezone
                            </label>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Select the timezone used for displaying transaction dates and dashboard metrics. The page will reload after changing this setting.
                            </p>
                            <select
                                id="timezone-select"
                                value={selectedTimezone}
                                onChange={handleTimezoneChange}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {timezones.map((tz) => (
                                    <option key={tz} value={tz}>
                                        {tz}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
