export async function deleteSession() {
  const res = await fetch("/session_plugin/session/delete", {
    method: "DELETE",
  });
  if (res.ok) {
    return true;
  }
  return false;
}
