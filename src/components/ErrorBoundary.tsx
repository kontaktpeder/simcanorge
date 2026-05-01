import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

// Local-storage keys that, when stale or corrupt, can drive an infinite
// "bounce back to /app -> crash -> ErrorBoundary" loop. The reset button
// clears these so the user always has a way out.
const TRIP_CACHE_KEYS = [
  'active_activity_session_id_v1',
  'active_drive_session_v1',
  'activity_focus_minimized_v1',
];

function clearTripCaches() {
  if (typeof window === 'undefined') return;
  for (const key of TRIP_CACHE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Always log so the message shows up in support payloads.
    console.error('ErrorBoundary caught:', error?.message ?? error, errorInfo?.componentStack);
  }

  handleGoHome = () => {
    clearTripCaches();
    // Send to /app — the smart root will redirect to /login if signed out.
    window.location.assign('/app');
  };

  handleReload = () => {
    // Most common cause of repeated crashes here is a stale/corrupt active
    // trip in localStorage. Clear it before reloading.
    clearTripCaches();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ background: 'linear-gradient(180deg, #3a2e24 0%, #2a2118 60%, #1a1510 100%)' }}
        >
          {/* Subtle radial glow */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(196,150,44,0.06) 0%, transparent 60%)' }}
          />

          <div className="relative z-10 text-center max-w-md w-full">
            {/* Icon */}
            <div
              className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(196,150,44,0.15), rgba(196,150,44,0.05))', border: '1px solid rgba(196,150,44,0.2)' }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: '#c4962c' }} />
            </div>

            {/* Title */}
            <p
              className="text-[10px] tracking-[0.3em] uppercase mb-2"
              style={{ ...oswald, fontWeight: 500, color: 'rgba(196,150,44,0.7)' }}
            >
              bilgarasje.no
            </p>
            <h1
              className="text-[1.6rem] sm:text-[2rem] leading-[0.95] uppercase tracking-[0.02em] font-bold italic mb-3"
              style={{ ...chakra, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
            >
              Noe gikk galt
            </h1>
            <p
              className="text-[13px] sm:text-[14px] leading-relaxed mb-8"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Vi beklager, men noe uventet skjedde.
              <br />
              Prøv å laste inn siden på nytt.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleGoHome}
                className="gap-2 min-h-[44px] px-6 text-sm font-semibold uppercase tracking-wider rounded-lg"
                style={{
                  ...oswald,
                  background: 'linear-gradient(135deg, #c4962c, #d4a83c)',
                  color: '#1a1510',
                  border: 'none',
                }}
              >
                <Home className="w-4 h-4" />
                Gå til appen
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="gap-2 min-h-[44px] px-6 text-sm font-semibold uppercase tracking-wider rounded-lg"
                style={{
                  ...oswald,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Last inn på nytt
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
