
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { initAnalytics } from '@/lib/analytics'
import { initPerformanceObserver } from '@/lib/performance'
import { validateSecuritySettings } from '@/lib/security'
import { initializeTheme } from '@/lib/theme-init'
import { initializeVSCodeApi, isRunningInVSCode, notifyReady } from '@/services/vscode'
import { initializeComponentLoader } from '@/services/components/component-loader'
import { cn } from '@/lib/utils'

// Initialize theme FIRST before rendering
initializeTheme()

// Initialize analytics
initAnalytics()

// Initialize performance monitoring
if (import.meta.env.PROD) {
  initPerformanceObserver()
}

// Validate security settings in development
if (import.meta.env.DEV) {
  const warnings = validateSecuritySettings()
  if (warnings.length > 0) {
    console.group('[Security Warnings]')
    warnings.forEach(warning => console.warn(warning))
    console.groupEnd()
  }
}

// VS Code Webview Wrapper Component
function VSCodeWebviewWrapper({ children }: { children: React.ReactNode }) {
  const [isVSCode, setIsVSCode] = useState(false);
  const [isSidebarMode, setIsSidebarMode] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize VS Code API
    const initialized = initializeVSCodeApi();
    setIsVSCode(initialized);
    
    // Check if we're in sidebar mode (narrow viewport)
    const checkSidebarMode = () => {
      // VS Code sidebar is typically 250-300px, panel can be larger
      setIsSidebarMode(window.innerWidth < 500);
    };

    checkSidebarMode();
    window.addEventListener('resize', checkSidebarMode);
    
    if (initialized) {
      console.log('[App] Running inside VS Code webview');
      notifyReady();
      // Initialize component loader for file watching
      initializeComponentLoader();
    } else {
      console.log('[App] Running in standalone browser');
    }
    
    setIsReady(true);

    return () => window.removeEventListener('resize', checkSidebarMode);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full w-full",
      isVSCode && "vscode-webview",
      isSidebarMode && "vscode-sidebar"
    )}>
      {children}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="vite-shadcn-theme">
        <VSCodeWebviewWrapper>
          <App />
        </VSCodeWebviewWrapper>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
