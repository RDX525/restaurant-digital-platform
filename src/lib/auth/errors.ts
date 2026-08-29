export class AuthenticationError extends Error {
  readonly status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  readonly status: number;

  constructor(message = "Forbidden", status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export class NotFoundError extends Error {
  readonly status = 404;

  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
