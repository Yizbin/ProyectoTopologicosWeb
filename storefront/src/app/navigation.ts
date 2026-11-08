import { useSyncExternalStore } from 'react';

const navigationEvent = 'storefront:navigate';

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener(navigationEvent, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(navigationEvent, listener);
  };
}

function getLocation() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function useLocation() {
  return useSyncExternalStore(subscribe, getLocation, () => '/');
}

export function navigate(to: string, replace = false) {
  if (replace) window.history.replaceState({}, '', to);
  else window.history.pushState({}, '', to);
  window.dispatchEvent(new Event(navigationEvent));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return '/reservations';
  return value;
}
