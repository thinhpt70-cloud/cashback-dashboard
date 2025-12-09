import React from 'react';
import { LayoutDashboard, ArrowLeftRight, CreditCard, Banknote, ChevronsLeft, ChevronsRight, Search, RefreshCw, LogOut, DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { ModeToggle } from '../dashboard/header/ThemeToggle';

const navItems = [
  { view: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { view: 'transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { view: 'cards', icon: CreditCard, label: 'My Cards' },
  { view: 'cashback', icon: DollarSign, label: 'Cashback' },
  { view: 'payments', icon: Banknote, label: 'Payments' },
];

const AppSidebar = ({ 
  activeView, 
  setActiveView, 
  isCollapsed, 
  setIsCollapsed,
  handleLogout,
  refreshData,
  openFinder
}) => {

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
            <div className="mt-auto flex flex-col items-center gap-2 p-2 border-t">
                <div className="w-full space-y-2">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')} onClick={openFinder}>
                                    <Search className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                                    <span className={cn(isCollapsed && 'sr-only')}>Card Finder</span>
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>Card Finder</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')} onClick={() => refreshData(false)}>
                                    <RefreshCw className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                                    <span className={cn(isCollapsed && 'sr-only')}>Refresh</span>
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>Refresh</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                    <ModeToggle isCollapsed={isCollapsed} />
                </div>
                <div className="w-full pt-2 mt-2 border-t">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" className={cn('w-full justify-start h-10', isCollapsed && 'justify-center')} onClick={handleLogout}>
                                    <LogOut className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                                    <span className={cn(isCollapsed && 'sr-only')}>Logout</span>
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && (
                                <TooltipContent side="right">
                                    <p>Logout</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="p-2 border-t">
                    <Button variant="ghost" size="icon" className="w-full" onClick={toggleSidebar}>
                        {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;