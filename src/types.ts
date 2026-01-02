export type Data<Public, Server> = {
  client?: Public;
  server?: Server;
  meta: {
    updatedAt: number;
    createdAt: number;
    expiresAt: number;
  };
};

export const SESSION_DATA_ENDPOINT = "/__session_data__";
export const SESSION_COOKIE_NAME = "fm_session_id";

declare global {
  var __SESSION_PLUGIN_DATA__: Data<any, any> | undefined;
  var __SESSION_PLUGIN_SERVER_REQUEST_WARNING__: boolean | undefined;
}
