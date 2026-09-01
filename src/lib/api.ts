import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/auth/errors";
import { getErrorMessage } from "@/lib/utils";

export function jsonError(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const firstFieldMessage = Object.values(fieldErrors).flat()[0];
    const firstFormMessage = error.flatten().formErrors[0];
    return NextResponse.json(
      {
        error: firstFieldMessage ?? firstFormMessage ?? "Validation failed",
        details: fieldErrors,
      },
      { status: 422 },
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: "Forbidden" }, { status: error.status });
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const message = getErrorMessage(error);
  const safeStatus = status >= 400 && status < 600 ? status : 400;
  const publicMessage =
    safeStatus >= 500 ? "An unexpected error occurred." : message;

  return NextResponse.json({ error: publicMessage }, { status: safeStatus });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
