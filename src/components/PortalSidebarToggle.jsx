import React from 'react';
import { Menu } from 'lucide-react';

export default function PortalSidebarToggle({ onToggle }) {
    return (
        <button onClick={onToggle} className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open navigation</span>
        </button>
    );
}