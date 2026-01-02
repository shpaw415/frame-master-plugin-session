import type { FrameMasterPlugin } from "frame-master/plugin/types";
import { name, version } from "./package.json";
import { join } from "path";
import { isDev } from "frame-master/utils";
import type { CookieOptions, masterRequest } from "frame-master/server/request";
import {
  SESSION_COOKIE_NAME,
  SESSION_DATA_ENDPOINT,
  type Data as _Data,
} from "./src/types";

export type SessionPluginOptions<
  Data extends _Data<any, any> = _Data<any, any>
> = {
  sessionType:
    | "cookie"
    | "memory"
    | {
        init: (req: masterRequest) => Data | Promise<Data>;
        onNewData: (data: Data) => void;
      };
  /**
   * An array of route patterns to skip session handling for.
   * For example, ['/api/*', '/public/*'].
   * @default []
   * @link https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
   */
  skipForRoutes?: string[];
  cookieOptions?: Omit<CookieOptions, "encrypted">;
  disableServerRequestWarning?: boolean;
};

export type SessionPluginContext<
  Data extends _Data<any, any> = _Data<any, any>
> = {
  session: Data;
  session_activity: {
    updated: boolean;
    deleted: boolean;
  };
};

/**
 * frame-master-plugin-react-session - Frame-Master Plugin
 *
 * Description: Add your plugin description here
 */
export default function reactSessionPlugin<
  Data extends _Data<any, any> = _Data<any, any>
>(options?: SessionPluginOptions<Data>): FrameMasterPlugin {
  const {
    sessionType = "cookie",
    skipForRoutes = [],
    cookieOptions = {},
    disableServerRequestWarning = false,
  } = options || {};

  globalThis.__SESSION_PLUGIN_SERVER_REQUEST_WARNING__ =
    disableServerRequestWarning;

  const sessionDB = new Map<string, Data>();
  return {
    name,
    version,

    router: {
      async before_request(master) {
        const pattern = new URLPattern({ pathname: master.URL.pathname });
        if (skipForRoutes.some((route) => pattern.test({ pathname: route })))
          return;

        if (typeof sessionType === "object") {
          master.setContext<SessionPluginContext<Data>>({
            session: await sessionType.init(master),
            session_activity: { updated: false, deleted: false },
          });
        } else {
          const cookie = master.getCookie<Data | { id: string }>(
            SESSION_COOKIE_NAME,
            true
          );
          if (!cookie) return;

          switch (sessionType) {
            case "cookie":
              master.setContext<SessionPluginContext<Data>>({
                session: cookie as Data,
                session_activity: { updated: false, deleted: false },
              });
              break;
            case "memory":
              const data = sessionDB.get((cookie as { id: string }).id);
              if (!data) break;
              master.setContext<SessionPluginContext<Data>>({
                session: data,
                session_activity: { updated: false, deleted: false },
              });
              break;
          }
        }
      },
      request(master) {
        if (
          master.URL.pathname !== SESSION_DATA_ENDPOINT ||
          master.isResponseSetted()
        )
          return;
        const { server, ...data } =
          master.getContext<SessionPluginContext<Data>>()?.session ?? {};

        master.setResponse(data ? JSON.stringify(data) : "null", {
          headers: { "Content-Type": "application/json" },
        });
      },
      after_request(master) {
        const { session, session_activity } =
          master.getContext<SessionPluginContext<Data>>();
        if (!session) return;

        if (session_activity.deleted) {
          master.deleteCookie(SESSION_COOKIE_NAME);
          return;
        }

        master.setCookie<Data>(SESSION_COOKIE_NAME, session, {
          httpOnly: true,
          secure: isDev() ? false : true,
          ...cookieOptions,
          encrypted: true,
          maxAge: session.meta.expiresAt || cookieOptions.maxAge,
        });
      },
    },

    requirement: {
      frameMasterVersion: "^3.1.1",
      bunVersion: ">=1.2.0",
    },
  };
}
