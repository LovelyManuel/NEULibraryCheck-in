
import { Timestamp } from "firebase/firestore";

export type UserRole = 'admin' | 'user';

export interface LibraryUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  collegeId: string;
  isBlocked: boolean;
  createdAt: Timestamp;
}

export interface LibraryVisit {
  id?: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  purposeOfVisit: string;
  collegeId: string;
  collegeName: string;
}

export interface College {
  id: string;
  name: string;
}

export const VISIT_PURPOSES = [
  "Study",
  "Research",
  "Book Return",
  "Book Borrowing",
  "Clearance",
  "Internet Usage",
  "Others"
];
