declare global {
  namespace globalThis {
    /**
     * Extend this interface to add custom client-side session data.
     * @example
     * declare global {
     *   namespace globalThis {
     *     interface SessionDataClient {
     *       userId: string;
     *     }
     *   }
     * }
     */
    interface SessionDataClient {}

    /**
     * Extend this interface to add custom server-side session data.
     * @example
     * declare global {
     *   namespace globalThis {
     *     interface SessionDataServer {
     *       secretInfo: string;
     *     }
     *   }
     * }
     */
    interface SessionDataServer {}

    interface SessionData {
      client?: SessionDataClient;
      server?: SessionDataServer;
      meta: {
        updatedAt: number;
        createdAt: number;
        expiresAt: number;
      };
    }
  }
}

export {};
