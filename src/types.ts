export interface Member {
  id: string;
  name: string;
  phone: string;
  goal: number; // The target amount in MNT
  likes: number;
  shares: number;
  invites: number; // Number of people invited through this member
  basicSupports: number; // Sum of 1000₮ supports
  superSupports: number; // Sum of custom supports
  createdAt: number;
  expiresAt: number | null; // null means infinite, or timestamp
  likedBy?: string[]; // Array of RegisteredUser.id
  sharedBy?: string[]; // Array of RegisteredUser.id
}

export interface RegisteredUser {
  id: string;
  name: string;
  phone: string;
  password: string;
  invitedByPhone: string;
  createdAt: number;
}
