import type { masterRequest } from "frame-master/server/request";
import type { SessionPluginContext } from "..";

function createExpirationDate(currentExpiration: number): number {
  if (
    !globalThis.__PLUGIN_SESSION_OPTIONS__.updateSessionExpirationOnActivity
  ) {
    return currentExpiration;
  }
  return (
    Date.now() +
    (globalThis.__PLUGIN_SESSION_OPTIONS__.cookieOptions?.maxAge ??
      60 * 60 * 24) *
      1000
  );
}
export default function SessionManager(master: masterRequest) {
  return {
    /**
     * Sets the session data for the current request.
     *
     * Merges the provided data with the existing session data.
     */
    setSessionData(
      data: Omit<Partial<globalThis.SessionData>, "meta"> & {
        meta?: Partial<globalThis.SessionData["meta"]>;
      }
    ) {
      const current_data =
        master.getContext<SessionPluginContext>()?.session ||
        ({} as Partial<globalThis.SessionData>);

      const new_data: globalThis.SessionData = {
        client: { ...(current_data?.client || {}), ...(data.client || {}) },
        server: { ...(current_data?.server || {}), ...(data.server || {}) },
        meta: {
          updatedAt: Date.now(),
          createdAt: current_data?.meta?.createdAt || Date.now(),
          expiresAt:
            data?.meta?.expiresAt ||
            createExpirationDate(
              current_data?.meta?.expiresAt || Date.now() + 60 * 60 * 24 * 1000
            ),
        },
      } as globalThis.SessionData;

      master.setContext<SessionPluginContext>({
        session: new_data,
        session_activity: {
          updated: true,
          deleted: false,
        },
      });
    },
    /**
     * Resets the session expiration time based on the current time
     * and the configured `maxAge`.
     * @default 60 * 60 * 24 (24 hours)
     */
    resetExpiration() {
      const current_data = master.getContext<SessionPluginContext>()?.session;
      if (!current_data) return;
      this.setSessionData({
        meta: {
          expiresAt:
            Date.now() +
            (globalThis.__PLUGIN_SESSION_OPTIONS__.cookieOptions?.maxAge ??
              60 * 60 * 24) *
              1000,
        },
      });
    },
    /**
     * Retrieves the current session data.
     */
    getSessionData(): globalThis.SessionData {
      const current_data = master.getContext<SessionPluginContext>().session;
      return current_data;
    },
    /**
     * Deletes the current session.
     */
    deleteSession() {
      master.setContext<Omit<SessionPluginContext, "session">>({
        session_activity: {
          updated: false,
          deleted: true,
        },
      });
    },
  };
}
