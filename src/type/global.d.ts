declare global {
  interface Window {
    gtag: (
      command: 'js' | 'config' | 'event',
      targetId: string | Date,
      params?: Record<string, unknown>
    ) => void;
  }
}

export {};