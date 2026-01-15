"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "src/lib/utils"
import { Button } from "src/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "src/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "src/components/ui/popover"

const Combobox = ({ options = [], value, onChange, placeholder, searchPlaceholder, disableAutoFocus = false, className, id }) => {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('');

  // Explicitly manage focus to ensure disableAutoFocus is respected
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open && disableAutoFocus && inputRef.current) {
      // Force blur if it grabs focus, or ensure we don't focus it.
      // cmdk might try to focus it.
      // Actually, cmdk's Command.Input has autoFocus.
      // If we pass autoFocus={false}, react might still focus it if cmdk does internally.
      // Let's try blurring it immediately if it's not supposed to be focused.
      setTimeout(() => {
          if (document.activeElement === inputRef.current) {
              inputRef.current.blur();
          }
      }, 0);
    }
  }, [open, disableAutoFocus]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-10", className)}
        >
          {/* --- FIX 1: Added fallback to 'value' --- */}
          {value
            ? (options.find((option) => option.value === value)?.label || value)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={setInputValue}
            // Fix: Disable autofocus if requested (e.g. on mobile)
            autoFocus={!disableAutoFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue) {
                if (!options.some(opt => opt.value.toLowerCase() === inputValue.toLowerCase())) {
                  onChange(inputValue);
                  setInputValue('');
                  setOpen(false);
                }
              }
            }}
          />
          <CommandEmpty>
            {inputValue && (
                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                        onChange(inputValue);
                        setInputValue('');
                        setOpen(false);
                    }}
                >
                    Create "{inputValue}"
                </Button>
            )}
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                // --- FIX 2: Use label for searching ---
                value={option.label}
                // --- FIX 3: Use value for selecting ---
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox }