
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRole } from '../auth/RoleProvider';
import { isReadOnlyRole } from '../auth/permissions';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X, Upload } from 'lucide-react';

const timezones = [
  "Europe/London",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const SaveBar = ({ onSave, onCancel, isSaving }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-sm border-t">
    <div className="max-w-5xl mx-auto flex justify-end items-center gap-4">
      <p className="text-sm text-gray-600">You have unsaved changes.</p>
      <Button variant="ghost" onClick={onCancel} disabled={isSaving}>Cancel</Button>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save
      </Button>
    </div>
  </div>
);

export default function ProfilePane() {
    const { user, setOptimisticProfile, refreshUser } = useRole();
    const { toast } = useToast();
    const [draft, setDraft] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);
    
    // isReadOnly should be true if user is null (e.g., during initial load)
    const isReadOnly = user ? isReadOnlyRole(user.role) : true;

    useEffect(() => {
        // Sync draft only when the canonical user object changes
        if (user) {
            setDraft({
                display_name: user.display_name || '',
                email: user.email,
                timezone: user.timezone || 'Europe/London',
                avatar_url: user.avatar_url || '',
            });
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: null}));
        }
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        const newErrors = {};
        if (draft.display_name && draft.display_name.length > 80) {
            newErrors.display_name = "Display name must be 80 characters or less.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        
        setIsSaving(true);
        const payload = {
            display_name: draft.display_name,
            timezone: draft.timezone,
            avatar_url: draft.avatar_url,
        };

        // 1. Optimistic Update
        setOptimisticProfile(payload);
        toast({ title: "Profile saved." });

        try {
            // 2. Online Save
            await User.updateMyUserData(payload);
        } catch (error) {
            console.error("Online profile save failed:", error);
            toast({ title: "Offline Save", description: "Your profile is saved locally and will sync later.", variant: "default" });
        } finally {
            setIsSaving(false);
            // 3. Trigger a silent re-fetch to ensure consistency
            // This event can be listened to by other components that need to refresh their user data.
            // setOptimisticProfile handles the immediate UI update, but a re-fetch confirms server state.
            window.dispatchEvent(new CustomEvent('profileUpdated')); 
        }
    };
    
    const handleCancel = () => {
        // Revert draft to the current canonical user data
        if(user) setDraft(user);
        setErrors({});
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const previousAvatarUrl = draft.avatar_url; // Store current URL to revert on error

        if (file.size > 1 * 1024 * 1024) { // 1MB limit
            setErrors(prev => ({ ...prev, avatar: "File size cannot exceed 1MB." }));
            return;
        }
        if (!['image/png', 'image/jpeg'].includes(file.type)) {
            setErrors(prev => ({ ...prev, avatar: "Only PNG and JPG files are allowed." }));
            return;
        }

        setIsUploading(true);
        setErrors(prev => ({ ...prev, avatar: null }));
        try {
            const { file_url } = await UploadFile({ file });
            setDraft(d => ({ ...d, avatar_url: file_url })); // Update draft directly
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload avatar.", variant: "destructive" });
            setDraft(d => ({...d, avatar_url: previousAvatarUrl })); // Revert avatar_url on upload failure
        } finally {
            setIsUploading(false);
        }
    };
    
    // Determine if there are changes by comparing draft to the canonical user object
    const hasChanges = JSON.stringify(draft) !== JSON.stringify({
        display_name: user?.display_name || '',
        email: user?.email,
        timezone: user?.timezone || 'Europe/London',
        avatar_url: user?.avatar_url || '',
    });

    if (!draft) {
        return <Loader2 className="h-8 w-8 animate-spin text-gray-400" />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>This is how others will see you on the site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                            id="display_name"
                            value={draft.display_name}
                            onChange={(e) => handleInputChange('display_name', e.target.value)}
                            disabled={isReadOnly || isSaving}
                            maxLength={81}
                        />
                        {errors.display_name && <p className="text-sm text-red-500">{errors.display_name}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={draft.email} readOnly disabled />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                            value={draft.timezone}
                            onValueChange={(value) => handleInputChange('timezone', value)}
                            disabled={isReadOnly || isSaving}
                        >
                            <SelectTrigger id="timezone">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz.replace('_', ' ')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500">Displayed times use Europe/London unless otherwise noted.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Avatar</Label>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={draft.avatar_url} alt={draft.display_name || draft.email} />
                                <AvatarFallback>{(draft.display_name || draft.email).charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isReadOnly || isUploading || isSaving}
                                >
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                                    {isUploading ? 'Uploading...' : 'Change'}
                                </Button>
                                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/png, image/jpeg" />
                                {draft.avatar_url && 
                                    <Button variant="ghost" onClick={() => handleInputChange('avatar_url', '')} disabled={isReadOnly || isSaving}>Remove</Button>}
                            </div>
                        </div>
                        {errors.avatar && <p className="text-sm text-red-500 mt-2">{errors.avatar}</p>}
                    </div>
                </CardContent>
            </Card>
            
            {hasChanges && !isReadOnly && <SaveBar onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />}
        </>
    );
}
