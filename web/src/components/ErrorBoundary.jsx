import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Optional: Send error to logging service
    if (typeof this.props.onError === "function") {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call optional reset handler
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }

    // Optional: Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Oops! Something Went Wrong
            </h1>

            {/* Message */}
            <p className="text-slate-600 text-center mb-6 leading-relaxed">
              The application encountered an unexpected error. Please try again or contact support if the problem persists.
            </p>

            {/* Error Details (Development) */}
            {isDevelopment && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded">
                <p className="text-xs font-bold text-red-700 mb-2">Error Details (Dev Mode):</p>
                <pre className="text-xs text-red-900 overflow-auto max-h-32 font-mono bg-white p-2 rounded border border-red-200">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {/* Error Count */}
            {this.state.errorCount > 1 && (
              <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-600 rounded">
                <p className="text-xs text-yellow-800">
                  This error has occurred {this.state.errorCount} times. Consider clearing your cache or checking your connection.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>

            {/* Support Link */}
            <p className="text-xs text-slate-500 text-center mt-6">
              Need help?{" "}
              <a
                href="mailto:support@outbreaksense.ai"
                className="text-blue-600 hover:underline font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
