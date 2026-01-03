import type { masterRequest } from "frame-master/server/request";
import type { SessionPluginContext } from "..";

export default function SessionManager(master: masterRequest) {
  return {
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
            current_data?.meta?.expiresAt ||
            Date.now() +
              (globalThis.__PLUGIN_SESSION_OPTIONS__.cookieOptions?.maxAge ??
                60 * 60 * 24) *
                1000,
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
    getSessionData(): globalThis.SessionData {
      const current_data = master.getContext<SessionPluginContext>().session;
      return current_data;
    },
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
