import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransactionProvider } from "@/context/TransactionContext";
import { AppNav } from "@/layouts/AppNav";
import PaymentApp from "./features/payment/PaymentApp";
import MonitorDashboard from "./features/monitoring/MonitorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TransactionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PaymentApp />} />
            <Route path="/monitor" element={<MonitorDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AppNav />
        </BrowserRouter>
      </TransactionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
