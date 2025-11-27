import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BarChart2, Upload, Loader2, Save } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { Branding } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { useRole } from '../auth/RoleProvider';
import { can } from '../auth/permissions';
import { DecisionLog } from '@/api/entities';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LabeledInput = ({ id, label, value, onChange, maxLength, description, isTextarea = false, disabled = false }) => {
    const Component = isTextarea ? Textarea : Input;
    const remaining = maxLength ? maxLength - (value?.length || 0) : null;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label htmlFor={id}>{label}</Label>
                {maxLength && <span className="text-xs text-gray-500">{remaining} remaining</span>}
            </div>
            <Component id={id} value={value || ''} onChange={onChange} maxLength={maxLength} disabled={disabled} />
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    );
};

const FileUploadField = ({ id, label, currentUrl, onChange, description, isUploading, setUploading, disabled = false }) => {
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG/SVG recommended).');
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB limit
             alert('File size cannot exceed 1 MB.');
             return;
        }
        
        setUploading(true);
        try {
            const { file_url } = await UploadFile({ file });
            onChange(file_url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start font-normal" disabled={isUploading || disabled}>
                    <label htmlFor={id}>
                        {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        {currentUrl ? "Change image..." : "Upload image..."}
                    </label>
                </Button>
                <Input id={id} type="file" className="hidden" accept="image/png, image/svg+xml" onChange={handleFileChange} disabled={isUploading || disabled} />
                {currentUrl && (
                    <div className="text-xs text-gray-500 break-all">Current: {currentUrl}</div>
                )}
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
    );
};

export default function BrandingTab() {
    const [settings, setSettings] = useState(null);
    const { user, effectiveRole } = useRole();
    const [localSettings, setLocalSettings] = useState({});
    const [isUploadingLight, setIsUploadingLight] = useState(false);
    const [isUploadingDark, setIsUploadingDark] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const canEdit = can(effectiveRole, 'org:branding');

    const fetchSettings = useCallback(async () => {
        try {
            const settingsData = await Branding.list();
            const currentSettings = settingsData.length > 0 ? settingsData[0] : {};
            setSettings(currentSettings);
            setLocalSettings({ ...currentSettings });
        } catch (e) {
            console.error("Failed to load branding data:", e);
            toast({ title: "Error", description: "Could not load branding data.", variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setLocalSettings(prev => ({ ...prev, [id]: value }));
        setHasChanges(true);
    };

    const handleFileChange = (field, url) => {
        setLocalSettings(prev => ({ ...prev, [field]: url }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const payload = { ...localSettings };
            let result;
            if (settings?.id) {
                result = await Branding.update(settings.id, payload);
            } else {
                result = await Branding.create({ ...payload, env: 'development' });
            }
            setSettings(result);
            setLocalSettings(result);
            setHasChanges(false);

            if (result.favicon_url) {
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = result.favicon_url;
            }

            window.dispatchEvent(new CustomEvent('brandingUpdated'));
            toast({ title: "Settings saved", description: "Your branding settings have been updated." });
        } catch (error) {
            console.error("Failed to update branding:", error);
            toast({ title: "Couldn’t save", description: "Please check the fields and try again.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!settings) {
        return <div><Loader2 className="animate-spin mr-2" /> Loading branding settings...</div>;
    }
    
    const isUploading = isUploadingLight || isUploadingDark || isUploadingFavicon;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Logos & Favicon</CardTitle>
                    <CardDescription>Upload your company's branding assets. PNG/SVG up to 1 MB. Transparent background recommended.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <FileUploadField
                            id="light_logo_upload"
                            label="Logo (Light Mode)"
                            currentUrl={localSettings.light_logo_url}
                            onChange={(url) => handleFileChange('light_logo_url', url)}
                            isUploading={isUploadingLight}
                            setUploading={setIsUploadingLight}
                            disabled={!canEdit || isUploading}
                        />
                        <FileUploadField
                            id="dark_logo_upload"
                            label="Logo (Dark Mode)"
                            currentUrl={localSettings.dark_logo_url}
                            onChange={(url) => handleFileChange('dark_logo_url', url)}
                            description="For dark backgrounds. Leave empty to use light logo."
                            isUploading={isUploadingDark}
                            setUploading={setIsUploadingDark}
                            disabled={!canEdit || isUploading}
                        />
                        <FileUploadField
                            id="favicon_upload"
                            label="Favicon"
                            currentUrl={localSettings.favicon_url}
                            onChange={(url) => handleFileChange('favicon_url', url)}
                            description="Site icon. Recommended: 32x32 PNG or ICO format."
                            isUploading={isUploadingFavicon}
                            setUploading={setIsUploadingFavicon}
                            disabled={!canEdit || isUploading}
                        />
                    </div>
                    <div className="space-y-4">
                        <Label>Preview</Label>
                        <Card className="bg-gray-100 dark:bg-gray-800 p-4 flex items-center justify-center gap-4 h-full">
                           <div className="flex items-center gap-2 p-2 rounded-md bg-white shadow">
                                {localSettings.light_logo_url ? (
                                    <img src={localSettings.light_logo_url} alt="Logo Preview (Light)" className="h-8" />
                                ) : <BarChart2 className="h-6 w-6 text-indigo-600" />}
                           </div>
                           <div className="flex items-center gap-2 p-2 rounded-md bg-gray-900 shadow">
                                {localSettings.dark_logo_url || localSettings.light_logo_url ? (
                                     <img src={localSettings.dark_logo_url || localSettings.light_logo_url} alt="Logo Preview (Dark)" className="h-8" />
                                ) : <BarChart2 className="h-6 w-6 text-white" />}
                           </div>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Home Page Hero</CardTitle>
                    <CardDescription>Customize the content of the main landing page. Leave fields blank to use default text.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <LabeledInput
                                id="hero_title"
                                label="Hero Title (H1)"
                                value={localSettings.hero_title}
                                onChange={handleInputChange}
                                maxLength={120}
                                disabled={!canEdit}
                            />
                            <LabeledInput
                                id="hero_subtitle"
                                label="Hero Subtitle (H2)"
                                value={localSettings.hero_subtitle}
                                onChange={handleInputChange}
                                maxLength={160}
                                disabled={!canEdit}
                            />
                             <LabeledInput
                                id="hero_lead"
                                label="Hero Lead Paragraph"
                                value={localSettings.hero_lead}
                                onChange={handleInputChange}
                                maxLength={400}
                                isTextarea
                                disabled={!canEdit}
                            />
                            <h4 className="font-semibold pt-4">CTA Button Labels</h4>
                            <LabeledInput
                                id="hero_primary_cta_label"
                                label="Primary CTA"
                                value={localSettings.hero_primary_cta_label}
                                onChange={handleInputChange}
                                disabled={!canEdit}
                            />
                            <LabeledInput
                                id="hero_secondary_cta_label"
                                label="Secondary CTA"
                                value={localSettings.hero_secondary_cta_label}
                                onChange={handleInputChange}
                                disabled={!canEdit}
                            />
                             <LabeledInput
                                id="hero_outline_cta_label"
                                label="Outline CTA"
                                value={localSettings.hero_outline_cta_label}
                                onChange={handleInputChange}
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Live Preview</Label>
                            <Card className="bg-gray-50 p-6 text-center h-full flex flex-col justify-center">
                                <h1 className="text-2xl font-bold text-gray-900">{localSettings.hero_title || "CABPOE™ Pilot Console"}</h1>
                                <h2 className="mt-2 text-md text-indigo-700 font-semibold">{localSettings.hero_subtitle || "Chaos-Based Business Process Optimization"}</h2>
                                <p className="mt-4 max-w-md mx-auto text-sm text-gray-600">{localSettings.hero_lead || "Make faster, safer decisions with live stability signals, Lyapunov drift, and actionable recommendations."}</p>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {hasChanges && canEdit && (
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl p-4 z-50">
                    <Card className="shadow-2xl bg-white/95 backdrop-blur-sm">
                        <CardContent className="p-4 flex justify-between items-center">
                            <p className="text-sm font-medium">You have unsaved changes.</p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => fetchSettings().then(() => setHasChanges(false))}>Discard</Button>
                                <Button onClick={handleSave} disabled={isSaving || isUploading}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}