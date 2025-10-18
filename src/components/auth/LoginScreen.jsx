import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import PinInput from './PinInput';

export default function LoginScreen({ onLoginSuccess }) {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePinComplete = async (pin) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin }),
                credentials: 'include',
            });

            if (response.ok) {
                onLoginSuccess();
            } else {
                setError('Incorrect PIN. Please try again.');
                // Clear the PIN inputs after a failed attempt (optional but good UX)
                // You would need to add a reset function to your PinInput component.
            }
        } catch (err) {
            console.error('Login request failed:', err);
            setError('An error occurred. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Enter PIN</CardTitle>
                        <p className="text-sm text-muted-foreground pt-1">Please enter your 6-digit PIN to continue.</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* The PinInput component doesn't need any changes */}
                        <PinInput onComplete={handlePinComplete} />
                        
                        {isLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}

                        {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}