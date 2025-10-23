import { createContext } from "react";
import type { SessionType } from "../types";

export const SessionContext = createContext<SessionType | undefined | null>(
  null
);
