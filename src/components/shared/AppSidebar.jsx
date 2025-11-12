// src/components/shared/AppSidebar.jsx

import React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { LayoutDashboard, Wallet, CreditCard, Landmark } from 'lucide-react';

const menuItems = [
  { title: 'Overview', icon: LayoutDashboard, value: 'overview' },
  { title: 'Transactions', icon: Wallet, value: 'transactions' },
  { title: 'My Cards', icon: CreditCard, value: 'cards' },
  { title: 'Payments', icon: Landmark, value: 'payments' },
];

export function AppSidebar({ activeView, setActiveView }) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => setActiveView(item.value)}
                    isActive={activeView === item.value}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}