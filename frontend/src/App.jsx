import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

import LogBugPage from "./pages/LogBugPage";
import ViewBugsPage from "./pages/ViewBugPage";
import BugAnalyticsPage from "./pages/BugAnalyticsPage";

import "./App.css";

function App() {
  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      {/* ✅ Desktop-only header */}
      <Box display={{ base: "none", md: "block" }}>
        <Header />
      </Box>

      {/* ✅ IMPORTANT: column on mobile, row on desktop */}
      <Flex flex="1" w="100%" direction={{ base: "column", md: "row" }}>
        <Sidebar />

        {/* ✅ Content full width on mobile */}
        <Box flex="1" w="100%" p={{ base: 3, md: 6 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/log-bug" replace />} />
            <Route path="/log-bug" element={<LogBugPage />} />
            <Route path="/view-bugs" element={<ViewBugsPage />} />
            <Route path="/analytics" element={<BugAnalyticsPage />} />
            <Route path="*" element={<Navigate to="/log-bug" replace />} />
          </Routes>
        </Box>
      </Flex>
    </Flex>
  );
}

export default App;
