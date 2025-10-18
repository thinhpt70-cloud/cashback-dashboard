import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';

export default function PinInput({ length = 6, onComplete }) {
    const [pin, setPin] = useState(Array(length).fill(''));
    const inputRefs = useRef([]);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (!/^[0-9]$/.test(value) && value !== '') return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        if (value !== '' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (newPin.join('').length === length) {
            onComplete(newPin.join(''));
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && pin[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pastedData = e.clipboardData.getData('text').slice(0, length);
        if (/^[0-9]+$/.test(pastedData)) {
            const newPin = Array(length).fill('');
            pastedData.split('').forEach((char, index) => {
                newPin[index] = char;
            });
            setPin(newPin);
            if (newPin.join('').length === length) {
                onComplete(newPin.join(''));
            }
        }
    };

    return (
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {pin.map((digit, index) => (
                <Input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="password"
                    maxLength="1"
                    pattern="[0-9]"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-12 h-14 text-center text-2xl font-semibold"
                />
            ))}
        </div>
    );
}