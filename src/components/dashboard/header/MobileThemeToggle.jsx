import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/components/ui/theme-provider';

const MobileThemeToggle = () => {
  const { setTheme } = useTheme();

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="theme-toggle" className="border-none">
        <AccordionTrigger className="w-full justify-start h-10 p-2 hover:no-underline">
          <Button variant="ghost" className="w-full justify-start h-10">
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-3" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-3" />
            <span>Toggle Theme</span>
          </Button>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-2">
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setTheme('light')}>
              <Sun className="h-5 w-5 mr-3" />
              <span>Light</span>
            </Button>
          </SheetTrigger>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setTheme('dark')}>
              <Moon className="h-5 w-5 mr-3" />
              <span>Dark</span>
            </Button>
          </SheetTrigger>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setTheme('system')}>
              <Monitor className="h-5 w-5 mr-3" />
              <span>System</span>
            </Button>
          </SheetTrigger>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default MobileThemeToggle;