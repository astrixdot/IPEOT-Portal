import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { ldapEscapeFilter } from "../ldap.js";

const SEED_HASH = "$2b$10$RVTpuEZC4SU11hC4FcQY6.CYyZQBYjyXi8vcnXhtDm.fLM8FLOIYi";

test("development seed hash matches the documented password", async () => {
  assert.equal(await bcrypt.compare("Ipeot@123", SEED_HASH), true);
  assert.equal(await bcrypt.compare("nope", SEED_HASH), false);
});

test("ldap filter escape encodes reserved characters", () => {
  assert.equal(ldapEscapeFilter("100001"), "100001");
  assert.equal(ldapEscapeFilter("a*b"), "a\\2ab");
  assert.equal(ldapEscapeFilter("(cn)"), "\\28cn\\29");
});
