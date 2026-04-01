import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { routes } from "./routes";
import { useAuth } from "@/hooks/useAuth";
import { RequirePersonProfile } from "@/components/auth/RequirePersonProfile";
import type { ComponentType } from "react";
import simcaRallye from "@/assets/simca-rallye-yellow.png";

// Loading fallback – looping "car driving into garage" animation
function RouteLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative" style={{ width: 160, height: 80, overflow: 'hidden' }}>
        {/* Garage structure */}
        <svg viewBox="0 0 96 48" fill="none" className="absolute inset-0 w-full h-full">
          <rect x="4" y="16" width="88" height="32" rx="2" fill="#F5F0E6" stroke="#1B3A5C" strokeWidth="2.5" />
          <path d="M2 18 L48 4 L94 18" stroke="#1B3A5C" strokeWidth="2.5" fill="#1B3A5C" strokeLinejoin="round" />
          <rect x="10" y="20" width="76" height="28" rx="2" fill="#D6DEE8" stroke="#1B3A5C" strokeWidth="2" />
          <line x1="48" y1="8" x2="48" y2="14" stroke="#1B3A5C" strokeWidth="1.5" />
          <path d="M44 14 Q48 17 52 14" stroke="#1B3A5C" strokeWidth="1.5" fill="none" />
          <defs>
            <radialGradient id="lampGlowLoading" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
              <stop offset="50%" stopColor="#EAB308" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#EAB308" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="48" cy="15" r="4" fill="url(#lampGlowLoading)" />
          <circle cx="48" cy="15" r="1.8" fill="#FDE68A" />
          <circle cx="48" cy="15" r="1" fill="#FFFBEB" />
          <line x1="12" y1="46" x2="84" y2="46" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {/* Car driving in on loop */}
        <img
          src={simcaRallye}
          alt=""
          className="absolute z-10 animate-car-into-garage-loop"
          style={{
            height: 56,
            bottom: -4,
            filter: 'saturate(1.4) brightness(1.1)',
          }}
        />
      </div>
      <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
        Laster…
      </p>
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
