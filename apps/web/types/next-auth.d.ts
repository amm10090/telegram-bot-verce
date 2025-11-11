import type { AuthUser } from "better-auth/types";

declare module "better-auth/types" {
  interface Session {
    user: AuthUser & {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}