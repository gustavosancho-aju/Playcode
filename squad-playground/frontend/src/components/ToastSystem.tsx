import { useToastStore, type ToastType } from '../stores/useToastStore';

const TOAST_STYLES: Record<ToastType, { border: string; bg: string; text: string; icon: string }> = {
  success: { border: 'border-matrix-green', bg: 'bg-green-900/90', text: 'text-green-200', icon: '✓' },
  error: { border: 'border-red-500', bg: 'bg-red-900/90', text: 'text-red-200', icon: '✗' },
  warning: { border: 'border-yellow-500', bg: 'bg-yellow-900/90', text: 'text-yellow-200', icon: '⚠' },
  info: { border: 'border-blue-500', bg: 'bg-blue-900/90', text: 'text-blue-200', icon: 'ℹ' },
};

export function ToastSystem() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto ${style.bg} border ${style.border} rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 animate-slide-down`}
          >
            <span className={`${style.text} text-lg font-bold`}>{style.icon}</span>
            <p className={`${style.text} font-mono text-xs flex-1`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
