import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResetPassword() {

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <Alert variant="destructive" className="bg-blue-50 border-blue-200 text-blue-900">
            <TriangleAlert className="h-4 w-4 !text-blue-900" />
            <AlertTitle>Use Secure Platform Login</AlertTitle>
            <AlertDescription>
              This local password reset flow is retired. Please use the password reset feature from your identity provider.
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