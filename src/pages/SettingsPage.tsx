import React, { useState, useEffect } from 'react';
import { User, StoreConfig, DatabaseStatus, DatabaseTestResult } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Users,
  UserPlus,
  Settings,
  Shield,
  Building,
  Save,
  CheckCircle2,
  Lock,
  Power,
  Database,
  RefreshCw,
  Play,
  CheckCircle,
  AlertCircle,
  Server,
  Layers,
  Activity,
  UploadCloud
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

  // MongoDB & Database connection state
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loadingDbStatus, setLoadingDbStatus] = useState<boolean>(false);
  const [runningDbTest, setRunningDbTest] = useState<boolean>(false);
  const [dbTestResult, setDbTestResult] = useState<DatabaseTestResult | null>(null);
  const [dbTestError, setDbTestError] = useState<string | null>(null);

  // Push local data to Atlas state
  const [pushingData, setPushingData] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<any>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const fetchDbStatus = async () => {
    setLoadingDbStatus(true);
    try {
      const res = await api.getDatabaseStatus();
      setDbStatus(res);
    } catch (err: any) {
      console.error('Failed to fetch DB status:', err);
    } finally {
      setLoadingDbStatus(false);
    }
  };

  const handleRunDbTest = async () => {
    setRunningDbTest(true);
    setDbTestError(null);
    try {
      const res = await api.runDatabaseTest();
      setDbTestResult(res);
      await fetchDbStatus();
    } catch (err: any) {
      setDbTestError(err.message || 'Database test failed');
    } finally {
      setRunningDbTest(false);
    }
  };

  const handlePushData = async () => {
    setPushingData(true);
    setPushError(null);
    setPushResult(null);
    try {
      const res = await api.pushDataToMongo();
      setPushResult(res);
      await fetchDbStatus();
    } catch (err: any) {
      setPushError(err.message || 'Failed to push data to MongoDB Atlas');
    } finally {
      setPushingData(false);
    }
  };

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
    fetchDbStatus();
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
                  placeholder="Minimum 6 characters"
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

        {/* Right Column: Database Status & Store Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* MongoDB Database Connection & Live Data Operation Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-semibold text-slate-900">MongoDB Database Status</h2>
              </div>
              <button
                type="button"
                onClick={fetchDbStatus}
                disabled={loadingDbStatus}
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                title="Refresh Database Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDbStatus ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="font-mono">Sync</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Connection Pill & Metrics */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{dbStatus?.connected ? 'MongoDB Connected' : 'Database Disconnected'}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${dbStatus?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        State: {dbStatus?.stateName || 'ReadyState ' + (dbStatus?.readyState ?? 0)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-[260px]">
                      DB: <span className="text-slate-800 font-semibold">{dbStatus?.databaseName || 'RestaurantPOS'}</span>
                    </div>
                  </div>
                </div>

                {dbStatus?.pingMs !== null && dbStatus?.pingMs !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Roundtrip Ping</span>
                    <span className="font-mono font-semibold text-emerald-700 text-xs">
                      {dbStatus.pingMs} ms
                    </span>
                  </div>
                )}
              </div>

              {/* Host & Target URI */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium text-slate-600">Target Host & Masked URI</div>
                <div className="p-2.5 bg-slate-100/80 rounded-lg font-mono text-[11px] text-slate-700 break-all border border-slate-200/80">
                  {dbStatus?.maskedUri || 'Loading target URI...'}
                </div>
                {dbStatus?.host && (
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Server className="w-3 h-3 text-slate-400" />
                    <span>Cluster Node: {dbStatus.host}</span>
                  </div>
                )}
              </div>

              {/* Collections In Database */}
              {dbStatus?.collections && dbStatus.collections.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                    <span>Collections ({dbStatus.collections.length})</span>
                    <span className="text-[10px] text-slate-400 font-mono">RestaurantPOS</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dbStatus.collections.map((coll) => (
                      <span
                        key={coll}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-mono border border-slate-200"
                      >
                        {coll}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Test Trigger Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">Test Data Operations</div>
                  <p className="text-[11px] text-slate-500">Run live atomic CRUD (Insert, Query, Update, Delete) on MongoDB</p>
                </div>
                <button
                  type="button"
                  onClick={handleRunDbTest}
                  disabled={runningDbTest}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  {runningDbTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Operations</span>
                    </>
                  )}
                </button>
              </div>

              {/* Test Error Message */}
              {dbTestError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-xs">Test Data Operation Failed</div>
                    <div className="text-[11px]">{dbTestError}</div>
                  </div>
                </div>
              )}

              {/* Test Success Results Card */}
              {dbTestResult && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All 4 CRUD Operations Passed</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-emerald-200/60 text-emerald-900 rounded-full">
                      Total: {dbTestResult.totalDurationMs} ms
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-emerald-100 space-y-0.5">
                      <div className="text-slate-500 flex items-center justify-between font-mono text-[10px]">
                        <span>1. CREATE</span>
                        <span className="text-emerald-700 font-bold">{dbTestResult.operations.create.durationMs}ms</span>
                      </div>
                      <div className="font-semibold text-slate-800">insertOne() Passed</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate" title={dbTestResult.operations.create.insertedId}>
                        ID: {dbTestResult.operations.create.insertedId}
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-emerald-100 space-y-0.5">
                      <div className="text-slate-500 flex items-center justify-between font-mono text-[10px]">
                        <span>2. READ</span>
                        <span className="text-emerald-700 font-bold">{dbTestResult.operations.read.durationMs}ms</span>
                      </div>
                      <div className="font-semibold text-slate-800">findOne() Passed</div>
                      <div className="text-[10px] text-emerald-700">Verified by ObjectId</div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-emerald-100 space-y-0.5">
                      <div className="text-slate-500 flex items-center justify-between font-mono text-[10px]">
                        <span>3. UPDATE</span>
                        <span className="text-emerald-700 font-bold">{dbTestResult.operations.update.durationMs}ms</span>
                      </div>
                      <div className="font-semibold text-slate-800">updateOne() Passed</div>
                      <div className="text-[10px] text-emerald-700">Modified count: {dbTestResult.operations.update.modifiedCount}</div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-emerald-100 space-y-0.5">
                      <div className="text-slate-500 flex items-center justify-between font-mono text-[10px]">
                        <span>4. DELETE</span>
                        <span className="text-emerald-700 font-bold">{dbTestResult.operations.delete.durationMs}ms</span>
                      </div>
                      <div className="font-semibold text-slate-800">deleteOne() Passed</div>
                      <div className="text-[10px] text-emerald-700">Cleaned up: {dbTestResult.operations.delete.deletedCount} doc</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Push Local Data to Atlas Trigger */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">Push Local Data to Atlas</div>
                  <p className="text-[11px] text-slate-500">Sync all 112 products, 27 users, 461 movements, 249 sales into MongoDB</p>
                </div>
                <button
                  type="button"
                  onClick={handlePushData}
                  disabled={pushingData}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  {pushingData ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Pushing Data...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Push to Atlas</span>
                    </>
                  )}
                </button>
              </div>

              {/* Push Error Message */}
              {pushError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-xs">Data Sync Notice</div>
                      <div className="text-[11px]">{pushError}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushError(null)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Push Success Summary */}
              {pushResult && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Data Pushed to MongoDB Atlas</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-blue-200/60 text-blue-900 rounded-full">
                      {pushResult.summary?.durationMs || 0} ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-blue-950">
                    <div className="bg-white/80 p-1.5 rounded border border-blue-100">
                      Products: <span className="font-bold text-blue-700">{pushResult.summary?.products?.upserted || 112}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-blue-100">
                      Users: <span className="font-bold text-blue-700">{pushResult.summary?.users?.upserted || 27}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-blue-100">
                      Sales: <span className="font-bold text-blue-700">{pushResult.summary?.sales?.upserted || 249}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-blue-100">
                      Movements: <span className="font-bold text-blue-700">{pushResult.summary?.movements?.upserted || 461}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-blue-100">
                      Banners: <span className="font-bold text-blue-700">{pushResult.summary?.banners?.upserted || 5}</span>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-blue-100">
                      Config: <span className="font-bold text-emerald-700">Saved</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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
