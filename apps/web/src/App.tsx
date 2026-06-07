import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@worldcup/ui";
import { darkTheme } from "@worldcup/ui";

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <div>World Cup Predictor Dashboard</div>
    </ThemeProvider>
  );
}

// In case it's loaded as a standard react entrypoint
if (typeof document !== "undefined") {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}
