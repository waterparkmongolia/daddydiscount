import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { Search, Plus, ThumbsUp, Heart, Star, X, Share2, UserPlus, CheckCircle2, User, LogOut, UserCheck, Crown, Shield, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Users as UsersIcon, Clock, AlertCircle } from 'lucide-react';
import { Member, RegisteredUser, MembershipTier } from './types';

const ADMIN_PASSWORD = 'admin2024';

const MEMBERSHIP_TIERS: { tier: MembershipTier; label: string; amount: number; color: string; bg: string }[] = [
  { tier: 'bronze',  label: 'Bronze',  amount: 1000,  color: 'text-amber-700',  bg: 'bg-amber-100 border-amber-300' },
  { tier: 'silver',  label: 'Silver',  amount: 5000,  color: 'text-slate-500',  bg: 'bg-slate-100 border-slate-300' },
  { tier: 'gold',    label: 'Gold',    amount: 10000, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300' },
  { tier: 'diamond', label: 'Diamond', amount: 20000, color: 'text-blue-500',   bg: 'bg-blue-50 border-blue-300' },
  { tier: 'vip',     label: 'VIP',     amount: 50000, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-300' },
];

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'profile'>('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [expiryOption, setExpiryOption] = useState<'24h' | 'extra' | 'infinite'>('24h');
  const [extraDays, setExtraDays] = useState('0');
  
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regInvitedBy, setRegInvitedBy] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [superSupportId, setSuperSupportId] = useState<string | null>(null);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [superAmount, setSuperAmount] = useState('');
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [tick, setTick] = useState(0);

  // Follow / Membership / Admin
  const [membershipTargetId, setMembershipTargetId] = useState<string | null>(null);
  const [adminTargetId, setAdminTargetId] = useState<string | null>(null);
  const [adminInput, setAdminInput] = useState('');
  const [adminUnlockedId, setAdminUnlockedId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [qpayInvoice, setQpayInvoice] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{
    type: 'support' | 'register' | 'add_member' | 'membership';
    amount: number;
    data: any;
  } | null>(null);

  // Migration for old data
  useEffect(() => {
    const savedMembers = localStorage.getItem('members');
    const savedRegUsers = localStorage.getItem('registeredUsers');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      setIsUserRegistered(true);
    }

    if (savedRegUsers) {
      setRegisteredUsers(JSON.parse(savedRegUsers));
    }

    if (savedMembers) {
      const parsed = JSON.parse(savedMembers);
      // Migration for old data
      const migrated = parsed.map((m: any) => ({
        ...m,
        shares: m.shares ?? 0,
        invites: m.invites ?? 0,
        goal: m.goal ?? 0,
        expiresAt: m.expiresAt ?? null,
        basicSupports: m.basicSupports ?? (m.supports ? (m.supports % 1000 === 0 ? m.supports : 0) : 0),
        superSupports: m.superSupports ?? (m.supports ? (m.supports % 1000 !== 0 ? m.supports : 0) : 0),
        likedBy: m.likedBy ?? [],
        sharedBy: m.sharedBy ?? [],
        followers: m.followers ?? [],
        listingPaid: m.listingPaid ?? false,
        contributions: m.contributions ?? [],
      }));
      setMembers(migrated);
    } else {
      // Sample data
      const initial: Member[] = [
        {
          id: '1',
          name: 'Хэрэглэгч №1',
          phone: '99110022',
          goal: 1000000,
          likes: 5,
          shares: 2,
          invites: 0,
          basicSupports: 2000,
          superSupports: 10000,
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000,
          likedBy: [], sharedBy: [], followers: [], listingPaid: false, contributions: [],
        },
        {
            id: '2', name: 'Галт Баатар', phone: '88001122', goal: 20000000,
            likes: 12, shares: 10, invites: 0, basicSupports: 5000, superSupports: 150000,
            createdAt: Date.now() - 10000, expiresAt: null,
            likedBy: [], sharedBy: [], followers: [], listingPaid: true, contributions: [],
          }
      ];
      setMembers(initial);
      localStorage.setItem('members', JSON.stringify(initial));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (members.length > 0) {
      localStorage.setItem('members', JSON.stringify(members));
    }
  }, [members]);

  useEffect(() => {
    if (registeredUsers.length > 0) {
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    }
  }, [registeredUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      setIsUserRegistered(true);
    } else {
      localStorage.removeItem('currentUser');
      setIsUserRegistered(false);
    }
  }, [currentUser]);

  // Real-time countdown — re-renders every second
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeLeft = (expiresAt: number | null): string => {
    if (expiresAt === null) return '∞';
    const diff = expiresAt - Date.now();
    if (diff <= 0) return '00 цаг 00 мин 00 сек';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')} цаг ${String(m).padStart(2, '0')} мин ${String(s).padStart(2, '0')} сек`;
  };

  const getTimeLeftPercent = (member: Member): number => {
    if (!member.expiresAt) return 100;
    const total = member.expiresAt - member.createdAt;
    const remaining = member.expiresAt - Date.now();
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  };

  const getTimerColor = (percent: number) => {
    if (percent > 50) return { bar: 'bg-emerald-500', text: 'text-emerald-600', glow: 'shadow-[0_0_8px_rgba(16,185,129,0.4)]' };
    if (percent > 20) return { bar: 'bg-amber-500', text: 'text-amber-600', glow: 'shadow-[0_0_8px_rgba(245,158,11,0.4)]' };
    return { bar: 'bg-red-500', text: 'text-red-600', glow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]' };
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery);
      const isNotExpired = m.expiresAt === null || m.expiresAt > Date.now();
      return matchesSearch && isNotExpired;
    }).sort((a, b) => {
      if (a.listingPaid !== b.listingPaid) return a.listingPaid ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  // tick ensures expired members are filtered out in real-time
  }, [members, searchQuery, tick]);

  const handleAddMember = (e: FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    let expiry: number | null = null;
    const now = Date.now();
    if (expiryOption === '24h') {
        expiry = now + 86400000;
    } else if (expiryOption === 'extra') {
        expiry = now + 86400000 + (parseInt(extraDays) * 86400000);
    } else if (expiryOption === 'infinite') {
        expiry = null;
    }

    const price = expiryOption === '24h' ? 0 : (expiryOption === 'infinite' ? (parseInt(newGoal) * 0.5) : parseInt(extraDays) * 1000);

    const newMemberData = {
      name: newName,
      phone: newPhone.replace(/\D/g, ''),
      goal: parseInt(newGoal) || 0,
      createdAt: now,
      expiresAt: expiry,
      listingPaid: price > 0,
    };

    if (price > 0) {
      initiatePayment('add_member', price, newMemberData);
    } else {
      finalizeAddMember(newMemberData);
    }
  };

  const finalizeAddMember = (data: any) => {
    const newMember: Member = {
      id: crypto.randomUUID(),
      ...data,
      likes: 0,
      shares: 0,
      invites: 0,
      basicSupports: 0,
      superSupports: 0,
      likedBy: [],
      sharedBy: [],
      followers: [],
      listingPaid: data.listingPaid ?? false,
      contributions: [],
    };

    setMembers([newMember, ...members]);
    setNewName('');
    setNewPhone('');
    setNewGoal('');
    setExpiryOption('24h');
    setExtraDays('0');
    setIsModalOpen(false);
  };

  const handleActionGuard = (callback: () => void) => {
    if (!currentUser) {
      alert("Энэ үйлдлийг хийхийн тулд та заавал бүртгүүлсэн байх шаардлагатай.");
      setActiveTab('users');
      return;
    }
    callback();
  };

  const handleLike = (id: string) => {
    handleActionGuard(() => {
      if (!currentUser) return;
      
      setMembers(prev => prev.map(m => {
        if (m.id === id) {
          const likedBy = m.likedBy || [];
          const hasLiked = likedBy.includes(currentUser.id);
          
          if (hasLiked) {
            // Unlike
            return {
              ...m,
              likes: Math.max(0, (m.likes || 1) - 1),
              likedBy: likedBy.filter(uid => uid !== currentUser.id)
            };
          } else {
            // Like
            return {
              ...m,
              likes: (m.likes || 0) + 1,
              likedBy: [...likedBy, currentUser.id]
            };
          }
        }
        return m;
      }));
    });
  };

  const initiatePayment = async (type: 'support' | 'register' | 'add_member', amount: number, data: any) => {
    const action = () => {
      setIsProcessingPayment(true);
      setPaymentTarget({ type, amount, data });
      
      const fetchInvoice = async () => {
        try {
          const response = await fetch('/api/qpay/create-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, description: `${type.toUpperCase()} - ${amount}₮` })
          });
          
          const result = await response.json();
          if (result.error) throw new Error(result.error);
          
          setQpayInvoice(result);
        } catch (error: any) {
          console.error('Payment Initiation Error:', error);
          alert("Төлбөрийн системд алдаа гарлаа. Туршилтын горимоор үргэлжлүүлж байна.");
          processSuccessfulPayment(type, amount, data);
          setIsProcessingPayment(false);
          setPaymentTarget(null);
        }
      };
      fetchInvoice();
    };

    if (type === 'support') {
      handleActionGuard(action);
    } else {
      action();
    }
  };

  const processSuccessfulPayment = (type: string, amount: number, data: any) => {
    switch (type) {
      case 'support':
        handleSupport(data.memberId, amount, data.isSuper);
        break;
      case 'register':
        finalizeRegister(data);
        break;
      case 'add_member':
        finalizeAddMember(data);
        break;
      case 'membership':
        finalizeMembership(data.memberId, data.tier);
        break;
    }
  };

  const checkPaymentStatus = async () => {
    if (!qpayInvoice || !paymentTarget) return;

    try {
      const response = await fetch(`/api/qpay/check-payment/${qpayInvoice.invoice_id}`);
      const result = await response.json();
      
      if (result.rows && result.rows.length > 0 && result.rows[0].payment_status === 'PAID') {
        processSuccessfulPayment(paymentTarget.type, paymentTarget.amount, paymentTarget.data);
        setQpayInvoice(null);
        setPaymentTarget(null);
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error('Check Payment Error:', error);
    }
  };

  // Poll for payment
  useEffect(() => {
    let interval: any;
    if (qpayInvoice) {
      interval = setInterval(checkPaymentStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [qpayInvoice]);

  const handleSupport = (id: string, amount: number, isSuper: boolean = false) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== id) return m;
      if (!isSuper) return { ...m, basicSupports: m.basicSupports + amount };

      const contributions = [...(m.contributions || [])];
      if (currentUser) {
        const idx = contributions.findIndex(c => c.userId === currentUser.id);
        if (idx >= 0) {
          contributions[idx] = { ...contributions[idx], amount: contributions[idx].amount + amount };
        } else {
          contributions.push({ userId: currentUser.id, amount });
        }
      }
      return { ...m, superSupports: m.superSupports + amount, contributions };
    }));
  };

  const handleShare = (member: Member) => {
    handleActionGuard(() => {
      if (!currentUser) return;

      const hasShared = (member.sharedBy || []).includes(currentUser.id);

      // We always allow starting the share dialog, but reward only once
      if (!hasShared) {
        setMembers(prev => prev.map(m => m.id === member.id ? { 
            ...m, 
            shares: (m.shares || 0) + 1,
            sharedBy: [...(m.sharedBy || []), currentUser.id]
        } : m));
      }

      const url = window.location.href;
      const text = `${member.name} хэрэглэгчийг Daddy Discounter дээр дэмжээрэй!`;
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
      window.open(facebookUrl, '_blank', 'width=600,height=400');
    });
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    if (!regPhone || !regName) return;
    if (regPassword.length < 6) {
      alert('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      alert('Нууц үг таарахгүй байна. Дахин оруулна уу.');
      return;
    }
    const alreadyExists = registeredUsers.some(u => u.phone.replace(/\D/g, '') === regPhone.replace(/\D/g, ''));
    if (alreadyExists) {
      alert('Энэ дугаар бүртгэлтэй байна. Нэвтэрнэ үү.');
      setAuthMode('login');
      return;
    }

    const data = {
      name: regName,
      phone: regPhone,
      password: regPassword,
      invitedBy: regInvitedBy,
      inviteId: inviteId
    };

    initiatePayment('register', 5000, data);
  };

  const finalizeRegister = (data: any) => {
    const cleanPhone = data.phone.replace(/\D/g, '');
    let cleanInvitedBy = data.invitedBy.replace(/\D/g, '');
    
    // If registered via specific post/invite icon
    if (data.inviteId) {
      const inviter = members.find(m => m.id === data.inviteId);
      if (inviter) cleanInvitedBy = inviter.phone;
    }

    const newUser: RegisteredUser = {
      id: crypto.randomUUID(),
      name: data.name,
      phone: cleanPhone,
      password: data.password || '',
      invitedByPhone: cleanInvitedBy || null,
      createdAt: Date.now(),
    };

    // Update inviter's invite count
    if (cleanInvitedBy) {
      setMembers(prev => prev.map(m => m.phone === cleanInvitedBy ? { ...m, invites: (m.invites || 0) + 1 } : m));
    }

    setRegisteredUsers([newUser, ...registeredUsers]);
    setCurrentUser(newUser);
    
    setRegName('');
    setRegPhone('');
    setRegInvitedBy('');
    setRegPassword('');
    setRegConfirmPassword('');
    setInviteId(null);
    alert("Амжилттай бүртгүүллээ!");
  };

  const handleFollow = (id: string) => {
    handleActionGuard(() => {
      if (!currentUser) return;
      setMembers(prev => prev.map(m => {
        if (m.id !== id) return m;
        const followers = m.followers || [];
        const isFollowing = followers.includes(currentUser.id);
        return { ...m, followers: isFollowing ? followers.filter(f => f !== currentUser.id) : [...followers, currentUser.id] };
      }));
    });
  };

  const finalizeMembership = (memberId: string, tier: MembershipTier) => {
    if (!currentUser) return;
    const updatedUser: RegisteredUser = {
      ...currentUser,
      memberships: [
        ...(currentUser.memberships || []).filter(m => m.memberId !== memberId),
        { memberId, tier },
      ],
    };
    setCurrentUser(updatedUser);
    setRegisteredUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setMembershipTargetId(null);
    alert(`"${tier.charAt(0).toUpperCase() + tier.slice(1)}" гишүүн боллоо!`);
  };

  const startLongPress = (memberId: string) => {
    longPressTimer.current = setTimeout(() => setAdminTargetId(memberId), 600);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    if (adminInput === ADMIN_PASSWORD) {
      setAdminUnlockedId(adminTargetId);
      setAdminInput('');
    } else {
      alert('Нууц үг буруу байна.');
      setAdminInput('');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('posts');
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const clean = loginPhone.replace(/\D/g, '');
    const found = registeredUsers.find(u => u.phone === clean);
    if (!found) {
      alert('Энэ дугаараар бүртгэл олдсонгүй. Эхлээд бүртгүүлнэ үү.');
      setAuthMode('register');
      return;
    }
    if (found.password && found.password !== loginPassword) {
      alert('Нууц үг буруу байна.');
      return;
    }
    setCurrentUser(found);
    setLoginPhone('');
    setLoginPassword('');
    setActiveTab('profile');
  };

  const formatSupport = (amount: number) => {
    if (amount >= 1000) {
      const kValue = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1);
      return `${kValue}K`;
    }
    return `${amount}`;
  };

  const calculateAchievement = (member: Member) => {
    return (
      ((member.likes || 0) * 1) +
      ((member.basicSupports || 0) + (member.superSupports || 0)) +
      ((member.shares || 0) * 100) +
      ((member.invites || 0) * 1000)
    );
  };

  const calculateUserScore = (user: RegisteredUser): number => {
    let score = 0;
    members.forEach(m => {
      if ((m.followers || []).includes(user.id)) score += 1000;
      if ((m.likedBy || []).includes(user.id)) score += 1;
      if ((m.sharedBy || []).includes(user.id)) score += 100;
      const contrib = (m.contributions || []).find(c => c.userId === user.id);
      if (contrib) score += contrib.amount * 2;
    });
    return score;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter text-indigo-600 flex items-center gap-2">
            <Heart className="w-5 h-5 fill-current" />
            Daddy Discounter
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition-all active:scale-95 shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </header>


      {/* Main Content */}
      <main className="flex-1 p-3 md:p-6 pb-24">
        {activeTab === 'posts' ? (
          <div className="max-w-4xl mx-auto grid grid-cols-1 gap-2 pb-20">
            {/* Search bar — only in Posts tab */}
            <div className="relative mb-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Хайх..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm shadow-sm"
              />
            </div>

            <AnimatePresence mode="popLayout">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const isFollowing = (member.followers || []).includes(currentUser?.id || '');
                  const userMembership = (currentUser?.memberships || []).find(m => m.memberId === member.id);
                  const tierInfo = userMembership ? MEMBERSHIP_TIERS.find(t => t.tier === userMembership.tier) : null;

                  return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={member.id}
                    onMouseDown={() => startLongPress(member.id)}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={() => startLongPress(member.id)}
                    onTouchEnd={cancelLongPress}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm relative overflow-hidden select-none"
                  >
                    {/* Free / Paid badge */}
                    <div className={`absolute top-0 left-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-br-lg ${member.listingPaid ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                      {member.listingPaid ? 'Paid' : 'Free'}
                    </div>

                    {/* User Section (Top) */}
                    <div className="space-y-3 mt-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 shrink-0 mt-0.5 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-base">
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800 text-sm leading-none truncate">{member.name}</h3>
                          <p className="text-slate-400 text-[9px] mt-1 flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5" />
                            {(member.followers || []).length} дагагч
                            {tierInfo && (
                              <span className={`ml-1 px-1.5 py-0.5 rounded font-bold text-[8px] border ${tierInfo.bg} ${tierInfo.color}`}>
                                {tierInfo.label}
                              </span>
                            )}
                          </p>
                        </div>
                        {/* Follow button — top right of card */}
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelLongPress(); handleFollow(member.id); }}
                          onMouseDown={e => e.stopPropagation()}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border ${isFollowing ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                        >
                          <UserCheck className="w-3 h-3" />
                          {isFollowing ? 'Дагаж байна' : 'Дагах'}
                        </button>
                      </div>
                      
                      <div className="-mx-3 px-3 py-2.5 bg-slate-50/50 border-y border-slate-100 space-y-1.5">
                        {/* Countdown timer — only for time-limited posts */}
                        {member.expiresAt !== null && (() => {
                          const pct = getTimeLeftPercent(member);
                          const color = getTimerColor(pct);
                          return (
                            <>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-slate-400 font-bold uppercase tracking-wider">Хугацаа -</span>
                                <span className={`font-bold font-mono tabular-nums ${color.text}`}>
                                  {formatTimeLeft(member.expiresAt)}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                                <motion.div
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: 'linear' }}
                                  className={`h-full ${color.bar} ${color.glow}`}
                                />
                              </div>
                            </>
                          );
                        })()}

                        <div className="flex justify-between items-center text-[10px] gap-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0">Биелэлт явц</span>
                          <span className="font-bold text-emerald-600 shrink-0">
                            {Math.min(100, Math.round((calculateAchievement(member) / (member.goal || 1)) * 100))}%
                          </span>
                          <span className="text-slate-300 shrink-0">–</span>
                          <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0">Зорилго</span>
                          <span className="font-bold text-slate-600 truncate">{(member.goal || 0).toLocaleString()}₮</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (calculateAchievement(member) / (member.goal || 1)) * 100)}%` }}
                                className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                            />
                        </div>
                      </div>
                    </div>

                  {/* Actions Section (Bottom) */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-50 pt-1.5 transition-all">
                    {/* Like Action */}
                    <div className="flex items-center gap-1.5 pr-1.5">
                       <button
                        onClick={() => handleLike(member.id)}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 flex items-center justify-center ring-1 ${member.likedBy?.includes(currentUser?.id || '') ? 'bg-blue-600 text-white ring-blue-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 ring-blue-100'}`}
                        title={member.likedBy?.includes(currentUser?.id || '') ? "Unlike" : "Like"}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${member.likedBy?.includes(currentUser?.id || '') ? 'fill-current' : ''}`} />
                      </button>
                      <span className={`text-[11px] font-bold min-w-[16px] ${member.likedBy?.includes(currentUser?.id || '') ? 'text-blue-600' : 'text-slate-500'}`}>{member.likes || 0}</span>
                    </div>
                    
                    {/* Super Support Action (Now Green too as requested) */}
                    <div className="flex items-center gap-1.5 border-l border-slate-100 pl-2 pr-1.5">
                      <button
                        onClick={() => setSuperSupportId(member.id)}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-95 flex items-center justify-center font-black shadow-sm ring-1 ring-emerald-100"
                      >
                        <span className="text-base leading-none drop-shadow-sm">₮</span>
                      </button>
                      <span className="text-[11px] font-bold text-emerald-600 min-w-[24px]">{formatSupport(member.superSupports)}</span>
                    </div>

                    {/* Share Action */}
                    <div className="flex items-center gap-1.5 border-l border-slate-100 pl-2 pr-1.5">
                        <button
                        onClick={() => handleShare(member)}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 flex items-center justify-center ring-1 ${member.sharedBy?.includes(currentUser?.id || '') ? 'bg-slate-600 text-white ring-slate-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 ring-slate-100'}`}
                        title="Share on Facebook"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-[11px] font-bold min-w-[16px] ${member.sharedBy?.includes(currentUser?.id || '') ? 'text-slate-600' : 'text-slate-400'}`}>{member.shares || 0}</span>
                    </div>

                    {/* Membership Action */}
                    <div className="flex items-center gap-1.5 border-l border-slate-100 pl-2">
                      <button
                        onClick={() => handleActionGuard(() => setMembershipTargetId(member.id))}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 flex items-center justify-center ring-1 ${tierInfo ? `${tierInfo.bg} ${tierInfo.color} ring-current` : 'bg-slate-50 text-slate-400 hover:bg-yellow-50 hover:text-yellow-600 ring-slate-100'}`}
                        title="Гишүүнчлэл"
                      >
                        <Crown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
                );})
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl py-12 flex flex-col items-center justify-center opacity-40">
                <Search className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-400 text-xs font-bold uppercase italic">Хэрэглэгч байхгүй</p>
              </div>
            )}
          </AnimatePresence>
        </div>
        ) : activeTab === 'users' ? (
          <div className="max-w-4xl mx-auto space-y-4 pb-20">
            {/* Login / Register prompt */}
            {!currentUser && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-indigo-800">Нэвтрэх / Бүртгүүлэх</p>
                  <p className="text-[10px] text-indigo-400 mt-0.5">Дэмжлэгийн оноо хянах, үйлдэл хийхийн тулд нэвтэрнэ үү</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setAuthMode('login'); setActiveTab('profile'); }}
                    className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg font-bold text-xs border border-indigo-200 hover:bg-indigo-100 transition-all active:scale-95"
                  >
                    Нэвтрэх
                  </button>
                  <button
                    onClick={() => { setAuthMode('register'); setActiveTab('profile'); }}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Бүртгүүлэх
                  </button>
                </div>
              </div>
            )}

            {/* Top 3 Ranking */}
            {registeredUsers.length > 0 && (() => {
              const MEDAL = [
                { label: '1', bg: 'bg-yellow-400', cardBg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
                { label: '2', bg: 'bg-slate-400',  cardBg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-500'  },
                { label: '3', bg: 'bg-amber-600',  cardBg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  },
              ];
              const top3 = [...registeredUsers]
                .map(user => ({ user, score: calculateUserScore(user) }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
              return (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-yellow-50 to-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      Шилдэг Дэмжигчид
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Дэмжлэгийн оноо</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {top3.map(({ user, score }, idx) => {
                      const m = MEDAL[idx];
                      return (
                        <div key={user.id} className={`px-5 py-3.5 flex items-center gap-3 ${m.cardBg}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-white text-xs shrink-0 ${m.bg}`}>
                            {m.label}
                          </div>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm uppercase border ${m.border} ${m.text} bg-white shrink-0`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-800 leading-none truncate">{user.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{user.phone}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${m.text}`}>{score.toLocaleString()}₮</p>
                            <p className="text-[8px] text-slate-400 uppercase tracking-wider">оноо</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Full Users List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-indigo-500" />
                        Бүртгэлтэй хэрэглэгчид
                    </h3>
                    <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full">{registeredUsers.length}</span>
                </div>
                <div className="divide-y divide-slate-50">
                    {registeredUsers.length > 0 ? registeredUsers.map(user => (
                        <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm uppercase group-hover:bg-indigo-100 transition-colors">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 leading-none">{user.name}</h4>
                                    <p className="text-[10px] text-slate-400 mt-1.5 font-mono">{user.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {user.invitedByPhone && (
                                    <div className="text-[9px] text-slate-400 flex flex-col items-end gap-0.5">
                                        <span className="uppercase font-bold text-[8px] tracking-widest text-slate-300">Урьсан:</span>
                                        <div className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">
                                          {user.invitedByPhone}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                            <UsersIcon className="w-12 h-12 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest mt-4">Бүртгэлтэй хэрэглэгч алга</p>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto space-y-6 pb-20 px-4">
             {currentUser ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-br from-indigo-500 to-indigo-600" />
                  <div className="relative pt-4">
                    <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg border-2 border-white mb-3">
                        <span className="text-xl font-black text-indigo-600 uppercase">
                          {currentUser.name.charAt(0)}
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">{currentUser.name}</h2>
                    <p className="text-slate-400 font-mono text-[10px] mt-0.5">{currentUser.phone}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Урилга</p>
                        <p className="text-lg font-black text-indigo-600">
                          {members.find(m => m.phone === currentUser.phone)?.invites || 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Бүртгүүлсэн</p>
                        <p className="text-[10px] font-bold text-slate-600">
                          {new Date(currentUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button 
                      id="logout-button"
                      onClick={handleLogout}
                      className="mt-6 w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      ГАРАХ
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm"
              >
                {/* Toggle */}
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6">
                  <button
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'login' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    НЭВТРЭХ
                  </button>
                  <button
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === 'register' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    БҮРТГҮҮЛЭХ
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {authMode === 'login' ? (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={handleLogin}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Утасны дугаар</label>
                        <input
                          required
                          type="tel"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="9999XXXX"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Нууц үг</label>
                        <input
                          required
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="••••••"
                        />
                      </div>
                      <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">
                        НЭВТРЭХ
                      </button>
                      <p className="text-center text-[10px] text-slate-400">
                        Бүртгэлгүй бол{' '}
                        <button type="button" onClick={() => setAuthMode('register')} className="text-indigo-500 font-bold underline">
                          бүртгүүлнэ үү
                        </button>
                      </p>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Нэр</label>
                          <input
                            required
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Таны нэр"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Утас</label>
                          <input
                            required
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="9999XXXX"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Урьсан хүний утас</label>
                          <input
                            value={regInvitedBy}
                            onChange={(e) => setRegInvitedBy(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="9911XXXX"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Нууц үг</label>
                          <input
                            required
                            type="password"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="••••••"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Нууц үг давтах</label>
                          <input
                            required
                            type="password"
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className={`w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${regConfirmPassword && regPassword !== regConfirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                            placeholder="••••••"
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100">
                        <div className="text-xs text-indigo-600 font-medium italic">Бүртгэлийн хураамж: 5,000₮</div>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all">
                          БҮРТГҮҮЛЭХ
                        </button>
                      </div>
                      <p className="text-center text-[10px] text-slate-400">
                        Бүртгэлтэй бол{' '}
                        <button type="button" onClick={() => setAuthMode('login')} className="text-indigo-500 font-bold underline">
                          нэвтэрнэ үү
                        </button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 pb-8 md:pb-3 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`group flex flex-col items-center gap-1 transition-all ${activeTab === 'posts' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'posts' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'posts' ? 'opacity-100' : 'opacity-40'}`}>Самбар</span>
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`group flex flex-col items-center gap-1 transition-all ${activeTab === 'users' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
           <div className={`p-1 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <UsersIcon className="w-5 h-5" />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'users' ? 'opacity-100' : 'opacity-40'}`}>Хэрэглэгчид</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`group flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
           <div className={`p-1 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-indigo-50' : 'bg-transparent'}`}>
            <User className="w-5 h-5" />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === 'profile' ? 'opacity-100' : 'opacity-40'}`}>Profile</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="px-6 py-4 bg-slate-100 border-t border-slate-200 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Daddy Discounter</p>
      </footer>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">New Post</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Нэр</label>
                  <input
                    required
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Бат-Эрдэнэ"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Дугаар</label>
                  <input
                    required
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="9911-XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Зорилго (₮)</label>
                  <input
                    required
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm font-bold text-slate-700"
                    placeholder="20,000,000"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Хугацаа Сонгох</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                        type="button"
                        onClick={() => setExpiryOption('24h')}
                        className={`group flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${expiryOption === '24h' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-100'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${expiryOption === '24h' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-700">24 Цаг</p>
                                <p className="text-[9px] text-slate-400">Үнэгүй байршина</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100 uppercase">Үнэгүй</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setExpiryOption('extra')}
                        className={`group flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${expiryOption === 'extra' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-100'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${expiryOption === 'extra' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                                <Plus className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-700">Нэмэлт хугацаа</p>
                                <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="number"
                                        value={extraDays}
                                        onChange={(e) => setExtraDays(e.target.value)}
                                        className="w-12 px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold outline-none focus:border-indigo-300"
                                        placeholder="Өдөр"
                                    />
                                    <span className="text-[9px] text-slate-400">хоног нэмэх</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="text-xs font-black text-emerald-500">{(parseInt(extraDays) || 0) * 1000}₮</span>
                            <span className="text-[8px] text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded uppercase font-bold mt-1">1к / 24ц</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setExpiryOption('infinite')}
                        className={`group flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${expiryOption === 'infinite' ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100' : 'bg-slate-50 border-slate-100'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${expiryOption === 'infinite' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'}`}>
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-700">Хугацаагүй</p>
                                <p className="text-[9px] text-slate-400">Биелэх хүртэл</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100 uppercase tracking-tighter">
                            {newGoal ? (parseInt(newGoal) * 0.5).toLocaleString() : '...'}₮
                        </span>
                    </button>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Нийт төлбөр</span>
                    <span className="text-lg font-black text-slate-800 ml-1">
                      {(expiryOption === '24h' ? 0 : (expiryOption === 'infinite' ? (parseInt(newGoal || '0') * 0.5) : parseInt(extraDays || '0') * 1000)).toLocaleString()}₮
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                  >
                    БАТЛАХ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invite/Registration Modal */}
      <AnimatePresence>
        {inviteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInviteId(null)}
              className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-indigo-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-indigo-600" />
                    Бүртгүүлэх
                </h2>
                <button onClick={() => setInviteId(null)} className="p-2 hover:bg-indigo-50 rounded-lg">
                  <X className="w-5 h-5 text-indigo-400" />
                </button>
              </div>
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Нэр</label>
                        <input
                            required
                            type="text"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            placeholder="Таны нэр"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Утасны Дугаар</label>
                        <input
                            required
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            placeholder="9999-XXXX"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Урьсан хүний утас (Доорх хүн)</label>
                        <input
                            type="tel"
                            value={inviteId ? (members.find(m => m.id === inviteId)?.phone || regInvitedBy) : regInvitedBy}
                            onChange={(e) => setRegInvitedBy(e.target.value)}
                            disabled={!!inviteId}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-500 font-bold"
                            placeholder="9911-XXXX"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Нууц үг</label>
                            <input
                                required
                                type="password"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                placeholder="••••••"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Нууц үг давтах</label>
                            <input
                                required
                                type="password"
                                value={regConfirmPassword}
                                onChange={(e) => setRegConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${regConfirmPassword && regPassword !== regConfirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                placeholder="••••••"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Бүртгэлийн хураамж</span>
                            <span className="text-xs text-emerald-600 opacity-70 italic font-medium">Шууд төлөгдөнө</span>
                        </div>
                        <span className="text-xl font-black text-emerald-700">5,000₮</span>
                    </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                >
                  БҮРТГҮҮЛЭХ
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Super Support Modal */}
      <AnimatePresence>
        {superSupportId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuperSupportId(null)}
              className="absolute inset-0 bg-amber-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl border-4 border-amber-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                    Super Support
                </h2>
                <button onClick={() => setSuperSupportId(null)} className="p-2 hover:bg-amber-50 rounded-lg">
                  <X className="w-5 h-5 text-amber-400" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="relative">
                   <input
                    autoFocus
                    type="number"
                    value={superAmount}
                    onChange={(e) => setSuperAmount(e.target.value)}
                    className="w-full px-4 py-6 text-4xl font-extralight bg-amber-50 border border-amber-100 rounded-xl text-center focus:ring-2 focus:ring-amber-500 outline-none transition-all text-amber-900"
                    placeholder="0"
                  />
                  <span className="absolute right-4 bottom-2 text-amber-400 font-bold text-2xl group-focus-within:text-amber-600 transition-colors">₮</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[5000, 10000, 50000].map(val => (
                    <button
                      key={val}
                      onClick={() => setSuperAmount(val.toString())}
                      className="py-2 text-[10px] border border-amber-100 bg-amber-50 hover:bg-amber-600 hover:text-white rounded-lg font-bold transition-all uppercase tracking-tighter"
                    >
                      {val.toLocaleString()}₮
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (superAmount && superSupportId) {
                      initiatePayment('support', parseInt(superAmount), { memberId: superSupportId, isSuper: true });
                      setSuperAmount('');
                      setSuperSupportId(null);
                    }
                  }}
                  className="w-full py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 active:scale-95"
                >
                  ДЭМЖИХ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Modal */}
      <AnimatePresence>
        {adminTargetId && (() => {
          const member = members.find(m => m.id === adminTargetId);
          const isUnlocked = adminUnlockedId === adminTargetId;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setAdminTargetId(null); setAdminUnlockedId(null); setAdminInput(''); }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-500" /> Админ харагдац
                  </h2>
                  <button onClick={() => { setAdminTargetId(null); setAdminUnlockedId(null); setAdminInput(''); }}
                    className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                {isUnlocked ? (
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Нэр</p>
                      <p className="font-bold text-slate-800">{member?.name}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Утас</p>
                      <p className="font-mono font-bold text-slate-800">{member?.phone}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Нэмсэн огноо</p>
                      <p className="font-bold text-slate-600">{member ? new Date(member.createdAt).toLocaleString() : ''}</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Админ нууц үг</label>
                      <input autoFocus type="password" value={adminInput} onChange={e => setAdminInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••" />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">
                      <Lock className="w-4 h-4 inline mr-1.5" />НЭВТРЭХ
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Membership Modal */}
      <AnimatePresence>
        {membershipTargetId && (() => {
          const member = members.find(m => m.id === membershipTargetId);
          const userMembership = (currentUser?.memberships || []).find(m => m.memberId === membershipTargetId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMembershipTargetId(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <Crown className="w-6 h-6 mb-1 text-yellow-300" />
                      <h3 className="text-lg font-bold">Гишүүнчлэл</h3>
                      <p className="text-indigo-200 text-xs mt-0.5">{member?.name}</p>
                    </div>
                    <button onClick={() => setMembershipTargetId(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-indigo-100 mt-3 leading-relaxed">
                    Нэг удаа төлөхөд насан туршийн гишүүн болно. Сар болгон төлөх шаардлагагүй.
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  {MEMBERSHIP_TIERS.map(t => {
                    const isCurrent = userMembership?.tier === t.tier;
                    return (
                      <button key={t.tier} onClick={() => {
                        if (!isCurrent) {
                          const amounts: Record<MembershipTier, number> = { bronze: 1000, silver: 5000, gold: 10000, diamond: 20000, vip: 50000 };
                          initiatePayment('membership', amounts[t.tier], { memberId: membershipTargetId, tier: t.tier });
                          setMembershipTargetId(null);
                        }
                      }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isCurrent ? `${t.bg} ${t.color} font-black` : 'bg-slate-50 border-slate-100 hover:border-slate-300 text-slate-700'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Crown className={`w-4 h-4 ${isCurrent ? t.color : 'text-slate-300'}`} />
                          <span className="font-bold text-sm">{t.label}</span>
                          {isCurrent && <span className="text-[9px] font-black uppercase tracking-widest bg-white/60 px-1.5 py-0.5 rounded">Одоогийн</span>}
                        </div>
                        <span className={`font-black text-sm ${isCurrent ? t.color : 'text-slate-500'}`}>
                          {t.amount.toLocaleString()}₮
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* QPay Payment Modal */}
      <AnimatePresence>
        {qpayInvoice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-[280px] bg-white rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="bg-blue-600 p-4 text-white text-center">
                <div className="w-10 h-10 bg-white rounded-xl mx-auto flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-xl font-black text-blue-600 italic">q</span>
                </div>
                <h3 className="text-lg font-bold">QPay Төлбөр</h3>
                <p className="text-blue-100 text-xs">{paymentTarget?.amount.toLocaleString()}₮ төлөх</p>
              </div>
              
              <div className="p-4 flex flex-col items-center">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 mb-4">
                    {/* QPay usually provides a QR image source in data.qr_image */}
                    <img 
                      src={`data:image/png;base64,${qpayInvoice.qr_image}`} 
                      alt="QPay QR" 
                      className="w-32 h-32"
                      referrerPolicy="no-referrer"
                    />
                </div>
                
                <p className="text-[9px] text-slate-400 text-center mb-4 px-2">
                    QR уншуулж эсвэл банкны апп сонгоно уу.
                </p>

                <div className="grid grid-cols-2 gap-2 w-full max-h-[160px] overflow-y-auto no-scrollbar pr-1">
                    {qpayInvoice.urls?.map((bank: any) => (
                        <div
                            key={bank.name}
                            onClick={() => window.open(bank.link, '_blank')}
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-blue-50 transition-colors border border-slate-100 cursor-pointer group"
                        >
                            <img src={bank.logo} alt={bank.description} className="w-6 h-6 rounded-md shadow-sm group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                            <span className="text-[9px] font-bold text-slate-600 truncate">{bank.description}</span>
                        </div>
                    ))}
                </div>
              </div>
              
              <button 
                onClick={() => {
                    setQpayInvoice(null);
                    setPaymentTarget(null);
                    setIsProcessingPayment(false);
                }}
                className="w-full py-3 bg-slate-50 text-slate-400 text-xs font-bold hover:bg-slate-100 transition-colors border-t border-slate-100"
              >
                БОЛИХ
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
