import './ToastCenter.css'
import { useGameStore } from '../store/useGameStore.js'

export function ToastCenter() {
  const toasts = useGameStore((state) => state.toasts)

  if (!toasts.length) {
    return null
  }

  return (
    <div className="cr2-toast-center" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'cr2-toast-center__item',
            `cr2-toast-center__item--${toast.tone}`,
          ].join(' ')}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
