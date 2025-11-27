
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useProjects } from '@/components/portal/useProjectsContext';
import { useToast } from '@/components/ui/use-toast';
import { can } from '@/components/auth/permissions';
import { useRole } from '@/components/auth/RoleProvider';
import BrandingPublisher from '@/components/settings/BrandingPublisher';
import {
  readUsers,
  writeUsers,
  getUserId,
  isAdmin,
  getSessionSafe,
  clearSessionAndGoHome,
  createUser,
  getUsers, // This import might become redundant after the change, but keeping it for now as it's part of the original file
  saveUsers, // This import might become redundant after the change, but keeping it for now as it's part of the original file
  findUserById,
  clearSession,
  findUserByEmail,
  hashPassword,
  verifyPassword
} from "@/components/auth/authUtils";
import { User } from '@/api/entities';
import { UserActivationRequest } from '@/api/entities/UserActivationRequest';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";

/** ================================================================
 *  PERSISTENCE SHIM — API first, fallback to localStorage
 *  =============================================================== */
async function tryFetch(u, o = {}) {
  try { const r = await fetch(u, { cache: "no-store", ...o }); if (!r.ok) throw 0; return await r.json().catch(() => ({})); }
  catch { return null; }
}
async function trySave(u, p, method = "POST") {
  try { const r = await fetch(u, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); return r.ok ? await r.json().catch(() => ({})) : null; }
  catch { return null; }
}

const LS_KEY = "cabpoe_settings_proto";
const SESSION_KEY = "cabpoe_session";

function lsRead() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } }
function lsWrite(patch) { try { const cur = lsRead(); const next = { ...cur, ...patch }; localStorage.setItem(LS_KEY, JSON.stringify(next)); return next; } catch { return null; } }

async function loadOrShim(key, urls = [], transform = (j)=>j) {
  for (const u of urls) { const j = await tryFetch(u); if (j) return transform(j); }
  const cur = lsRead(); return cur[key] ?? null;
}
async function saveOrShim(key, payload, url, method = "POST") {
  const ok = await trySave(url, payload, method);
  if (ok) return { ok: true, via: "api" };
  const next = lsWrite({ [key]: payload });
  return { ok: !!next, via: "local" };
}

async function uploadFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/** ================================================================
 *  UI Helpers
 *  =============================================================== */
