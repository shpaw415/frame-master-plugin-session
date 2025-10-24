import { useContext } from "react";
import { SessionContext } from "./contexts";

const HowToUseSessionErrorMessage = [
  "Did you forget to add SessionProvider?",
  "Wrap your app with SessionProvider to use useSession hook.",
  "import { SessionProvider } from 'frame-master-plugin-session/react/providers';",
  "then wrap your app",
].join("\n");

export function useSession() {
  const session = useContext(SessionContext);
  if (session === null) {
    throw new Error(HowToUseSessionErrorMessage);
  }

  return session;
}
