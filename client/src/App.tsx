import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/BookingDetail";
import Finances from "./pages/Finances";
import SqlLogs from "./pages/SqlLogs";
import Reviews from "./pages/Reviews";
import LoginPage from "./pages/LoginPage";
import Profile from "./pages/Profile";
import PersonalData from "./pages/settings/PersonalData";
import Documents from "./pages/settings/Documents";
import PaymentMethods from "./pages/settings/PaymentMethods";
import Notifications from "./pages/settings/Notifications";
import Security from "./pages/settings/Security";
import Support from "./pages/Support";
import AuthGuard from "./components/AuthGuard";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <AuthGuard>
            <Navigation />
            <Switch>
              <Route path={"/"} component={Home} />
              <Route path={"/workspaces"} component={Workspaces} />
              <Route path={"/workspaces/:id"} component={WorkspaceDetail} />
              <Route path={"/bookings"} component={Bookings} />
              <Route path={"/bookings/:id"} component={BookingDetail} />
              <Route path={"/finances"} component={Finances} />
              <Route path={"/logs"} component={SqlLogs} />
              <Route path={"/reviews"} component={Reviews} />
              <Route path={"/profile"} component={Profile} />
              <Route path={"/profile/personal"} component={PersonalData} />
              <Route path={"/profile/documents"} component={Documents} />
              <Route path={"/profile/payment"} component={PaymentMethods} />
              <Route path={"/profile/notifications"} component={Notifications} />
              <Route path={"/profile/security"} component={Security} />
              <Route path={"/support"} component={Support} />
              <Route path={"/404"} component={NotFound} />
              <Route component={NotFound} />
            </Switch>
          </AuthGuard>
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
