import type { PracticeRecord, WrongCharRecord } from '../stores/historyStore';
import type { SettingsSnapshot } from '../stores/settingsStore';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string;
  isAdmin: boolean;
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

export interface CoachTask {
  title: string;
  focus: string;
  description: string;
}

export interface AICitation {
  title: string;
  content: string;
}

export interface AIPracticePayload {
  mode: 'char' | 'phrase' | 'article';
  speed: number;
  accuracy: number;
  totalChars: number;
  correctChars: number;
  wrongChars: number;
  maxCombo: number;
  duration: number;
  date: string;
}

export interface AIWrongCharPayload {
  char: string;
  pinyin: string;
  flypyCode: string;
  count: number;
}

export interface CoachAnalysis {
  summary: string;
  weaknesses: string[];
  recommendedFocus: string[];
  tasks: CoachTask[];
  citations: AICitation[];
  meta: {
    usedModel: boolean;
    usedLangGraph: boolean;
  };
}

export interface GeneratedAIContent {
  type: 'char' | 'phrase' | 'article';
  title: string;
  difficulty: string;
  tags: string[];
  content: string;
}

export interface AIAnswer {
  answer: string;
  citations: AICitation[];
}

export interface KnowledgeIngestResult {
  knowledgeBaseCode: string;
  documentId: number;
  chunkCount: number;
  status: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
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

function computeAIMetrics(records: AIPracticePayload[]) {
  if (records.length === 0) {
    return { avgSpeed: 0, avgAccuracy: 0 };
  }
  const recent = records.slice(0, 10);
  const avgSpeed = recent.reduce((sum, item) => sum + item.speed, 0) / recent.length;
  const avgAccuracy = recent.reduce((sum, item) => sum + item.accuracy, 0) / recent.length;
  return {
    avgSpeed: Math.round(avgSpeed),
    avgAccuracy: Math.round(avgAccuracy),
  };
}

function buildDemoCitations(goal: string, wrongChars: AIWrongCharPayload[]): AICitation[] {
  return [
    {
      title: '训练节奏建议',
      content: '先稳正确率，再逐步提速。95% 以上正确率更适合作为提速起点。',
    },
    {
      title: '专项训练策略',
      content: `当前训练目标是${goal}，可优先围绕 ${wrongChars.slice(0, 3).map((item) => item.char).join('、') || '高频错字'} 做专项复盘。`,
    },
  ];
}

function buildDemoTasks(goal: string, wrongChars: AIWrongCharPayload[]): CoachTask[] {
  const focusText = wrongChars.slice(0, 3).map((item) => item.char).join('、') || '当前高频错字';
  return [
    {
      title: '热身专项',
      focus: '高频错字',
      description: `先围绕 ${focusText} 做 2 轮短时专项，重点放在编码稳定。`,
    },
    {
      title: '主训练任务',
      focus: goal,
      description: '第一轮控制正确率，第二轮再逐步提速，避免一开始就冲速度。',
    },
    {
      title: '练后复盘',
      focus: '重复错误',
      description: '记录是否出现重复错字；如果重复，下一轮继续专项，不切换题型。',
    },
  ];
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

  if (path.startsWith('/ai/') && path !== '/ai/knowledge-bases/flypy-coach/ingest') {
    if (!token) {
      throw new Error('请先登录后再使用 AI 功能');
    }
    const auth = getDemoUserByToken(token);
    if (!auth) {
      throw new Error('登录态已失效，请重新登录');
    }
  }

  if (path === '/ai/coach/analyze' && method === 'POST') {
    const records = (body.records || []) as AIPracticePayload[];
    const wrongChars = (body.wrongChars || []) as AIWrongCharPayload[];
    const goal = String(body.goal || '综合提升');
    const metrics = computeAIMetrics(records);
    return {
      summary: `最近平均速度约 ${metrics.avgSpeed} 字/分，平均正确率约 ${metrics.avgAccuracy}%。建议优先围绕高频错字和${goal}做专项训练。`,
      weaknesses: [
        metrics.avgAccuracy < 92 ? '正确率波动偏大' : '整体正确率尚可',
        wrongChars.length >= 5 ? '存在稳定高频错字' : '错字分布较分散',
        metrics.avgSpeed < 90 ? '基础速度偏慢' : '可以开始做速度冲刺',
      ],
      recommendedFocus: [goal, '高频错字', '连续输入稳定性'],
      tasks: buildDemoTasks(goal, wrongChars),
      citations: buildDemoCitations(goal, wrongChars),
      meta: {
        usedModel: false,
        usedLangGraph: false,
      },
    } as T;
  }

  if (path === '/ai/coach/tasks/generate' && method === 'POST') {
    const wrongChars = (body.wrongChars || []) as AIWrongCharPayload[];
    const goal = String(body.goal || '综合提升');
    return {
      summary: `已按“${goal}”整理一组可直接执行的训练任务。`,
      tasks: buildDemoTasks(goal, wrongChars),
    } as T;
  }

  if (path === '/ai/content/generate' && method === 'POST') {
    const wrongChars = (body.wrongChars || []) as AIWrongCharPayload[];
    const contentType = String(body.contentType || 'article') as GeneratedAIContent['type'];
    const focusChars = wrongChars.slice(0, 6).map((item) => item.char).join('');
    const contentMap: Record<GeneratedAIContent['type'], string> = {
      char: focusChars || '双拼稳定提速专项练习',
      phrase: `${focusChars.slice(0, 2) || '双拼'}训练 稳定输入 准确编码 节奏提升`,
      article: `今天的训练重点是${focusChars || '高频错字'}。先保证编码准确，再逐步提高节奏。若错误重复出现，就继续做专项，不要急于切换训练内容。`,
    };
    return {
      type: contentType,
      title: 'AI 生成练习内容',
      difficulty: 'medium',
      tags: [String(body.goal || '综合提升'), 'AI 生成'],
      content: contentMap[contentType],
    } as T;
  }

  if (path === '/ai/qa' && method === 'POST') {
    const question = String(body.question || '');
    const records = (body.records || []) as AIPracticePayload[];
    const wrongChars = (body.wrongChars || []) as AIWrongCharPayload[];
    const metrics = computeAIMetrics(records);
    const citations = buildDemoCitations(question || '训练建议', wrongChars);
    return {
      answer: `针对“${question}”，建议先把正确率稳定在 95% 左右，再逐步提速。你当前平均速度约 ${metrics.avgSpeed} 字/分，平均正确率约 ${metrics.avgAccuracy}%。`,
      citations,
    } as T;
  }

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
        isAdmin: true,
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
        isAdmin: user.isAdmin,
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
        isAdmin: user.isAdmin,
      },
    } as T;
  }

  if (path.startsWith('/ai/knowledge-bases/') && path.endsWith('/ingest') && method === 'POST') {
    if (!user.isAdmin) {
      throw new Error('需要管理员权限');
    }
    return {
      knowledgeBaseCode: path.split('/')[3] || 'flypy-coach',
      documentId: Date.now(),
      chunkCount: Math.max(1, Math.ceil(String(body.content || '').length / 220)),
      status: 'indexed',
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
      is_admin?: boolean;
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
      isAdmin: Boolean(result.user.isAdmin || result.user.is_admin),
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

export async function analyzeCoach(
  token: string,
  goal: string,
  records: AIPracticePayload[],
  wrongChars: AIWrongCharPayload[],
) {
  return request<CoachAnalysis>('/ai/coach/analyze', {
    method: 'POST',
    body: JSON.stringify({ goal, records, wrongChars }),
  }, token);
}

export async function generateCoachTasks(
  token: string,
  goal: string,
  records: AIPracticePayload[],
  wrongChars: AIWrongCharPayload[],
) {
  return request<{ summary: string; tasks: CoachTask[] }>('/ai/coach/tasks/generate', {
    method: 'POST',
    body: JSON.stringify({ goal, records, wrongChars }),
  }, token);
}

export async function generateAIContent(
  token: string,
  goal: string,
  contentType: GeneratedAIContent['type'],
  records: AIPracticePayload[],
  wrongChars: AIWrongCharPayload[],
) {
  return request<GeneratedAIContent>('/ai/content/generate', {
    method: 'POST',
    body: JSON.stringify({ goal, contentType, records, wrongChars }),
  }, token);
}

export async function askAI(
  token: string,
  question: string,
  records: AIPracticePayload[],
  wrongChars: AIWrongCharPayload[],
) {
  return request<AIAnswer>('/ai/qa', {
    method: 'POST',
    body: JSON.stringify({ question, records, wrongChars }),
  }, token);
}

export async function ingestKnowledgeDocument(
  token: string,
  knowledgeBaseCode: string,
  payload: { title: string; content: string; metadata?: Record<string, string | string[] | number | boolean | null> },
) {
  return request<KnowledgeIngestResult>(
    `/ai/knowledge-bases/${knowledgeBaseCode}/ingest`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}
