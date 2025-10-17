import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AppProviders } from "./providers";
import { Layout } from "../components/Layout";
import { DashboardPage } from "../pages/DashboardPage";
import { GraphEditorPage } from "../pages/GraphEditorPage";
import { LoginPage } from "../pages/LoginPage";
import { ProtectedRoute } from "../features/auth/ProtectedRoute";

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/graphs/:graphId" element={<GraphEditorPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </AppProviders>
  );
}

export default App;
