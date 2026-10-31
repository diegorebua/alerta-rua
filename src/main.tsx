import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { ptBR } from '@clerk/localizations';
import App from './App';
import './index.css';

const CLERK_STORAGE_KEY = 'alerta_rua_clerk_pk';
const DEFAULT_CLERK_PUBLISHABLE_KEY =
  'pk_test_c2F2aW5nLWNvd2JpcmQtNzU3OS5jbGVyay5hY2NvdW50cy5kZXYk';

export function getStoredClerkKey(): string {
  try {
    return (
      (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string) ||
      localStorage.getItem(CLERK_STORAGE_KEY) ||
      DEFAULT_CLERK_PUBLISHABLE_KEY
    ).trim();
  } catch {
    return (
      (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string) || DEFAULT_CLERK_PUBLISHABLE_KEY
    ).trim();
  }
}

export function setStoredClerkKey(key: string): void {
  const clean = key.trim();
  if (clean) {
    localStorage.setItem(CLERK_STORAGE_KEY, clean);
  } else {
    localStorage.removeItem(CLERK_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent('alerta-rua:clerk-key-changed', { detail: clean }));
}

function RootProvider() {
  const [clerkKey, setClerkKey] = useState<string>(() => getStoredClerkKey());

  useEffect(() => {
    const handleKeyChange = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setClerkKey(custom.detail || getStoredClerkKey());
    };
    window.addEventListener('alerta-rua:clerk-key-changed', handleKeyChange);

    if (!clerkKey) {
      fetch('/api/config')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.clerkPublishableKey) {
            setClerkKey(data.clerkPublishableKey);
          }
        })
        .catch(() => {});
    }

    return () => window.removeEventListener('alerta-rua:clerk-key-changed', handleKeyChange);
  }, [clerkKey]);

  const isValidClerkKey = /^pk_(test|live)_/.test(clerkKey);

  if (isValidClerkKey) {
    return (
      <ClerkProvider
        publishableKey={clerkKey}
        localization={ptBR}
        afterSignOutUrl="/"
      >
        <BrowserRouter>
          <App clerkActive={true} />
        </BrowserRouter>
      </ClerkProvider>
    );
  }

  return (
    <BrowserRouter>
      <App clerkActive={false} />
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <RootProvider />
    </React.StrictMode>
  );
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Falha ao registrar Service Worker do PWA:', err);
    });
  });
}
