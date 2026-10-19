/** A user-facing error: its message is shown to the buyer/admin as-is. */
export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
