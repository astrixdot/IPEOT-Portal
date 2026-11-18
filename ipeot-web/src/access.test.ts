import { describe, expect, it } from "vitest";
import { can } from "./access";
import type { SessionUser } from "./types";

function user(partial: Partial<SessionUser>): SessionUser {
  return {
    id: 1,
    cpf: "100001",
    name: "Portal Admin",
    email: null,
    departmentId: null,
    workCentreId: null,
    roles: [],
    permissions: [],
    ...partial,
  };
}

describe("can", () => {
  it("lets administrators through", () => {
    expect(can(user({ roles: [{ code: "ADMIN", name: "Administrator", scope: "global", departmentId: null, workCentreId: null, delegated: false, delegatedFrom: null }] }), "admin.users.write")).toBe(true);
  });

  it("checks the permission list for other roles", () => {
    expect(can(user({ permissions: ["projects.read"] }), "projects.read")).toBe(true);
    expect(can(user({ permissions: ["projects.read"] }), "awp.write")).toBe(false);
    expect(can(null, "projects.read")).toBe(false);
  });
});
