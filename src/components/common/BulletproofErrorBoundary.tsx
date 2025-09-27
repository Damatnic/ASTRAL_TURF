/**
 * BULLETPROOF ERROR BOUNDARY
 * Revolutionary error handling with automatic recovery and fallback systems
 * Production-grade error boundaries with retry mechanisms
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../../utils/bulletproofSafety';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, Bug, Shield, Home } from 'lucide-react';

// ============================================================================
// ERROR BOUNDARY INTERFACES
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelayMs?: number;
  context?: string;
  showErrorDetails?: boolean;
  autoRetry?: boolean;
  criticalError?: boolean;
}

interface ErrorDisplayProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  context: string;
  onRetry: () => void;
  onReset: () => void;
  retryCount: number;
  maxRetries: number;
  showDetails: boolean;
  criticalError: boolean;
}

// ============================================================================
// ERROR DISPLAY COMPONENT
// ============================================================================

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorInfo,
  errorId,
  context,
  onRetry,
  onReset,
  retryCount,
  maxRetries,
  showDetails,
  criticalError
}) => {
  const errorLevel = criticalError ? 'critical' : retryCount > 2 ? 'severe' : 'moderate';
  
  const getErrorColor = () => {
    switch (errorLevel) {
      case 'critical': return 'border-red-500 bg-red-900/20';
      case 'severe': return 'border-orange-500 bg-orange-900/20';
      default: return 'border-yellow-500 bg-yellow-900/20';
    }
  };

  const getErrorIcon = () => {
    switch (errorLevel) {
      case 'critical': return <AlertTriangle className="w-8 h-8 text-red-400" />;
      case 'severe': return <Bug className="w-8 h-8 text-orange-400" />;
      default: return <Shield className="w-8 h-8 text-yellow-400" />;
    }
  };

  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <Card className={`max-w-2xl w-full border-2 ${getErrorColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-white">
            {criticalError ? 'Critical System Error' : 'Component Error Detected'}
          </CardTitle>
          <p className="text-slate-400">
            {context} encountered an unexpected error but the system is still stable.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Summary */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Error Summary</h4>
            <p className="text-sm text-slate-300 font-mono bg-slate-900/50 p-2 rounded">
              {error.message}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Error ID: {errorId}
            </p>
          </div>

          {/* Retry Information */}
          {maxRetries > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Recovery Status</h4>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <RefreshCw className="w-4 h-4" />
                <span>Retry attempts: {retryCount} / {maxRetries}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(retryCount / maxRetries) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Detailed Error Information */}
          {showDetails && (
            <details className="bg-slate-800/50 rounded-lg p-4">
              <summary className="font-semibold text-white cursor-pointer">
                Technical Details (Click to expand)
              </summary>
              <div className="mt-3 space-y-2">
                <div>
                  <h5 className="text-sm font-medium text-slate-300">Stack Trace:</h5>
                  <pre className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded overflow-x-auto mt-1">
                    {error.stack}
                  </pre>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-slate-300">Component Stack:</h5>
                  <pre className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded overflow-x-auto mt-1">
                    {errorInfo.componentStack}
                  </pre>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-slate-300">Timestamp:</h5>
                  <p className="text-xs text-slate-400">{new Date().toISOString()}</p>
                </div>
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-4">
            {retryCount < maxRetries && (
              <Button 
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={onReset}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Reset Component
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-slate-500">
            {criticalError ? (
              <p>This error has been automatically reported. Please refresh the page.</p>
            ) : (
              <p>This error has been logged and will help improve the application.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// BULLETPROOF ERROR BOUNDARY CLASS
// ============================================================================

export class BulletproofErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context = 'Unknown Component' } = this.props;
    
    // Log the error with full context
    logger.error(`Error Boundary Caught Error in ${context}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    });

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in custom error handler:', handlerError);
      }
    }

    // Schedule auto-retry if enabled
    if (this.props.autoRetry && this.shouldAutoRetry()) {
      this.scheduleAutoRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private shouldAutoRetry(): boolean {
    const { maxRetries = 3 } = this.props;
    const { retryCount, lastErrorTime } = this.state;
    const now = Date.now();
    
    // Don't auto-retry if max retries exceeded
    if (retryCount >= maxRetries) {
      return false;
    }

    // Don't auto-retry if error occurred too recently (prevent infinite loops)
    if (now - lastErrorTime < 1000) {
      return false;
    }

    return true;
  }

  private scheduleAutoRetry(): void {
    const { retryDelayMs = 2000 } = this.props;
    const delay = Math.min(retryDelayMs * Math.pow(2, this.state.retryCount), 10000); // Exponential backoff with max 10s
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  private handleRetry = (): void => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      logger.warn('Max retries exceeded, cannot retry');
      return;
    }

    logger.info(`Retrying component ${this.props.context}, attempt ${this.state.retryCount + 1}`);
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      lastErrorTime: Date.now()
    }));
  };

  private handleReset = (): void => {
    logger.info(`Resetting error boundary for ${this.props.context}`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0,
      errorId: ''
    });
  };

  render() {
    const { 
      children, 
      fallback, 
      maxRetries = 3, 
      context = 'Component',
      showErrorDetails = false,
      criticalError = false
    } = this.props;
    
    const { hasError, error, errorInfo, retryCount, errorId } = this.state;

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error display
      return (
        <ErrorDisplay
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          context={context}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
          retryCount={retryCount}
          maxRetries={maxRetries}
          showDetails={showErrorDetails}
          criticalError={criticalError}
        />
      );
    }

    return children;
  }
}

// ============================================================================
// HIGHER-ORDER COMPONENT FOR EASY WRAPPING
// ============================================================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WithErrorBoundaryComponent = (props: P) => (
    <BulletproofErrorBoundary 
      {...errorBoundaryProps}
      context={errorBoundaryProps?.context || WrappedComponent.displayName || WrappedComponent.name}
    >
      <WrappedComponent {...props} />
    </BulletproofErrorBoundary>
  );
  
  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithErrorBoundaryComponent;
}

// ============================================================================
// HOOK FOR SAFE ASYNC OPERATIONS
// ============================================================================

export function useSafeAsync<T>() {
  const [state, setState] = React.useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const execute = React.useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('useSafeAsync: Async operation failed', errorObj);
      setState({ data: null, loading: false, error: errorObj });
      throw errorObj;
    }
  }, []);

  const reset = React.useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// ============================================================================
// SAFE COMPONENT WRAPPER
// ============================================================================

export const SafeComponent: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}> = ({ children, fallback, context }) => (
  <BulletproofErrorBoundary
    fallback={fallback}
    context={context}
    showErrorDetails={process.env.NODE_ENV === 'development'}
    autoRetry={true}
    maxRetries={2}
  >
    {children}
  </BulletproofErrorBoundary>
);

export default BulletproofErrorBoundary;