import type { masterRequest } from "frame-master/server/request";
import type { SessionPluginContext } from "..";

export default {
  setSessionData(
    master: masterRequest,
    data: Omit<Partial<Data>, "meta"> & { meta?: Partial<Data["meta"]> }
  ) {
    const current_data =
      master.getContext<SessionPluginContext>()?.session ||
      ({} as Partial<Data>);

    const new_data: Data = {
      client: { ...(current_data?.client || {}), ...(data.client || {}) },
      server: { ...(current_data?.server || {}), ...(data.server || {}) },
      meta: {
        updatedAt: Date.now(),
        createdAt: current_data?.meta?.createdAt || Date.now(),
        expiresAt:
          data?.meta?.expiresAt ||
          current_data?.meta?.expiresAt ||
          Date.now() + 1000 * 60 * 60 * 24,
      },
    } as Data;

    master.setContext<SessionPluginContext>({
      session: new_data,
      session_activity: {
        updated: true,
        deleted: false,
      },
    });
  },
  getSessionData(master: masterRequest) {
    const current_data = master.getContext<SessionPluginContext>().session;
    return current_data as Data;
  },
  deleteSession(master: masterRequest) {
    master.setContext<Omit<SessionPluginContext, "session">>({
      session_activity: {
        updated: false,
        deleted: true,
      },
    });
  },
};
