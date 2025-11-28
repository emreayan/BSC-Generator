
export interface Program {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  ageRange: string;
  dates: string;
  duration: string;
  accommodationType: 'Residence' | 'Aile Yanı' | 'Otel' | 'Kampüs';
  accommodationDetails: string;
  includedServices: string[];
  youngLearnersGoals: string[];
  description: string;
  heroImage: string;
  bannerImage?: string; // New field for program-specific print banner
  galleryImages: string[];
  timetableImages: string[];
  basePriceNote: string;
}

export interface QuoteDetails {
  agencyName: string;
  consultantName: string;
  studentCount: string;
  groupLeaderCount: string;
  pricePerStudent: string;
  priceType: 'Net' | 'Gross';
  extraLeaderPrice: string;
  durationWeeks: string;
  notes: string;
  // New Transfer Fields
  transferAirport?: string;
  transferType?: 'Solo' | 'Multi-Person' | 'Accompanied (UM)';
  // transferFee removed as per request
}

export type PortalType = 'YL_GROUPS' | 'YL_INDIVIDUAL' | 'ADULTS';

export enum AppView {
  LANDING = 'LANDING',
  LIST = 'LIST',
  DETAIL = 'DETAIL',
  PRINT = 'PRINT',
  ADMIN = 'ADMIN'
}