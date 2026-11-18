export function hasPermission(user, ...codes) {
  if (!user) return false;
  if ((user.roles || []).some((role) => role.code === "ADMIN")) return true;
  const have = new Set(user.permissions || []);
  return codes.some((code) => have.has(code));
}

export function validateAssignment({ scope, departmentId, workCentreId }) {
  if (!["global", "department", "work_centre"].includes(scope)) return "invalid_scope";
  if (scope === "global" && (departmentId || workCentreId)) return "scope_mismatch";
  if (scope === "department" && (!departmentId || workCentreId)) return "department_required";
  if (scope === "work_centre" && (!workCentreId || departmentId)) return "work_centre_required";
  return null;
}

export function requirePermission(...codes) {
  return (req, res, next) => {
    if (hasPermission(req.session?.user, ...codes)) return next();
    return res.status(403).json({ error: "forbidden" });
  };
}
