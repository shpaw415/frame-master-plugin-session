import { useState } from "react";
import { SessionContext } from "./contexts";
import type { SessionType } from "../types";
import type { masterRequest } from "frame-master/server/request";

/**
 * Wrap your application with this provider to make session data available via context.
 * @example
 * ```tsx
 * import ReactSSRShell from "frame-master-plugin-react-ssr/shell";
 * import type { masterRequest } from "frame-master/server/request";
 * import type { JSX } from "react";
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
 */
export function SessionProvider({
  children,
  request,
}: {
  children: React.ReactNode;
  request: masterRequest | null;
}) {
  const [session, setSession] = useState<SessionType | undefined>(
    request
      ? request.getContext<{ __SESSION__: SessionType | undefined }>()
          .__SESSION__
      : globalThis.__SESSION__
  );
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