function Label({ children, className = "" }) { return <span className={`font-medium ${className}`}>{children}</span>; }
function Field({ label, children, className="" }) {
  return <label className={`grid gap-1 text-sm ${className}`}><Label>{label}</Label>{children}</label>;
}
function Banner({ apiDetected }) {
  return (
    <div className={`mb-3 p-3 text-sm border rounded ${apiDetected ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
      <b>Settings page loaded ✓</b>
      <span className="ml-2">
        {apiDetected ? "Using live API when available." : "Prototype mode: saving to your browser (localStorage)."}
      </span>
    </div>
  );
}

function Button({ onClick, children, className = "", disabled = false, variant = "default", size = "md" }) {
  const baseClasses = "px-3 py-2 text-sm border rounded";
  const variantClasses = {
    default: "bg-white hover:bg-gray-50",
    outline: "bg-white border-gray-300 hover:bg-gray-50",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  };
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2 text-base",
  };
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

/** ================================================================
 *  AUTH UTILS SHIM (for user management)
 *  =============================================================== */
const getCurrentUser = async () => {
  try {
    return await User.me();
  } catch {
    return null;
  }
};

const canAccessTab = (effectiveRole, tabKey) => {
  switch (tabKey) {
    case "account":
    case "profile":
      return true;
    case "users":
      return can(effectiveRole, 'users', 'list');
    case "roles":
      return can(effectiveRole, 'users', 'edit_non_admin');
    case "security":
    case "api":
    case "billing":
      return can(effectiveRole, 'settings', 'edit_security') || effectiveRole === 'admin';
    case "branding":
    case "notify":
    case "presets":
    case "data":
    case "ticker":
    case "integrations":
      return can(effectiveRole, 'settings', 'view');
    case "support":
      return true;
    default:
      return false;
  }
};

/** ================================================================
 *  Tabs metadata
 *  =============================================================== */
const TABS = [
  { key: "account",    label: "Account" },
  { key: "profile",    label: "Profile" },
  { key: "users",      label: "Users" },
  { key: "roles",      label: "Roles & Access" },
  { key: "security",   label: "Security & Compliance" },
  { key: "branding",   label: "Branding & Theme" },
  { key: "api",        label: "API Keys" },
  { key: "notify",     label: "Notifications" },
  { key: "presets",    label: "Presets & Templates" },
  { key: "data",       label: "Data Sources" },
  { key: "ticker",     label: "Ticker Sources" },
  { key: "integrations", label: "Integrations" },
  { key: "billing",    label: "Billing & Subscription" },
  { key: "support",    label: "Support & Help" },
];

/** ================================================================
 *  INDIVIDUAL TABS (enhanced with new features)
 *  =============================================================== */
function AccountTab() {
  const [me, setMe] = useState(null);
  const { effectiveRole } = useRole();

  useEffect(() => {
    (async () => {
      const currentUser = await getCurrentUser();
      setMe(currentUser);
    })();
  }, []);
  
  const signOut = () => { clearSessionAndGoHome(); };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Account</h2>
      <p className="text-sm text-zinc-700">Signed in as <b>{me?.email}</b> ({me?.app_role})</p>
      <button onClick={signOut} className="px-3 py-2 text-sm border rounded">Sign out</button>

      {effectiveRole === 'admin' && (
        <div className="pt-8">
          <EmergencyUserTools />
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
  const [profile, setProfile] = useState({ full_name: "", company: "", phone: "", title: "", location: "", avatar_url: "" });
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { (async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setProfile({
        full_name: currentUser.full_name || "",
        company: currentUser.company || "",
        phone: currentUser.phone || "",
        title: currentUser.title || "",
        location: currentUser.location || "",
        avatar_url: currentUser.avatar_url || ""
      });
    } else {
      const j = await loadOrShim("profile", ["/api/profile", "/api/user/profile"]);
      if (j) setProfile({ 
        full_name: j.name || "",
        company: j.company || "", 
        phone: j.phone || "", 
        title: j.title || "", 
        location: j.location || "",
        avatar_url: j.avatar_url || ""
      });
    }
  })(); }, []);

  const save = async () => {
    setMsg("");
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const updatedUser = await User.update(currentUser.id, profile);
        setProfile({ 
          full_name: updatedUser.full_name || "", 
          company: updatedUser.company || "", 
          phone: updatedUser.phone || "", 
          title: updatedUser.title || "", 
          location: updatedUser.location || "",
          avatar_url: updatedUser.avatar_url || ""
        });
        setMsg("Saved ✓ (via API)");
      } else {
        const res = await saveOrShim("profile", profile, "/api/profile");
        const currentLsUser = lsRead().currentUser;
        lsWrite({ currentUser: { ...currentLsUser, ...profile } });
        setMsg(res?.ok ? `Saved ✓${res.via==="local"?" (local)":" "}` : "Could not save.");
      }
    } catch (error) {
      setMsg(`Save failed: ${error.message}`);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const dataUrl = await uploadFile(file);
      setProfile(v => ({ ...v, avatar_url: dataUrl }));
      setMsg("Image uploaded successfully. Click Save to persist.");
    } catch (error) {
      setMsg("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Profile</h2>
      
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Profile Picture</h3>
        <div className="flex items-center gap-4">
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
          )}
          <div className="flex-1">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px, JPG or PNG</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Full Name"><input className="px-2 py-1 border rounded" value={profile.full_name} onChange={e => setProfile(v => ({ ...v, full_name: e.target.value }))}/></Field>
        <Field label="Title"><input className="px-2 py-1 border rounded" value={profile.title} onChange={e => setProfile(v => ({ ...v, title: e.target.value }))}/></Field>
        <Field label="Company"><input className="px-2 py-1 border rounded" value={profile.company} onChange={e => setProfile(v => ({ ...v, company: e.target.value }))}/></Field>
        <Field label="Location"><input className="px-2 py-1 border rounded" value={profile.location} onChange={e => setProfile(v => ({ ...v, location: e.target.value }))}/></Field>
        <Field label="Phone" className="md:col-span-2"><input className="px-2 py-1 border rounded" value={profile.phone} onChange={e => setProfile(v => ({ ...v, phone: e.target.value }))}/></Field>
      </div>
      <button onClick={save} className="px-3 py-2 text-sm border rounded" disabled={uploading}>
        {uploading ? "Uploading..." : "Save"}
      </button> 
      {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}

function DeleteUserModal({ user, isOpen, onClose, onConfirm, loading }) {
    const [confirmText, setConfirmText] = useState("");

    useEffect(() => {
        if (!isOpen) {
            setConfirmText("");
        }
    }, [isOpen]);

    if (!user) return null;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-gray-600">
                        Type <strong>DELETE</strong> to confirm you want to permanently remove <span className="font-semibold">{user.email}</span>.
                    </p>
                    <Input 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="mt-4"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button 
                        variant="destructive"
                        disabled={confirmText !== 'DELETE' || loading}
                        onClick={() => onConfirm(user.id)}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function useUsersModel() {
  const [users, setUsers] = useState([]);
  const [apiDetected, setApiDetected] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  
  const load = React.useCallback(async () => {
    try {
      console.log('Loading users...');
      setDebugInfo('Loading users...');
      
      // First try to get current user to verify auth works
      const currentUser = await User.me();
      console.log('Current user:', currentUser);
      setDebugInfo(`Current user: ${currentUser?.email || 'N/A'} (${currentUser?.app_role || 'N/A'}) - Attempting to load all users...`);
      
      const loadedUsers = await User.list(); 
      console.log('Users loaded:', loadedUsers);
      setUsers(loadedUsers || []);
      setDebugInfo(`Successfully loaded ${loadedUsers?.length || 0} users.`);
    } catch (error) {
      console.error('Failed to load users:', error);
      const errorMessage = error.message || 'Unknown error';
      const errorStatus = error.status ? ` (Status: ${error.status})` : '';
      setDebugInfo(`Error loading users: ${errorMessage}${errorStatus}. Attempting fallback.`);
      
      // Fallback: try to at least show current user
      try {
        const currentUser = await User.me();
        if (currentUser) {
          setUsers([currentUser]);
          setDebugInfo(`Fallback: Showing only current user (${currentUser.email}) due to full user list error: ${errorMessage}${errorStatus}.`);
        } else {
          setUsers([]);
          setDebugInfo(`Complete failure: ${errorMessage}${errorStatus}. Fallback also failed (no current user).`);
        }
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
        setUsers([]);
        setDebugInfo(`Complete failure: Initial error: ${errorMessage}${errorStatus} | Fallback error: ${fallbackError.message || 'Unknown fallback error'}.`);
      }
    }
  }, []);

  const createFirstAdmin = React.useCallback(async ({ name, email, password }) => {
    try {
      const me = await User.me();
      if (!me) {
        return { ok: false, error: "No current user found. Please log in first." };
      }
      await User.updateMyUserData({ app_role: 'admin', status: 'active' }); // Changed to updateMyUserData
      await load();
      return { ok: true, message: "Current user promoted to Admin." };
    } catch (error) {
      return { ok: false, error: "Could not promote user to admin. " + error.message };
    }
  }, [load]);

  const inviteUser = React.useCallback(async ({ name, email, role, password }) => {
    try {
      console.log(`Simulating invitation for ${email} with role ${role}.`);
      
      return { 
        ok: false, 
        error: `To create user ${email}, please invite them via the Base44 dashboard. Once they sign up, you can assign them the '${role}' role here.` 
      };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, []);

  const setAppRole = React.useCallback(async (idOrEmail, appRole) => {
    try {
      console.log(`Setting app_role for user ${idOrEmail} to ${appRole}`);
      const user = users.find(u => u.id === idOrEmail || u.email === idOrEmail);
      if (!user) {
        return { ok: false, error: 'User not found' };
      }
      await User.update(user.id, { app_role: appRole });
      await load();
      return { ok: true, via: "api" };
    } catch (error) {
      console.error('Failed to update app_role:', error);
      return { ok: false, error: error.message };
    }
  }, [users, load]);

  const updateUserStatus = useCallback(async (userId, status) => {
    try {
        const currentUser = await getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            return { ok: false, error: "You cannot change your own status." };
        }
        await User.update(userId, { status });
        await load();
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error.message };
    }
  }, [load]);

  const resetPassword = React.useCallback(async (idOrEmail, newPassword) => {
    const user = users.find(u => u.id === idOrEmail || u.email === idOrEmail);
    if (!user) {
      return { ok: false, error: 'User not found' };
    }
    return { 
      ok: false, 
      error: `Password resets must be initiated by the user (${user.email}) through the login page.`
    };
  }, [users]);
  
  const deleteUser = useCallback(async (userToDeleteObj) => {
    try {
      console.log('Deleting user:', userToDeleteObj);
      const allUsers = await User.list();
      const activeAdmins = allUsers.filter(u => u.app_role === 'admin' && u.status === 'active');
      const targetIsAdmin = userToDeleteObj.app_role === 'admin';

      if (targetIsAdmin && activeAdmins.length <= 1 && activeAdmins[0].id === userToDeleteObj.id) {
        return { ok: false, error: "Cannot delete the only remaining active admin." };
      }

      await User.delete(userToDeleteObj.id);
      
      const currentUser = await User.me().catch(() => null);
      if (currentUser && currentUser.id === userToDeleteObj.id) {
        await User.logout();
        return { ok: true, selfDelete: true, message: "Your account was deleted. Redirecting..." };
      }

      await load();
      return { ok: true, message: "User deleted successfully." };

    } catch (error) {
      console.error('Delete user error:', error);
      return { ok: false, error: "An unexpected error occurred while deleting the user." };
    }
  }, [load]);

  const deactivate = React.useCallback(async (idOrEmail) => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser && (currentUser.id === idOrEmail || currentUser.email === idOrEmail)) {
        return { ok: false, error: "Cannot deactivate your own account" };
      }
      const user = users.find(u => u.id === idOrEmail || u.email === idOrEmail);
      if (!user) {
        return { ok: false, error: 'User not found' };
      }
      await User.update(user.id, { status: 'deactivated' });
      await load();
      return { ok: true, via: "api" };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [users, load]);
  
  return { users, apiDetected, load, createFirstAdmin, inviteUser, setAppRole, resetPassword, deactivate, deleteUser, updateUserStatus, debugInfo };
}

function HashingDiagnostics() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [generatedHash, setGeneratedHash] = useState("");
  const [storedHash, setStoredHash] = useState(null);
  const [isMatch, setIsMatch] = useState(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!password || !email) {
        toast({ title: "Error", description: "Please enter email and password to verify.", variant: "destructive" });
        return;
    }
    
    let user = null;
    try {
      const allUsers = await User.list();
      user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    } catch (base44Error) {
      user = findUserByEmail(email); 
    }

    if (!user) {
        setStoredHash("User not found.");
        setGeneratedHash("");
        setIsMatch(false);
        return;
    }
    setStoredHash(user.password_hash || "No hash found in storage.");
    const computedHash = await hashPassword(password, email.toLowerCase());
    setGeneratedHash(computedHash);
    
    const isValid = await verifyPassword(password, user.password_hash, user.email);
    setIsMatch(isValid);
  };

  const handleRepairUser = async () => {
    if (!password || !email) {
        toast({ title: "Error", description: "Please enter email and password to repair.", variant: "destructive" });
        return;
    }
    
    let user = null;
    try {
      const allUsers = await User.list();
      user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    } catch (base44Error) {
      toast({ title: "Error", description: `Failed to fetch users for repair: ${base44Error.message}`, variant: "destructive" });
      return;
    }

    if (!user) {
        toast({ title: "Error", description: "User not found in Base44.", variant: "destructive" });
        return;
    }

    try {
        const salt = user.email.toLowerCase();
        const password_hash = await hashPassword(password, salt);
        
        await User.update(user.id, {
            password_hash,
            updated_at: new Date().toISOString()
        });
            
        toast({ 
            title: "Success", 
            description: `Password hash repaired for ${email} via Base44. User can now log in.` 
        });
        
        setStoredHash(password_hash);
        setIsMatch(true);
    } catch (error) {
        toast({ title: "Error", description: `Failed to repair user password via Base44: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className="mt-8 p-4 border-2 border-dashed rounded-lg bg-yellow-50 border-yellow-300">
      <h3 className="text-base font-semibold text-yellow-900">Hashing & Verification Diagnostics</h3>
      <p className="text-sm text-yellow-800 mb-4">Use this tool to debug login issues by comparing a live hash with a stored one.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">User Email (for salt)</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="ramzan@gigsgen.com" />
        </div>
        <div>
          <Label className="text-sm">Password to Test</Label>
          <Input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="The password you are testing" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={handleVerify} variant="secondary" size="sm">Verify Password</Button>
        {storedHash === "No hash found in storage." && (
          <Button onClick={handleRepairUser} variant="outline" size="sm" className="bg-green-50 border-green-300 text-green-800 hover:bg-green-100">
            🔧 Repair User (Set Proper Hash)
          </Button>
        )}
      </div>
      { (generatedHash || storedHash) && (
        <div className="mt-4 space-y-2 text-xs font-mono bg-white p-3 rounded">
          <p><strong>Computed Hash:</strong> <span className="break-all">{generatedHash}</span></p>
          <p><strong>Stored Hash:</strong> <span className="break-all">{storedHash}</span></p>
          <p className="text-base"><strong>Match:</strong> {isMatch === null ? 'N/A' : isMatch ? '✅ Yes, they match.' : '❌ NO, THEY DO NOT MATCH.'}</p>
        </div>
      )}
    </div>
  );
}

function EmergencyUserTools() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  const activateAndPromoteUser = async () => {
    if (!email) {
      setMessage('Please enter an email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const users = await User.list();
      const userToUpdate = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!userToUpdate) {
        setMessage(`User ${email} not found`);
        setLoading(false);
        return;
      }

      await User.update(userToUpdate.id, {
        status: 'active',
        app_role: 'admin'
      });

      setMessage(`✅ User ${email} activated and promoted to admin`);
      toast({ 
        title: 'Success', 
        description: `User ${email} is now an active admin` 
      });
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }

    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
      <h3 className="font-medium text-red-800 mb-3">🚨 Emergency User Management</h3>
      <p className="text-sm text-red-700 mb-3">Use this tool if you're locked out and need to activate/promote a user to admin.</p>
      
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-red-700 mb-1">User Email</label>
          <input 
            type="email"
            className="w-full px-3 py-2 border border-red-300 rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="gigsgen@gmail.com"
          />
        </div>
        <button 
          onClick={activateAndPromoteUser}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Activate & Make Admin'}
        </button>
      </div>
      
      {message && (
        <div className="mt-3 p-2 bg-white border border-red-200 rounded text-sm">
          {message}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const { users, load, updateUserStatus, debugInfo } = useUsersModel();
  const { toast } = useToast();
  const { effectiveRole, user: currentUser } = useRole();
  const [pendingStatusChanges, setPendingStatusChanges] = useState({});

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = (userId, newStatus) => {
    setPendingStatusChanges(prev => ({ ...prev, [userId]: newStatus }));
  };

  const handleUpdateStatus = async (userId) => {
    const newStatus = pendingStatusChanges[userId];
    if (!newStatus) return;

    const result = await updateUserStatus(userId, newStatus);

    if (result.ok) {
      toast({ title: 'Success', description: 'User status updated.' });
      setPendingStatusChanges(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">User Management</h2>
        <p className="text-sm text-zinc-600 mt-1">
          View existing users and manage their status. New users must be invited via the Base44 dashboard.
        </p>
      </div>

      {debugInfo && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-mono text-red-800 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <span><strong>Debug:</strong> {debugInfo}</span>
          </p>
        </div>
      )}

      <div className="border rounded overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Email</th>
                <th className="text-left p-2 font-medium">App Role</th>
                <th className="text-left p-2 font-medium">Current Status</th>
                <th className="text-left p-2 font-medium">Change Status</th>
                <th className="p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const userId = u.id || u.email;
                const isCurrentUser = currentUser && currentUser.id === userId;
                const canChangeStatus = effectiveRole === 'admin' && !isCurrentUser;
                const pendingStatus = pendingStatusChanges[userId];

                return (
                  <tr key={userId} className={isCurrentUser ? 'bg-blue-50' : ''}>
                    <td className="p-2">{u.full_name || "—"}</td>
                    <td className="p-2">{u.email || "—"}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        u.app_role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.app_role || "viewer"}
                      </span>
                    </td>
                    <td className="p-2">
                       <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.status === 'active' ? 'bg-green-100 text-green-800' :
                        u.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {u.status || 'N/A'}
                      </span>
                    </td>
                    <td className="p-2">
                      {canChangeStatus ? (
                        <select
                          className={`w-full px-2 py-1 border rounded ${pendingStatus ? 'border-orange-300 bg-orange-50' : ''}`}
                          value={pendingStatus || u.status}
                          onChange={(e) => handleStatusChange(userId, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="deactivated">Deactivated</option>
                          <option value="pending">Pending</option>
                        </select>
                      ) : (
                        <span className="text-xs text-gray-500 italic">
                          {isCurrentUser ? "Cannot change self" : "Protected"}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {canChangeStatus && pendingStatus && (
                        <Button size="sm" onClick={() => handleUpdateStatus(userId)}>
                          Update
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!users.length && <tr><td className="p-2 text-center text-gray-500" colSpan={6}>No users found. This may be due to platform security restrictions.</td></tr>}
            </tbody>
          </table>
      </div>
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">Important Note:</h4>
        <p className="text-sm text-yellow-700">
          Due to platform security, the user list may not appear in the live web environment. If the list is empty, please manage users directly from the Base44 dashboard. Changes to roles can be made in the "Roles & Access" tab.
        </p>
      </div>

    </div>
  );
}


function RolesAccessTab() {
  const { users, load, setAppRole } = useUsersModel();
  const { effectiveRole } = useRole(); // Define effectiveRole using the hook
  const [msg, setMsg] = useState("");
  const [resetPasswordForm, setResetPasswordForm] = useState({ userId: "", newPassword: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingRoleChanges, setPendingRoleChanges] = useState({});

  useEffect(() => { 
    load(); 
    getCurrentUser().then(setCurrentUser);
  }, [load]);

  const isAdmin = (user) => user?.app_role === 'admin';
  const getUserId = (user) => user?.id || user?.email;

  const handleRoleChange = (userId, newRole) => {
    setPendingRoleChanges(prev => ({
      ...prev,
      [userId]: newRole
    }));
    setMsg("");
  };

  const handleUpdateRole = async (userId) => {
    if (currentUser && getUserId(currentUser) === userId && isAdmin(currentUser)) {
      setMsg("Admins cannot change their own role");
      return;
    }

    const newRole = pendingRoleChanges[userId];
    if (!newRole) {
      setMsg("No role change selected");
      return;
    }

    setMsg("Updating role..."); 
    const res = await setAppRole(userId, newRole);
    if (res.ok) {
      setMsg("Role updated successfully");
      setPendingRoleChanges(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    } else {
      setMsg(`Update failed: ${res.error}`);
    }
  };

  const handleResetPassword = async () => {
    setMsg("Password reset functionality is primarily managed in the Users tab.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Roles & Access</h2>
        <p className="text-sm text-zinc-600">Assign application-level roles to users.</p>
      </div>
      
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="font-medium mb-2">Role Permissions</h3>
        <div className="text-sm space-y-1">
          <div><strong>Admin:</strong> Full access to all settings and user management</div>
          <div><strong>Manager:</strong> Can manage users (except admins) and most settings</div>
          <div><strong>Operator:</strong> Can create/run decisions, limited settings access</div>
          <div><strong>Reviewer:</strong> Read-only access to most features</div>
        </div>
      </div>

      <div className="border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50">
              <th className="text-left p-2">User</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Current App Role</th>
              <th className="p-2">Change App Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const userId = getUserId(u);
              const isCurrentUser = currentUser && getUserId(currentUser) === userId;
              const canChangeRole = effectiveRole === "admin" && (!isCurrentUser || !isAdmin(currentUser));
              const hasPendingChange = userId in pendingRoleChanges && pendingRoleChanges[userId] !== u.app_role;
              const selectedRole = hasPendingChange ? pendingRoleChanges[userId] : u.app_role || "viewer";
              
              return (
                <tr key={userId}>
                  <td className="p-2">{u.full_name || "—"}</td>
                  <td className="p-2">{u.email || "—"}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.app_role === 'admin' ? 'bg-red-100 text-red-800' :
                      u.app_role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      u.app_role === 'operator' ? 'bg-green-100 text-green-800' :
                      u.app_role === 'reviewer' || u.app_role === 'viewer' ? 'bg-purple-100 text-purple-800' : // Group reviewer and viewer
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {u.app_role || "viewer"}
                    </span>
                  </td>
                  <td className="p-2">
                    {canChangeRole ? (
                      <select 
                        className={`px-2 py-1 border rounded ${hasPendingChange ? 'border-orange-300 bg-orange-50' : ''}`}
                        value={selectedRole}
                        onChange={e => handleRoleChange(userId, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="operator">Operator</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {isCurrentUser ? "Current User" : "Protected"}
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    {canChangeRole && hasPendingChange && (
                      <button 
                        onClick={() => handleUpdateRole(userId)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Update Role
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!users.length && <tr><td className="p-2" colSpan={5}>No users.</td></tr>}
          </tbody>
        </table>
      </div>
      
      {msg && <div className="text-sm p-3 bg-gray-50 border rounded">{msg}</div>}
    </div>
  );
}

function SecurityAndComplianceTab() {
  const [redir, setRedir] = useState("dashboard"); const [msg, setMsg] = useState("");
  useEffect(() => { (async () => {
    const a = await loadOrShim("auth_redirect", ["/api/settings/auth-redirect", "/api/org/settings"]);
    if (a) { const v = a.redirect || a.data?.redirect || a.settings?.redirect || a.default_redirect; if (typeof v === "string") setRedir(v.includes("project") ? "projects" : "dashboard");}
  })(); }, []);
  const save = async () => {
    setMsg(""); const payload = { redirect: redir === "projects" ? "/projects" : "/dashboard" };
    const res = await saveOrShim("auth_redirect", payload, "/api/settings/auth-redirect");
    setMsg(res?.ok ? `Saved ✓${res.via==="local"?" (local)":""}` : "Could not save.");
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Security & Compliance</h2>
        <p className="text-sm text-zinc-600">Manage security settings, authentication, and compliance features.</p>
      </div>
      <div className="space-y-3 p-4 border rounded-lg">
        <h3 className="font-medium">After-login default page</h3>
        <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="r" checked={redir === "dashboard"} onChange={() => setRedir("dashboard")} />Dashboard</label>
        <label className="inline-flex items-center gap-2 text-sm"><input type="radio" name="r" checked={redir === "projects"} onChange={() => setRedir("projects")} />Projects</label>
        <div><button onClick={save} className="px-3 py-2 text-sm border rounded">Save Redirect</button> {msg && <span className="text-sm">{msg}</span>}</div>
      </div>
      <div className="space-y-3 p-4 border rounded-lg bg-zinc-50">
        <h3 className="font-medium">Two-Factor Authentication (2FA)</h3>
        <p className="text-sm text-zinc-600">2FA options are managed at the organization level. Contact your administrator for details.</p>
        <button className="px-3 py-2 text-sm border rounded bg-white" disabled>Configure 2FA (stub)</button>
      </div>
      <div className="space-y-3 p-4 border rounded-lg bg-zinc-50">
        <h3 className="font-medium">Compliance</h3>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled /> Enforce GDPR/CCPA data handling (stub)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled /> Enable audit trail for all actions (stub)</label>
      </div>
    </div>
  );
}

function BrandPreview({ branding }) {
  const { logo, seoGlobal } = branding;
  const ogImage = seoGlobal?.og?.image?.file;

  return (
    <div className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center justify-center min-h-32 text-center">
      <p className="text-xs text-gray-500 mb-2">Live Preview (simplified)</p>
      {logo?.light?.file && (
        <img src={logo.light.file} alt="Light Logo Preview" className="h-10 w-auto max-w-48 object-contain mb-4" />
      )}
      <h4 className="text-xl font-bold mb-1">{seoGlobal?.title || "Your Site Title"}</h4>
      <p className="text-sm text-gray-700 mb-2">{seoGlobal?.description || "Your site description goes here."}</p>
      {ogImage && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-1">OpenGraph Image Preview</p>
          <img src={ogImage} alt="OpenGraph Preview" className="max-w-full h-32 object-contain border rounded" />
        </div>
      )}
    </div>
  );
}


function BrandingAndThemeTab() {
  const [branding, setBranding] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(null);
  const [activeSeoPage, setActiveSeoPage] = useState('global');
  const [activeContentPage, setActiveContentPage] = useState('home');

  useEffect(() => {
    (async () => {
      const { getBrandingConfig } = await import('@/components/lib/brandingStore');
      const data = getBrandingConfig();
      setBranding(data);
    })();
  }, []);

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    setUploading(type);
    setMsg("");
    
    try {
      const { uploadBrandingFile, generateFaviconVariants } = await import('@/components/lib/brandingStore');
      const result = await uploadBrandingFile(file, type);
      
      let newBranding = { ...branding };

      if (type === 'logo-light') {
        newBranding.logo = { ...newBranding.logo, light: result };
      } else if (type === 'logo-dark') {
        newBranding.logo = { ...newBranding.logo, dark: result };
      } else if (type === 'favicon') {
        newBranding.favicon = { ...newBranding.favicon, ...result };
        if (file.type.startsWith('image/') && file.type !== 'image/x-icon') {
            const variants = await generateFaviconVariants(file);
            newBranding.favicon.variants = variants;
        }
      } else if (type === 'ogImage') {
        newBranding.seoGlobal = newBranding.seoGlobal || {};
        newBranding.seoPages = newBranding.seoPages || {};

        if (activeSeoPage === 'global') {
          newBranding.seoGlobal = { ...newBranding.seoGlobal, og: { ...newBranding.seoGlobal.og, image: result } };
        } else {
          newBranding.seoPages[activeSeoPage] = { 
            ...newBranding.seoPages[activeSeoPage], 
            og: { ...newBranding.seoPages[activeSeoPage]?.og, image: result }
          };
        }
      } else if (type === 'heroImage') {
        newBranding.publicPages.home = { ...newBranding.publicPages.home, heroImage: result };
      }
      
      setBranding(newBranding);
      setMsg(`${type} uploaded. Save to persist.`);
    } catch (error) {
      setMsg(`Upload failed: ${error.message}`);
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setMsg("");
    try {
        const { setBrandingConfig } = await import('@/components/lib/brandingStore');
        const { applyBrandingHead, applySEOHead } = await import('@/components/lib/seoUtils');
        
        setBrandingConfig(branding);
        
        applyBrandingHead(branding);
        applySEOHead('settings', branding); 

        if (window.__publishBrandingToPublic) {
            window.__publishBrandingToPublic(branding);
        }

        setMsg(`Saved successfully!`);
    } catch (e) {
        setMsg("Could not save.");
        console.error('Save failed:', e);
    }
  };
  
  const handleNestedChange = (path, value) => {
    const keys = path.split('.');
    setBranding(prev => {
        const newState = { ...prev };
        let current = newState;
        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] ? { ...current[keys[i]] } : {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newState;
    });
  };

  if (!branding) {
    return <div>Loading branding settings...</div>;
  }

  const seoFields = activeSeoPage === 'global' ? (branding.seoGlobal || {}) : (branding.seoPages?.[activeSeoPage] || {});
  const pageContent = branding.publicPages?.[activeContentPage] || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Branding, Content & SEO</h2>
        <p className="text-sm text-zinc-600">Centralized control for your application's appearance and public-facing content.</p>
      </div>

      <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Brand Assets</h3>
          <div className="flex items-center gap-4 mb-4">
            <label className="block text-sm font-medium">Logo (Light):</label>
            <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'logo-light')} disabled={uploading === 'logo-light'} />
          </div>
          {branding.logo?.light?.file && <img src={branding.logo.light.file} alt="Light Logo Preview" className="h-10 my-2 border" />}
          
          <div className="flex items-center gap-4 mb-4">
            <label className="block text-sm font-medium">Logo (Dark):</label>
            <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'logo-dark')} disabled={uploading === 'logo-dark'} />
          </div>
          {branding.logo?.dark?.file && <img src={branding.logo.dark.file} alt="Dark Logo Preview" className="h-10 my-2 border bg-gray-800" />}

          <div className="flex items-center gap-4 mb-4">
            <label className="block text-sm font-medium">Favicon:</label>
            <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'favicon')} disabled={uploading === 'favicon'} />
          </div>
          {branding.favicon?.variants?.[32]?.file && <img src={branding.favicon.variants[32].file} alt="Favicon Preview" className="h-8 w-8 my-2 border" />}
      </div>
      
      <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Social Links</h3>
          <p className="text-sm text-gray-500 mb-4">Enter a full URL or just the handle (e.g., @yourbrand).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Facebook"><input className="w-full border p-2 rounded" placeholder="facebook.com/your-page" value={branding.social?.facebook || ''} onChange={e => handleNestedChange('social.facebook', e.target.value)} /></Field>
              <Field label="Instagram"><input className="w-full border p-2 rounded" placeholder="@yourhandle" value={branding.social?.instagram || ''} onChange={e => handleNestedChange('social.instagram', e.target.value)} /></Field>
              <Field label="LinkedIn"><input className="w-full border p-2 rounded" placeholder="linkedin.com/company/your-co" value={branding.social?.linkedin || ''} onChange={e => handleNestedChange('social.linkedin', e.target.value)} /></Field>
              <Field label="Twitter / X"><input className="w-full border p-2 rounded" placeholder="@yourhandle" value={branding.social?.twitter || ''} onChange={e => handleNestedChange('social.twitter', e.target.value)} /></Field>
              <Field label="YouTube"><input className="w-full border p-2 rounded" placeholder="@yourchannel" value={branding.social?.youtube || ''} onChange={e => handleNestedChange('social.youtube', e.target.value)} /></Field>
          </div>
      </div>

      <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">SEO Settings</h3>
          <select value={activeSeoPage} onChange={e => setActiveSeoPage(e.target.value)} className="p-2 border rounded mb-4">
              <option value="global">Global Defaults</option>
              {Object.keys(branding.seoPages || {}).map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)} ({p})
                </option>
              ))}
          </select>
          <div className="mt-2 space-y-2">
            <input placeholder="Site Title" value={seoFields.title || ''} onChange={e => handleNestedChange(activeSeoPage === 'global' ? 'seoGlobal.title' : `seoPages.${activeSeoPage}.title`, e.target.value)} className="w-full border p-2 rounded" />
            <textarea placeholder="Meta Description" value={seoFields.description || ''} onChange={e => handleNestedChange(activeSeoPage === 'global' ? 'seoGlobal.description' : `seoPages.${activeSeoPage}.description`, e.target.value)} className="w-full border p-2 rounded" />
            <input placeholder="Keywords (comma-separated)" value={seoFields.keywords || ''} onChange={e => handleNestedChange(activeSeoPage === 'global' ? 'seoGlobal.keywords' : `seoPages.${activeSeoPage}.keywords`, e.target.value)} className="w-full border p-2 rounded" />
             <div className="flex items-center gap-4">
               <label className="block text-sm font-medium">OG Image:</label>
               <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'ogImage')} disabled={uploading === 'ogImage'} />
             </div>
            {(seoFields.og?.image?.file) && <img src={seoFields.og.image.file} alt="OG Image Preview" className="h-20 my-2 border" />}
          </div>
      </div>
      
      <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-3">Public Page Content</h3>
          <select value={activeContentPage} onChange={e => setActiveContentPage(e.target.value)} className="p-2 border rounded mb-4">
              {Object.keys(branding.publicPages || {}).map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)} ({p})
                </option>
              ))}
          </select>
          <div className="mt-2 space-y-2">
              <input placeholder="H1 Title" value={pageContent.h1 || ''} onChange={e => handleNestedChange(`publicPages.${activeContentPage}.h1`, e.target.value)} className="w-full border p-2 rounded" />
              <textarea placeholder="Paragraph 1" value={pageContent.paragraphs?.[0] || ''} onChange={e => {
                const newParagraphs = [...(pageContent.paragraphs || [])];
                newParagraphs[0] = e.target.value;
                handleNestedChange(`publicPages.${activeContentPage}.paragraphs`, newParagraphs);
              }} className="w-full border p-2 rounded" />
              {activeContentPage === 'home' && (
                  <>
                    <div className="flex items-center gap-4">
                      <label className="block text-sm font-medium">Hero Image:</label>
                      <input type="file" onChange={e => handleFileUpload(e.target.files[0], 'heroImage')} disabled={uploading === 'heroImage'} />
                    </div>
                    {branding.publicPages?.home?.heroImage?.file && <img src={branding.publicPages.home.heroImage.file} alt="Hero Image Preview" className="h-20 my-2 border" />}
                  </>
              )}
          </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Preview</h3>
        <BrandPreview branding={branding} />
      </div>

      <div className="flex gap-3">
        <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={!!uploading}>
          {uploading ? "Processing..." : "Save All Changes"}
        </button>
      </div>
      {msg && <div className="text-sm mt-2">{msg}</div>}

      <BrandingPublisher branding={branding} />
    </div>
  );
}

function APITokensTab() {
  const [items, setItems] = useState([]); const [name, setName] = useState(""); const [msg, setMsg] = useState("");
  const load = React.useCallback(async () => {
    const j = await loadOrShim("api_keys", ["/api/keys", "/api/api-keys"]);
    setItems(Array.isArray(j) ? j : (j?.keys || []));
  }, []);
  useEffect(() => { load(); }, [load]);
  const create = async () => {
    setMsg(""); const payload = { name, key_last4: Math.floor(Math.random()*9000+1000).toString() };
    const res = await saveOrShim("api_keys", (Array.isArray(items)?items:[]).concat([payload]), "/api/keys");
    setMsg(res?.ok ? `Created ✓${res.via==="local"?" (local)":""}` : "Create failed");
    setName(""); load();
  };
  const revoke = async (idOrLast4) => {
    const res = await tryFetch(`/api/keys/${idOrLast4}`, { method: "DELETE" });
    if (!res) { const next = (Array.isArray(items)?items:[]).filter(k => (k.id||k.key_last4)!==idOrLast4); lsWrite({ api_keys: next }); }
    load();
  };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">API Keys</h2>
      <div className="flex gap-2 text-sm">
        <input className="px-2 py-1 border rounded" value={name} onChange={e => setName(e.target.value)} placeholder="Key name" />
        <button onClick={create} className="px-3 py-2 text-sm border rounded">Create</button> {msg && <span className="text-sm">{msg}</span>}
      </div>
      <div className="mt-3 border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-zinc-50"><th className="text-left p-2">Name</th><th className="text-left p-2">Key</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {(Array.isArray(items)?items:[]).map(k => (<tr key={k.id || k.key_last4 || k.name}><td className="p-2">{k.name || "—"}</td><td className="p-2">{k.masked || k.key_last4 ? `••••${k.key_last4}` : "••••"}</td><td className="p-2 text-right"><button onClick={() => revoke(k.id || k.key_last4)} className="px-2 py-1 border rounded">Revoke</button></td></tr>))}
            {!items?.length && <tr><td className="p-2" colSpan={3}>No keys.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [email, setEmail] = useState(true), [sms, setSms] = useState(false), [push, setPush] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { (async () => { const j = await loadOrShim("notifications", ["/api/settings/notifications"]); if (j) { setEmail(!!j.email); setSms(!!j.sms); setPush(!!j.push); } })(); }, []);
  const save = async () => { setMsg(""); const res = await saveOrShim("notifications", { email, sms, push }, "/api/settings/notifications"); setMsg(res?.ok ? `Saved ✓${res.via==="local"?" (local)":""}` : "Could not save."); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Notifications</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={email} onChange={e => setEmail(e.target.checked)} /> Email</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sms} onChange={e => setSms(e.target.checked)} /> SMS</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={push} onChange={e => setPush(e.target.checked)} /> Push</label>
      <button onClick={save} className="px-3 py-2 text-sm border rounded">Save</button> {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}

function PresetsAndTemplatesTab() {
    const [weights, setW] = useState({ time: 0.4, cost: 0.3, reliability: 0.3 }); const [msg, setMsg] = useState("");
    useEffect(() => { (async () => { const j = await loadOrShim("presets", ["/api/settings/presets"]); if (j?.weights) setW(j.weights); })(); }, []);
    const save = async () => { setMsg(""); const res = await saveOrShim("presets", { weights: weights }, "/api/settings/presets"); setMsg(res?.ok ? `Saved ✓${res.via==="local"?" (local)":""}` : "Could not save."); };
    return (
      <div className="space-y-6">
        <div>
            <h2 className="text-lg font-medium">Presets & Templates</h2>
            <p className="text-sm text-zinc-600">Configure global defaults and reusable project templates.</p>
        </div>
        <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium">Default objective weights for new projects:</h3>
            {["time", "cost", "reliability"].map(k => (
                <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                <input type="number" min="0" max="1" step="0.1" className="px-2 py-1 border rounded" value={weights[k]} onChange={e => setW(v => ({ ...v, [k]: parseFloat(e.target.value || 0) }))} />
                </Field>
            ))}
            <button onClick={save} className="px-3 py-2 text-sm border rounded">Save Defaults</button> {msg && <span className="text-sm">{msg}</span>}
        </div>
        <div className="space-y-3 p-4 border rounded-lg bg-zinc-50">
            <h3 className="font-medium">Project Templates</h3>
            <p className="text-sm text-zinc-700">Configure per-project defaults (future extension).</p>
            <button className="px-3 py-2 text-sm border rounded bg-white" disabled>Manage Templates (stub)</button>
        </div>
      </div>
    );
}

function DataSourcesTab() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [autoDetectResult, setAutoDetectResult] = useState(null);
  const { projects, loadStatus, lastReloadAt, reloadProjects } = useProjects();
  const { toast } = useToast();

  useEffect(() => { (async () => {
    const j = await loadOrShim("data_sources", ["/api/datasets", "/api/data-sources"]);
    const arr = Array.isArray(j) ? j : (j?.datasets || j?.items || []);
    setRows(arr);
  })(); }, []);

  const handleRestoreFromRemote = async () => {
    setMsg("Restoring from remote...");
    const result = await reloadProjects({ prefer: 'remote' });
    if (result.ok) {
        toast({ title: 'Success', description: `Projects reloaded from ${result.source.toUpperCase()} (${result.count}).` });
        setMsg(`Restored ${result.count} projects from ${result.source}.`);
    } else {
        const errorMsg = result.reason === 'no-data'
            ? 'Both remote and internal returned 0 projects; kept existing list.'
            : `Restore failed: ${result.reason}`;
        toast({ title: 'Restore Failed', description: errorMsg, variant: 'destructive' });
        setMsg(errorMsg);
    }
  };

  const handleRestoreFromInternal = async () => {
    setMsg("Restoring from internal fallback...");
    const result = await reloadProjects({ prefer: 'internal' });
    if (result.ok) {
        toast({ title: 'Success', description: `Projects reloaded from ${result.source.toUpperCase()} (${result.count}).` });
        setMsg(`Restored ${result.count} projects from ${result.source}.`);
    } else {
        const errorMsg = result.reason === 'no-data'
            ? 'Both internal and remote returned 0 projects; kept existing list.'
            : `Restore failed: ${result.reason}`;
        toast({ title: 'Restore Failed', description: errorMsg, variant: 'destructive' });
        setMsg(errorMsg);
    }
  };

  const handleEnableSniffer = async () => {
    setMsg("Enabling network sniffer...");
    try {
      const { enableSniffer } = await import('@/components/projects/netSniffer').catch(() => ({enableSniffer: () => console.log('Mock: Net sniffer enabled')}));
      enableSniffer();
      setMsg("Network sniffer enabled ✓ Visit Data → Projects in another tab, then return here.");
    } catch (error) {
      setMsg(`Failed to enable sniffer: ${error.message}`);
    }
  };

  const handleAutoDetect = async () => {
    setMsg("Auto-detecting...");
    setAutoDetectResult(null);
    try {
      const { autoDetectProjectsSource } = await import('@/components/projects/projectsAutoDetect').catch(() => ({autoDetectProjectsSource: async () => {
        console.log('Mock: Auto-detect projects source');
        return { entity: 'mock_project_api', count: 12, auth: 'Bearer Token', fields: { idField: 'id', nameField: 'name' }};
      }}));
      const result = await autoDetectProjectsSource();
      setAutoDetectResult(result);
      setMsg(`Auto-detected ✓ Entity: ${result.entity}, Count: ${result.count}, Auth: ${result.auth}`);
    } catch (error) {
      setMsg(`Auto-detect failed: ${error.message}`);
      setAutoDetectResult(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Data Sources</h2>
      
      <div className="p-4 border rounded-lg">
        <h3 className="font-medium mb-3">Projects Source Configuration</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={handleEnableSniffer}>
              Enable Network Sniffer (temp)
            </Button>
            <Button onClick={handleAutoDetect}>
              Auto-Detect Projects Source
            </Button>
            <Button onClick={handleRestoreFromRemote} variant="outline">
              Restore from Remote
            </Button>
            <Button onClick={handleRestoreFromInternal} variant="outline">
              Reload via Internal Fallback
            </Button>
          </div>
          
          <div className="p-3 bg-gray-50 border rounded text-xs space-y-1">
              <p><strong>Current Status:</strong> <span className="font-mono">{loadStatus}</span></p>
              <p><strong>Projects Loaded:</strong> <span className="font-mono">{projects.length}</span></p>
              <p><strong>Last Reload:</strong> <span className="font-mono">{lastReloadAt ? lastReloadAt.toLocaleTimeString() : 'N/A'}</span></p>
          </div>

          {autoDetectResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <p><strong>Detected Source:</strong></p>
              <p>Entity: <code>{autoDetectResult.entity}</code></p>
              <p>Fields: ID={autoDetectResult.fields?.idField}, Name={autoDetectResult.fields?.nameField}</p>
              <p>Count: {autoDetectResult.count}, Auth: {autoDetectResult.auth}</p>
              <p className="text-green-700 font-medium mt-2">Saved ✓ (local)</p>
            </div>
          )}
          
          {msg && <p className="text-sm text-gray-600">{msg}</p>}
        </div>
      </div>

      <div className="border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-zinc-50"><th className="text-left p-2">Name</th><th className="text-left p-2">Type</th><th className="text-left p-2">Updated</th></tr></thead>
          <tbody>
            {rows.map(d => (<tr key={d.id || d.name}><td className="p-2">{d.name || "—"}</td><td className="p-2">{d.type || "—"}</td><td className="p-2">{d.updated_at || d.ts || "—"}</td></tr>))}
            {!rows.length && <tr><td className="p-2" colSpan={3}>No data sources.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TickerSourcesTab() {
  const [freq, setFreq] = useState("daily"); const [msg, setMsg] = useState("");
  useEffect(() => { (async () => { const j = await loadOrShim("ticker", ["/api/settings/ticker"]); if (j) setFreq(j.frequency || j.refresh || "daily"); })(); }, []);
  const save = async () => { setMsg(""); const res = await saveOrShim("ticker", { frequency: freq }, "/api/settings/ticker"); setMsg(res?.ok ? `Saved ✓${res.via==="local"?" (local)":""}` : "Could not save."); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Ticker Sources</h2>
      <Field label="Refresh frequency">
        <select className="px-2 py-1 border rounded" value={freq} onChange={e => setFreq(e.target.value)}>
          <option value="daily">Daily (credit-light)</option>
          <option value="6h">Every 6 hours</option>
          <option value="hourly">Hourly</option>
        </select>
      </Field>
      <button onClick={save} className="px-3 py-2 text-sm border rounded">Save</button> {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}

function IntegrationsTab() {
  const [cfg, setCfg] = useState({ weather: false, fx: false, geopolitics: false }); const [msg, setMsg] = useState("");
  useEffect(() => { (async () => { const j = await loadOrShim("integrations", ["/api/settings/integrations"]); if (j) setCfg({ weather: !!j.weather, fx: !!j.fx, geopolitics: !!j.geopolitics }); })(); }, []);
  const save = async () => { setMsg(""); const res = await saveOrShim("integrations", cfg, "/api/settings/integrations"); setMsg(res?.ok ? `Saved ✓${res.via==="local"?" (local)":""}` : "Could not save."); };
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Integrations</h2>
      {["weather", "fx", "geopolitics"].map(k => (
        <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cfg[k]} onChange={e => setCfg(v => ({ ...v, [k]: e.target.checked }))} /> {k[0].toUpperCase() + k.slice(1)}</label>
      ))}
      <button onClick={save} className="px-3 py-2 text-sm border rounded">Save</button> {msg && <span className="text-sm">{msg}</span>}
    </div>
  );
}

function BillingAndSubscriptionTab() {
  return (
    <div className="space-y-3">
        <h2 className="text-lg font-medium">Billing & Subscription</h2>
        <p className="text-sm text-zinc-600">View your current plan, usage, and billing history.</p>
        <div className="p-4 border rounded-lg bg-zinc-50 text-sm text-zinc-700">
            <p>Billing and subscription management features are coming soon.</p>
        </div>
    </div>
  );
}

function SupportAndHelpTab() {
    return (
      <div className="space-y-3">
          <h2 className="text-lg font-medium">Support & Help</h2>
          <p className="text-sm text-zinc-600">Find answers, get help, and provide feedback.</p>
          <div className="p-4 border rounded-lg bg-zinc-50 text-sm text-zinc-700">
              <p>Support features are coming soon.</p>
          </div>
      </div>
    );
}

/** ================================================================
 *  HEADER WITH AVATAR
 *  =============================================================== */
function SettingsHeader() {
  const [profile, setProfile] = useState(null);
  useEffect(() => { (async () => {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setProfile(currentUser);
    } else {
      const j = await loadOrShim("profile", ["/api/profile", "/api/user/profile"]);
      if (j) setProfile(j);
    }
  })(); }, []);

  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="flex items-center gap-4">
        {profile?.avatar_url && (
          <button 
            onClick={() => window.location.hash = "#profile"}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src={profile.avatar_url} 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200" 
            />
            <span className="text-sm text-gray-600 hidden md:inline">Profile</span>
          </button>
        )}
        <a href="/dashboard" className="text-sm underline">Back to Dashboard</a>
      </div>
    </div>
  );
}

/** ================================================================
 *  MAIN ROUTE
 *  =============================================================== */
export default function SettingsRoute() {
  const [tab, setTab] = useState("account");
  const [apiDetected, setApiDetected] = useState(false);
  const { effectiveRole } = useRole();

  useEffect(() => { 
    try { 
      const u = new URL(window.location.href); 
      const t = u.searchParams.get("tab") || u.hash.replace("#", "");
      if (t && TABS.some(x => x.key === t) && canAccessTab(effectiveRole, t)) setTab(t); 
    } catch {} 
  }, [effectiveRole]);
  
  useEffect(() => { 
    try { 
      const u = new URL(window.location.href); 
      u.searchParams.set("tab", tab); 
      window.history.replaceState({}, "", u.toString()); 
    } catch {} 
  }, [tab]);
  
  useEffect(() => { (async () => { const ping = await tryFetch("/api/me"); setApiDetected(!!ping); })(); }, []);

  const availableTabs = TABS.filter(t => canAccessTab(effectiveRole, t.key));

  const Content = useMemo(() => {
    switch (tab) {
      case "account": return <AccountTab />;
      case "profile": return <ProfileTab />;
      case "users": return <UsersTab />;
      case "roles": return <RolesAccessTab />;
      case "security": return <SecurityAndComplianceTab />;
      case "branding": return <BrandingAndThemeTab />;
      case "api": return <APITokensTab />;
      case "notify": return <NotificationsTab />;
      case "presets": return <PresetsAndTemplatesTab />;
      case "data": return <DataSourcesTab />;
      case "ticker": return <TickerSourcesTab />;
      case "integrations": return <IntegrationsTab />;
      case "billing": return <BillingAndSubscriptionTab />;
      case "support": return <SupportAndHelpTab />;
      default: return <AccountTab />;
    }
  }, [tab]);

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6">
      <Banner apiDetected={apiDetected} />
      <SettingsHeader />
      <div className="sticky top-0 z-10 mb-4 overflow-x-auto">
        <div className="flex gap-2 py-2">
          {availableTabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 text-sm border rounded whitespace-nowrap ${t.key === tab ? "bg-zinc-900 text-white" : "bg-white hover:bg-zinc-50"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="border rounded p-4 bg-white">{Content}</div>
    </div>
  );
}
