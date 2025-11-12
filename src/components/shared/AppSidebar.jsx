// src/components/shared/AppSidebar.jsx

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, List, CreditCard, Calendar, Search, RefreshCw, Plus, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/ui/ThemeToggle";

export function AppSidebar({
    activeView,
    setActiveView,
    onFinderOpen,
    onRefresh,
    onNewTransaction,
    onLogout,
    monthSelector,
    className
}) {
    const menuItems = [
        { title: "Overview", icon: Home, view: "overview" },
        { title: "Transactions", icon: List, view: "transactions" },
        { title: "My Cards", icon: CreditCard, view: "cards" },
        { title: "Payments", icon: Calendar, view: "payments" },
    ];

    return (
        <Sidebar className={className}>
            <SidebarHeader className="p-4">
                <div className="flex items-center gap-2">
                    <img src="/favicon.svg" alt="Cardifier icon" className="h-8 w-8" />
                    <span className="text-xl font-semibold">Cardifier</span>
                </div>
                <div className="mt-4">
                    {monthSelector}
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        {menuItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    onClick={() => setActiveView(item.view)}
                                    isActive={activeView === item.view}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarSeparator />
                <SidebarGroup>
                     <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={onFinderOpen}>
                                <Search className="h-4 w-4" />
                                <span>Card Finder</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={onRefresh}>
                                <RefreshCw className="h-4 w-4" />
                                <span>Refresh Data</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                         <SidebarMenuItem>
                            <Button onClick={onNewTransaction} className="w-full justify-start h-10">
                                <Plus className="mr-2 h-4 w-4" />
                                New Transaction
                            </Button>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 flex flex-col gap-2">
                <ModeToggle />
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={onLogout}>
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
