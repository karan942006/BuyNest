import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Plus, DollarSign, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { RootState } from '../../store';
import { updateProfile } from '../../store/slices/authSlice';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  description: string;
  ref_type?: string;
  created_at: string;
}

export const Wallet: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wallet/transactions');
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      toast.error('Failed to load wallet transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(topupAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/wallet/topup', { amount: amountVal });
      if (response.data.success) {
        toast.success(`₹${amountVal} successfully added to wallet!`);
        
        // Update user wallet balance in Redux store
        const newBalance = response.data.data.new_balance;
        dispatch(updateProfile({ wallet_balance: newBalance }));
        
        // Refresh transaction list
        fetchTransactions();
        setTopupAmount('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Topup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (amt: number) => {
    setTopupAmount(amt.toString());
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-bold tracking-tight mb-8">BuyNest Wallet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Balance & Topup Card */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Balance Display */}
            <div className="bg-gradient-to-tr from-accent to-accent-dark text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
                <WalletIcon className="w-64 h-64" />
              </div>

              <div className="flex justify-between items-start mb-12">
                <div>
                  <p className="text-sm font-semibold text-white/70 uppercase tracking-wider">Wallet Balance</p>
                  <h2 className="text-4xl font-extrabold mt-1">
                    ₹{(user?.wallet_balance || 0).toLocaleString('en-IN')}
                  </h2>
                </div>
                <WalletIcon className="w-8 h-8 text-white/80" />
              </div>

              <div className="text-xs text-white/60 font-medium">
                Linked Account: {user?.email}
              </div>
            </div>

            {/* Top-up Form */}
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium">
              <h3 className="font-bold text-lg mb-6">Add Funds</h3>
              
              <form onSubmit={handleTopup} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Enter Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">₹</span>
                    <input
                      type="number"
                      placeholder="Amount to add"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-lg border border-border dark:border-border/10 text-base font-extrabold outline-none bg-secondary dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[100, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickSelect(amt)}
                      className="py-2.5 rounded-lg border border-border dark:border-border/10 text-xs font-extrabold text-muted hover:border-accent hover:text-accent dark:hover:border-accent/40 bg-slate-50 dark:bg-dark-light transition-all"
                    >
                      +₹{amt}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="primary"
                  className="w-full py-3 flex justify-center items-center font-bold text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" /> Top Up Wallet
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-6 shadow-premium h-full min-h-[500px]">
              <h3 className="font-bold text-lg mb-6">Transaction History</h3>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-muted font-medium mt-3">Fetching transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-20">
                  <WalletIcon className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-sm font-semibold text-muted">No transactions yet</p>
                  <p className="text-xs text-muted mt-1">To start adding funds, use the top-up panel.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === 'credit';
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 border border-border dark:border-border/10 rounded-xl hover:bg-secondary/30 dark:hover:bg-dark-light transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isCredit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{tx.description}</h4>
                            <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(tx.created_at).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`font-extrabold text-base ${isCredit ? 'text-success' : 'text-text dark:text-white'}`}>
                            {isCredit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                          </div>
                          <p className="text-[10px] font-semibold text-muted mt-0.5">
                            Balance: ₹{tx.balance.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Wallet;
