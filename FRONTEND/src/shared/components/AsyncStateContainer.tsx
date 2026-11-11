import type { ReactNode } from 'react';
import type { ApiError } from '../api/types';

export interface AsyncStateContainerProps {
  isLoading: boolean;
  error: ApiError | null;
  hasData: boolean;
  emptyMessage: string;
  children: ReactNode;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyAction?: ReactNode;
  className?: string;
}


export function AsyncStateContainer({
  isLoading,
  error,
  hasData,
  emptyMessage,
  children,
  onRetry,
  loadingMessage = 'Cargando información…',
  emptyTitle = 'No hay información para mostrar',
  emptyAction,
  className = '',
}: AsyncStateContainerProps) {
  if (isLoading) {
    return (
      <section
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={`rounded-2xl border border-stone-200/90 bg-white/90 p-6 shadow-sm ${className}`.trim()}
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-700"
          />
          <p className="m-0 text-sm font-medium text-stone-700">
            {loadingMessage}
          </p>
        </div>

        <div className="mt-5 space-y-3 animate-pulse" aria-hidden="true">
          <div className="h-4 w-2/5 rounded-md bg-stone-200/80" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-xl bg-stone-200/70" />
            <div className="h-24 rounded-xl bg-stone-200/70" />
            <div className="hidden h-24 rounded-xl bg-stone-200/70 sm:block" />
          </div>
          <div className="h-3.5 w-4/5 rounded-md bg-stone-200/60" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className={`rounded-2xl border border-red-200 bg-red-50/95 p-6 text-red-950 shadow-sm ${className}`.trim()}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-sm font-semibold text-red-900">
                  No se pudo completar la operación
                </h3>
              </div>
              <p className="m-0 text-sm leading-relaxed text-red-800">
                {error.message}
              </p>
            </div>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Reintentar
            </button>
          )}
        </div>
      </section>
    );
  }

  if (!hasData) {
    return (
      <section
        aria-live="polite"
        className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/90 px-6 py-12 text-center ${className}`.trim()}
      >
        <div
          aria-hidden="true"
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-200/80 text-stone-600"
        >
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 2v4" />
            <path d="M16 2v4" />
          </svg>
        </div>

        <h3 className="m-0 text-base font-semibold text-stone-800">
          {emptyTitle}
        </h3>
        <p className="mt-1.5 mb-0 max-w-md text-sm leading-relaxed text-stone-600">
          {emptyMessage}
        </p>

        {emptyAction && <div className="mt-5">{emptyAction}</div>}
      </section>
    );
  }

  return <>{children}</>;
}

export default AsyncStateContainer;

