export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'vip';

export interface Member {
  id: string;
  name: string;
  phone: string;
  goal: number;
  goalName: string;
  likes: number;
  shares: number;
  invites: number;
  basicSupports: number;
  superSupports: number;
  createdAt: number;
  expiresAt: number | null;
  likedBy: string[];
  sharedBy: string[];
  followers: string[];       // RegisteredUser.id array
  listingPaid: boolean;      // true if paid for listing (extra days / infinite)
  contributions: { userId: string; amount: number }[];
  views: number;
  viewedBy: string[];        // deviceId array
}

export interface RegisteredUser {
  id: string;
  name: string;
  phone: string;
  password: string;
  invitedByPhone: string;
  createdAt: number;
  memberships: { memberId: string; tier: MembershipTier }[];
  keys: { id: string; type: 'bronze' | 'silver' | 'gold' | 'diamond' }[];
}
