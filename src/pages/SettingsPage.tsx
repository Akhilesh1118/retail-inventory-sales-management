import React, { useState, useEffect } from 'react';
import { User, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Users,
  UserPlus,
  Building,
  Save,
  CheckCircle2,
  Power
} from 'lucide-react';

interface SettingsPageProps {
  config: StoreConfig | null;
  onConfigUpdated: (config: StoreConfig) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ config, onConfigUpdated }) => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);

  // New user form state
  const [newUsername, setNewUsername] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<'admin' | 'staff'>('staff');
  const [newFullName, setNewFullName] = useState<string>('');
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Store config form state
  const [storeName, setStoreName] = useState<string>(config?.storeName || 'Apex Retail Mart');
  const [storeAddress, setStoreAddress] = useState<string>(
    config?.storeAddress || 'Plot 42, Commercial Avenue, Sector 5'
  );
  const [gstin, setGstin] = useState<string>(config?.gstin || '07AAAAA0000A1Z5');
  const [currency, setCurrency] = useState<string>(config?.currency || 'INR');
  const [taxRatePercent, setTaxRatePercent] = useState<string>(
    String(config?.taxRatePercent || 18)
  );
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);

    try {
      await api.createUser({
        username: newUsername.trim(),
        email: newEmail.trim(),
        passwordPlain: newPassword,
        role: newRole,
        fullName: newFullName.trim()
      });

      setUserSuccess(`User '${newUsername}' created successfully.`);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      await fetchUsers();
    } catch (err: any) {
      setUserError(err.message || 'Failed to create user');
    }
  };

  const handleToggleUserActive = async (targetUser: User) => {
    const targetUserId = targetUser.id || (targetUser as any)._id;
    const currentUserId = currentUser?.id || (currentUser as any)?._id;

    if (targetUserId === currentUserId) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    const action = targetUser.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${targetUser.fullName}?`)) return;

    try {
      await api.updateUser(targetUserId, { isActive: !targetUser.isActive });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess(null);

    try {
      const res = await api.updateConfig({
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        gstin: gstin.trim(),
        currency: currency.trim(),
        taxRatePercent: Number(taxRatePercent) || 18
      });

      onConfigUpdated(res.config);
      setConfigSuccess('Store fiscal configuration saved successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update configuration');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Store Settings & Access Control</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage staff credentials, role-based authorization, tax rates, and receipt formatting
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: User Management & Create User (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Create User Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Provision Employee Account</h2>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              {userError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {userError}
                </div>
              )}
              {userSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Role & Permissions <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="staff">Staff / Cashier (POS checkout & inventory lookups)</option>
                    <option value="admin">Admin / Manager (Full system & financial access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. ramesh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg lowercase focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ramesh@apexretail.local"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg lowercase focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 12 characters"
                    minLength={12}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>

          {/* User Directory Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-900">Authorized System Users</h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {users.length} active / registered accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-left font-medium">
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Username</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u, index) => {
                    const uniqueKey = u.id || (u as any)._id || u.username || `user-${index}`;
                    return (
                      <tr key={uniqueKey} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{u.username}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] font-semibold ${
                            u.role === 'admin' ? 'text-blue-700' : 'text-slate-700'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-medium ${
                            u.isActive ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title={u.isActive ? 'Deactivate account' : 'Reactivate account'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Store Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Store & Receipt Configuration Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Store & Receipt Configuration</h2>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 text-xs">
              {configSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{configSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Store / Business Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Store Address (on Invoices)</label>
                <textarea
                  rows={2}
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">GSTIN / Tax Identification</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-900 uppercase"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Standard GST / Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Store Config</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
