import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./auth/session";
import { designUser, isDesignMode } from "./design-mode";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  ctx.user = isDesignMode
    ? designUser
    : await authenticateRequest(opts.req.headers, opts.resHeaders);
  return ctx;
}
