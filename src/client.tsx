import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Context,
  type ReactNode,
} from "react";
import { SESSION_DATA_ENDPOINT } from "./types";

export type SessionManagerOptions = {
  data?: Data;
};

class SessionManager {
  private clientSessionData: Data["client"] | null = null;
  private serverSessionData: Data["server"] | null = null;
  public metaData: Data["meta"] | null = null;
  private onChangeCallbacks: Map<string, () => void> = new Map();

  private isInited: boolean = false;

  constructor(options?: SessionManagerOptions) {
    if (options?.data) {
      this.clientSessionData = options.data.client;
      this.serverSessionData = options.data.server;
      this.isInited = true;
    }
  }

  addOnChangeCallback(callback: () => void) {
    const id = crypto.randomUUID();
    this.onChangeCallbacks.set(id, callback);
    return id;
  }

  removeOnChangeCallback(id: string) {
    this.onChangeCallbacks.delete(id);
  }

  /**
   * Gets the combined session data from both client and server.
   *
   * @returns The combined session data.
   */
  getData(): {
    client: null | Data["client"];
    server: null | Data["server"];
    meta: null | Data["meta"];
  } {
    return {
      client: this.clientSessionData,
      server: this.serverSessionData,
      meta: this.metaData,
    };
  }
  getMetaData() {
    return this.metaData;
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
    this.onChangeCallbacks.forEach((cb) => cb());
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

declare global {
  var __SESSION_CONTEXT__: Context<SessionManager | null>;
}

globalThis.__SESSION_CONTEXT__ ??= createContext<SessionManager | null>(null);

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionManager, setSessionManager] = useState(new SessionManager());
  useEffect(() => {
    sessionManager.init();
  }, []);
  return (
    <globalThis.__SESSION_CONTEXT__.Provider value={sessionManager}>
      {children}
    </globalThis.__SESSION_CONTEXT__.Provider>
  );
}

export function useEnsureContext() {
  const context = useContext(globalThis.__SESSION_CONTEXT__);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export function useRerenderOnSessionChange() {
  const context = useContext(globalThis.__SESSION_CONTEXT__);
  const [signal, setSignal] = useState(0);
  useEnsureContext();
  const id =
    typeof window !== "undefined"
      ? useMemo(
          () => context!.addOnChangeCallback(() => setSignal((s) => s + 1)),
          []
        )
      : null;
  useEffect(() => {
    return () => {
      if (id) {
        context!.removeOnChangeCallback(id);
      }
    };
  }, [id, context]);

  return signal;
}

export function useSession() {
  const context = useContext(globalThis.__SESSION_CONTEXT__);
  useRerenderOnSessionChange();
  useEnsureContext();
  return context!;
}
