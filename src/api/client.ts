import type { PracticeRecord, WrongCharRecord } from '../stores/historyStore';
import type { SettingsSnapshot } from '../stores/settingsStore';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface CloudArticle {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  tags: string[];
  content: string;
  updatedAt: string;
}

const API_BASE = '/api';
const DEMO_STORAGE_KEY = 'flypy-cloud-demo';
const ENABLE_DEMO_FALLBACK = import.meta.env.VITE_ENABLE_DEMO_FALLBACK === 'true';

class ApiRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface DemoUser extends AuthUser {
  settings: SettingsSnapshot;
  practiceRecords: PracticeRecord[];
  wrongChars: WrongCharRecord[];
}

interface DemoDb {
  users: DemoUser[];
  loginCodes: Array<{ email: string; code: string; expiresAt: number }>;
  sessions: Array<{ token: string; email: string }>;
  articles: CloudArticle[];
}

const defaultDemoSettings: SettingsSnapshot = {
  darkMode: false,
  showKeyboard: true,
  showPinyin: true,
  highlightKeys: true,
  fontSize: 24,
  soundEnabled: false,
  soundVolume: 50,
  charCount: 50,
  phraseCount: 20,
  charPool: 500,
  practiceType: 'random',
  timerMode: 'none',
  dailyGoalChars: 1000,
};

const defaultDemoArticles: CloudArticle[] = [
  {
    id: 'demo-1',
    title: '春晓',
    category: '诗词',
    difficulty: 'easy',
    tags: ['短文', '入门'],
    content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: '静夜思',
    category: '诗词',
    difficulty: 'easy',
    tags: ['短文', '常用字'],
    content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    updatedAt: new Date().toISOString(),
  },
];

function createDefaultDemoDb(): DemoDb {
  return {
    users: [],
    loginCodes: [],
    sessions: [],
    articles: defaultDemoArticles,
  };
}

function readDemoDb(): DemoDb {
  const raw = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!raw) return createDefaultDemoDb();
  try {
    return JSON.parse(raw) as DemoDb;
  } catch {
    return createDefaultDemoDb();
  }
}

function writeDemoDb(db: DemoDb) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
}

function randomId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function dedupeRecords(records: PracticeRecord[]) {
  const map = new Map<string, PracticeRecord>();
  records.forEach((record) => {
    const key = [
      record.date,
      record.mode,
      record.speed,
      record.accuracy,
      record.totalChars,
      record.correctChars,
      record.wrongChars,
      record.maxCombo,
      record.duration,
    ].join('|');
    map.set(key, record);
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getDemoUserByToken(token: string) {
  const db = readDemoDb();
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  const user = db.users.find((item) => item.email === session.email);
  if (!user) return null;
  return { db, user };
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }));
      throw new ApiRequestError(response.status, error.message || error.detail || '请求失败');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (
      ENABLE_DEMO_FALLBACK &&
      (error instanceof TypeError || (error instanceof ApiRequestError && error.status >= 500))
    ) {
      return requestWithDemoFallback<T>(path, init, token);
    }
    throw error;
  }
}

