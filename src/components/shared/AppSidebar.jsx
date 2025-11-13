// src/components/shared/AppSidebar.jsx
import React from 'react';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, CreditCard, Repeat, Settings } from 'lucide-react';

const AppSidebar = ({ activeView, setActiveView }) => {
  return (
    <Sidebar>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            href="#"
            isActive={activeView === 'overview'}
            onClick={() => setActiveView('overview')}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            href="#"
            isActive={activeView === 'transactions'}
            onClick={() => setActiveView('transactions')}
          >
            <Repeat className="h-4 w-4" />
            <span>Transactions</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            href="#"
            isActive={activeView === 'cards'}
            onClick={() => setActiveView('cards')}
          >
            <CreditCard className="h-4 w-4" />
            <span>My Cards</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            href="#"
            isActive={activeView === 'payments'}
            onClick={() => setActiveView('payments')}
          >
            <Settings className="h-4 w-4" />
            <span>Payments</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </Sidebar>
  );
};

export default AppSidebar;
