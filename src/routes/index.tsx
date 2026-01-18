import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "./routes";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ComponentType } from "react";

// Loading fallback component
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Wrapper for lazy-loaded components (prevents ref warnings)
function LazyComponentWrapper({ Component }: { Component: ComponentType }) {
  return <Component />;
}

// Protected Route wrapper component
function ProtectedRoute({ 
  Component, 
  requiresAuth, 
  requiresAdmin 
}: { 
  Component: ComponentType;
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
  return <LazyComponentWrapper Component={Component} />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.requiresAuth || route.requiresAdmin ? (
                <ProtectedRoute 
                  Component={route.element}
                  requiresAuth={route.requiresAuth} 
                  requiresAdmin={route.requiresAdmin}
                />
              ) : (
                <LazyComponentWrapper Component={route.element} />
              )
            }
          />
        ))}
      </Routes>
    </Suspense>
  );
}
