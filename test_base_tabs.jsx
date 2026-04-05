import * as React from "react";
import { createRoot } from "react-dom/client";
import { Tabs } from "@base-ui/react";
import { renderToString } from "react-dom/server";

function App() {
  return (
    <Tabs.Root defaultValue="tab1">
      <Tabs.List>
        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
      <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
    </Tabs.Root>
  );
}

console.log(renderToString(<App />));
