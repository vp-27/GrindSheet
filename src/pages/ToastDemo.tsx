import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/lib/toast-utils';
import Layout from '@/components/Layout';

const ToastDemo = () => {
  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <Card className="apple-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Toast System Demo</CardTitle>
            <p className="text-muted-foreground">Test the new redesigned toast notifications that match your app's UI/UX</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Success Toasts */}
              <div className="space-y-3">
                <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">Success Toasts</h3>
                <Button 
                  onClick={() => toast.exerciseLogged('Bench Press')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  Exercise Logged
                </Button>
                <Button 
                  onClick={() => toast.exerciseAdded('Bench Press')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  Exercise Added
                </Button>
                <Button 
                  onClick={() => toast.categoryAdded('Strength')}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  Category Added
                </Button>
                <Button 
                  onClick={() => toast.loginSuccess()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  Login Success
                </Button>
              </div>

              {/* Info Toasts */}
              <div className="space-y-3">
                <h3 className="font-semibold text-blue-600 dark:text-blue-400">Info Toasts</h3>
                <Button 
                  onClick={() => toast.logoutSuccess()}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Logout Success
                </Button>
                <Button 
                  onClick={() => toast.info({ 
                    title: 'Tip! 💡', 
                    description: 'Try swiping toasts to dismiss them quickly.' 
                  })}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Show Tip
                </Button>
                <Button 
                  onClick={() => toast.info({ 
                    title: 'Data synced', 
                    description: 'Your workout data has been synchronized.' 
                  })}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Data Sync
                </Button>
              </div>

              {/* Error Toasts */}
              <div className="space-y-3">
                <h3 className="font-semibold text-red-600 dark:text-red-400">Error Toasts</h3>
                <Button 
                  onClick={() => toast.networkError()}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Network Error
                </Button>
                <Button 
                  onClick={() => toast.genericError('Something went wrong')}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Generic Error
                </Button>
                <Button 
                  onClick={() => toast.error({ 
                    title: 'Authentication failed', 
                    description: 'Invalid credentials. Please try again.' 
                  })}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  Auth Error
                </Button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-xl">
              <h4 className="font-semibold mb-2">New Toast Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Apple-style glassmorphism design with backdrop blur</li>
                <li>• Contextual icons for different toast types</li>
                <li>• Smooth animations with spring physics</li>
                <li>• Swipe-to-dismiss functionality</li>
                <li>• Consistent with your app's design system</li>
                <li>• Auto-dismiss with visual progress indicator</li>
                <li>• Dark mode support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ToastDemo;
