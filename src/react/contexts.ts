import { createContext } from "react";
import type { SessionType } from "../types";

type sessionContextType = {
  /** session management object */
  session: SessionType["public"];
  /** method to delete the current session true if success false otherwise */
  delete: () => Promise<boolean>;
};

export const SessionContext = createContext<
  sessionContextType | undefined | null
>(null);
