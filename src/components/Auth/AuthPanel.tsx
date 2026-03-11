import { useEffect, useRef, useState } from 'react';
import { createEmailCode, loginWithEmailCode } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPanel({ onClose }: { onClose: () => void }) {
  const demoFallbackEnabled = import.meta.env.VITE_ENABLE_DEMO_FALLBACK === 'true';
  const { setSession } = useAuthStore();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'info' | 'error' | 'success'>('info');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  const normalizedEmail = email.trim().toLowerCase();
  const emailError =
    email.length === 0
      ? ''
      : normalizedEmail.length > 64
        ? '邮箱长度不能超过 64 个字符'
        : !EMAIL_PATTERN.test(normalizedEmail)
          ? '请输入有效的邮箱地址'
          : '';
  const isEmailValid = normalizedEmail.length > 0 && !emailError;
  const normalizedCode = code.trim();
  const canSubmitLogin = isEmailValid && normalizedCode.length > 0 && !isSubmitting;

  const handleSendCode = async () => {
    if (!isEmailValid) {
      setMessageTone('error');
      setMessage(emailError || '请输入有效的邮箱地址');
      return;
    }
    try {
      setIsSending(true);
      setDemoCode('');
      setCodeError('');
      setCodeSuccess(false);
      const result = await createEmailCode(normalizedEmail);
      if (result.demoCode) {
        setDemoCode(result.demoCode);
        setMessageTone('info');
        setMessage(`演示验证码：${result.demoCode}（10 分钟内有效）`);
      } else {
        setMessageTone('success');
        setMessage(result.message || '验证码已发送，请查收邮箱');
      }
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : '验证码发送失败');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogin = async () => {
    if (!isEmailValid) {
      setMessageTone('error');
      setMessage(emailError || '请输入有效的邮箱地址');
      return;
    }
    if (normalizedCode.length < 6) {
      setCodeError('请输入 6 位验证码');
      setCodeSuccess(false);
      setMessageTone('error');
      setMessage('请输入 6 位验证码');
      return;
    }
    try {
      setIsSubmitting(true);
      setCodeError('');
      setCodeSuccess(false);
      const result = await loginWithEmailCode(normalizedEmail, normalizedCode);
      setCodeSuccess(true);
      setMessageTone('success');
      setMessage('验证成功，正在登录...');
      window.setTimeout(() => {
        setIsSubmitting(false);
        setSession(result.token, result.user);
        onClose();
      }, 600);
    } catch (error) {
      setIsSubmitting(false);
      setCodeError('验证码错误或已过期');
      setCodeSuccess(false);
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : '登录失败');
      return;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(circle at top, rgba(99,102,241,0.14), transparent 28%), rgba(15,23,42,0.46)',
      }}
      onKeyDownCapture={(event) => {
        event.stopPropagation();
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[28px] border shadow-2xl"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 96%, white 4%) 0%, var(--bg-card) 100%)',
          borderColor: 'color-mix(in srgb, var(--border) 86%, white 14%)',
          boxShadow: '0 24px 80px rgba(15,23,42,0.24)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="登录云同步"
      >
        <div
          className="relative px-7 pt-7 pb-5"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 58%)',
            borderBottom: '1px solid color-mix(in srgb, var(--border) 78%, white 22%)',
          }}
        >
          <div
            className="absolute right-[-40px] top-[-52px] h-32 w-32 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', filter: 'blur(12px)' }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-light) 75%, white 25%)',
                  color: 'var(--accent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 16%, transparent)',
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: demoFallbackEnabled ? '#f59e0b' : '#22c55e' }}
                />
                <span>{demoFallbackEnabled ? 'DEMO MODE' : 'CLOUD SYNC'}</span>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: 'var(--text-primary)' }}>
                  登录云同步
                </h2>
                <p className="max-w-md text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                  登录后可同步设置、练习记录和易错统计，在不同设备上延续同一份训练进度。
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-muted)',
                backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 88%, white 12%)',
              }}
              aria-label="关闭"
              title="关闭"
            >
              <span className="text-base leading-none">✕</span>
            </button>
          </div>
        </div>

        <div className="px-7 py-6 space-y-5">
          <label className="block space-y-2.5">
            <span className="text-sm font-semibold tracking-[0.01em]" style={{ color: 'var(--text-primary)' }}>
              邮箱
            </span>
            <input
              ref={emailInputRef}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage('');
              }}
              placeholder="you@example.com"
              className="w-full rounded-2xl border px-4 py-3.5 text-sm transition-all outline-none"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 88%, white 12%)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
                boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04)',
              }}
            />
            {emailError && (
              <p className="text-xs px-1" style={{ color: 'var(--error)' }}>
                {emailError}
              </p>
            )}
          </label>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="space-y-2.5">
              <span className="text-sm font-semibold tracking-[0.01em]" style={{ color: 'var(--text-primary)' }}>
                验证码
              </span>
              <input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setCodeError('');
                  setCodeSuccess(false);
                  setMessage('');
                }}
                placeholder="6 位数字"
                className="w-full rounded-2xl border px-4 py-3.5 text-sm transition-all outline-none"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--bg-secondary) 88%, white 12%)',
                  borderColor: codeError ? 'var(--error)' : codeSuccess ? 'var(--success)' : 'var(--border)',
                  color: 'var(--text-primary)',
                  boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04)',
                }}
              />
              {codeError && (
                <p className="text-xs px-1" style={{ color: 'var(--error)' }}>
                  {codeError}
                </p>
              )}
              {codeSuccess && (
                <p className="text-xs px-1" style={{ color: 'var(--success)' }}>
                  验证成功
                </p>
              )}
            </label>
            <button
              onClick={handleSendCode}
              disabled={isSending || !isEmailValid}
              className="btn-secondary h-[46px] justify-center rounded-xl px-4 text-sm sm:min-w-[108px]"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-light) 72%, white 28%)',
                borderColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                opacity: isSending || !isEmailValid ? 0.6 : 1,
              }}
            >
              {isSending ? '发送中...' : '获取验证码'}
            </button>
          </div>

          {demoCode && (
            <div
              className="rounded-2xl border px-4 py-4 text-sm"
              style={{
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--bg-secondary) 82%, white 18%) 0%, var(--bg-secondary) 100%)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <div className="text-xs mb-1.5 uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                演示验证码
              </div>
              <span className="font-bold tracking-[0.3em] text-lg">{demoCode}</span>
            </div>
          )}

          {message && (
            <div
              className="rounded-2xl px-4 py-4 text-sm leading-6 mb-2"
              style={{
                background:
                  messageTone === 'error'
                    ? 'linear-gradient(180deg, color-mix(in srgb, var(--error) 12%, white 88%) 0%, color-mix(in srgb, var(--error) 8%, white 92%) 100%)'
                    : messageTone === 'success'
                      ? 'linear-gradient(180deg, color-mix(in srgb, var(--success) 14%, white 86%) 0%, color-mix(in srgb, var(--success) 8%, white 92%) 100%)'
                      : 'linear-gradient(180deg, color-mix(in srgb, var(--accent-light) 76%, white 24%) 0%, var(--accent-light) 100%)',
                color:
                  messageTone === 'error'
                    ? 'var(--error)'
                    : messageTone === 'success'
                      ? 'var(--success)'
                      : 'var(--text-secondary)',
                border:
                  messageTone === 'error'
                    ? '1px solid color-mix(in srgb, var(--error) 20%, transparent)'
                    : messageTone === 'success'
                      ? '1px solid color-mix(in srgb, var(--success) 20%, transparent)'
                      : '1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
              }}
            >
              {message}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!canSubmitLogin}
            className="btn-primary mt-4 w-full justify-center rounded-2xl py-3.5 text-sm font-semibold"
            style={{
              background:
                'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 82%, black 18%) 100%)',
              boxShadow: '0 14px 32px color-mix(in srgb, var(--accent) 24%, transparent)',
              opacity: canSubmitLogin ? 1 : 0.6,
            }}
          >
            {isSubmitting ? '登录中...' : '登录并同步'}
          </button>
        </div>
      </div>
    </div>
  );
}
