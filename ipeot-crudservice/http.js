export function httpError(status, error) {
  const err = new Error(error);
  err.status = status;
  return err;
}

export function idParam(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "invalid_id");
  return id;
}

export function cleanCode(value) {
  const code = String(value || "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(code)) throw httpError(400, "invalid_code");
  return code;
}

export function cleanName(value) {
  const name = String(value || "").trim();
  if (!name || name.length > 200) throw httpError(400, "invalid_name");
  return name;
}

export function page(req) {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  if (!Number.isFinite(limit) || !Number.isFinite(offset)) throw httpError(400, "invalid_page");
  return { limit, offset };
}
