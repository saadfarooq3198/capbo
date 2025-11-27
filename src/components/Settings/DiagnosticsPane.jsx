import React from 'react';
import DemoDataSeeder from '../dashboard/DemoDataSeeder';
import SystemHealthCard from '../diagnostics/SystemHealthCard';
import { useProject } from '../ProjectProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRole } from '../auth/RoleProvider';
import { can } from '../auth/permissions';

export default function DiagnosticsPane() {
    const { selectedProject, allProjects, refreshProjects } = useProject();
    const { effectiveRole } = useRole();
    
    if (!can(effectiveRole, 'org:diagnostics')) {
        return <p>Access Denied.</p>;
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Demo Data Management</CardTitle>
                    <CardDescription>
                        Use these controls to seed or clear demonstration data for projects. This is useful for populating dashboards and testing system behavior.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DemoDataSeeder
                        selectedProject={selectedProject}
                        allProjects={allProjects}
                        onDataSeeded={refreshProjects}
                        showAllProjectsButton={true}
                        showInsertDemo={true}
                        showClearDemo={true}
                    />
                </CardContent>
            </Card>

            <SystemHealthCard />
        </div>
    )
}