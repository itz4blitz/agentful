import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { env } from '@/lib/env'
import { FormsShowcase, FeedbackShowcase, NavigationShowcase, OverlaysShowcase, DataDisplayShowcase, MiscShowcase } from '@/components/showcase'
import { VisualWebsiteBuilder } from '@/components/visual-website-builder'
import { Palette, Box, MessageSquare, Navigation, Layers, Table, Grid } from 'lucide-react'

function ComponentShowcase() {
  const location = useLocation()
  const navigate = useNavigate()

  // Extract current tab from URL path
  const getCurrentTab = () => {
    const match = location.pathname.match(/^\/c\/(forms|feedback|navigation|overlays|data|misc)$/)
    return match ? match[1] : 'forms'
  }

  const activeTab = getCurrentTab()

  const handleTabChange = (value: string) => {
    navigate(`/c/${value}`)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        {/* Main gradient orbs - responsive sizes */}
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-ring/10 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

        {/* Radial gradient vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_70%)]" />
      </div>

      {/* Header with proper backdrop blur support */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Box className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">{env.VITE_APP_TITLE}</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{env.VITE_APP_VERSION}</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content area with proper spacing */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-7xl">
        {/* Hero section with responsive typography and spacing */}
        <div className="mb-8 sm:mb-12 lg:mb-16 text-center">
          <div className="mb-3 sm:mb-4 inline-flex items-center rounded-full bg-muted px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
            <Palette className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="font-semibold">Theme Showcase</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            {env.VITE_APP_TITLE}
          </h2>

          <p className="text-muted-foreground mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
            {env.VITE_APP_DESCRIPTION} — Explore all 54 components with live demos
          </p>

          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-3 px-4">
            <Button size="default" asChild className="min-h-[2.5rem] sm:min-h-[2.75rem]">
              <a href="#showcase">Explore Components</a>
            </Button>
            <Button size="default" variant="outline" asChild className="min-h-[2.5rem] sm:min-h-[2.75rem]">
              <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
                View Documentation
              </a>
            </Button>
          </div>
        </div>

        {/* Showcase section with proper spacing */}
        <div id="showcase" className="space-y-8 sm:space-y-12">
          <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-xl sm:shadow-2xl">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                Component Showcase
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Browse all available shadcn/ui components organized by category
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-2 h-auto p-1 sm:p-1.5">
                  <TabsTrigger value="forms" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                    <Box className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Forms</span>
                    <span className="sm:hidden">Forms</span>
                  </TabsTrigger>
                  <TabsTrigger value="feedback" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Feedback</span>
                    <span className="sm:hidden">Feedback</span>
                  </TabsTrigger>
                  <TabsTrigger value="navigation" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                    <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Navigation</span>
                    <span className="sm:hidden">Nav</span>
                  </TabsTrigger>
                  <TabsTrigger value="overlays" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                    <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Overlays</span>
                    <span className="sm:hidden">Overlay</span>
                  </TabsTrigger>
                  <TabsTrigger value="data" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                    <Table className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Data</span>
                    <span className="sm:hidden">Data</span>
                  </TabsTrigger>
                  <TabsTrigger value="misc" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
                    <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Misc</span>
                    <span className="sm:hidden">Misc</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="forms" className="mt-4 sm:mt-6">
                  <FormsShowcase />
                </TabsContent>

                <TabsContent value="feedback" className="mt-4 sm:mt-6">
                  <FeedbackShowcase />
                </TabsContent>

                <TabsContent value="navigation" className="mt-4 sm:mt-6">
                  <NavigationShowcase />
                </TabsContent>

                <TabsContent value="overlays" className="mt-4 sm:mt-6">
                  <OverlaysShowcase />
                </TabsContent>

                <TabsContent value="data" className="mt-4 sm:mt-6">
                  <DataDisplayShowcase />
                </TabsContent>

                <TabsContent value="misc" className="mt-4 sm:mt-6">
                  <MiscShowcase />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Feature cards with responsive grid */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">🎨 54 Components</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  All shadcn/ui components ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Every component from the shadcn/ui library is installed and configured with proper theming.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">🎭 8 Themes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Multiple color schemes available
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Blue, Green, Orange, Red, Rose, Violet, Yellow, and Default themes with light/dark modes.
                </p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-card/80 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-base sm:text-lg">🔧 Fully Customizable</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Tailwind CSS + CSS Variables
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Modify any component by adjusting CSS variables or Tailwind classes to match your brand.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer with proper responsive spacing */}
      <footer className="mt-12 sm:mt-16 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              Built by{' '}
              <a
                href="https://premierstudio.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                Premier Studio
              </a>
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                shadcn/ui
              </a>
              <a
                href="https://vitejs.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Vite
              </a>
              <a
                href="https://react.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                React
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VisualWebsiteBuilder />} />
        <Route path="/c/:tab" element={<ComponentShowcase />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
