import assert from "node:assert/strict";
import test from "node:test";
import { hasPermission, validateAssignment } from "../authz.js";

test("administrators pass every permission check", () => {
  const user = { roles: [{ code: "ADMIN" }], permissions: [] };
  assert.equal(hasPermission(user, "admin.users.write"), true);
});

test("other roles need an explicit permission", () => {
  const user = { roles: [{ code: "L3" }], permissions: ["proposals.read"] };
  assert.equal(hasPermission(user, "proposals.read"), true);
  assert.equal(hasPermission(user, "admin.users.write"), false);
  assert.equal(hasPermission(null, "proposals.read"), false);
});

test("assignment scope must match the selected unit", () => {
  assert.equal(validateAssignment({ scope: "global", departmentId: null, workCentreId: null }), null);
  assert.equal(validateAssignment({ scope: "department", departmentId: 1, workCentreId: null }), null);
  assert.equal(validateAssignment({ scope: "department", departmentId: null, workCentreId: null }), "department_required");
  assert.equal(validateAssignment({ scope: "work_centre", departmentId: null, workCentreId: 4 }), null);
  assert.equal(validateAssignment({ scope: "global", departmentId: 1, workCentreId: null }), "scope_mismatch");
  assert.equal(validateAssignment({ scope: "site", departmentId: null, workCentreId: null }), "invalid_scope");
});
