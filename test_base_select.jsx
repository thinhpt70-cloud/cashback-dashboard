import * as React from "react";
import { createRoot } from "react-dom/client";
import { Select } from "@base-ui/react";
import { renderToString } from "react-dom/server";

function App() {
  const [val, setVal] = React.useState("my-uuid-123");
  return (
    <Select.Root value={val} onValueChange={setVal}>
      <Select.Trigger className="trigger">
        <Select.Value placeholder="Select..." />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner>
          <Select.Popup>
            <Select.Item value="my-uuid-123"><Select.ItemText>My Card Name</Select.ItemText></Select.Item>
            <Select.Item value="2"><Select.ItemText>Two</Select.ItemText></Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

console.log(renderToString(<App />));
