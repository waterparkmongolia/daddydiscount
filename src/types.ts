export type MembershipTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'vip';
export type GoalType = 'price' | 'likes' | 'shares';

export interface Member {
  id: string;
  name: string;
  phone: string;
  goal: number;
  goalName: string;
  goalType: GoalType;
  likes: number;
  shares: number;
  invites: number;
  basicSupports: number;
  superSupports: number;
  createdAt: number;
  expiresAt: number | null;
  likedBy: string[];
  sharedBy: string[];
  fbFollowedBy: string[];
  ytFollowedBy: string[];
  igFollowedBy: string[];
  followers: string[];       // RegisteredUser.id array
  listingPaid: boolean;      // true if paid for listing (extra days / infinite)
  discountPct: number;       // discount % offered on the item (0 = none)
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
