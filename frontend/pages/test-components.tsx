import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestComponents() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold mb-8">Component Test Page</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Components</CardTitle>
            <CardDescription>Verify that all components render correctly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Test Input</Label>
              <Input id="test-input" placeholder="Type something..." />
            </div>
            
            <div className="space-x-2">
              <Button>Default Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="link">Link Button</Button>
            </div>
            
            <Alert>
              <AlertDescription>
                This is an alert message to test the Alert component.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              All components should be styled and functional.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
