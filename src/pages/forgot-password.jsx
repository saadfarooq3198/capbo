import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Forgot Password</CardTitle>
           <CardDescription className="text-center pt-2">
            This local password reset flow is retired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <Alert variant="destructive" className="bg-blue-50 border-blue-200 text-blue-900">
            <TriangleAlert className="h-4 w-4 !text-blue-900" />
            <AlertTitle>Use Secure Platform Login</AlertTitle>
            <AlertDescription>
              Please use the password reset feature from your identity provider (e.g., Google) via the main sign-in page.
            </AlertDescription>
          </Alert>
          <Button className="w-full" asChild>
            <Link to="/signin">Proceed to Secure Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}