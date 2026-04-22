import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { Search, Plus, ThumbsUp, Heart, Star, X, Share2, UserPlus, CheckCircle2, User, LogOut, UserCheck, Crown, Shield, Lock, Eye, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Users as UsersIcon, Clock, AlertCircle } from 'lucide-react';
import { Member, RegisteredUser, MembershipTier, GoalType } from './types';

const ADMIN_PASSWORD = 'admin2024';
const SPECIAL_CODE = 'DADDY2024';

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
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('price');
  const [newDiscount, setNewDiscount] = useState('');
  const [expiryOption, setExpiryOption] = useState<'24h' | 'special' | 'infinite'>('24h');
  const [specialCodeInput, setSpecialCodeInput] = useState('');
  
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

  const [usersSubTab, setUsersSubTab] = useState<'all' | 'top'>('all');
  const [keyModalId, setKeyModalId] = useState<string | null>(null);

  const deviceId = useMemo(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('deviceId', id); }
    return id;
  }, []);

  // Follow / Membership / Admin
  const [membershipTargetId, setMembershipTargetId] = useState<string | null>(null);
  const [adminTargetId, setAdminTargetId] = useState<string | null>(null);
  const [adminInput, setAdminInput] = useState('');
  const [adminUnlockedId, setAdminUnlockedId] = useState<string | null>(null);
  const [addPostAuthOpen, setAddPostAuthOpen] = useState(false);
  const [addPostAuthInput, setAddPostAuthInput] = useState('');
  const [addPostAuthError, setAddPostAuthError] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapCountRef = useRef<Record<string, number>>({});
  const tapTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [likedBurstIds, setLikedBurstIds] = useState<string[]>([]);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string>('');
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
      const parsed = JSON.parse(savedRegUsers);
      setRegisteredUsers(parsed.map((u: any) => ({
        ...u,
        memberships: u.memberships ?? [],
        keys: u.keys ?? [],
      })));
    }

    if (savedMembers) {
      const parsed = JSON.parse(savedMembers);
      // Migration for old data
      const migrated = parsed.map((m: any) => ({
        ...m,
        shares: m.shares ?? 0,
        invites: m.invites ?? 0,
        goal: m.goal ?? 0,
        goalName: m.goalName ?? '',
        expiresAt: m.expiresAt ?? null,
        basicSupports: m.basicSupports ?? (m.supports ? (m.supports % 1000 === 0 ? m.supports : 0) : 0),
        superSupports: m.superSupports ?? (m.supports ? (m.supports % 1000 !== 0 ? m.supports : 0) : 0),
        likedBy: m.likedBy ?? [],
        sharedBy: m.sharedBy ?? [],
        followers: m.followers ?? [],
        listingPaid: m.listingPaid ?? false,
        contributions: m.contributions ?? [],
        views: m.views ?? 0,
        viewedBy: m.viewedBy ?? [],
        goalType: m.goalType ?? 'price',
        discountPct: m.discountPct ?? 0,
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
          goalName: 'Утас авах',
          goalType: 'price' as GoalType,
          likes: 5,
          shares: 2,
          invites: 0,
          basicSupports: 2000,
          superSupports: 10000,
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000,
          likedBy: [], sharedBy: [], followers: [], listingPaid: false, discountPct: 0, contributions: [], views: 0, viewedBy: [],
        },
        {
            id: '2', name: 'Галт Баатар', phone: '88001122', goal: 20000000, goalName: 'Вэбсайт хийлгэх',
            goalType: 'price' as GoalType,
            likes: 12, shares: 10, invites: 0, basicSupports: 5000, superSupports: 150000,
            createdAt: Date.now() - 10000, expiresAt: null,
            likedBy: [], sharedBy: [], followers: [], listingPaid: true, discountPct: 0, contributions: [], views: 0, viewedBy: [],
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

  // Cross-device sync via server
  const syncTimer = useRef<any>(null);
  const localOnlyMode = useRef(false);

  // Load from server on startup (overrides localStorage if server has data)
  useEffect(() => {
    fetch('/api/data/get')
      .then(r => r.json())
      .then(data => {
        if (!data.configured) { localOnlyMode.current = true; return; }
        if (data.members && data.members.length > 0) setMembers(data.members);
        if (data.users && data.users.length > 0) setRegisteredUsers(data.users);
      })
      .catch(() => { localOnlyMode.current = true; });
  }, []);

  // Debounced push members to server on change
  useEffect(() => {
    if (localOnlyMode.current || members.length === 0) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch('/api/data/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'members', value: members }),
      }).catch(() => {});
    }, 1500);
  }, [members]);

  // Debounced push users to server on change
  const userSyncTimer = useRef<any>(null);
  useEffect(() => {
    if (localOnlyMode.current || registeredUsers.length === 0) return;
    clearTimeout(userSyncTimer.current);
    userSyncTimer.current = setTimeout(() => {
      fetch('/api/data/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'users', value: registeredUsers }),
      }).catch(() => {});
    }, 1500);
  }, [registeredUsers]);

  // Real-time countdown — re-renders every second
  useEffect(() => {
    const interval = setInterval(() => setTick((t: number) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Track unique views per device when posts tab is active
  useEffect(() => {
    if (activeTab !== 'posts' || members.length === 0) return;
    setMembers(prev => {
      let changed = false;
      const updated = prev.map(m => {
        if ((m.viewedBy || []).includes(deviceId)) return m;
        changed = true;
        return { ...m, views: (m.views || 0) + 1, viewedBy: [...(m.viewedBy || []), deviceId] };
      });
      return changed ? updated : prev;
    });
  }, [activeTab, deviceId]);

  const formatTimeShort = (expiresAt: number | null): string => {
    if (expiresAt === null) return '';
    const diff = expiresAt - Date.now();
    if (diff <= 0) return '0с';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `${h}ц ${String(m).padStart(2, '0')}м`;
    if (m > 0) return `${m}м ${String(s).padStart(2, '0')}с`;
    return `${s}с`;
  };

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
    if (!newName || !newPhone || !newGoalName) return;

    const now = Date.now();
    let expiry: number | null = null;
    let price = 0;
    let listingPaid = false;

    if (expiryOption === '24h') {
      expiry = now + 86400000;
    } else if (expiryOption === 'special') {
      if (specialCodeInput.trim() !== SPECIAL_CODE) {
        alert('Тусгай код буруу байна.');
        return;
      }
      expiry = null;
    } else if (expiryOption === 'infinite') {
      expiry = null;
      const discPct = Math.min(100, Math.max(0, parseInt(newDiscount) || 0));
      price = (parseInt(newGoal) || 0) * 0.5 * (1 - discPct / 100);
      listingPaid = true;
    }

    const discountPct = expiryOption === 'infinite' ? Math.min(100, Math.max(0, parseInt(newDiscount) || 0)) : 0;

    const newMemberData = {
      name: newName,
      phone: newPhone.replace(/\D/g, ''),
      goal: parseInt(newGoal) || 0,
      goalName: newGoalName,
      goalType: newGoalType,
      discountPct,
      createdAt: now,
      expiresAt: expiry,
      listingPaid,
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
      goalName: data.goalName ?? '',
      goalType: data.goalType ?? 'price',
      discountPct: data.discountPct ?? 0,
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
      views: 0,
      viewedBy: [],
    };

    setMembers(prev => [newMember, ...prev]);
    setNewName('');
    setNewPhone('');
    setNewGoalName('');
    setNewGoal('');
    setNewGoalType('price');
    setNewDiscount('');
    setExpiryOption('24h');
    setSpecialCodeInput('');
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
        setPaymentSuccessMsg(`${amount.toLocaleString()}₮ дэмжлэг амжилттай илгээгдлээ!`);
        break;
      case 'register':
        finalizeRegister(data);
        break;
      case 'add_member':
        finalizeAddMember(data);
        setPaymentSuccessMsg('Таны пост амжилттай нийтлэгдлээ!');
        break;
      case 'membership':
        finalizeMembership(data.memberId, data.tier);
        setPaymentSuccessMsg('Гишүүнчлэл амжилттай идэвхжлээ!');
        break;
    }
  };

  // Refs to avoid stale closure in polling interval
  const qpayInvoiceRef = useRef<any>(null);
  const paymentTargetRef = useRef<any>(null);
  useEffect(() => { qpayInvoiceRef.current = qpayInvoice; }, [qpayInvoice]);
  useEffect(() => { paymentTargetRef.current = paymentTarget; }, [paymentTarget]);

  const [paymentChecking, setPaymentChecking] = useState(false);
  const [lastCheckDebug, setLastCheckDebug] = useState<string>('');

  const checkPaymentStatus = async () => {
    const invoice = qpayInvoiceRef.current;
    const target = paymentTargetRef.current;
    if (!invoice || !target) {
      setLastCheckDebug(`invoice=${!!invoice} target=${!!target}`);
      return;
    }

    try {
      setPaymentChecking(true);
      const invoiceId = invoice.invoice_id;
      const response = await fetch(`/api/qpay/check-payment/${invoiceId}`);
      const result = await response.json();
      setLastCheckDebug(JSON.stringify(result));

      const paid =
        result.count > 0 ||
        (Array.isArray(result.rows) &&
          result.rows.some((r: any) =>
            ['PAID', 'SUCCESS', 'COMPLETE', 'COMPLETED'].includes(r.payment_status)
          ));

      if (paid) {
        processSuccessfulPayment(target.type, target.amount, target.data);
        setQpayInvoice(null);
        setPaymentTarget(null);
        setIsProcessingPayment(false);
        setLastCheckDebug('');
      }
    } catch (error: any) {
      setLastCheckDebug(`Error: ${error.message}`);
    } finally {
      setPaymentChecking(false);
    }
  };

  // Poll for payment every 3s
  useEffect(() => {
    if (!qpayInvoice) return;
    const interval = setInterval(checkPaymentStatus, 3000);
    return () => clearInterval(interval);
  }, [qpayInvoice?.invoice_id]);

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
      memberships: [],
      keys: [{ id: crypto.randomUUID(), type: 'bronze' }],
    };

    // Update inviter's invite count
    if (cleanInvitedBy) {
      setMembers(prev => prev.map(m => m.phone === cleanInvitedBy ? { ...m, invites: (m.invites || 0) + 1 } : m));
    }

    setRegisteredUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    
    setRegName('');
    setRegPhone('');
    setRegInvitedBy('');
    setRegPassword('');
    setRegConfirmPassword('');
    setInviteId(null);
    setPaymentSuccessMsg('Амжилттай бүртгүүллээ!');
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

  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleDoubleTap = (memberId: string) => {
    tapCountRef.current[memberId] = (tapCountRef.current[memberId] || 0) + 1;
    clearTimeout(tapTimerRef.current[memberId]);
    if (tapCountRef.current[memberId] >= 2) {
      tapCountRef.current[memberId] = 0;
      setAdminTargetId(memberId);
    } else {
      tapTimerRef.current[memberId] = setTimeout(() => {
        tapCountRef.current[memberId] = 0;
      }, 400);
    }
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
    if (member.goalType === 'likes') return member.likes || 0;
    if (member.goalType === 'shares') return member.shares || 0;
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
    <div className="min-h-screen max-w-md mx-auto bg-slate-50 font-sans text-slate-900 flex flex-col relative overflow-x-hidden">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 px-3 py-2.5 flex items-center justify-between gap-3">
        <h1 className="text-sm font-black tracking-tight text-indigo-600 flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 fill-current" />
          Daddy Discounter
        </h1>
        <button
          onClick={() => { setAddPostAuthOpen(true); setAddPostAuthInput(''); setAddPostAuthError(false); }}
          className="flex items-center gap-1 bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg font-bold transition-all active:scale-95 shadow-sm text-[11px]"
        >
          <Plus className="w-3 h-3" />
          Пост нэмэх
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
                  const pct = getTimeLeftPercent(member);
                  const timerColor = getTimerColor(pct);
                  const ringC = 2 * Math.PI * 22;

                  return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={member.id}
                    onDoubleClick={() => handleDoubleTap(member.id)}
                    onTouchEnd={() => handleDoubleTap(member.id)}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-3 shadow-sm relative overflow-hidden select-none"
                  >
                    {/* Free / Paid badge */}
                    <div className={`absolute top-0 left-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-br-lg ${member.listingPaid ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                      {member.listingPaid ? 'Paid' : 'Free'}
                    </div>
                    {/* Discount badge */}
                    {(member.discountPct || 0) > 0 && (
                      <div className="absolute top-0 right-0 px-2 py-0.5 text-[8px] font-black tracking-widest rounded-bl-lg bg-rose-500 text-white">
                        -{member.discountPct}%
                      </div>
                    )}

                    {/* User Section (Top) */}
                    <div className="space-y-3 mt-3">
                      <div className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <div className="relative w-12 h-12">
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="24" cy="24" r="22" fill="none" stroke="#e2e8f0" strokeWidth="2.5"/>
                              {member.expiresAt !== null && (
                                <circle cx="24" cy="24" r="22" fill="none"
                                  stroke={pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444'}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeDasharray={ringC}
                                  strokeDashoffset={ringC * (1 - pct / 100)}
                                  style={{ transition: 'stroke-dashoffset 0.8s linear' }}
                                />
                              )}
                            </svg>
                            <div className="absolute inset-1.5 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-sm">
                              {member.name.charAt(0)}
                            </div>
                          </div>
                          {member.expiresAt !== null && (
                            <span className={`text-[7px] font-bold font-mono tabular-nums leading-none ${timerColor.text}`}>
                              {formatTimeShort(member.expiresAt)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-slate-800 text-sm leading-none truncate">{member.name}</h3>
                          <p className="text-slate-400 text-[9px] mt-1 flex items-center gap-1.5">
                            <UserCheck className="w-2.5 h-2.5" />
                            {(member.followers || []).length} дагагч
                            <span className="text-slate-300">·</span>
                            <Eye className="w-2.5 h-2.5" />
                            {(member.views || 0).toLocaleString()} үзэлт
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
                      
                      {(() => {
                        const achievement = calculateAchievement(member);
                        const goal = member.goal || 1;
                        const pctGoal = Math.min(100, Math.round((achievement / goal) * 100));
                        const isLikesGoal = member.goalType === 'likes';
                        const isSharesGoal = member.goalType === 'shares';
                        const isPriceGoal = !isLikesGoal && !isSharesGoal;
                        const remaining = Math.max(0, (member.goal || 0) - achievement);
                        return (
                          <div className="-mx-3 px-3 py-2.5 bg-slate-50/50 border-y border-slate-100 space-y-1.5">
                            {/* Goal name + % */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-700 truncate">{member.goalName || 'Зорилго'}</span>
                              <span className="text-[10px] font-black text-emerald-600 shrink-0">{pctGoal}%{isPriceGoal ? ' хэмнэлт' : ''}</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pctGoal}%` }}
                                className={`h-full shadow-[0_0_8px_rgba(16,185,129,0.3)] ${isLikesGoal ? 'bg-blue-500' : isSharesGoal ? 'bg-slate-500' : 'bg-emerald-500'}`}
                              />
                            </div>
                            {/* Count / Price + action button */}
                            <div className="flex items-center justify-between pt-0.5">
                              {isLikesGoal ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-black text-blue-600">{achievement.toLocaleString()}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">/ {(member.goal || 0).toLocaleString()} Like</span>
                                </div>
                              ) : isSharesGoal ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-black text-slate-700">{achievement.toLocaleString()}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">/ {(member.goal || 0).toLocaleString()} Share</span>
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[9px] text-slate-400 line-through font-mono">{(member.goal || 0).toLocaleString()}₮</span>
                                  <span className="text-sm font-black text-slate-800">{remaining.toLocaleString()}₮</span>
                                </div>
                              )}
                              {isPriceGoal && (
                                <button
                                  onClick={() => handleActionGuard(() => {
                                    if (remaining <= 0) { alert('Энэ зүйл бүрэн үнэгүй боллоо!'); return; }
                                    initiatePayment('support', remaining, { memberId: member.id, isSuper: true });
                                  })}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-black text-[11px] hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                                >
                                  АВАХ
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  {/* Actions — single row */}
                  {(() => {
                    const isLiked = member.likedBy?.includes(currentUser?.id || '');
                    const isShared = member.sharedBy?.includes(currentUser?.id || '');
                    const isBursting = likedBurstIds.includes(member.id);
                    const memberCount = registeredUsers.filter(u => (u.memberships || []).some(ms => ms.memberId === member.id)).length;
                    return (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      {/* Like */}
                      <div className="flex items-center gap-1 shrink-0 relative">
                        <motion.button
                          onClick={() => {
                            if (!isLiked) {
                              setLikedBurstIds(ids => [...ids, member.id]);
                              setTimeout(() => setLikedBurstIds(ids => ids.filter(x => x !== member.id)), 600);
                            }
                            handleLike(member.id);
                          }}
                          whileTap={{ scale: 0.75 }}
                          animate={isBursting ? { scale: [1, 1.45, 0.88, 1.12, 1] } : { scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                          className={`p-1 rounded-md flex items-center justify-center ring-1 relative overflow-visible ${isLiked ? 'bg-blue-600 text-white ring-blue-600' : 'bg-blue-50 text-blue-600 ring-blue-100'}`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                          <AnimatePresence>
                            {isBursting && (
                              <motion.span
                                initial={{ opacity: 1, scale: 0.5, y: 0, x: '-50%' }}
                                animate={{ opacity: 0, scale: 1, y: -22 }}
                                exit={{}}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="absolute -top-1 left-1/2 text-[10px] font-black text-blue-500 pointer-events-none select-none"
                                style={{ transformOrigin: 'center' }}
                              >+1</motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={member.likes}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className={`text-[11px] font-bold min-w-[12px] ${isLiked ? 'text-blue-600' : 'text-slate-500'}`}
                          >{member.likes || 0}</motion.span>
                        </AnimatePresence>
                      </div>

                      {/* Key */}
                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          onClick={() => handleActionGuard(() => setKeyModalId(member.id))}
                          whileTap={{ rotate: [0, -18, 18, -12, 12, 0], scale: 0.9 }}
                          transition={{ duration: 0.4 }}
                          className="p-1 rounded-md bg-amber-50 text-amber-600 ring-1 ring-amber-100 flex items-center justify-center"
                        >
                          <Key className="w-3 h-3" />
                        </motion.button>
                        <span className="text-[10px] font-bold text-amber-600 min-w-[10px]">{(currentUser?.keys || []).length}</span>
                      </div>

                      {/* Share */}
                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          onClick={() => handleShare(member)}
                          whileTap={{ scale: 0.78, x: [0, 4, -4, 3, 0] }}
                          transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                          className={`p-1 rounded-md flex items-center justify-center ring-1 ${isShared ? 'bg-slate-600 text-white ring-slate-600' : 'bg-slate-50 text-slate-400 ring-slate-100'}`}
                        >
                          <Share2 className="w-3 h-3" />
                        </motion.button>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={member.shares}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className={`text-[11px] font-bold min-w-[12px] ${isShared ? 'text-slate-600' : 'text-slate-400'}`}
                          >{member.shares || 0}</motion.span>
                        </AnimatePresence>
                      </div>

                      <div className="w-px h-4 bg-slate-200 shrink-0" />

                      {/* Invite */}
                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); cancelLongPress(); setInviteId(member.id); }}
                          onMouseDown={e => e.stopPropagation()}
                          whileTap={{ scale: 0.78 }}
                          whileHover={{ scale: 1.08 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          className="p-1 rounded-md bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100 flex items-center justify-center"
                        >
                          <UserPlus className="w-3 h-3" />
                        </motion.button>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={member.invites}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="text-[11px] font-bold text-slate-400 min-w-[12px]"
                          >{member.invites || 0}</motion.span>
                        </AnimatePresence>
                      </div>

                      {/* ₮ */}
                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          onClick={() => setSuperSupportId(member.id)}
                          whileTap={{ scale: 1.25, backgroundColor: '#059669' }}
                          transition={{ type: 'spring', stiffness: 600, damping: 12 }}
                          className="p-1 rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 flex items-center justify-center font-black"
                        >
                          <span className="text-xs leading-none">₮</span>
                        </motion.button>
                        <span className="text-[10px] font-bold text-emerald-600 min-w-[16px]">{formatSupport(member.superSupports)}</span>
                      </div>

                      {/* Membership / Crown */}
                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          onClick={() => handleActionGuard(() => setMembershipTargetId(member.id))}
                          whileTap={{ scale: 0.78, rotate: -12 }}
                          whileHover={{ scale: 1.08, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                          className={`p-1 rounded-md flex items-center justify-center ring-1 ${tierInfo ? `${tierInfo.bg} ${tierInfo.color} ring-current` : 'bg-slate-50 text-slate-400 ring-slate-100'}`}
                        >
                          <Crown className="w-3 h-3" />
                        </motion.button>
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={memberCount}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="text-[11px] font-bold text-slate-400 min-w-[12px]"
                          >{memberCount}</motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                    );
                  })()}
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
            {/* Sub-tab toggle */}
            <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <button
                onClick={() => setUsersSubTab('all')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${usersSubTab === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <UsersIcon className="w-3.5 h-3.5" />
                Нийт Хэрэглэгч
              </button>
              <button
                onClick={() => setUsersSubTab('top')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${usersSubTab === 'top' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Crown className="w-3.5 h-3.5" />
                Топ Хэрэглэгч
              </button>
            </div>

            <AnimatePresence mode="wait">
            {usersSubTab === 'all' ? (
              <motion.div key="all" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="space-y-4">
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
              </motion.div>
            ) : (
              <motion.div key="top" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
                {registeredUsers.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-300 bg-white border border-slate-200 rounded-2xl">
                    <Crown className="w-12 h-12 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest mt-4">Бүртгэлтэй хэрэглэгч алга</p>
                  </div>
                ) : (() => {
                  const MEDAL = [
                    { label: '1', bg: 'bg-yellow-400', cardBg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
                    { label: '2', bg: 'bg-slate-400',  cardBg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-500'  },
                    { label: '3', bg: 'bg-amber-600',  cardBg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  },
                  ];
                  const scored = [...registeredUsers]
                    .map(user => ({ user, score: calculateUserScore(user) }))
                    .sort((a, b) => b.score - a.score);
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
                        {scored.map(({ user, score }, idx) => {
                          const medal = idx < 3 ? MEDAL[idx] : null;
                          return (
                            <div key={user.id} className={`px-5 py-3.5 flex items-center gap-3 ${medal?.cardBg ?? ''}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${medal ? `${medal.bg} text-white` : 'bg-slate-100 text-slate-400'}`}>
                                {idx + 1}
                              </div>
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm uppercase border bg-white shrink-0 ${medal ? `${medal.border} ${medal.text}` : 'border-slate-200 text-slate-500'}`}>
                                {user.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-slate-800 leading-none truncate">{user.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{user.phone}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-black ${medal ? medal.text : 'text-slate-400'}`}>{score.toLocaleString()}₮</p>
                                <p className="text-[8px] text-slate-400 uppercase tracking-wider">оноо</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
            </AnimatePresence>
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
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 px-4 py-2 pb-6 flex items-center justify-around z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {([
          { tab: 'posts', icon: LayoutGrid, label: 'Самбар' },
          { tab: 'users', icon: UsersIcon, label: 'Хэрэглэгч' },
          { tab: 'profile', icon: User, label: 'Профайл' },
        ] as const).map(({ tab, icon: Icon, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center gap-0.5 transition-all ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}
          >
            <div className={`p-1 rounded-lg transition-all ${activeTab === tab ? 'bg-indigo-50' : ''}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`text-[8px] font-bold ${activeTab === tab ? 'opacity-100' : 'opacity-50'}`}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <footer className="px-6 py-4 bg-slate-100 border-t border-slate-200 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Daddy Discounter</p>
      </footer>

      {/* Add Modal */}
      {/* Add-post admin auth gate */}
      <AnimatePresence>
        {addPostAuthOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddPostAuthOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xs bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Админ нэвтрэх</h2>
                </div>
                <button onClick={() => setAddPostAuthOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={e => {
                e.preventDefault();
                if (addPostAuthInput === 'Нү#Админ1₮' || addPostAuthInput === 'Pw#Admin1$') {
                  setAddPostAuthOpen(false);
                  setAddPostAuthInput('');
                  setAddPostAuthError(false);
                  setIsModalOpen(true);
                } else {
                  setAddPostAuthError(true);
                  setAddPostAuthInput('');
                }
              }} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Нууц үг</label>
                  <input
                    autoFocus
                    type="password"
                    value={addPostAuthInput}
                    onChange={e => { setAddPostAuthInput(e.target.value); setAddPostAuthError(false); }}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${addPostAuthError ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 bg-slate-50'}`}
                    placeholder="••••••••"
                  />
                  {addPostAuthError && (
                    <p className="text-[10px] text-red-500 font-bold ml-0.5">Нууц үг буруу байна</p>
                  )}
                </div>
                <button type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">
                  НЭВТРЭХ
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-50"
          >
            {/* Full-screen header */}
            <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-white" />
                <h2 className="text-sm font-bold text-white">Пост нэмэх</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 active:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleAddMember} className="p-4 space-y-3 pb-6">
                {/* Name + Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">Нэр</label>
                    <input required type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                      placeholder="Бат-Эрдэнэ" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">Дугаар</label>
                    <input required type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                      placeholder="9911-XXXX" />
                  </div>
                </div>

                {/* Goal name */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">Зорилго</label>
                  <input required type="text" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                    placeholder="Утас авах, Аялал гэх мэт..." />
                </div>

                {/* Goal type selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">Зорилгын Төрөл</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { value: 'price', label: '₮ Үнэ' },
                      { value: 'likes', label: '👍 Like' },
                      { value: 'shares', label: '🔗 Share' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewGoalType(opt.value)}
                        className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${newGoalType === opt.value
                          ? opt.value === 'price' ? 'bg-indigo-600 text-white border-indigo-600'
                            : opt.value === 'likes' ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-600 text-white border-slate-600'
                          : 'bg-white text-slate-500 border-slate-200'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goal amount */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">
                    {newGoalType === 'likes' ? 'Like Зорилго' : newGoalType === 'shares' ? 'Share Зорилго' : 'Зорилго Үнэ (₮)'}
                  </label>
                  <input required type="number" value={newGoal} onChange={(e) => setNewGoal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700 bg-white"
                    placeholder={newGoalType === 'likes' ? '100000' : newGoalType === 'shares' ? '90000' : '20000000'} />
                  {newGoalType === 'likes' && <p className="text-[9px] text-blue-500 ml-0.5">100,000 Like хүрвэл аялалд гарна</p>}
                  {newGoalType === 'shares' && <p className="text-[9px] text-slate-500 ml-0.5">90,000 Share хүрвэл аялалд гарна</p>}
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-0.5">Хугацаа</label>
                  <div className="space-y-1.5">
                    {/* 24h */}
                    <button type="button" onClick={() => setExpiryOption('24h')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-xl transition-all ${expiryOption === '24h' ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${expiryOption === '24h' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">24 Цаг</p>
                          <p className="text-[9px] text-slate-400">Үнэгүй байршина</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">ҮНЭГҮЙ</span>
                    </button>

                    {/* Special code */}
                    <div className={`border rounded-xl transition-all ${expiryOption === 'special' ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white border-slate-200'}`}>
                      <button type="button" onClick={() => setExpiryOption('special')}
                        className="w-full flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${expiryOption === 'special' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Key className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-700">Тусгай код</p>
                            <p className="text-[9px] text-slate-400">Хугацаагүй, үнэгүй</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-indigo-600 px-2 py-0.5 bg-indigo-100 rounded-full">КОД</span>
                      </button>
                      {expiryOption === 'special' && (
                        <div className="px-3 pb-3" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={specialCodeInput}
                            onChange={(e) => setSpecialCodeInput(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400 tracking-widest uppercase ${specialCodeInput && specialCodeInput !== SPECIAL_CODE ? 'border-red-300 bg-red-50 text-red-600' : specialCodeInput === SPECIAL_CODE ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'}`}
                            placeholder="XXXXXXXX"
                          />
                          {specialCodeInput === SPECIAL_CODE && <p className="text-[9px] text-emerald-600 font-bold mt-1 ml-0.5">✓ Зөв код</p>}
                          {specialCodeInput && specialCodeInput !== SPECIAL_CODE && <p className="text-[9px] text-red-500 font-bold mt-1 ml-0.5">Код буруу</p>}
                        </div>
                      )}
                    </div>

                    {/* Infinite paid */}
                    <div className={`border rounded-xl transition-all ${expiryOption === 'infinite' ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white border-slate-200'}`}>
                      <button type="button" onClick={() => setExpiryOption('infinite')}
                        className="w-full flex items-center justify-between px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${expiryOption === 'infinite' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-slate-700">Хугацаагүй</p>
                            <p className="text-[9px] text-slate-400">Биелэх хүртэл — хөнгөлөлттэй</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                          {newGoal
                            ? Math.round(parseInt(newGoal) * 0.5 * (1 - (Math.min(100, Math.max(0, parseInt(newDiscount) || 0)) / 100))).toLocaleString()
                            : '...'}₮
                        </span>
                      </button>
                      {expiryOption === 'infinite' && (
                        <div className="px-3 pb-3 space-y-2" onClick={e => e.stopPropagation()}>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Хөнгөлөлтийн хувь (%)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={newDiscount}
                              onChange={e => setNewDiscount(e.target.value)}
                              className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700 text-center"
                              placeholder="0"
                            />
                            <span className="text-sm font-black text-slate-500">%</span>
                            {newDiscount && parseInt(newDiscount) > 0 && newGoal && (
                              <div className="flex-1 text-right">
                                <p className="text-[9px] text-slate-400 line-through">{Math.round(parseInt(newGoal) * 0.5).toLocaleString()}₮</p>
                                <p className="text-xs font-black text-emerald-600">{Math.round(parseInt(newGoal) * 0.5 * (1 - Math.min(100, parseInt(newDiscount)) / 100)).toLocaleString()}₮</p>
                              </div>
                            )}
                          </div>
                          {newDiscount && parseInt(newDiscount) > 0 && (
                            <p className="text-[9px] text-indigo-500">{parseInt(newDiscount)}% хөнгөлөлттэй байршина</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit bar */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Нийт төлбөр</p>
                    <p className="text-base font-black text-slate-800">
                      {(expiryOption === '24h' || expiryOption === 'special' ? 0 : (parseInt(newGoal || '0') * 0.5)).toLocaleString()}₮
                    </p>
                  </div>
                  <button type="submit"
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200">
                    БАТЛАХ
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
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
              className="absolute inset-0 bg-emerald-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border-2 border-emerald-100"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                  <span className="text-xl">₮</span>
                  Мөнгөн дэмжлэг
                </h2>
                <button onClick={() => setSuperSupportId(null)} className="p-1.5 hover:bg-emerald-50 rounded-lg">
                  <X className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    autoFocus
                    type="number"
                    value={superAmount}
                    onChange={(e) => setSuperAmount(e.target.value)}
                    className="w-full px-4 py-5 text-3xl font-light bg-emerald-50 border border-emerald-100 rounded-xl text-center focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-emerald-900"
                    placeholder="0"
                  />
                  <span className="absolute right-4 bottom-2 text-emerald-400 font-bold text-xl">₮</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1000, 5000, 10000, 20000].map(val => (
                    <motion.button
                      key={val}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSuperAmount(val.toString())}
                      className={`py-2 text-[11px] border rounded-xl font-bold transition-all ${superAmount === val.toString() ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {val >= 1000 ? `${val/1000}K` : val}₮
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (superAmount && superSupportId) {
                      initiatePayment('support', parseInt(superAmount), { memberId: superSupportId, isSuper: true });
                      setSuperAmount('');
                      setSuperSupportId(null);
                    }
                  }}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                >
                  ДЭМЖИХ
                </motion.button>
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

      {/* Key Modal */}
      <AnimatePresence>
        {keyModalId && (() => {
          const keyMember = members.find(m => m.id === keyModalId);
          const userKeys = currentUser?.keys || [];
          const keyCounts = {
            bronze: userKeys.filter(k => k.type === 'bronze').length,
            silver: userKeys.filter(k => k.type === 'silver').length,
            gold:   userKeys.filter(k => k.type === 'gold').length,
            diamond: userKeys.filter(k => k.type === 'diamond').length,
          };
          const totalKeys = Object.values(keyCounts).reduce((a, b) => a + b, 0);
          const KEY_DEFS = [
            { type: 'bronze',  label: 'Хүрэл',  color: 'text-amber-700',  bg: 'bg-amber-100'  },
            { type: 'silver',  label: 'Мөнгөн', color: 'text-slate-500',  bg: 'bg-slate-100'  },
            { type: 'gold',    label: 'Алтан',  color: 'text-yellow-600', bg: 'bg-yellow-100' },
            { type: 'diamond', label: 'Алмаз',  color: 'text-blue-500',   bg: 'bg-blue-100'   },
          ] as const;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setKeyModalId(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <Key className="w-6 h-6 mb-1 text-amber-200" />
                      <h3 className="text-lg font-bold">Түлхүүр ашиглах</h3>
                      <p className="text-amber-100 text-xs mt-0.5">{keyMember?.name}</p>
                    </div>
                    <button onClick={() => setKeyModalId(null)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Key inventory */}
                  <div className="grid grid-cols-4 gap-2">
                    {KEY_DEFS.map(k => (
                      <div key={k.type} className={`p-2.5 rounded-xl text-center ${k.bg}`}>
                        <Key className={`w-4 h-4 mx-auto mb-1 ${k.color}`} />
                        <p className={`text-lg font-black leading-none ${k.color}`}>{keyCounts[k.type]}</p>
                        <p className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${k.color} opacity-70`}>{k.label}</p>
                      </div>
                    ))}
                  </div>
                  {totalKeys > 0 ? (
                    <div className="space-y-2">
                      <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">
                        Өөрөө хэрэглэх
                      </button>
                      <button className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm active:scale-95 transition-all hover:bg-slate-200">
                        Хүнд өгөх
                      </button>
                      <p className="text-center text-[9px] text-slate-400 pt-1">Яг юу хийхийг удахгүй тодруулна</p>
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-1">
                      <Key className="w-8 h-8 text-slate-200 mx-auto" />
                      <p className="text-sm font-bold text-slate-500">Түлхүүр байхгүй байна</p>
                      <p className="text-[10px] text-slate-400">Бүртгүүлснээр 1 хүрэл түлхүүр авна</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* QPay Payment Modal — full screen */}
      <AnimatePresence>
        {(isProcessingPayment || qpayInvoice) && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed inset-0 z-[60] flex flex-col bg-white"
          >
            {/* Header */}
            <div className="bg-blue-600 pt-0 px-5 pb-5 text-white flex-shrink-0">
              <div className="flex items-center justify-between mb-4 pt-3">
                <button
                  onClick={() => { setQpayInvoice(null); setPaymentTarget(null); setIsProcessingPayment(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow">
                    <span className="text-sm font-black text-blue-600 italic leading-none">q</span>
                  </div>
                  <span className="text-base font-bold">QPay</span>
                </div>
                <div className="w-8" />
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-xs mb-0.5">Төлөх дүн</p>
                <p className="text-3xl font-black tabular-nums">{paymentTarget?.amount.toLocaleString()}₮</p>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {!qpayInvoice ? (
                /* Loading state — shown immediately */
                <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full animate-spin" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#dbeafe" strokeWidth="6" />
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#2563eb" strokeWidth="6"
                        strokeLinecap="round" strokeDasharray="214" strokeDashoffset="160" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-black text-blue-600 italic">q</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-700">Нэхэмжлэл үүсгэж байна...</p>
                    <p className="text-xs text-slate-400 mt-1">Түр хүлээнэ үү</p>
                  </div>
                </div>
              ) : (
                /* Invoice ready */
                <div className="flex flex-col items-center px-5 py-6 gap-5">
                  {/* QR code */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_0_0_1px_#e2e8f0,0_8px_24px_rgba(0,0,0,0.08)]">
                    <img
                      src={`data:image/png;base64,${qpayInvoice.qr_image}`}
                      alt="QPay QR"
                      className="w-52 h-52"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-center leading-relaxed">
                    QR кодыг уншуулах эсвэл доорх банкны аппыг сонгоно уу
                  </p>

                  {/* Bank app grid */}
                  {qpayInvoice.urls?.length > 0 && (
                    <div className="w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Банкны апп сонгох</p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {qpayInvoice.urls.map((bank: any) => (
                          <button
                            key={bank.name}
                            onClick={() => window.open(bank.link, '_blank')}
                            className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100 active:scale-95 active:bg-blue-50 transition-all"
                          >
                            <img src={bank.logo} alt={bank.description} className="w-9 h-9 rounded-xl shadow-sm" referrerPolicy="no-referrer" />
                            <span className="text-[9px] font-bold text-slate-600 text-center leading-tight line-clamp-2">{bank.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Polling indicator + manual check */}
                  <div className="flex flex-col items-center gap-3 pt-1 w-full">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Автоматаар шалгаж байна...
                    </div>
                    {lastCheckDebug ? (
                      <div className="w-full bg-slate-100 rounded-lg p-2 text-[9px] font-mono text-slate-500 break-all">
                        {lastCheckDebug}
                      </div>
                    ) : null}
                    <motion.button
                      onClick={checkPaymentStatus}
                      disabled={paymentChecking}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {paymentChecking ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                          </svg>
                          Шалгаж байна...
                        </>
                      ) : '✓ Би төлсөн — шалгах'}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer cancel */}
            <div className="flex-shrink-0 border-t border-slate-100">
              <button
                onClick={() => { setQpayInvoice(null); setPaymentTarget(null); setIsProcessingPayment(false); }}
                className="w-full py-4 text-slate-400 text-sm font-bold active:bg-slate-50 transition-colors"
              >
                БОЛИХ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment / Register Success full-screen */}
      <AnimatePresence>
        {paymentSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
              className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
            >
              <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <motion.path
                  strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-2xl font-black text-slate-800 text-center px-8"
            >
              Амжилттай!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-slate-500 text-sm text-center mt-2 px-10"
            >
              {paymentSuccessMsg}
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPaymentSuccessMsg('')}
              className="mt-10 px-10 py-3.5 bg-emerald-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-emerald-200 active:bg-emerald-600"
            >
              Үргэлжлүүлэх
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
