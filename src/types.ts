/**
 * Base session type that can be extended by users via module augmentation.
 *
 * @example
 * ```ts
 * // In your project
 * declare module "frame-master-plugin-session/types" {
 *   interface PublicSessionType {
 *     user: {
 *       id: string;
 *       name: string;
 *       email: string;
 *       role: "admin" | "user";
 *     };
 *     token: string;
 *     expiresAt: Date;
 *   }
 * interface PrivateSessionType {
 *     apiKey: string;
 *     secret: string;
 *   }
 * }
 * ```
 */
export type SessionType = {
  public: PublicSessionType;
  private: PrivateSessionType & PublicSessionType;
};
export interface PublicSessionType {}
export interface PrivateSessionType {}
