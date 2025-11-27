import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, MoreHorizontal, Shield, Check, X, RefreshCw, Copy, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRole } from '../components/auth/RoleProvider';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { normEmail, hashPassword, readOffline, writeOffline, genTempPassword } from '../components/auth/localAuthUtils';
import ResetPasswordDialog from '../components/users/ResetPasswordDialog';

async function fetchAllLocalUsers() {
    return readOffline();
}

async function createLocalUser(userData) {
  const email = normEmail(userData.email);
  const existingUsers = readOffline();
  if (existingUsers.some(u => normEmail(u.email) === email)) {
    throw new Error("A user with this email already exists.");
  }
  const newUser = {
    ...userData,
    email,
    id: Date.now().toString(),
    created_date: new Date().toISOString()
  };
  writeOffline([...existingUsers, newUser]);
  return newUser;
}

async function updateLocalUser(email, patch) {
  email = normEmail(email);
  const allUsers = readOffline();
  const user = allUsers.find(u => normEmail(u.email) === email);

  if (!user) throw new Error("User not found for update");

  const updatedUsers = allUsers.map(u => normEmail(u.email) === email ? { ...u, ...patch } : u);
  writeOffline(updatedUsers);
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  disabled: { label: 'Disabled', color: 'bg-red-100 text-red-800' },
};

const roleConfig = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  operator: { label: 'Operator', color: 'bg-blue-100 text-blue-800' },
  reviewer: { label: 'Reviewer', color: 'bg-yellow-100 text-yellow-800' },
  reader: { label: 'Reader', color: 'bg-gray-100 text-gray-800' },
};

