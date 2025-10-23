import { useContext } from "react";
import { SessionContext } from "./contexts";

const HowToUseSessionErrorMessage = [
  "Did you forget to add SessionProvider?",
  "Wrap your app with SessionProvider to use useSession hook.",
].join("\n");

export function useSession() {
  const session = useContext(SessionContext);
  if (session === null) {
    throw new Error(HowToUseSessionErrorMessage);
  }
}
