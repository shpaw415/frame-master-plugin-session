import type { FrameMasterPlugin } from "frame-master/plugin";
import packageJson from "./package.json";
import type { SessionType } from "./src/types";

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
};

const DEFAULT_PROPS: Partial<SessionPluginProps> = {
  strategy: "cookie",
  expiresIn: 60 * 60 * 24, // 1 day
};

/**
 * Session management plugin
 *
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
    },
    router: {
      before_request(master) {
        const cookie = master.getCookie<
          typeof props.strategy extends "cookie"
            ? Record<"id", string>
            : Record<"data", SessionType | undefined>
        >("session_id", true);
        if (props.strategy == "cookie") {
          if (master.isAskingHTML)
            master.setGlobalValues({ __SESSION__: cookie?.data });
          master.setContext({ __SESSION__: cookie?.data });
        }
      },
    },
  };
}
