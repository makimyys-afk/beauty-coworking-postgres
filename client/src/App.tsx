import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetails from "./pages/WorkspaceDetails";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/BookingDetail";
import Finances from "./pages/Finances";
import SqlLogs from "./pages/SqlLogs";
import Reviews from "./pages/Reviews";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWorkspaces from "./pages/admin/AdminWorkspaces";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminReviews from "./pages/admin/AdminReviews";
import Profile from "./pages/Profile";
import StatusPage from "./pages/StatusPage";
import PersonalData from "./pages/settings/PersonalData";
import Documents from "./pages/settings/Documents";
import PaymentMethods from "./pages/settings/PaymentMethods";
import Notifications from "./pages/settings/Notifications";
import Security from "./pages/settings/Security";
import Support from "./pages/Support";
import AuthGuard from "./components/AuthGuard";
import AdminGuard from "./components/AdminGuard";
import UserGuard from "./components/UserGuard";

function Router() {
  return (
    <>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route>
          <AuthGuard>
            <Navigation />
            <Switch>
              <Route path={"/"} component={Home} />
              {/* Страницы только для обычных пользователей */}
              <Route path={"/workspaces"}>
                <UserGuard>
                  <Workspaces />
                </UserGuard>
              </Route>
              <Route path={"/workspaces/:id"}>
                <UserGuard>
                  <WorkspaceDetail />
                </UserGuard>
              </Route>
              <Route path={"/bookings"}>
                <UserGuard>
                  <Bookings />
                </UserGuard>
              </Route>
              <Route path={"/bookings/:id"}>
                <UserGuard>
                  <BookingDetail />
                </UserGuard>
              </Route>
              <Route path={"/finances"}>
                <UserGuard>
                  <Finances />
                </UserGuard>
              </Route>
              <Route path={"/reviews"}>
                <UserGuard>
                  <Reviews />
                </UserGuard>
              </Route>
              <Route path={"/profile"}>
                <UserGuard>
                  <Profile />
                </UserGuard>
              </Route>
              <Route path={"/profile/status"}>
                <UserGuard>
                  <StatusPage />
                </UserGuard>
              </Route>
              <Route path={"/profile/personal"}>
                <UserGuard>
                  <PersonalData />
                </UserGuard>
              </Route>
              <Route path={"/profile/documents"}>
                <UserGuard>
                  <Documents />
                </UserGuard>
              </Route>
              <Route path={"/profile/payment"}>
                <UserGuard>
                  <PaymentMethods />
                </UserGuard>
              </Route>
              <Route path={"/profile/notifications"}>
                <UserGuard>
                  <Notifications />
                </UserGuard>
              </Route>
              <Route path={"/profile/security"}>
                <UserGuard>
                  <Security />
                </UserGuard>
              </Route>
              <Route path={"/support"}>
                <UserGuard>
                  <Support />
                </UserGuard>
              </Route>
              {/* SQL Логи доступны только админам */}
              <Route path={"/logs"}>
                <AdminGuard>
                  <SqlLogs />
                </AdminGuard>
              </Route>
              {/* Админские страницы */}
              <Route path={"/admin"}>
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              </Route>
              <Route path={"/admin/users"}>
                <AdminGuard>
                  <AdminUsers />
                </AdminGuard>
              </Route>
              <Route path={"/admin/workspaces"}>
                <AdminGuard>
                  <AdminWorkspaces />
                </AdminGuard>
              </Route>
              <Route path={"/admin/bookings"}>
                <AdminGuard>
                  <AdminBookings />
                </AdminGuard>
              </Route>
              <Route path={"/admin/reviews"}>
                <AdminGuard>
                  <AdminReviews />
                </AdminGuard>
              </Route>
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
