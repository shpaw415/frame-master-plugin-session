import type { FrameMasterPlugin } from "frame-master/plugin";
import packageJson from "./package.json";
import type { SessionType } from "./src/types";
import { masterRequest } from "frame-master/server/request";

declare global {
  var __SESSION__: SessionType | undefined;
}

export type SessionPluginProps = {
  /** the method to hold the session information */
  strategy?: "cookie" /*| "database" | "next-auth"*/;
  /** expiration of the session in second `default: 1 day` */
  expiresIn?: number; // in seconds
  /** used framework */
  framework: "react" | "vanillaJS";
};

export type SessionPluginRequestContext = {
  __SESSION__: SessionType | undefined;
  __SESSION_CHANGED__: boolean;
};

const DEFAULT_PROPS: Partial<SessionPluginProps> = {
  strategy: "cookie",
  expiresIn: 60 * 60 * 24, // 1 day
};

const COOKIE_NAME = "session_id";

/**
 * Base session type that can be extended by users via module augmentation.
 *
 * @example
 * ```ts
 * // In your project
 * declare module "frame-master-plugin-session/types" {
 *   interface PublicSessionType {
 *     user: {
 *       id: string;
 *       name: string;
 *       email: string;
 *       role: "admin" | "user";
 *     };
 *     token: string;
 *     expiresAt: Date;
 *   }
 * interface PrivateSessionType {
 *     apiKey: string;
 *     secret: string;
 *   }
 * }
 * ```
 *
 *  * Wrap your application with this provider to make session data available via context.
 * @example
 * ```tsx
 * import ReactSSRShell from "frame-master-plugin-react-ssr/shell";
 * import type { masterRequest } from "frame-master/server/request";
 * import { SessionProvider } from "frame-master-plugin-session/react/providers";
 * import type { JSX } from "react";
import { RequestContext } from '../react-ssr/src/hooks/contexts';
 *
 * function Shell({ request, children }: { request: masterRequest | null, children: JSX.Element }) {
 *   return (
 *     <SessionProvider request={request}>
 *      <ReactSSRShell request={request}>
 *        {children}
 *      </ReactSSRShell>
 *     </SessionProvider>
 *   );
 * }
 * ```
 * */
export default function createPlugin(
  props: SessionPluginProps
): FrameMasterPlugin {
  props = { ...DEFAULT_PROPS, ...props };
  return {
    name: "session-management-plugin",
    version: packageJson.version,
    requirement: {
      frameMasterPlugins: {
        ...(props.framework === "react" && {
          "frame-master-plugin-react-ssr": "^1.0.0",
        }),
      },
      bunVersion: "^1.0.0",
    },
    router: {
      before_request(master) {
        const cookie = master.getCookie<
          typeof props.strategy extends "cookie"
            ? Record<"id", string>
            : Record<"data", SessionType | undefined>
        >(COOKIE_NAME, true);
        if (props.strategy == "cookie") {
          if (master.isAskingHTML)
            master.setGlobalValues({ __SESSION__: cookie?.data });
          master.setContext<SessionPluginRequestContext>({
            __SESSION__: cookie?.data,
            __SESSION_CHANGED__: false,
          });
        }
      },
      request: (master) =>
        onRoute(master, {
          "/session_plugin/session": {
            GET: (master) => {
              if (props.strategy !== "cookie")
                master
                  .setResponse(
                    JSON.stringify(
                      master.getContext<SessionPluginRequestContext>()
                        .__SESSION__?.public || null
                    ),
                    { status: 200 }
                  )
                  .preventGlobalValuesInjection()
                  .preventRewrite()
                  .sendNow();
            },
            DELETE: (req) =>
              req
                .deleteCookie(COOKIE_NAME)
                .setResponse("Session deleted", { status: 200 })
                .preventGlobalValuesInjection()
                .preventRewrite()
                .sendNow(),
          },
        }),
      after_request(master) {
        if (props.strategy == "cookie") {
          const context = master.getContext<SessionPluginRequestContext>();
          if (context.__SESSION_CHANGED__) {
            if (context.__SESSION__ === undefined) {
              master.deleteCookie(COOKIE_NAME);
              return;
            } else
              master.setCookie(
                COOKIE_NAME,
                { data: context.__SESSION__.public },
                {
                  maxAge: props.expiresIn,
                  httpOnly: true,
                  encrypted: true,
                }
              );
          }
        }
      },
    },
  };
}
type RouteCallback = (master: masterRequest) => void | Promise<void>;
type MethodKeys = "POST" | "GET" | "DELETE";

function onRoute(
  master: masterRequest,
  routes: Record<
    string,
    RouteCallback | Partial<Record<MethodKeys, RouteCallback>>
  >
) {
  const currentRoute = routes[master.URL.pathname];

  if (typeof currentRoute == "function") {
    return currentRoute(master);
  } else if (currentRoute) {
    return currentRoute[master.request.method as MethodKeys]?.(master);
  }
}
