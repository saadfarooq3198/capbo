import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Check, Copy, RefreshCw, Save, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { genTempPassword, hashPassword, readOffline, writeOffline } from '../auth/localAuthUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function resetUserPassword(email, newPassword) {
    const password_hash = await hashPassword(newPassword, email);
    const patch = { password_hash, must_reset: true };

    const allUsers = readOffline();
    const userIndex = allUsers.findIndex(u => u.email === email);

    if (userIndex === -1) {
        throw new Error("User not found in offline store.");
    }
    
    allUsers[userIndex] = { ...allUsers[userIndex], ...patch };
    writeOffline(allUsers);
}

export default function ResetPasswordDialog({ user, open, onOpenChange, onSuccess }) {
    const [tempPassword, setTempPassword] = useState('');
    const [isReset, setIsReset] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setTempPassword(genTempPassword());
            setIsReset(false);
            setShowPassword(false);
        }
    }, [open]);

    const handleSave = async () => {
        try {
            await resetUserPassword(user.email, tempPassword);
            setIsReset(true);
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast({ description: `${label} copied to clipboard.` });
    };

    const getLoginInstructions = () => {
        const url = `${window.location.origin}/demo-login`;
        return `1) Go to: ${url}\n2) Sign in with:\n   Email: ${user.email}\n   Temp password: ${tempPassword}\n3) You'll be asked to set a new password.`;
    };
    
    const handleClose = () => {
        if (isReset) {
            onSuccess();
        }
        onOpenChange(false);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                {!isReset ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Reset Password for {user.email}</DialogTitle>
                            <DialogDescription>
                                A secure temporary password has been generated. The user will be required to change it on their next login.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Label htmlFor="temp-password">Temporary Password</Label>
                            <div className="flex gap-2">
                                <Input id="temp-password" value={tempPassword} readOnly />
                                <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => setTempPassword(genTempPassword())}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                Save & Show
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-600" />
                                Password Reset Complete
                            </DialogTitle>
                            <DialogDescription>
                                User {user.email} password has been reset successfully.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Alert>
                                <ShieldCheck className="h-4 w-4" />
                                <AlertTitle>Share this one-time password with the user</AlertTitle>
                                <AlertDescription>
                                    They'll be asked to set a new password on first login.
                                </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-2">
                                <Label>Temporary Password</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={tempPassword} 
                                        type={showPassword ? 'text' : 'password'} 
                                        readOnly 
                                        className="font-mono"
                                    />
                                    <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(tempPassword, 'Password')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Copy Credentials</Label>
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => copyToClipboard(`Email: ${user.email}\nPassword: ${tempPassword}`, 'Credentials')}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Email & Password
                                </Button>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Copy Login Instructions</Label>
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => copyToClipboard(getLoginInstructions(), 'Login instructions')}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Full Instructions
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}