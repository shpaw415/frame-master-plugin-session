import { useCallback, useState } from "react";
import { SessionContext } from "./contexts";
import type { SessionType } from "../types";
import type { masterRequest } from "frame-master/server/request";
import { deleteSession as deleteSessionAPI, getSession } from "../api";
/**
 * Wrap your application with this provider to make session data available via context.
 * @example
 * ```tsx
 * import ReactSSRShell from "frame-master-plugin-react-ssr/shell";
 * import { SessionProvider } from "frame-master-plugin-session/react/providers";
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
  const [session, setSession] = useState<SessionType["public"] | undefined>(
    request
      ? request.getContext<{ __SESSION__: SessionType["public"] | undefined }>()
          .__SESSION__
      : globalThis.__SESSION__
  );

  const deleteSession = useCallback(async () => {
    if (await deleteSessionAPI()) {
      setSession(undefined);
      return true;
    } else return false;
  }, []);

  const revalidate = useCallback(async () => {
    const newSession = await getSession();
    setSession(newSession || undefined);
  }, []);

  return (
    <SessionContext.Provider
      value={
        session
          ? { session: session, delete: deleteSession, revalidate }
          : undefined
      }
    >
      {children}
    </SessionContext.Provider>
  );
}
