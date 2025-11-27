import React from 'react';
import { useRole } from './auth/RoleProvider';
import { isPreview } from './preview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLES } from './auth/permissions';

export default function DevViewAsBanner() {
    const { realRole, effectiveRole, setViewAs } = useRole();

    // This banner is only for admins in the development environment, not in the live preview.
    if (isPreview || realRole !== ROLES.ADMIN) {
        return null;
    }

    const handleRoleChange = (newRole) => {
        // Setting the view to the user's real role clears the override.
        setViewAs(newRole === realRole ? null : newRole);
    };

    return (
        <div className="bg-yellow-100 text-yellow-900 text-xs text-center p-2 z-50 flex items-center justify-center gap-4">
            <span className="font-semibold uppercase">Admin View</span>
            <div className="flex items-center gap-2">
                <span>Viewing as:</span>
                <Select value={effectiveRole} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-6 w-32 text-xs bg-white border-yellow-300">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(ROLES).map(role => (
                            <SelectItem key={role} value={role} className="capitalize text-xs">
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}