import React from 'react';
import { LayoutDashboard, ArrowLeftRight, CreditCard, Banknote, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { cn } from '../../lib/utils';

const navItems = [
  { view: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { view: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { view: 'cards', icon: CreditCard, label: 'My Cards' },
  { view: 'payments', icon: Banknote, label: 'Payments' },
];

const AppSidebar = ({ activeView, setActiveView, isCollapsed, setIsCollapsed }) => {

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLinkClick = (view) => {
    setActiveView(view);
  };

  const NavLink = ({ item, isCollapsed, activeView, handleLinkClick }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeView === item.view ? 'default' : 'ghost'}
            className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')}
            onClick={() => handleLinkClick(item.view)}
          >
            <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
            <span className={cn(isCollapsed && 'sr-only')}>{item.label}</span>
          </Button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  return (
        <aside
            className={cn(
                'hidden md:flex flex-col h-screen bg-background border-r transition-all duration-300 ease-in-out fixed top-0 left-0 z-40',
                isCollapsed ? 'w-16' : 'w-56'
            )}
        >
            <div className="flex items-center justify-center h-16 border-b">
                <img src="/favicon.svg" alt="Cardifier" className="h-8 w-8" />
            </div>
            <nav className="flex-1 p-2 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.view}
                        item={item}
                        isCollapsed={isCollapsed}
                        activeView={activeView}
                        handleLinkClick={handleLinkClick}
                    />
                ))}
            </nav>
            <div className="p-2 border-t">
                <Button variant="ghost" size="icon" className="w-full" onClick={toggleSidebar}>
                    {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                </Button>
      </div>
        </aside>
  );
};

export default AppSidebar;
