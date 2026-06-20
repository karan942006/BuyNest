import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, AlertCircle, Send, CheckCircle, Clock, Plus, Inbox, FileText, ArrowLeft, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

export const Support: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // New ticket state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketDesc, setNewTicketDesc] = useState<string>('');
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  
  // Chat input
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/tickets');
      if (res.data.success) {
        setTickets(res.data.data);
        if (res.data.data.length > 0 && !selectedTicket) {
          setSelectedTicket(res.data.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const res = await api.get(`/support/tickets/${ticketId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load chat history');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    // Scroll to bottom of message list on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDesc.trim()) {
      toast.error('Please fill in the subject and description');
      return;
    }

    setCreatingTicket(true);
    try {
      const res = await api.post('/support/tickets', {
        subject: newTicketSubject,
        description: newTicketDesc,
        priority: newTicketPriority,
      });

      if (res.data.success) {
        toast.success('Support ticket created successfully!');
        const freshTicket = res.data.data;
        setTickets((prev) => [freshTicket, ...prev]);
        setSelectedTicket(freshTicket);
        setShowCreateModal(false);
        setNewTicketSubject('');
        setNewTicketDesc('');
        setNewTicketPriority('medium');
      }
    } catch (err) {
      toast.error('Failed to submit ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    setSendingReply(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        message: replyMessage,
      });

      if (res.data.success) {
        const newMsg = res.data.data;
        setMessages((prev) => [...prev, newMsg]);
        setReplyMessage('');
      }
    } catch (err) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-info/10 text-info';
      case 'in_progress':
        return 'bg-warning/10 text-warning';
      case 'resolved':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted/10 text-muted';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'text-danger bg-danger/5';
      case 'medium':
        return 'text-warning bg-warning/5';
      default:
        return 'text-success bg-success/5';
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-secondary dark:bg-dark text-text dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
            <p className="text-xs text-muted mt-1">Speak with our premium support team or file complaints.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} variant="primary" className="flex items-center gap-1.5 font-bold">
            <Plus className="w-4 h-4" /> Create Ticket
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
          
          {/* Ticket Listing Pane */}
          <div className="lg:col-span-1 bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl p-4 overflow-y-auto flex flex-col shadow-premium">
            <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-4 px-2">Your Tickets</h3>

            {loading ? (
              <div className="flex-1 flex flex-col justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center py-20 text-center px-4">
                <Inbox className="w-10 h-10 text-muted mb-4" />
                <p className="text-sm font-semibold text-muted">No support tickets</p>
                <p className="text-xs text-muted mt-1">Need help? Create a ticket to query about orders or payments.</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 rounded-xl cursor-pointer border transition-all text-left relative ${
                      selectedTicket?.id === ticket.id
                        ? 'border-accent bg-accent/5'
                        : 'border-border dark:border-border/10 hover:bg-slate-50/50 dark:hover:bg-dark-light'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusStyle(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm truncate">{ticket.subject}</h4>
                    <p className="text-xs text-muted mt-1 truncate">{ticket.description}</p>
                    <span className="text-[10px] text-muted block mt-2">
                      {new Date(ticket.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Messages Pane */}
          <div className="lg:col-span-2 bg-white dark:bg-dark/40 dark:border-border/10 border border-border rounded-2xl overflow-hidden flex flex-col shadow-premium">
            {selectedTicket ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-border dark:border-border/10 bg-slate-50/50 dark:bg-dark/20 flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-base truncate">{selectedTicket.subject}</h2>
                    <span className="text-xs text-muted mt-0.5 block">
                      Opened on {new Date(selectedTicket.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${getStatusStyle(selectedTicket.status)}`}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === selectedTicket.user_id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl p-4 ${
                            isMe
                              ? 'bg-accent text-white rounded-tr-none'
                              : 'bg-secondary dark:bg-dark border border-border dark:border-border/10 rounded-tl-none'
                          }`}>
                            {!isMe && (
                              <p className="text-[10px] font-bold text-accent uppercase tracking-wide mb-1">
                                {msg.sender?.full_name || 'Agent'} ({msg.sender?.role || 'Support'})
                              </p>
                            )}
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-line">{msg.message}</p>
                            <span className={`text-[9px] block mt-1.5 ${isMe ? 'text-white/60' : 'text-muted'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendReply} className="px-6 py-4 border-t border-border dark:border-border/10 bg-slate-50/50 dark:bg-dark/20 flex gap-4">
                  <input
                    type="text"
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    disabled={selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border dark:border-border/10 text-sm font-medium outline-none bg-white dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-55"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={sendingReply || selectedTicket.status === 'closed' || selectedTicket.status === 'resolved'}
                    className="flex items-center justify-center p-2.5 rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6">
                <MessageSquare className="w-12 h-12 text-muted mb-4" />
                <h3 className="font-bold text-lg">No Ticket Selected</h3>
                <p className="text-sm text-muted mt-1 max-w-sm">
                  Please select a support ticket from the list to view its conversation history or open a new one.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark border border-border dark:border-border/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden"
            >
              <h2 className="text-xl font-bold mb-6">Create Support Ticket</h2>
              
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <Input
                  label="Subject *"
                  placeholder="Summarize your issue (e.g. Broken item received)"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  required
                />
                
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Description *
                  </label>
                  <textarea
                    placeholder="Provide details about the issue..."
                    value={newTicketDesc}
                    onChange={(e) => setNewTicketDesc(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-border dark:border-border/10 rounded-lg text-sm font-medium outline-none bg-secondary dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                      Priority Level
                    </label>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value as any)}
                      className="w-full px-4 py-2.5 border border-border dark:border-border/10 rounded-lg text-sm font-medium outline-none bg-secondary dark:bg-dark focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-6 border-t border-border dark:border-border/10">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={creatingTicket}>
                    {creatingTicket ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Support;
