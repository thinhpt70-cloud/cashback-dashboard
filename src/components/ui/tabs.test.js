// src/components/ui/tabs.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

describe('Tabs', () => {
  it('renders the tabs component', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <p>Overview content</p>
        </TabsContent>
        <TabsContent value="transactions">
          <p>Transactions content</p>
        </TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Overview content')).toBeInTheDocument();
  });
});