
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
  program?: string;
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
  "Internet Usage"
];

export const DEPARTMENTS: Record<string, string> = {
  LIBRARY: 'Library',
  ABM:     'College of Accountancy',
  CAS:     'College of Arts and Sciences',
  CBA:     'College of Business Administration',
  CEA:     'College of Engineering and Architecture',
  CED:     'College of Education',
  CICS:    'College of Informatics and Computing Studies',
  CMT:     'College of Medical Technology',
  COA:     'College of Agriculture',
  COC:     'College of Communication',
  COM:     'College of Midwifery',
  COMS:    'College of Music',
  CON:     'College of Nursing',
  CPT:     'College of Physical Therapy',
  CRIM:    'College of Criminology',
  CRT:     'College of Respiratory Therapy',
  SOIR:    'School of International Relations'
};
