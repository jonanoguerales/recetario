/** Error returned by Supabase Auth, reduced to what the app uses to choose a message. */
export interface AuthErrorModel {
  /** Supabase Auth error code (e.g. `invalid_credentials`, `user_already_exists`). */
  code?: string;
  /** HTTP status of the Auth response, when there is one. */
  status?: number;
}

export type AuthResult = { ok: true; hasSession: boolean } | { ok: false; error: AuthErrorModel };

export interface Credentials {
  email: string;
  password: string;
}
