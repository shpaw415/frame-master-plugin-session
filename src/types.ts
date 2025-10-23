/**
 * Base session type that can be extended by users via module augmentation.
 *
 * @example
 * ```ts
 * // In your project
 * declare module "frame-master-plugin-session/react/types" {
 *   interface SessionType {
 *     user: {
 *       id: string;
 *       name: string;
 *       email: string;
 *       role: "admin" | "user";
 *     };
 *     token: string;
 *     expiresAt: Date;
 *   }
 * }
 * ```
 */
export interface SessionType {}
