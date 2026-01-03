declare global {
  interface SessionData<TClient = unknown, TServer = unknown> {
    client?: TClient;
    server?: TServer;
    meta: {
      updatedAt: number;
      createdAt: number;
      expiresAt: number;
    };
  }
}

export type { SessionData };
