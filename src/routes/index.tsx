import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "./routes";
import { useAuth } from "@/hooks/useAuth";
import { RequirePersonProfile } from "@/components/auth/RequirePersonProfile";
import type { ComponentType } from "react";
import { BrandLoader } from "@/components/brand/BrandLoader";

// Loading fallback – Bilgarasje line-art that draws itself on loop.
function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <BrandLoader />
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
  // Dashboard routes (except /kom-i-gang and /konto) require a person profile
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  if (isDashboardRoute) {
    return (
      <RequirePersonProfile>
        <LazyComponentWrapper Component={Component} />
      </RequirePersonProfile>
    );
  }

  return <LazyComponentWrapper Component={Component} />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Permanent redirect: /dashboard → /garasje */}
        <Route path="/dashboard" element={<Navigate to="/garasje" replace />} />
        {routes
          .filter((route) => route.path !== "/dashboard")
          .map((route) => (
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
