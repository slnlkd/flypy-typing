import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  analyzeCoach,
  askAI,
  generateAIContent,
  generateCoachTasks,
  ingestKnowledgeDocument,
  type GeneratedAIContent,
} from '../../api/client';
import { useAuthStore } from '../../stores/authStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useAIStore } from '../../stores/aiStore';
import { renderMarkdownToHtml } from '../../utils/markdown';

const GOAL_OPTIONS = ['综合提升', '提升速度', '提升正确率', '专项声母', '专项韵母', '文章稳定性'] as const;
type AITab = 'analysis' | 'next' | 'knowledge';
const SURFACE_CARD_CLASS = 'rounded-[18px]';
const INPUT_CLASS = 'w-full rounded-[18px] px-4 py-3 text-sm';
const UNIFIED_ACTION_BUTTON_CLASS =
  'inline-flex min-h-[34px] items-center justify-center rounded-[14px] px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors border';

export function AICoachPanel({
  onClose,
  onApplyContent,
}: {
  onClose: () => void;
  onApplyContent: (content: GeneratedAIContent) => void;
}) {
  const history = useHistoryStore();
  const { token, user } = useAuthStore();
  const {
    goal,
    question,
    analysis,
    tasksSummary,
    tasks,
    generatedContent,
    answer,
    error,
    isAnalyzing,
    isGeneratingTasks,
    isGeneratingContent,
    isAnswering,
    isIngestingKnowledge,
    setGoal,
    setQuestion,
    startAnalyze,
    finishAnalyze,
    startGenerateTasks,
    finishGenerateTasks,
    startGenerateContent,
    finishGenerateContent,
    startAnswer,
    finishAnswer,
    startIngestKnowledge,
    finishIngestKnowledge,
    setError,
  } = useAIStore();
  const [contentType, setContentType] = useState<GeneratedAIContent['type']>('article');
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeContent, setKnowledgeContent] = useState('');
  const [knowledgeMessage, setKnowledgeMessage] = useState('');
  const [activeTab, setActiveTab] = useState<AITab>('analysis');
  const [isPending, startTransition] = useTransition();
  const canUseAI = Boolean(token && user);
  const isAdmin = Boolean(user?.isAdmin);

  const records = useMemo(
    () =>
      history.records.map((item) => ({
        mode: item.mode,
        speed: item.speed,
        accuracy: item.accuracy,
        totalChars: item.totalChars,
        correctChars: item.correctChars,
        wrongChars: item.wrongChars,
        maxCombo: item.maxCombo,
        duration: item.duration,
        date: item.date,
      })),
    [history.records]
  );
  const wrongChars = useMemo(() => Object.values(history.wrongChars), [history.wrongChars]);

  const runAction = (action: () => Promise<void>) => {
    startTransition(() => {
      void action().catch((err) => {
        setError(err instanceof Error ? err.message : 'AI 请求失败');
      });
    });
  };

  const ensureAuthenticated = () => {
    if (canUseAI && token) {
      return token;
    }
    setError('请先登录后再使用 AI 功能');
    return null;
  };

  const handleAnalyze = () => {
    const authToken = ensureAuthenticated();
    if (!authToken) return;
    startAnalyze();
    runAction(async () => {
      const result = await analyzeCoach(authToken, goal, records, wrongChars);
      finishAnalyze(result);
    });
  };

  const handleGenerateTasks = () => {
    const authToken = ensureAuthenticated();
    if (!authToken) return;
    startGenerateTasks();
    runAction(async () => {
      const result = await generateCoachTasks(authToken, goal, records, wrongChars);
      finishGenerateTasks(result.summary, result.tasks);
    });
  };

  const handleGenerateContent = () => {
    const authToken = ensureAuthenticated();
    if (!authToken) return;
    startGenerateContent();
    runAction(async () => {
      const result = await generateAIContent(authToken, goal, contentType, records, wrongChars);
      finishGenerateContent(result);
    });
  };

  const handleAsk = () => {
    const authToken = ensureAuthenticated();
    if (!authToken) return;
    if (!question.trim()) {
      setError('请输入问题');
      return;
    }
    startAnswer();
    runAction(async () => {
      const result = await askAI(authToken, question.trim(), records, wrongChars);
      finishAnswer(result);
    });
  };

  const handleIngestKnowledge = () => {
    if (!token) {
      setError('请先登录管理员账号');
      return;
    }
    if (!isAdmin) {
      setError('当前账号不是管理员，无法导入知识库');
      return;
    }
    if (!knowledgeTitle.trim() || !knowledgeContent.trim()) {
      setError('请输入知识标题和正文');
      return;
    }

    startIngestKnowledge();
    setKnowledgeMessage('');
    runAction(async () => {
      const result = await ingestKnowledgeDocument(token, 'flypy-coach', {
        title: knowledgeTitle.trim(),
        content: knowledgeContent.trim(),
        metadata: { tags: ['前端导入', '知识库'] },
      });
      setKnowledgeMessage(`导入成功，已写入 ${result.chunkCount} 个分片。`);
      setKnowledgeTitle('');
      setKnowledgeContent('');
      finishIngestKnowledge();
    });
  };

  const busy =
    isPending || isAnalyzing || isGeneratingTasks || isGeneratingContent || isAnswering || isIngestingKnowledge;
  const activeTabMeta: Record<AITab, { title: string; summary: string }> = {
    analysis: {
      title: '教练分析',
      summary: '先选训练目标，再生成分析结论，并围绕结果继续追问。',
    },
    next: {
      title: '下一步训练',
      summary: '把分析结果转成训练方案和练习材料，并可直接载入练习区。',
    },
    knowledge: {
      title: '知识库管理',
      summary: '仅管理员可用，用于追加知识文档并更新问答检索内容。',
    },
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  useEffect(() => {
    if (activeTab === 'knowledge' && !isAdmin) {
      setActiveTab('analysis');
    }
  }, [activeTab, isAdmin]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-5"
      style={{ backgroundColor: 'rgba(8, 15, 27, 0.54)' }}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-[30px] shadow-2xl"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--bg-primary) 94%, white 6%) 0%, var(--bg-primary) 100%)',
          border: '1px solid color-mix(in srgb, var(--border) 82%, white 18%)',
        }}
      >
        <div
          className="px-7 py-5"
          style={{
            borderBottom: '1px solid var(--border)',
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 55%)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 min-w-0">
              <div>
                <h2 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: 'var(--text-primary)' }}>
                  AI 教练工作台
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)] border border-[var(--border)]"
              aria-label="关闭 AI 教练"
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>✕</span>
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="训练记录" value={`${records.length}`} />
            <SummaryCard label="当前目标" value={goal} />
            <SummaryCard label="账号状态" value={user ? user.displayName : '未登录'} />
          </div>
        </div>

        <div className="max-h-[calc(92vh-170px)] overflow-y-auto custom-scrollbar px-6 pb-6 pt-5">
          <div className="space-y-5">
            <div
              className="inline-flex flex-wrap gap-2 rounded-[18px] p-2"
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')}>
                教练分析
              </TabButton>
              <TabButton active={activeTab === 'next'} onClick={() => setActiveTab('next')}>
                下一步训练
              </TabButton>
              {isAdmin ? (
                <TabButton active={activeTab === 'knowledge'} onClick={() => setActiveTab('knowledge')}>
                  知识库管理
                </TabButton>
              ) : null}
            </div>

            {canUseAI ? (
              <div
                className="rounded-[20px] px-5 py-4"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
              >
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {activeTabMeta[activeTab].title}
                </div>
                <div className="mt-1 text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                  {activeTabMeta[activeTab].summary}
                </div>
              </div>
            ) : null}

            {!canUseAI ? (
              <Panel>
                <PanelHeader title="教练分析" />
                <EmptyState text="请先登录后再使用 AI 教练" />
              </Panel>
            ) : (
              <>
                {activeTab === 'analysis' ? (
                <Panel>
                  <PanelHeader
                    title="教练分析"
                    action={
                      <ActionButton onClick={handleAnalyze} variant="primary" disabled={busy}>
                        {isAnalyzing ? '分析中...' : '开始分析'}
                      </ActionButton>
                    }
                  />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-[13px] font-semibold tracking-[0.01em]" style={{ color: 'var(--text-primary)' }}>
                        当前训练目标
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {GOAL_OPTIONS.map((item) => (
                          <ActionButton
                            key={item}
                            onClick={() => setGoal(item)}
                            variant={goal === item ? 'primary' : 'secondary'}
                          >
                            {item}
                          </ActionButton>
                        ))}
                      </div>
                    </div>

                    {analysis ? (
                      <div className="space-y-4">
                        <div
                          className={`${SURFACE_CARD_CLASS} p-4`}
                          style={{
                            background:
                              'linear-gradient(180deg, color-mix(in srgb, var(--bg-primary) 88%, white 12%) 0%, var(--bg-primary) 100%)',
                          }}
                        >
                          <div className="text-sm leading-7" style={{ color: 'var(--text-primary)' }}>
                            {analysis.summary}
                          </div>
                        </div>

                        <SubCard title="推荐重点">
                          <div className="flex flex-wrap gap-2">
                            {analysis.recommendedFocus.map((item) => (
                              <span
                                key={item}
                                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </SubCard>

                        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                          <SubCard title="主要弱项">
                            {analysis.weaknesses.map((item) => (
                              <div
                                key={item}
                                className={`${SURFACE_CARD_CLASS} px-3 py-2 text-sm leading-6`}
                                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                              >
                                {item}
                              </div>
                            ))}
                          </SubCard>
                          <SubCard title="知识依据">
                            {analysis.citations.map((item) => (
                              <div
                                key={item.title}
                                className={`${SURFACE_CARD_CLASS} px-3 py-3`}
                                style={{ backgroundColor: 'var(--bg-primary)' }}
                              >
                                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {item.title}
                                </div>
                                <div className="mt-1 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
                                  {item.content}
                                </div>
                              </div>
                            ))}
                          </SubCard>
                        </div>
                      </div>
                    ) : (
                      <EmptyState text="暂无分析结果" />
                    )}

                    <div className="space-y-3">
                      <PanelHeader
                        title="继续追问"
                        action={
                          <ActionButton onClick={handleAsk} variant="secondary" disabled={busy}>
                            {isAnswering ? '回答中...' : '继续追问'}
                          </ActionButton>
                        }
                      />
                      <textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        className="h-24 w-full resize-none rounded-[18px] p-4 text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          outline: 'none',
                        }}
                        placeholder="输入你想继续追问的问题"
                      />

                      {answer ? (
                        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                          <div
                            className="rounded-[18px] p-4 text-sm leading-7 [&_h1]:mb-3 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:list-disc [&_strong]:font-semibold [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5"
                            style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(answer.answer) }}
                          />
                          <SubCard title="引用来源">
                            {answer.citations.map((item) => (
                              <div
                                key={item.title}
                                className={`${SURFACE_CARD_CLASS} px-3 py-3`}
                                style={{ backgroundColor: 'var(--bg-primary)' }}
                              >
                                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {item.title}
                                </div>
                                <div className="mt-1 text-xs leading-5" style={{ color: 'var(--text-muted)' }}>
                                  {item.content}
                                </div>
                              </div>
                            ))}
                          </SubCard>
                        </div>
                      ) : (
                        <EmptyState text="暂无问答结果" />
                      )}
                    </div>
                  </div>
                </Panel>
                ) : null}

                {activeTab === 'next' ? (
                <Panel>
                  <PanelHeader title="下一步训练" />

                  <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-4">
                      <PanelHeader
                        title="训练方案"
                        action={
                          <ActionButton onClick={handleGenerateTasks} variant="secondary" disabled={busy}>
                            {isGeneratingTasks ? '生成中...' : '生成训练方案'}
                          </ActionButton>
                        }
                      />

                      {tasks.length > 0 ? (
                        <div className="space-y-3">
                          {tasksSummary ? (
                            <div
                              className={`${SURFACE_CARD_CLASS} px-3 py-3 text-sm leading-6`}
                              style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                            >
                              {tasksSummary}
                            </div>
                          ) : null}
                          {tasks.map((item) => (
                            <div
                              key={`${item.title}-${item.focus}`}
                              className={`${SURFACE_CARD_CLASS} p-4`}
                              style={{ backgroundColor: 'var(--bg-primary)' }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {item.title}
                                </div>
                                <span
                                  className="rounded-full px-2 py-1 text-[11px] font-semibold"
                                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                                >
                                  {item.focus}
                                </span>
                              </div>
                              <div className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                                {item.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState text="暂无训练方案" />
                      )}
                    </div>

                    <div className="space-y-4">
                      <PanelHeader
                        title="练习材料"
                        action={
                          <ActionButton onClick={handleGenerateContent} variant="primary" disabled={busy}>
                            {isGeneratingContent ? '生成中...' : '生成练习材料'}
                          </ActionButton>
                        }
                      />

                      <div className="grid grid-cols-3 gap-2">
                        {(['article', 'phrase', 'char'] as GeneratedAIContent['type'][]).map((item) => (
                          <ActionButton
                            key={item}
                            onClick={() => setContentType(item)}
                            variant={contentType === item ? 'primary' : 'secondary'}
                          >
                            {item === 'article' ? '文章' : item === 'phrase' ? '词组' : '单字'}
                          </ActionButton>
                        ))}
                      </div>

                      {generatedContent ? (
                        <div className="space-y-4">
                          <div className={`${SURFACE_CARD_CLASS} p-4`} style={{ backgroundColor: 'var(--bg-primary)' }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {generatedContent.title}
                                </div>
                                <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {generatedContent.tags.join(' / ')}
                                </div>
                              </div>
                              <span
                                className="rounded-full px-2 py-1 text-[11px] font-semibold"
                                style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                              >
                                {generatedContent.type === 'article' ? '文章' : generatedContent.type === 'phrase' ? '词组' : '单字'}
                              </span>
                            </div>
                            <div
                              className="mt-4 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-6"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {generatedContent.content}
                            </div>
                          </div>
                          <ActionButton
                            onClick={() => {
                              onApplyContent(generatedContent);
                              onClose();
                            }}
                            variant="primary"
                            className="w-full"
                          >
                            载入到练习区
                          </ActionButton>
                        </div>
                      ) : (
                        <EmptyState text="暂无练习材料" />
                      )}
                    </div>
                  </div>
                </Panel>
                ) : null}

                {isAdmin && activeTab === 'knowledge' ? (
                  <Panel>
                    <PanelHeader
                      title="知识库管理"
                      action={
                        <ActionButton onClick={handleIngestKnowledge} variant="secondary" disabled={busy}>
                          {isIngestingKnowledge ? '导入中...' : '导入知识'}
                        </ActionButton>
                      }
                    />
                    <div className="space-y-4">
                      <input
                        value={knowledgeTitle}
                        onChange={(event) => setKnowledgeTitle(event.target.value)}
                        className={INPUT_CLASS}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          outline: 'none',
                        }}
                        placeholder="知识标题"
                      />
                      <textarea
                        value={knowledgeContent}
                        onChange={(event) => setKnowledgeContent(event.target.value)}
                        className="h-32 w-full resize-none rounded-[18px] p-4 text-sm"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          outline: 'none',
                        }}
                        placeholder="粘贴知识正文"
                      />
                      {knowledgeMessage ? <EmptyState text={knowledgeMessage} /> : null}
                    </div>
                  </Panel>
                ) : null}
              </>
            )}

            {error ? (
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-6"
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  color: 'var(--error)',
                  border: '1px solid rgba(220, 38, 38, 0.22)',
                }}
              >
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] px-4 py-4" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <div className="text-[11px] font-semibold tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="mt-1 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function Panel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[20px] p-5 space-y-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.04)',
      }}
    >
      {children}
    </section>
  );
}

function PanelHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function SubCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-[13px] font-semibold tracking-[0.01em]" style={{ color: 'var(--text-primary)' }}>{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-[18px] px-4 py-3 text-sm leading-6"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}
    >
      {text}
    </div>
  );
}

function ActionButton({
  children,
  variant,
  className = '',
  disabled = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: 'primary' | 'secondary';
}) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`${UNIFIED_ACTION_BUTTON_CLASS} ${className}`.trim()}
      style={{
        backgroundColor: variant === 'primary' ? 'var(--accent)' : 'var(--bg-primary)',
        color: variant === 'primary' ? '#fff' : 'var(--text-secondary)',
        borderColor: variant === 'primary' ? 'var(--accent)' : 'var(--border)',
        opacity: disabled ? 0.6 : 1,
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex min-h-[34px] items-center justify-center rounded-[14px] px-3 py-1.5 text-xs font-semibold transition-colors border"
      style={{
        backgroundColor: active ? 'var(--accent)' : 'var(--bg-primary)',
        color: active ? '#fff' : 'var(--text-secondary)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
      }}
    >
      {children}
    </button>
  );
}
