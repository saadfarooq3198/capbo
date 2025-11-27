import React, { useState, useEffect, useCallback } from 'react';
import { Project } from '@/api/entities';
import { DecisionRun } from '@/api/entities';
import { Action } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { getSDKIdentifiers, pingAPI, getCurrentUser } from '@/components/lib/base44Client';
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DiagLitePage() {
  const [data, setData] = useState({});
  const [identifiers, setIdentifiers] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAllData = useCallback(async () => {
    setLoading(true);
    
    // Load user first
    let currentUser = null;
    try {
      currentUser = await User.me();
      setUser(currentUser);
      console.log('[CABPOE] Diag-lite user loaded:', currentUser);
    } catch (error) {
      console.error('[CABPOE] Failed to load user:', error);
    }

    // Get concrete SDK identifiers
    const sdkIds = getSDKIdentifiers();
    
    // Collect comprehensive identifiers
    const ids = {
      host: window.location.host,
      pathname: window.location.pathname,
      environment: window.location.host.includes('base44') ? 'preview' : 'production',
      user_email: currentUser?.email || 'none',
      user_id: currentUser?.id || 'none',
      user_role: currentUser?.role || 'none',
      user_app_role: currentUser?.app_role || 'none',
      user_status: currentUser?.status || 'none',
      timestamp: new Date().toISOString(),
      force_read: localStorage.getItem('FORCE_READ') || 'off',
      app_id: sdkIds.app_id,
      base_url: sdkIds.base_url,
      sdk_initialized: sdkIds.initialized,
      architecture: 'single-tenant-app'
    };

    console.log('[CABPOE] Diag identifiers:', ids);
    setIdentifiers(ids);

    // Load raw data counts
    const results = {};
    try {
      const projects = await Project.list('-created_date', 10);
      results.projects = { count: projects.length };
      console.log('[CABPOE] Diag projects:', projects.length);
    } catch (error) {
      console.error('[CABPOE] Diag projects failed:', error);
      results.projects = { error: error.message };
    }

    try {
      const runs = await DecisionRun.list('-created_date', 15);
      results.decision_runs = { count: runs.length };
      console.log('[CABPOE] Diag runs:', runs.length);
    } catch (error) {
      console.error('[CABPOE] Diag runs failed:', error);
      results.decision_runs = { error: error.message };
    }

    try {
      const actions = await Action.list('-created_date', 8);
      results.actions = { count: actions.length };
      console.log('[CABPOE] Diag actions:', actions.length);
    } catch (error) {
      console.error('[CABPOE] Diag actions failed:', error);
      results.actions = { error: error.message };
    }

    setData(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center">Loading Diagnostics...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Diagnostics — Production</h1>
          <p className="text-lg text-gray-600">Base44 single-tenant app architecture</p>
        </div>

        {/* Identifiers Panel */}
        <Card>
          <CardHeader>
            <CardTitle>App Identifiers & User Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Host:</strong> {identifiers.host}</div>
              <div><strong>Environment:</strong> {identifiers.environment}</div>
              <div><strong>App ID:</strong> <code className="bg-gray-100 px-1 rounded">{identifiers.app_id}</code></div>
              <div><strong>User Email:</strong> {identifiers.user_email}</div>
              <div><strong>User ID:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{identifiers.user_id}</code></div>
              <div><strong>User Role:</strong> {identifiers.user_role}</div>
              <div><strong>App Role:</strong> {identifiers.user_app_role}</div>
              <div><strong>FORCE_READ:</strong> {identifiers.force_read}</div>
            </div>

            <Button onClick={loadAllData} variant="outline" size="sm">
              Refresh Data
            </Button>
          </CardContent>
        </Card>

        {/* Data Counts */}
        <Card>
          <CardHeader>
            <CardTitle>Entity Data Counts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.projects?.count ?? 'Error'}
                </div>
                <div className="text-sm text-gray-600">Projects</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data.decision_runs?.count ?? 'Error'}
                </div>
                <div className="text-sm text-gray-600">Decision Runs</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {data.actions?.count ?? 'Error'}
                </div>
                <div className="text-sm text-gray-600">Actions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}