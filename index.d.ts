import type { Data as _Data } from "./src/types";

declare global {
  interface Data<TClient = unknown, TServer = unknown> {
    client?: TClient;
    server?: TServer;
    meta: {
      updatedAt: number;
      createdAt: number;
      expiresAt: number;
    };
  }
}

export type { Data };
