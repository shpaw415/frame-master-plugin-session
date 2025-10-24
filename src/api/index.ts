import type { SessionType } from "../types";

/**
 * delete the current session
 * @returns true if the session was deleted, false otherwise
 */
export async function deleteSession() {
  const res = await fetch("/session_plugin/session", {
    method: "DELETE",
  });
  if (res.ok) {
    return true;
  }
  return false;
}
/**
 * Fetch the current session's public data
 * @returns The public session data or null if no session exists
 */
export async function getSession(): Promise<SessionType["public"] | null> {
  const res = await fetch("/session_plugin/session", {
    method: "GET",
  });
  if (res.ok) {
    return res.json() as Promise<SessionType["public"]>;
  }
  return null;
}
