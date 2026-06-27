import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { AppState, Action, Application, DocItem } from './types';
import { seedApplications, generateAIFlags } from './data';

const INITIAL: AppState = {
  applications: seedApplications(),
  activeId: null,
  screen: 'dashboard',
  wizardStep: 0,
  activeDetailTab: 'checklist',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen, wizardStep: 0 };

    case 'SET_ACTIVE':
      return { ...state, activeId: action.id, screen: 'application-detail', activeDetailTab: 'overview' };

    case 'SET_WIZARD_STEP':
      return { ...state, wizardStep: action.step };

    case 'SET_DETAIL_TAB':
      return { ...state, activeDetailTab: action.tab };

    case 'ADD_APPLICATION': {
      const apps = [action.app, ...state.applications];
      return { ...state, applications: apps, activeId: action.app.id, screen: 'application-detail', activeDetailTab: 'checklist' };
    }

    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.id ? { ...a, ...action.patch, updatedAt: new Date().toISOString().split('T')[0] } : a
        ),
      };

    case 'UPDATE_DOC':
      return {
        ...state,
        applications: state.applications.map(a => {
          if (a.id !== action.appId) return a;
          return {
            ...a,
            docs: a.docs.map(d => d.id === action.docId ? { ...d, ...action.patch } : d),
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }),
      };

    case 'DISMISS_FLAG':
      return {
        ...state,
        applications: state.applications.map(a => {
          if (a.id !== action.appId) return a;
          return {
            ...a,
            aiFlags: a.aiFlags.map(f =>
              f.id === action.flagId ? { ...f, dismissed: true, dismissReason: action.reason } : f
            ),
          };
        }),
      };

    case 'ADD_COLLABORATOR':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.appId
            ? { ...a, collaborators: [...a.collaborators, action.collab] }
            : a
        ),
      };

    case 'REMOVE_COLLABORATOR':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.appId
            ? { ...a, collaborators: a.collaborators.filter(c => c.id !== action.collabId) }
            : a
        ),
      };

    case 'RUN_AI_REVIEW':
      return {
        ...state,
        applications: state.applications.map(a => {
          if (a.id !== action.appId) return a;
          const flags = generateAIFlags(a.docs);
          const hasNoMissing = a.docs.filter(d => d.required && d.status === 'pending').length === 0;
          return {
            ...a,
            aiFlags: flags,
            aiReviewRun: true,
            status: hasNoMissing ? 'review' : a.status,
          };
        }),
      };

    case 'SET_SUBMISSION_PATH':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.appId ? { ...a, submissionPath: action.path } : a
        ),
      };

    case 'MARK_RECEIPT_UPLOADED':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.appId ? { ...a, receiptUploaded: true, status: 'payment' } : a
        ),
      };

    case 'MARK_RECEIPT_VERIFIED':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.appId ? { ...a, receiptVerified: true } : a
        ),
      };

    case 'MARK_PLANIT_FEE_PAID':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.appId ? { ...a, planitFeePaid: true, status: 'ready' } : a
        ),
      };

    case 'SUBMIT_APPLICATION':
      return {
        ...state,
        applications: state.applications.map(a =>
          a.id === action.appId
            ? { ...a, status: 'submitted', submittedAt: new Date().toISOString().split('T')[0] }
            : a
        ),
      };

    default:
      return state;
  }
}

interface ContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  activeApp: Application | undefined;
}

const Ctx = createContext<ContextValue | null>(null);
const STORAGE_KEY = 'planit_state_v1';

export function StoreProvider({ children }: { children: ReactNode }) {
  const saved = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const [state, dispatch] = useReducer(reducer, saved ?? INITIAL);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeApp = state.applications.find(a => a.id === state.activeId);
  return <Ctx.Provider value={{ state, dispatch, activeApp }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}

function _makeId() { return Math.random().toString(36).slice(2, 10); }

export function buildNewApp(data: {
  parish: Application['parish'];
  applicationType: Application['applicationType'];
  address: string;
  lotNumber: string;
  volume: string;
  folio: string;
  landAreaSqM: number;
  currentUse: string;
  proposedUse: string;
  municipality: string;
  agency: string;
  docs: DocItem[];
}): Application {
  const id = _makeId();
  const codes: Record<Application['applicationType'], string> = { fdp: 'FDP', bp: 'BP', subdivision: 'SUB', 'change-of-use': 'COU' };
  const p: Record<Application['parish'], string> = { kingston: 'KGN', 'st-andrew': 'STA', 'st-catherine': 'STC', 'st-james': 'STJ' };
  const ref = `PLN-${codes[data.applicationType]}-${p[data.parish]}-${Math.floor(1000 + Math.random() * 9000)}`;
  const today = new Date().toISOString().split('T')[0];
  return {
    id, ref,
    createdAt: today, updatedAt: today,
    status: 'documents',
    ...data,
    collaborators: [],
    aiFlags: [],
    aiReviewRun: false,
    receiptUploaded: false,
    receiptVerified: false,
    planitFeePaid: false,
  };
}
