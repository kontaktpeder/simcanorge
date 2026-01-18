import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "./routes";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ReactElement } from "react";

// Loading fallback component
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Protected Route wrapper component
function ProtectedRoute({ 
  children, 
  requiresAuth, 
  requiresAdmin 
}: { 
  children: ReactElement;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}) {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <RouteLoadingFallback />;
  }

  // Check admin requirement first (most restrictive)
  if (requiresAdmin && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check auth requirement
  if (requiresAuth && !user) {
    // Include returnUrl so user can be redirected back after login
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  // User has required permissions, render the route
  return children;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {routes.map((route) => {
          // Create route element with protection if needed
          const routeElement = route.requiresAuth || route.requiresAdmin ? (
            <ProtectedRoute 
              requiresAuth={route.requiresAuth} 
              requiresAdmin={route.requiresAdmin}
            >
              <route.element />
            </ProtectedRoute>
          ) : (
            <route.element />
          );

          return (
            <Route
              key={route.path}
              path={route.path}
              element={routeElement}
            />
          );
        })}
      </Routes>
    </Suspense>
  );
}
