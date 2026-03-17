import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Layout/Header';
import { AICoachPanel } from './components/AI/AICoachPanel';
import { KeyboardMap } from './components/KeyboardMap/KeyboardMap';
import { CharPractice } from './components/TypingArea/CharPractice';
import { PhrasePractice } from './components/TypingArea/PhrasePractice';
import { ArticlePractice } from './components/TypingArea/ArticlePractice';
import { StatsBar } from './components/Stats/StatsBar';
import { ResultPanel } from './components/Stats/ResultPanel';
import { HistoryPanel } from './components/Stats/HistoryPanel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { AuthPanel } from './components/Auth/AuthPanel';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { useTypingStore } from './stores/typingStore';
import { applyDarkModeClass, getSettingsSnapshot, useSettingsStore } from './stores/settingsStore';
import { useHistoryStore } from './stores/historyStore';
import { useAuthStore } from './stores/authStore';
import { useArticleStore } from './stores/articleStore';
import {
  batchSyncPracticeRecords,
  batchSyncWrongChars,
  fetchCloudArticles,
  fetchCloudSettings,
  fetchMe,
  logout,
  saveCloudSettings,
} from './api/client';
import type { GeneratedAIContent } from './api/client';
import { textToPinyinChars } from './utils/pinyin';
import { setMasterVolume } from './utils/sound';

function App() {
  const { mode, isFinished, setMode, loadChars, loadArticle } = useTypingStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [openAIAfterAuth, setOpenAIAfterAuth] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const settingsStore = useSettingsStore();
  const settingsSnapshot = useMemo(() => getSettingsSnapshot(settingsStore), [settingsStore]);
  const { soundVolume } = settingsStore;
  const { records, wrongChars, replaceRecords, replaceWrongChars } = useHistoryStore();
  const { token, user, clearSession, setSession } = useAuthStore();
  const { setCloudArticles } = useArticleStore();
  const syncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    setMasterVolume(soundVolume / 100);
  }, [soundVolume]);

  useEffect(() => {
    applyDarkModeClass(settingsStore.darkMode);
  }, [settingsStore.darkMode]);

  useEffect(() => {
    fetchCloudArticles()
      .then((result) => setCloudArticles(result.articles))
      .catch(() => setCloudArticles([]));
  }, [setCloudArticles]);

  useEffect(() => {
    if (!token) return;
    if (syncedTokenRef.current === token) return;

    let active = true;
    syncedTokenRef.current = token;

    void (async () => {
      try {
        const [{ user: me }, { settings: remoteSettings }, syncedRecords, syncedWrongChars] = await Promise.all([
          fetchMe(token),
          fetchCloudSettings(token),
          batchSyncPracticeRecords(token, records),
          batchSyncWrongChars(token, Object.values(wrongChars)),
        ]);
        if (!active) return;
        setSession(token, me);
        useSettingsStore.getState().applySnapshot(remoteSettings);
        replaceRecords(syncedRecords.records);
        replaceWrongChars(syncedWrongChars.wrongChars);
      } catch (error) {
        syncedTokenRef.current = null;
        clearSession();
        window.alert(error instanceof Error ? error.message : '云端同步失败，请检查后端服务。');
      }
    })();

    return () => {
      active = false;
    };
  }, [clearSession, records, replaceRecords, replaceWrongChars, setSession, token, wrongChars]);

  useEffect(() => {
    if (!token || !user) return;
    const timer = window.setTimeout(() => {
      void saveCloudSettings(token, settingsSnapshot).catch(() => undefined);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [settingsSnapshot, token, user]);

  const handleAuthAction = async () => {
    if (!token) {
      setShowAuth(true);
      return;
    }

    setShowLogoutConfirm(true);
  };

  const handleShowAI = () => {
    if (!token) {
      setOpenAIAfterAuth(true);
      setShowAuth(true);
      return;
    }
    setShowAI(true);
  };

  const handleConfirmLogout = async () => {
    try {
      if (token) {
        await logout(token);
      }
    } finally {
      syncedTokenRef.current = null;
      clearSession();
      replaceRecords([]);
      replaceWrongChars([]);
      window.location.reload();
    }
  };

  const handleApplyAIContent = (content: GeneratedAIContent) => {
    if (content.type === 'article') {
      setMode('article');
      loadArticle(content.content);
      return;
    }

    const chars = textToPinyinChars(content.content).filter((item) => item.isChineseChar);
    setMode(content.type);
    loadChars(chars);
  };

  return (
    <div
      className="h-screen flex items-center justify-center px-4 py-3 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="w-full max-w-5xl flex flex-col rounded-2xl overflow-hidden shadow-lg h-full"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
        }}
      >
        <Header
          onShowHistory={() => setShowHistory(true)}
          onShowSettings={() => setShowSettings(true)}
          onShowAuth={() => { void handleAuthAction(); }}
          onShowAI={handleShowAI}
        />

        <main className="flex-1 flex flex-col items-center gap-3 px-6 py-3 min-h-0 overflow-hidden">
          <KeyboardMap />
          <div className="w-full max-w-4xl flex-1 min-h-0 flex flex-col items-center overflow-hidden">
            {mode === 'char' && <CharPractice />}
            {mode === 'phrase' && <PhrasePractice />}
            {mode === 'article' && <ArticlePractice />}
          </div>
          <StatsBar />
        </main>

        <footer
          className="flex items-center justify-center gap-4 py-3 text-xs"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
        >
          <span>小鹤双拼打字练习 · 键盘输入即开始</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <a
            href="https://flypy.cc/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            小鹤官网
          </a>
          <a
            href="https://rime.im/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            推荐 Rime 输入法
          </a>
        </footer>
      </div>

      {isFinished && <ResultPanel />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showAuth && (
        <AuthPanel
          onClose={() => {
            setShowAuth(false);
            setOpenAIAfterAuth(false);
          }}
          onSuccess={() => {
            if (openAIAfterAuth) {
              setShowAI(true);
              setOpenAIAfterAuth(false);
            }
          }}
        />
      )}
      {showAI && <AICoachPanel onClose={() => setShowAI(false)} onApplyContent={handleApplyAIContent} />}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="退出登录"
        message="确认退出当前云端账号吗？退出后会清除本机登录态并刷新页面。"
        confirmText="确认退出"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          void handleConfirmLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}

export default App;
