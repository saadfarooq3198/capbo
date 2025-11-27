import React from 'react';
import ProjectSelector from './ProjectSelector';
import ProfileMenu from './ProfileMenu';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function AppTopbar() {
    return (
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
            <ProjectSelector />
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/home">
                        <Home className="h-4 w-4 mr-2" />
                        Home
                    </Link>
                </Button>
                <ProfileMenu />
            </div>
        </div>
    );
}