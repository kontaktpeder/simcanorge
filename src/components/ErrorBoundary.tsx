import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
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
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1F66B5] to-[#0F3E7A] p-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-white mb-2">
              Noe gikk galt
            </h1>
            <p className="font-serif text-white/80 mb-6">
              Vi beklager, men noe uventet skjedde. Vennligst prøv å laste inn siden på nytt.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-white text-[#1F66B5] hover:bg-white/90"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gå til forsiden
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
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
