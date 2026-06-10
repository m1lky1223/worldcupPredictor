import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@worldcup/ui";
import { darkTheme } from "@worldcup/ui";
import { client } from "./apollo";
import Layout from "./Layout";
import Dashboard from "./pages/Dashboard";
import MatchList from "./pages/MatchList";
import MatchDetail from "./pages/MatchDetail";
import Teams from "./pages/Teams";
import TeamProfile from "./pages/TeamProfile";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import Groups from "./pages/Groups";
import ModelTracker from "./pages/ModelTracker";

function App() {
  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={darkTheme}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/matches" element={<MatchList />} />
              <Route path="/matches/:id" element={<MatchDetail />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:id" element={<TeamProfile />} />
              <Route path="/players" element={<Players />} />
              <Route path="/players/:id" element={<PlayerProfile />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/model" element={<ModelTracker />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ApolloProvider>
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

export default App;
