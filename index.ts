import type { FrameMasterPlugin } from "frame-master/plugin/types";
import { name, version } from "./package.json";
import { isDev } from "frame-master/utils";
import type { CookieOptions, masterRequest } from "frame-master/server/request";
import { SESSION_COOKIE_NAME, SESSION_DATA_ENDPOINT } from "./src/common";

export type SessionPluginOptions = {
  sessionType:
    | "cookie"
    | "memory"
    | {
        /**
         * triggered when session data is initialized and verified as valid.
         * @param id - The identifier of the session.
         * @param meta - Default metadata when initializing the session.
         * @returns The session data object.
         */
        init: (
          req: masterRequest,
          id: string,
          meta: () => globalThis.SessionData["meta"]
        ) => globalThis.SessionData | Promise<globalThis.SessionData>;
        /**
         * triggered when new session data is created or existing session data is updated.
         * @param id - The identifier of the session.
         * @param data - The new session data object.
         */
        onNewData: (
          req: masterRequest,
          id: string,
          data: globalThis.SessionData
        ) => void | Promise<void>;
        /**
         * triggered when session data is deleted. used for cleanup operations.
         * @param id - The identifier of the session being deleted.
         */
        onDelete?: (req: masterRequest, id: string) => void | Promise<void>;
      };
  /**
   * An array of route patterns to skip session handling for.
   * For example, ['/api/*', '/public/*'].
   * @default []
   * @link https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
   */
  skipForRoutes?: string[];
  cookieOptions?: Omit<CookieOptions, "encrypted">;
  /**
   * If true, updates the session expiration time on each activity.
   * @default true
   */
  updateSessionExpirationOnActivity?: boolean;
};

export type SessionPluginContext = {
  session: globalThis.SessionData;
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
export default function reactSessionPlugin(
  options?: SessionPluginOptions
): FrameMasterPlugin {
  const {
    sessionType = "cookie",
    skipForRoutes = [],
    cookieOptions = {},
    updateSessionExpirationOnActivity = true,
  } = options || {};

  globalThis.__PLUGIN_SESSION_OPTIONS__ ??= {
    ...options,
    sessionType,
    skipForRoutes,
    cookieOptions,
    updateSessionExpirationOnActivity,
  };

  const sessionDB = new Map<string, globalThis.SessionData>();
  return {
    name,
    version,

    createContext: () => {
      if (sessionType == "memory") {
        setInterval(() => {
          Array.from(sessionDB.entries())
            .filter(([_, data]) => {
              return data.meta.expiresAt < Date.now();
            })
            .forEach(([id, _]) => {
              sessionDB.delete(id);
            });
        }, 60 * 1000 * 5); // every 5 minutes
      }
    },

    router: {
      async before_request(master) {
        const pattern = new URLPattern({ pathname: master.URL.pathname });
        if (skipForRoutes.some((route) => pattern.test({ pathname: route })))
          return;

        const cookie = master.getCookie<
          Record<"meta" | "client" | "server", unknown> | { id: string }
        >(SESSION_COOKIE_NAME, true);

        if (
          typeof sessionType === "object" &&
          (cookie as { id?: string } | undefined)?.id
        ) {
          master.setContext<SessionPluginContext>({
            session: await sessionType.init(
              master,
              (cookie as { id: string }).id,
              () => ({
                createdAt: Date.now(),
                updatedAt: Date.now(),
                expiresAt:
                  (Date.now() + (cookieOptions.maxAge ?? 60 * 60 * 24)) * 1000,
              })
            ),
            session_activity: { updated: false, deleted: false },
          });
        } else {
          if (!cookie) return;

          switch (sessionType) {
            case "cookie":
              master.setContext<SessionPluginContext>({
                session: cookie as unknown as globalThis.SessionData,
                session_activity: { updated: false, deleted: false },
              });
              break;
            case "memory":
              const data = sessionDB.get((cookie as { id: string }).id);
              if (!data) break;
              master.setContext<SessionPluginContext>({
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
          master.getContext<SessionPluginContext>()?.session ?? {};

        master.setResponse(data ? JSON.stringify(data) : "null", {
          headers: { "Content-Type": "application/json" },
        });
      },
      async after_request(master) {
        if (!master.isResponseSetted()) return;

        const { session, session_activity } =
          master.getContext<SessionPluginContext>();
        if (!session) return;

        if (session_activity.deleted) {
          const id = (
            master.getCookie(SESSION_COOKIE_NAME, true) as
              | { id?: string }
              | undefined
          )?.id;
          master.deleteCookie(SESSION_COOKIE_NAME);
          if (typeof sessionType === "object" && id)
            await sessionType.onDelete?.(master, id);
          else {
            switch (sessionType) {
              case "memory":
                if (id) sessionDB.delete(id);
                break;
              default:
                break;
            }
          }
          return;
        }
        const cookieOpts: CookieOptions = {
          httpOnly: true,
          secure: isDev() ? false : true,
          encrypted: true,
          ...cookieOptions,
          maxAge:
            (session.meta.expiresAt - Date.now()) / 1000 ||
            cookieOptions.maxAge,
        };
        if (typeof sessionType === "object") {
          if (!session_activity.updated) return;
          // get or create id
          const id =
            (
              master.getCookie(SESSION_COOKIE_NAME, true) as
                | { id: string }
                | undefined
            )?.id || crypto.randomUUID();

          await sessionType.onNewData(master, id, session);

          master.setCookie<{ id: string }>(
            SESSION_COOKIE_NAME,
            { id },
            cookieOpts
          );
        } else {
          switch (sessionType) {
            case "memory":
              // get or create id
              const id =
                (
                  master.getCookie(SESSION_COOKIE_NAME, true) as
                    | { id: string }
                    | undefined
                )?.id || crypto.randomUUID();
              // set session in memory DB
              sessionDB.set(id, session);
              master.setCookie<{ id: string }>(
                SESSION_COOKIE_NAME,
                { id },
                cookieOpts
              );
              break;
            case "cookie":
              master.setCookie(SESSION_COOKIE_NAME, session as any, cookieOpts);
              break;
          }
        }
      },
    },

    requirement: {
      frameMasterVersion: "^3.1.1",
      bunVersion: ">=1.2.0",
    },
  };
}
