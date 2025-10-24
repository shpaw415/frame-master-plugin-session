"server-only";

import type { masterRequest } from "frame-master/server/request";
import type { SessionPluginRequestContext } from "..";
import type { SessionType } from "./types";

export function getSessionFromRequest(master: masterRequest) {
  const context = master.getContext<SessionPluginRequestContext>();
  return {
    data: context.__SESSION__,
    /** Set Session data */
    set<T extends keyof Exclude<typeof context.__SESSION__, undefined>>(
      newSession: SessionType[T],
      type: T
    ) {
      master.setContext({
        __SESSION_CHANGED__: true,
        __SESSION__: {
          ...context.__SESSION__,
          [type]: { ...context.__SESSION__?.[type], ...newSession },
        },
      });
    },
    /** Delete session */
    delete() {
      master.setContext({ __SESSION_CHANGED__: true, __SESSION__: undefined });
    },
  };
}
