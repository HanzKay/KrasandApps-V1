import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

// Error Boundary Class Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5EEDC] p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#5A3A2A] mb-2">
              Something went wrong
            </h2>
            <p className="text-[#5A3A2A]/60 mb-6">
              {this.props.fallbackMessage || 'We encountered an unexpected error. Please try refreshing the page.'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#5A3A2A] hover:bg-[#4a2a1a]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for sections
export const SectionErrorFallback = ({ error, onRetry, sectionName, compact = false }) => {
  if (compact) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-600 text-sm">Failed to load {sectionName}</span>
        </div>
        {onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry} className="text-red-600">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-600 font-medium mb-2">
        Unable to load {sectionName}
      </p>
      <p className="text-red-500 text-sm mb-4">
        {error || 'Please check your connection and try again.'}
      </p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
};

// Loading spinner component
export const LoadingSpinner = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin rounded-full border-b-2 border-[#5A3A2A] ${sizeClasses[size]} mb-3`} />
      <p className="text-[#5A3A2A]/60 text-sm">{message}</p>
    </div>
  );
};

// Empty state component
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12">
    {Icon && <Icon className="w-16 h-16 mx-auto mb-4 text-[#5A3A2A]/20" />}
    <h3 className="text-lg font-semibold text-[#5A3A2A]/80 mb-2">{title}</h3>
    {description && <p className="text-[#5A3A2A]/60 mb-4">{description}</p>}
    {action}
  </div>
);

export default ErrorBoundary;
