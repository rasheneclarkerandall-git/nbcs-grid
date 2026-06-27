export type Parish = 'kingston' | 'st-andrew' | 'st-catherine' | 'st-james';
export type ApplicationType = 'fdp' | 'bp' | 'subdivision' | 'change-of-use';
export type AppStatus =
  | 'draft'
  | 'documents'
  | 'review'
  | 'payment'
  | 'ready'
  | 'submitted'
  | 'under-review'
  | 'approved'
  | 'rejected';
export type DocStatus = 'pending' | 'uploaded' | 'flagged' | 'verified';
export type CollabRole = 'architect' | 'engineer' | 'surveyor' | 'attorney';
export type CollabStatus = 'invited' | 'active' | 'uploaded' | 'stalled';
export type SubmissionPath = 'print-deliver' | 'deliver-only' | 'self-deliver';
export type FlagSeverity = 'critical' | 'warning' | 'advisory';

export interface DocItem {
  id: string;
  name: string;
  required: boolean;
  stamped: boolean;
  stampedBy?: string;
  drawingSize?: string;
  notes?: string;
  status: DocStatus;
  uploadedAt?: string;
  collaboratorId?: string;
  expiryDays?: number;
}

export interface Collaborator {
  id: string;
  name: string;
  role: CollabRole;
  email: string;
  status: CollabStatus;
  invitedAt: string;
  lastActiveAt?: string;
  assignedDocIds: string[];
}

export interface AIFlag {
  id: string;
  severity: FlagSeverity;
  title: string;
  description: string;
  dismissed: boolean;
  dismissReason?: string;
}

export interface FeeBreakdown {
  agencyFee: number;
  serviceFee: number;
  printFee: number;
  deliveryFee: number;
  total: number;
  agencyLastVerified: string;
  paymentMethod: string;
  paymentInstructions: string;
  bankName: string;
}

export interface Application {
  id: string;
  ref: string;
  createdAt: string;
  updatedAt: string;
  status: AppStatus;

  parish: Parish;
  municipality: string;
  agency: string;
  applicationType: ApplicationType;

  address: string;
  lotNumber: string;
  volume: string;
  folio: string;
  landAreaSqM: number;
  currentUse: string;
  proposedUse: string;

  docs: DocItem[];
  collaborators: Collaborator[];

  aiFlags: AIFlag[];
  aiReviewRun: boolean;

  fee?: FeeBreakdown;
  receiptUploaded: boolean;
  receiptVerified: boolean;
  planitFeePaid: boolean;
  submissionPath?: SubmissionPath;

  submittedAt?: string;
  trackingStatus?: string;
}

export interface AppState {
  applications: Application[];
  activeId: string | null;
  screen: Screen;
  wizardStep: number;
  activeDetailTab: string;
}

export type Screen =
  | 'dashboard'
  | 'new-application'
  | 'application-detail'
  | 'platform-overview';

export type Action =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_ACTIVE'; id: string }
  | { type: 'SET_WIZARD_STEP'; step: number }
  | { type: 'SET_DETAIL_TAB'; tab: string }
  | { type: 'ADD_APPLICATION'; app: Application }
  | { type: 'UPDATE_APPLICATION'; id: string; patch: Partial<Application> }
  | { type: 'UPDATE_DOC'; appId: string; docId: string; patch: Partial<DocItem> }
  | { type: 'DISMISS_FLAG'; appId: string; flagId: string; reason: string }
  | { type: 'ADD_COLLABORATOR'; appId: string; collab: Collaborator }
  | { type: 'REMOVE_COLLABORATOR'; appId: string; collabId: string }
  | { type: 'RUN_AI_REVIEW'; appId: string }
  | { type: 'SET_SUBMISSION_PATH'; appId: string; path: SubmissionPath }
  | { type: 'MARK_RECEIPT_UPLOADED'; appId: string }
  | { type: 'MARK_RECEIPT_VERIFIED'; appId: string }
  | { type: 'MARK_PLANIT_FEE_PAID'; appId: string }
  | { type: 'SUBMIT_APPLICATION'; appId: string };