async function requestWithDemoFallback<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.parse(String(init.body)) : {};

  if (path === '/auth/email-code' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new Error('请输入有效邮箱');
    }
    const db = readDemoDb();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    db.loginCodes = db.loginCodes.filter((item) => item.email !== email);
    db.loginCodes.push({ email, code, expiresAt: Date.now() + 10 * 60 * 1000 });
    writeDemoDb(db);
    return {
      message: '已使用本地演示模式生成验证码',
      demoCode: code,
      expiresIn: 600,
    } as T;
  }

  if (path === '/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    const db = readDemoDb();
    const loginCode = db.loginCodes.find((item) => item.email === email && item.code === code);
    if (!loginCode || loginCode.expiresAt < Date.now()) {
      throw new Error('验证码无效或已过期');
    }
    let user = db.users.find((item) => item.email === email);
    if (!user) {
      const now = new Date().toISOString();
      user = {
        userId: randomId(),
        email,
        displayName: email.split('@')[0] || 'flypy',
        createdAt: now,
        lastLoginAt: now,
        settings: { ...defaultDemoSettings },
        practiceRecords: [],
        wrongChars: [],
      };
      db.users.push(user);
    } else {
      user.lastLoginAt = new Date().toISOString();
    }
    const demoToken = randomId();
    db.sessions = db.sessions.filter((item) => item.email !== email);
    db.sessions.push({ token: demoToken, email });
    db.loginCodes = db.loginCodes.filter((item) => item.email !== email);
    writeDemoDb(db);
    return {
      token: demoToken,
      user: {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    } as T;
  }

  if (path === '/auth/session' && method === 'DELETE') {
    const db = readDemoDb();
    db.sessions = db.sessions.filter((item) => item.token !== token);
    writeDemoDb(db);
    return { ok: true } as T;
  }

  if (path === '/articles' && method === 'GET') {
    const db = readDemoDb();
    return { articles: db.articles } as T;
  }

  if (!token) {
    throw new Error('未登录');
  }

  const auth = getDemoUserByToken(token);
  if (!auth) {
    throw new Error('登录态已失效');
  }
  const { db, user } = auth;

  if (path === '/me' && method === 'GET') {
    return {
      user: {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    } as T;
  }

  if (path === '/me/settings' && method === 'GET') {
    return { settings: user.settings } as T;
  }

  if (path === '/me/settings' && method === 'PUT') {
    user.settings = { ...defaultDemoSettings, ...body.settings };
    writeDemoDb(db);
    return { settings: user.settings } as T;
  }

  if (path === '/practice/records' && method === 'GET') {
    return { records: user.practiceRecords } as T;
  }

  if (path === '/practice/records' && method === 'POST') {
    user.practiceRecords = dedupeRecords([body.record, ...user.practiceRecords]);
    writeDemoDb(db);
    return { records: user.practiceRecords } as T;
  }

  if (path === '/practice/records/batch-sync' && method === 'POST') {
    user.practiceRecords = dedupeRecords([...(body.records || []), ...user.practiceRecords]);
    writeDemoDb(db);
    return { records: user.practiceRecords } as T;
  }

  if (path === '/practice/wrong-char-stats' && method === 'GET') {
    return { wrongChars: [...user.wrongChars].sort((a, b) => b.count - a.count) } as T;
  }

  if (path === '/practice/wrong-char-stats/batch-sync' && method === 'POST') {
    const next = new Map(user.wrongChars.map((item) => [item.char, item]));
    for (const item of body.wrongChars || []) {
      const existing = next.get(item.char);
      next.set(item.char, {
        char: item.char,
        pinyin: item.pinyin || existing?.pinyin || '',
        flypyCode: item.flypyCode || existing?.flypyCode || '',
        count: Math.max(Number(item.count || 0), Number(existing?.count || 0)),
      });
    }
    user.wrongChars = Array.from(next.values()).sort((a, b) => b.count - a.count);
    writeDemoDb(db);
    return { wrongChars: user.wrongChars } as T;
  }

  throw new Error('请求失败');
}

export async function createEmailCode(email: string) {
  return request<{ message: string; demoCode?: string; expiresIn: number }>('/auth/email-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function loginWithEmailCode(email: string, code: string) {
  const result = await request<{
    token?: string;
    access_token?: string;
    user: AuthUser & {
      display_name?: string;
      created_at?: string;
      last_login_at?: string;
    };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
  return {
    token: result.token || result.access_token || '',
    user: {
      userId: result.user.userId,
      email: result.user.email,
      displayName: result.user.displayName || result.user.display_name || '',
      createdAt: result.user.createdAt || result.user.created_at || '',
      lastLoginAt: result.user.lastLoginAt || result.user.last_login_at || '',
    },
  };
}

export async function logout(token: string) {
  return request<{ ok: boolean }>('/auth/session', { method: 'DELETE' }, token);
}

export async function fetchMe(token: string) {
  return request<{ user: AuthUser }>('/me', undefined, token);
}

export async function fetchCloudSettings(token: string) {
  return request<{ settings: SettingsSnapshot }>('/me/settings', undefined, token);
}

export async function saveCloudSettings(token: string, settings: SettingsSnapshot) {
  return request<{ settings: SettingsSnapshot }>(
    '/me/settings',
    {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    },
    token
  );
}

export async function fetchPracticeRecords(token: string) {
  return request<{ records: PracticeRecord[] }>('/practice/records', undefined, token);
}

export async function savePracticeRecord(token: string, record: PracticeRecord) {
  return request<{ records: PracticeRecord[] }>(
    '/practice/records',
    {
      method: 'POST',
      body: JSON.stringify({ record }),
    },
    token
  );
}

export async function batchSyncPracticeRecords(token: string, records: PracticeRecord[]) {
  return request<{ records: PracticeRecord[] }>(
    '/practice/records/batch-sync',
    {
      method: 'POST',
      body: JSON.stringify({ records }),
    },
    token
  );
}

export async function fetchWrongChars(token: string) {
  return request<{ wrongChars: WrongCharRecord[] }>('/practice/wrong-char-stats', undefined, token);
}

export async function batchSyncWrongChars(token: string, wrongChars: WrongCharRecord[]) {
  return request<{ wrongChars: WrongCharRecord[] }>(
    '/practice/wrong-char-stats/batch-sync',
    {
      method: 'POST',
      body: JSON.stringify({ wrongChars }),
    },
    token
  );
}

export async function fetchCloudArticles() {
  return request<{ articles: CloudArticle[] }>('/content/articles');
}
