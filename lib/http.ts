export function ok(data: any, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

export function fail(error: any) {
  return Response.json(
    {
      ok: false,
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: error.message || "Unexpected error",
      },
    },
    { status: error.statusCode || 500 }
  );
}
