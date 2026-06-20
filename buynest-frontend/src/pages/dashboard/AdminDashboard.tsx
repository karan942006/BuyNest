import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, ShoppingBag, DollarSign, Store, Check, X, UserMinus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import supabase from '../../services/supabase';
import { Button } from '../../components/ui/Button';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'customer' | 'seller' | 'admin' | 'super_admin' | 'delivery_partner';
  wallet_balance: number;
}

interface SellerApplication {
  id: string;
  store_name: string;
  store_slug: string;
  gstin?: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  created_at: string;
  user?: Profile;
}

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [sellers, setSellers] = useState<SellerApplication[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'moderation'>('users');

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      toast.error('Failed to load user directories');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSellers = async () => {
    setLoadingSellers(true);
    try {
      // Fetch sellers and profiles joining
      const { data, error } = await supabase
        .from('sellers')
        .select('*, user:profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSellers(data || []);
    } catch (err) {
      toast.error('Failed to load seller applications');
    } finally {
      setLoadingSellers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSellers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success(`Role updated successfully to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const handleSellerStatus = async (sellerId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status })
        .eq('id', sellerId);

      if (error) throw error;

      // If approved, update user's profile role to 'seller'
      if (status === 'approved') {
        const sellerObj = sellers.find(s => s.id === sellerId);
        if (sellerObj?.user?.id) {
          await supabase
            .from('profiles')
            .update({ role: 'seller' })
            .eq('id', sellerObj.user.id);
        }
      }

      toast.success(`Seller store has been ${status}`);
      setSellers(prev => prev.map(s => s.id === sellerId ? { ...s, status } : s));
      fetchUsers(); // Refresh roles list
    } catch (err) {
      toast.error('Failed to update seller status');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-accent" /> Control Center
            </h1>
            <p className="text-xs text-muted mt-1">Platform management workspace, user auditing, and vendor vetting.</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border border-border dark:border-border/10 rounded-xl overflow-hidden bg-white dark:bg-dark/40 shadow-sm p-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'users'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text dark:hover:text-white'
              }`}
            >
              Auditing
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'moderation'
                  ? 'bg-accent text-white'
                  : 'text-muted hover:text-text dark:hover:text-white'
              }`}
            >
              Vetting ({sellers.filter(s => s.status === 'pending').length})
            </button>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide">Total Users</p>
              <h3 className="text-2xl font-extrabold mt-1">{users.length}</h3>
            </div>
            <Users className="w-5 h-5 text-accent" />
          </div>

          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide">Active Sellers</p>
              <h3 className="text-2xl font-extrabold mt-1">{sellers.filter(s => s.status === 'approved').length}</h3>
            </div>
            <Store className="w-5 h-5 text-success" />
          </div>

          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide">Pending Sellers</p>
              <h3 className="text-2xl font-extrabold mt-1">{sellers.filter(s => s.status === 'pending').length}</h3>
            </div>
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>

          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-5 shadow-premium flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wide">Platform Volume</p>
              <h3 className="text-2xl font-extrabold mt-1">₹3,72,000</h3>
            </div>
            <DollarSign className="w-5 h-5 text-success" />
          </div>
        </div>

        {/* Content Toggles */}
        {activeTab === 'users' ? (
          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
            <h3 className="font-bold text-lg mb-6">User Auditing & Role Control</h3>

            {loadingUsers ? (
              <div className="py-20 flex justify-center items-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border dark:border-border/10 text-xs font-bold text-muted uppercase tracking-wider">
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Wallet Balance</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4 text-right">Modify Permission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-border/10">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-light transition-all">
                        <td className="py-4 px-4 font-bold text-sm">
                          {u.full_name || 'Guest User'}
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-muted">
                          {u.email}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold">
                          ₹{u.wallet_balance.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            u.role === 'admin' || u.role === 'super_admin'
                              ? 'bg-danger/10 text-danger'
                              : u.role === 'seller'
                              ? 'bg-success/10 text-success'
                              : 'bg-muted/10 text-muted'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="px-3 py-1.5 border border-border dark:border-border/10 rounded-lg text-xs font-bold outline-none bg-secondary dark:bg-dark focus:ring-1 focus:ring-accent"
                          >
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
            <h3 className="font-bold text-lg mb-6">Seller Vetting applications</h3>

            {loadingSellers ? (
              <div className="py-20 flex justify-center items-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : sellers.length === 0 ? (
              <div className="text-center py-20">
                <Store className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-sm font-semibold text-muted">No applications found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border dark:border-border/10 text-xs font-bold text-muted uppercase tracking-wider">
                      <th className="py-3 px-4">Store Profile</th>
                      <th className="py-3 px-4">Owner Name</th>
                      <th className="py-3 px-4">GSTIN Number</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Vetting Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-border/10">
                    {sellers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-dark-light transition-all">
                        <td className="py-4 px-4">
                          <h4 className="font-bold text-sm">{s.store_name}</h4>
                          <p className="text-xs text-muted mt-0.5">{s.store_slug}</p>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-muted">
                          {s.user?.full_name || 'Owner profile link missing'}
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold uppercase font-mono">
                          {s.gstin || 'None provided'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            s.status === 'approved'
                              ? 'bg-success/10 text-success'
                              : s.status === 'pending'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-danger/10 text-danger'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {s.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => handleSellerStatus(s.id, 'approved')}
                                variant="outline"
                                size="sm"
                                className="border-success/30 text-success hover:bg-success/5 px-2.5"
                              >
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button
                                onClick={() => handleSellerStatus(s.id, 'rejected')}
                                variant="outline"
                                size="sm"
                                className="border-danger/30 text-danger hover:bg-danger/5 px-2.5"
                              >
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
