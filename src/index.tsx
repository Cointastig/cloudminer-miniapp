import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

// Configure TonConnect theme
const tonConnectTheme = {
  theme: 'dark' as const,
  colors: {
    background: '#0f0f23',
    text: '#ffffff',
    accent: '#06b6d4',
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-gray-400 max-w-md">
              The app encountered an unexpected error. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-colors"
            >
              Reload App
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400">
                  Error Details
                </summary>
                <pre className="mt-2 p-4 bg-black/30 rounded-lg text-xs text-red-400 overflow-auto max-w-md">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring
const startTime = performance.now();

window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`⚡ App loaded in ${loadTime.toFixed(2)}ms`);
});

// Check for WebApp environment
const isWebApp = !!(window as any).Telegram?.WebApp;
const isDev = import.meta.env.DEV;

if (isDev) {
  console.log('🔧 Development mode');
}

if (isWebApp) {
  console.log('📱 Running in Telegram WebApp');
} else {
  console.log('🌐 Running in browser');
}

// Get manifest URL based on current origin. The TonConnect manifest must
// originate from the same domain as the application to avoid wallet
// connection failures. Previously we returned a relative path during
// development which could lead to incorrect domain resolution. Always build
// the URL from window.location.origin so it works both in development and
// production.
const getManifestUrl = () => {
  return `${window.location.origin}/tonconnect-manifest.json`;
};

// Initialize React App
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <TonConnectUIProvider
        manifestUrl={getManifestUrl()}
        uiPreferences={tonConnectTheme}
        // Dynamically configure the return URL for the Telegram mini app. If
        // VITE_TELEGRAM_BOT is provided (e.g. "my_bot"), we build the return
        // URL as https://t.me/{bot}. Otherwise we omit the configuration so
        // TonConnect can use its default behaviour. This prevents the wallet
        // connection from silently failing when an invalid or placeholder
        // username is supplied.
        actionsConfiguration={
          import.meta.env.VITE_TELEGRAM_BOT
            ? { twaReturnUrl: `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT}` }
            : undefined
        }
      >
        <App />
      </TonConnectUIProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Service Worker Registration (optional)
if ('serviceWorker' in navigator && !isDev) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('🔄 SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('❌ SW registration failed: ', registrationError);
      });
  });
}
