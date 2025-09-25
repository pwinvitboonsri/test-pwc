interface CursorPayload<TValue> {
  v: TValue;
  id: string;
}

export function makeCursor<TValue extends string | number>(value: TValue, id: string): string {
  const payload: CursorPayload<TValue> = { v: value, id };
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function parseCursor<TValue extends string | number>(cursor?: string | null): CursorPayload<TValue> | undefined {
  if (!cursor) {
    return undefined;
  }

  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(json) as CursorPayload<TValue>;
    if (typeof payload.id !== "string") {
      return undefined;
    }
    return payload;
  } catch (error) {
    console.error("Failed to parse cursor", error);
    return undefined;
  }
}
