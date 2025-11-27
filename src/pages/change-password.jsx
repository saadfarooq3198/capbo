import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ChangePassword() {

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
           <Alert variant="destructive" className="bg-amber-100 border-amber-300 text-amber-900">
            <TriangleAlert className="h-4 w-4 !text-amber-900" />
            <AlertTitle>Legacy Page</AlertTitle>
            <AlertDescription>
              This flow is retired. Password management is handled by the secure Base44 platform login provider (e.g., Google).
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full" asChild>
              <Link to="/home">Return to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}