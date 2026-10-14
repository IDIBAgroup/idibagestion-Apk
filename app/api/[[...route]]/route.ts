export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Imported lazily so env validation (DATABASE_URL) runs at request time, not during `next build`.
const handler = async (req: Request) => {
  const { default: app } = await import("../../../api/app");
  return app.fetch(req);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
