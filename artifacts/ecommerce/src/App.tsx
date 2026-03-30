import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/auth-context";


// Pages
import { Home } from "@/pages/home";
import { Products } from "@/pages/products";
import { ProductDetail } from "@/pages/product-detail";
import { Cart } from "@/pages/cart";
import { Orders } from "@/pages/orders";
import { Dashboard } from "@/pages/dashboard";
import { ProductManagement } from "@/pages/product-management";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { CheckoutPage } from "./pages/checkout";
import { OrderSuccessPage } from "./pages/order-success";
import NotFound from "@/pages/not-found";




const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/orders" component={Orders} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin/products" component={ProductManagement} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/order-success/:id" component={OrderSuccessPage} />
      <Route component={NotFound} />


    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>

  );
}

export default App;
