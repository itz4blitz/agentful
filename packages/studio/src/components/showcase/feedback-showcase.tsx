import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Sonner } from '@/components/ui/sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Terminal, AlertCircle, Info, CheckCircle, AlertTriangle, Bell, Loader2, BarChart3, Skull, MessageSquare } from 'lucide-react'

export function FeedbackShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Alerts Section - Spans 2 columns */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alerts
          </CardTitle>
          <CardDescription>Callout components for user attention.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription>
              This is a default alert message with some information.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong. Please try again later.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">Information</div>
                  <p className="text-sm">System update available.</p>
                </div>
              </div>
            </div>

            <div className="border border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">Success</div>
                  <p className="text-sm">Changes saved successfully.</p>
                </div>
              </div>
            </div>

            <div className="border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">Warning</div>
                  <p className="text-sm">Please review before proceeding.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Badges
          </CardTitle>
          <CardDescription>Small status indicators.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-blue-500 hover:bg-blue-600">Custom</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Progress
          </CardTitle>
          <CardDescription>Displays an indicator showing completion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Loading...</span>
              <span className="text-muted-foreground">25%</span>
            </div>
            <Progress value={25} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Processing...</span>
              <span className="text-muted-foreground">60%</span>
            </div>
            <Progress value={60} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Almost done...</span>
              <span className="text-muted-foreground">90%</span>
            </div>
            <Progress value={90} />
          </div>
        </CardContent>
      </Card>

      {/* Skeletons Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skull className="h-5 w-5" />
            Skeletons
          </CardTitle>
          <CardDescription>Loading states for components.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
          <Skeleton className="h-[100px] w-full rounded-xl" />
        </CardContent>
      </Card>

      {/* Spinner Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5" />
            Spinner
          </CardTitle>
          <CardDescription>Indicates a loading state.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-8 py-8">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" />
        </CardContent>
      </Card>

      {/* Toast Notifications Section - Spans 2 columns */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Toast Notifications
          </CardTitle>
          <CardDescription>A succinct message that is displayed temporarily.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => toast('Default toast message')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Default
            </button>
            <button
              onClick={() => toast.success('Event has been created')}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Success
            </button>
            <button
              onClick={() => toast.error('Event has been deleted')}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              Error
            </button>
            <button
              onClick={() => toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
                loading: 'Loading...',
                success: 'Loaded successfully',
                error: 'Error loading',
              })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Promise
            </button>
            <button
               onClick={() => toast('Event has been created', {
                description: 'Sunday, December 03, 2023 at 9:00 AM',
                action: {
                  label: 'Undo',
                  onClick: () => console.log('Undo'),
                },
              })}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              With Action
            </button>
          </div>
          <Sonner />
        </CardContent>
      </Card>
    </div>
  )
}