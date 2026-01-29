import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { isRunningInVSCode, openFullscreenStudio, showNotification } from '@/services/vscode'
import { Box, ExternalLink, Package, Server, RefreshCw, Play, Settings, LogIn, User, LogOut, Puzzle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAllThemes, applyTheme } from '@/lib/themes'

export function StudioSidebar() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isVSCode, setIsVSCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsVSCode(isRunningInVSCode())
    
    // Listen for theme changes from main panel
    const handleWindowMessage = (event: MessageEvent) => {
      const message = event.data
      
      if (message && message.command === 'themeChanged' && message.color) {
        // Apply the theme color change from main panel
        const isDark = document.documentElement.classList.contains('dark')
        const mode = isDark ? 'dark' : 'light'
        const themes = getAllThemes(mode)
        const theme = themes.find(t => t.id === message.color)
        
        if (theme) {
          applyTheme(theme)
          localStorage.setItem('selected-theme', message.color)
        }
      }
    }
    
    window.addEventListener('message', handleWindowMessage)
    return () => window.removeEventListener('message', handleWindowMessage)
  }, [])

  const handleLogin = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsAuthenticated(true)
      setIsLoading(false)
      showNotification('Successfully logged in to Agentful')
    }, 1000)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    showNotification('Logged out')
  }

  const handleOpenStudio = () => {
    if (isVSCode) {
      openFullscreenStudio()
    }
  }

  const handleInstallPackage = () => {
    showNotification('Installing @itz4blitz/agentful package...')
  }

  const handleUpdatePackage = () => {
    showNotification('Updating @itz4blitz/agentful package...')
  }

  const handleInstallMCP = () => {
    showNotification('Installing MCP server...')
  }

  const handleRestartMCP = () => {
    showNotification('Restarting MCP server...')
  }

  const handleDebugMCP = () => {
    showNotification('Opening MCP debug panel...')
  }

  const handleOpenIntegrationHub = () => {
    if (isVSCode) {
      openFullscreenStudio('/integrations')
    } else {
      navigate('/integrations')
    }
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header - aligned with main panel height */}
      <div className="flex items-center justify-between h-14 px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Box className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm truncate">Agentful</h1>
            <p className="text-[10px] text-muted-foreground truncate">
              {isAuthenticated ? 'Connected' : 'Studio'}
            </p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!isAuthenticated ? (
          <>
            {/* Login Card */}
            <Card className="border-border/50">
              <CardHeader className="pb-3 space-y-1">
                <CardTitle className="text-sm flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-primary" />
                  Welcome
                </CardTitle>
                <CardDescription className="text-xs">
                  Sign in to manage your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleLogin} 
                  className="w-full" 
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <QuickActionButton
                  icon={<ExternalLink className="h-3.5 w-3.5" />}
                  label="Open Studio"
                  onClick={handleOpenStudio}
                />
                <QuickActionButton
                  icon={<Puzzle className="h-3.5 w-3.5" />}
                  label="Integration Hub"
                  onClick={handleOpenIntegrationHub}
                />
                <QuickActionButton
                  icon={<Package className="h-3.5 w-3.5" />}
                  label="Install Package"
                  onClick={handleInstallPackage}
                />
                <QuickActionButton
                  icon={<Server className="h-3.5 w-3.5" />}
                  label="Install MCP Server"
                  onClick={handleInstallMCP}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* User Card */}
            <Card className="border-border/50 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">user@agentful.app</p>
                    <p className="text-[10px] text-muted-foreground">Pro Plan</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Studio Actions */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Studio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <Button 
                  className="w-full justify-start gap-2" 
                  size="sm"
                  onClick={handleOpenStudio}
                >
                  <Play className="h-4 w-4" />
                  Open Full Studio
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start gap-2" 
                  size="sm"
                  onClick={handleOpenIntegrationHub}
                >
                  <Puzzle className="h-4 w-4" />
                  Integration Hub
                </Button>
              </CardContent>
            </Card>

            {/* Package Management */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  NPM Package
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <QuickActionButton
                  icon={<Package className="h-3.5 w-3.5" />}
                  label="Install / Update"
                  onClick={handleUpdatePackage}
                />
              </CardContent>
            </Card>

            {/* MCP Server */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  MCP Server
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                <QuickActionButton
                  icon={<Server className="h-3.5 w-3.5" />}
                  label="Install"
                  onClick={handleInstallMCP}
                />
                <QuickActionButton
                  icon={<RefreshCw className="h-3.5 w-3.5" />}
                  label="Restart"
                  onClick={handleRestartMCP}
                />
                <QuickActionButton
                  icon={<Settings className="h-3.5 w-3.5" />}
                  label="Debug"
                  onClick={handleDebugMCP}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <p className="text-[10px] text-center text-muted-foreground">
          Agentful Studio v0.0.1
        </p>
      </div>
    </div>
  )
}

// Helper component for quick action buttons
function QuickActionButton({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode
  label: string
  onClick: () => void 
}) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="w-full justify-start gap-2 h-8 px-2 text-xs hover:bg-accent"
      onClick={onClick}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Button>
  )
}
