import type { masterRequest } from "frame-master/server/request";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SESSION_DATA_ENDPOINT, type Data as _Data } from "./types";

export type SessionManagerOptions<
  Data extends _Data<any, any> = {
    client: any;
    server: any;
    meta: any;
  }
> = {
  data?: Data;
};

class SessionManager<
  Data extends _Data<any, any> = {
    client: any;
    server: any;
    meta: any;
  }
> {
  private clientSessionData: Data["client"] | null = null;
  private serverSessionData: Data["server"] | null = null;
  public metaData: _Data<any, any>["meta"] | null = null;

  private isInited: boolean = false;

  constructor(options?: SessionManagerOptions<Data>) {
    if (options?.data) {
      this.clientSessionData = options.data.client;
      this.serverSessionData = options.data.server;
      this.isInited = true;
    }
  }

  private _ensureInit() {
    if (this.isInited) return;
    throw new Error(
      "SessionManager not initialized. Call init() before using."
    );
  }
  /**
   * Gets the combined session data from both client and server.
   *
   * @returns The combined session data.
   */
  getData() {
    return {
      client: this.clientSessionData,
      server: this.serverSessionData,
    } as Data;
  }
  async init() {
    if (this.isInited) return;
    const res = await fetch(SESSION_DATA_ENDPOINT);
    if (res.ok) {
      const data = (await res.json()) as Omit<Data, "server">;
      this.clientSessionData = data.client;
      this.metaData = data.meta;
    }
    this.isInited = true;
  }
  /**
   * Resets the session manager, forcing a re-initialization.
   *
   * Useful for scenarios where the session data might have changed
   * and needs to be refreshed.
   */
  reset() {
    this.isInited = false;
    return this.init();
  }
}

export type SessionProviderProps = {
  children?: ReactNode;
};

const SessionContext = createContext<SessionManager | null>(null);

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionManager, setSessionManager] = useState(new SessionManager());
  const [init, setInit] = useState(false);
  useEffect(() => {
    sessionManager.init().then(() => setInit(true));
  }, []);
  return (
    <SessionContext.Provider value={sessionManager}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
