export const SESSION_DATA_ENDPOINT = "/__session_data__";
export const SESSION_COOKIE_NAME = "fm_session_id";

declare global {
  var __SESSION_PLUGIN_DATA__: SessionData | undefined;
  var __SESSION_PLUGIN_SERVER_REQUEST_WARNING__: boolean | undefined;
}