function UserActions({ user, onAction, isSelf, isLastAdmin }) {
  const cantModify = isSelf || isLastAdmin;
  const tooltipText = isSelf ? "You cannot modify your own account." : isLastAdmin ? "Cannot modify the last active admin." : "";

  const handleAction = (action, value) => {
    if (cantModify && action !== 'openResetPassword') {
        // Allow self password reset, but block other actions
        if (isSelf && action === 'openResetPassword') {
             onAction(user, action, value);
        }
        return;
    }
    onAction(user, action, value);
  };

  const ActionItem = ({ children, disabled, onClick, className }) => {
    const item = <DropdownMenuItem onClick={onClick} disabled={disabled} className={className}>{children}</DropdownMenuItem>;

    if (disabled && tooltipText) {
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild><div className="w-full">{item}</div></TooltipTrigger>
            <TooltipContent><p>{tooltipText}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return item;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <ActionItem onClick={() => handleAction('openResetPassword')}><RefreshCw className="mr-2 h-4 w-4" /> Reset Password</ActionItem>
        <DropdownMenuSeparator/>
        <ActionItem disabled={cantModify} onClick={() => handleAction('changeRole', 'admin')}><Shield className="mr-2 h-4 w-4" /> Make Admin</ActionItem>
        <ActionItem disabled={cantModify} onClick={() => handleAction('changeRole', 'operator')}><Shield className="mr-2 h-4 w-4" /> Make Operator</ActionItem>
        <ActionItem disabled={cantModify} onClick={() => handleAction('changeRole', 'reviewer')}><Shield className="mr-2 h-4 w-4" /> Make Reviewer</ActionItem>
         <ActionItem disabled={cantModify} onClick={() => handleAction('changeRole', 'reader')}><Shield className="mr-2 h-4 w-4" /> Make Reader</ActionItem>
        <DropdownMenuSeparator/>
        {user.status === 'active' ? (
          <ActionItem disabled={cantModify} onClick={() => handleAction('toggleStatus')} className="text-red-600 focus:bg-red-50 focus:text-red-700"><X className="mr-2 h-4 w-4" /> Disable User</ActionItem>
        ) : (
          <ActionItem disabled={cantModify} onClick={() => handleAction('toggleStatus')}><Check className="mr-2 h-4 w-4" /> Enable User</ActionItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FirstAdminForm({ onAdminCreated }) {
    const [formData, setFormData] = useState({ email: 'admin@demo.local', password: 'Demo12345!', confirmPassword: 'Demo12345!' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast({ title: "Error", description: "Email and password are required.", variant: "destructive" });
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const password_hash = await hashPassword(formData.password, formData.email);
            await createLocalUser({
                email: formData.email,
                role: 'admin',
                password_hash,
                status: 'active',
                must_reset: false,
            });
            toast({ title: "Admin Created", description: `Account for ${formData.email} created.` });
            onAdminCreated();
        } catch (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 max-w-lg mx-auto">
            <h3 className="font-semibold text-lg text-center">Create First Administrator</h3>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input id="admin-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                        <Input id="admin-password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                        <Button type="button" variant="outline" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin-confirm">Confirm Password</Label>
                    <Input id="admin-confirm" type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Creating...' : 'Create Admin'}
                </Button>
            </form>
        </div>
    );
}

function NewUserForm({ onUserCreated }) {
  const [formData, setFormData] = useState({ email: '', role: 'reviewer' });
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  const generateAndSetPassword = useCallback(() => {
    setPassword(genTempPassword());
  }, []);
  
  useEffect(generateAndSetPassword, [generateAndSetPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        setEmailError('Please enter a valid email address.');
        return;
    }

    setIsSubmitting(true);
    try {
      const password_hash = await hashPassword(password, formData.email);
      await createLocalUser({
        email: formData.email,
        role: formData.role,
        password_hash,
        status: 'active',
        must_reset: true,
      });
      toast({ title: "User Created", description: `An account for ${formData.email} has been created.`, duration: 2000 });
      onUserCreated(formData.email, password);
      setFormData({ email: '', role: 'reviewer' });
      generateAndSetPassword();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setEmailError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50/50">
      <div className="space-y-1">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        {emailError && <p className="text-sm text-red-600">{emailError}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="role">Role</Label>
        <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
          <SelectTrigger id="role"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="reader">Reader</SelectItem>
            <SelectItem value="reviewer">Reviewer</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Temp Password</Label>
        <div className="flex gap-2">
          <Input id="password" type={showPassword ? 'text' : 'password'} value={password} readOnly />
          <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}><Eye className="h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="icon" onClick={generateAndSetPassword}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        Create User
      </Button>
    </form>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tempPasswordInfo, setTempPasswordInfo] = useState(null);
  const [userToReset, setUserToReset] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user: currentUser } = useRole();
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setTempPasswordInfo(null);
    try {
      const allUsers = await fetchAllLocalUsers();
      setUsers(allUsers.sort((a,b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)));
    } catch (error) {
      toast({ title: 'Error loading users', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleUserCreated = (email, password) => {
    loadUsers();
    setTempPasswordInfo({ email, password });
  };
  
  const handleUserAction = async (targetUser, action, value) => {
    if (action === 'openResetPassword') {
        setUserToReset(targetUser);
        return;
    }
      
    if (!targetUser) return;
    
    try {
        if (action === 'toggleStatus') {
            const newStatus = targetUser.status === 'active' ? 'disabled' : 'active';
            await updateLocalUser(targetUser.email, { status: newStatus });
            toast({ description: `User ${targetUser.email} ${newStatus}.` });
        } else if (action === 'changeRole') {
            await updateLocalUser(targetUser.email, { role: value });
            toast({ description: `User ${targetUser.email} role changed to ${value}.` });
        }
        loadUsers();
    } catch (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
        const searchMatch = !searchTerm || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = statusFilter === 'all' || user.status === statusFilter;
        return searchMatch && statusMatch;
    });
  }, [users, searchTerm, statusFilter]);

  const { totalUsers, activeUsers, activeAdmins } = useMemo(() => {
    const active = users.filter(u => u.status === 'active');
    return {
      totalUsers: users.length,
      activeUsers: active.length,
      activeAdmins: active.filter(u => u.role === 'admin').length,
    };
  }, [users]);
  
  const currentUserEmail = normEmail(currentUser?.email);

  const copyPassword = () => {
    if (!tempPasswordInfo) return;
    navigator.clipboard.writeText(tempPasswordInfo.password);
    toast({ description: 'Temporary password copied to clipboard.' });
  };

  const isOffline = true; // For demo purposes

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Local Demo Accounts</h1>
            {isOffline && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline">Offline Mode</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Local auth is using browser storage. Changes aren’t saved to the server.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
          </div>
          <p className="text-gray-600 mt-1">Total: {totalUsers} • Active: {activeUsers}</p>
        </div>
      </div>
      
      {tempPasswordInfo && (
        <Alert>
          <AlertTitle className="font-semibold">Copy credentials for {tempPasswordInfo.email}</AlertTitle>
          <AlertDescription className="flex justify-between items-center flex-wrap gap-2">
            <span>Share this password securely. It will only be shown once.</span>
            <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
                <code className="font-mono text-sm">{tempPasswordInfo.password}</code>
                <Button variant="outline" size="sm" onClick={copyPassword}><Copy className="mr-2 h-4 w-4"/>Copy</Button>
                <Button variant="ghost" size="icon" onClick={() => setTempPasswordInfo(null)}><X className="h-4 w-4"/></Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {users.length > 0 && (
        <Card>
          <CardHeader><CardTitle>New Local User</CardTitle></CardHeader>
          <CardContent><NewUserForm onUserCreated={handleUserCreated} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>All Users</CardTitle>
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Search by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48"
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (<p className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></p>) : users.length === 0 ? (
            <div className="text-center py-8"><FirstAdminForm onAdminCreated={loadUsers} /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => {
                  const isSelf = normEmail(user.email) === currentUserEmail;
                  const isLastAdmin = user.role === "admin" && user.status === "active" && activeAdmins <= 1;
                  const lastLoginDisplay = user.last_login ? new Date(user.last_login).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : 'Never';
                  const createdDisplay = user.created_date ? new Date(user.created_date).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A';

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.email}{isSelf && <span className="text-xs text-gray-500 ml-2">(you)</span>}</div>
                        {user.must_reset && <Badge variant="destructive" className="mt-1">Must Reset</Badge>}
                      </TableCell>
                      <TableCell><Badge className={roleConfig[user.role]?.color}>{roleConfig[user.role]?.label || user.role}</Badge></TableCell>
                      <TableCell><Badge className={statusConfig[user.status]?.color}>{statusConfig[user.status]?.label}</Badge></TableCell>
                      <TableCell title={user.last_login}>{lastLoginDisplay}</TableCell>
                      <TableCell title={user.created_date}>{createdDisplay}</TableCell>
                      <TableCell className="text-right"><UserActions user={user} onAction={handleUserAction} isSelf={isSelf} isLastAdmin={isLastAdmin} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {userToReset && (
        <ResetPasswordDialog
            user={userToReset}
            open={!!userToReset}
            onOpenChange={() => setUserToReset(null)}
            onSuccess={loadUsers}
        />
      )}
    </div>
  );
}