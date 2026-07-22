import { AppSettings, AppStorageState, KnowledgeCollection, LicenseData, QuizResult, UserProfile } from '../types';
import { SAMPLE_COLLECTIONS } from '../data/sampleCollections';
import { buildLicenseData, generateLicenseKey, getOrCreateDeviceId, HARDCODED_MASTER_KEYS } from './crypto';
import { loadStateFromIndexedDB, saveStateToIndexedDB, clearIndexedDB } from './indexedDB';

const STORAGE_KEY = 'oktp_app_state_v1';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'light',
  fontSize: 'medium',
  securityEnabled: false,
  pinCode: undefined,
  dailyStudyReminder: false,
  reminderTime: '20:00',
  examTimerDefaultMinutes: 1, // 1 min per q
  defaultPassMark: 70,
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Active Learner',
  avatarSeed: 'learner1',
  createdAt: new Date().toISOString(),
};

/**
 * Synchronously load app storage state from localStorage (Initial Fast Render)
 */
export function loadAppState(): AppStorageState {
  const deviceId = getOrCreateDeviceId();
  const nowMs = Date.now();

  const raw = localStorage.getItem(STORAGE_KEY);
  let state: Partial<AppStorageState> = {};

  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse app state from localStorage:', e);
    }
  }

  // Update clock watermark (monotonic timestamp)
  const previousWatermark = state.clockWatermark || 0;
  const newWatermark = Math.max(previousWatermark, nowMs);

  // Default initial license: Auto-activate standard Master User license
  let activeLicense: LicenseData | null = null;
  if (state.license?.key) {
    activeLicense = buildLicenseData(state.license.key, deviceId, newWatermark);
  } else {
    activeLicense = buildLicenseData(HARDCODED_MASTER_KEYS.USER, deviceId, newWatermark);
  }

  let collections = (state.collections && state.collections.length > 0)
    ? state.collections
    : SAMPLE_COLLECTIONS;

  if (collections.some((c) => c.id === 'col-aws-cloud-01')) {
    collections = SAMPLE_COLLECTIONS;
  }

  const fullState: AppStorageState = {
    deviceId,
    clockWatermark: newWatermark,
    license: activeLicense,
    profile: { ...DEFAULT_PROFILE, ...state.profile },
    settings: { ...DEFAULT_SETTINGS, ...state.settings },
    collections,
    quizResults: state.quizResults || [],
    lastStudyDate: state.lastStudyDate,
    currentStreak: state.currentStreak || 0,
  };

  saveAppState(fullState);
  return fullState;
}

/**
 * Asynchronously load & hydrate state from browser IndexedDB
 */
export async function loadAppStateAsync(): Promise<AppStorageState> {
  const idbState = await loadStateFromIndexedDB();
  if (idbState && idbState.collections && idbState.collections.length > 0) {
    // Save to localStorage as synced cache
    saveAppState(idbState);
    return idbState;
  }

  // Fallback to synchronous load & seed IndexedDB
  const localState = loadAppState();
  await saveStateToIndexedDB(localState);
  return localState;
}

/**
 * Save state to both localStorage (sync cache) and IndexedDB (high capacity browser DB)
 */
export function saveAppState(state: AppStorageState): void {
  const nowMs = Date.now();
  state.clockWatermark = Math.max(state.clockWatermark || 0, nowMs);

  // 1. Save to localStorage (fast cache / legacy compatibility)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('LocalStorage quota limit reached, relying on IndexedDB:', e);
  }

  // 2. Persist to IndexedDB (Browser Local DB)
  saveStateToIndexedDB(state).catch((err) => {
    console.warn('IndexedDB async save failed:', err);
  });
}

/**
 * Reset local storage and IndexedDB
 */
export async function resetAppState(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  await clearIndexedDB();
}

/**
 * Update learning streak when completing a session
 */
export function calculateAndUpdateStreak(state: AppStorageState, sessionQuestionCount: number): AppStorageState {
  if (sessionQuestionCount < 5) return state; // Must answer at least 5 questions for streak

  const todayStr = new Date().toISOString().split('T')[0];
  const lastDateStr = state.lastStudyDate;

  if (lastDateStr === todayStr) {
    return state;
  }

  let newStreak = state.currentStreak;

  if (!lastDateStr) {
    newStreak = 1;
  } else {
    const lastDate = new Date(lastDateStr);
    const today = new Date(todayStr);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1; // Streak reset
    }
  }

  const updatedState: AppStorageState = {
    ...state,
    lastStudyDate: todayStr,
    currentStreak: newStreak,
  };

  saveAppState(updatedState);
  return updatedState;
}

