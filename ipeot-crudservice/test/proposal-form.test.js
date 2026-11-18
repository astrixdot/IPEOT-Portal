import test from "node:test";
import assert from "node:assert/strict";
import { catalogue } from "../catalogue-data.js";
import { validateProposal } from "../proposal-form.js";

test("a production study accepts its input answers", () => {
  const study = catalogue.studies["D1-ACID"];
  const result = validateProposal(study, {
    title: "Acid stimulation for NH",
    category: "scheduled",
    asset: "NH",
    answers: { 0: "Field file attached" },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.value.form.answers["0"], "Field file attached");
  assert.equal(result.value.form.asset, "NH");
});

test("structural integrity assessment requires a plain platform name and a modification", () => {
  const study = catalogue.studies["D6-SIA"];
  assert.equal(validateProposal(study, {
    title: "SIA of B55",
    category: "short_term",
    platform: "B55",
    modifications: [{ code: "scour", shared: { scheme: "IMR" } }],
  }).error, "invalid_category");
  assert.equal(validateProposal(study, {
    title: "SIA of B55",
    category: "unscheduled",
    platform: "B-55",
    modifications: [{ code: "scour", shared: { scheme: "IMR" } }],
  }).error, "invalid_platform");
  const saved = validateProposal(study, {
    title: "SIA of B55",
    category: "unscheduled",
    platform: "B55",
    modifications: [{ code: "new_risers", count: 2, shared: { scheme: "Riser add" }, items: [{ size: "8", face: "South" }, { size: "6", face: "East" }] }],
  });
  assert.equal(saved.value.form.modifications[0].items.length, 2);
  assert.equal(saved.value.form.modifications[0].sampleReport, "PB");
});

test("the workbook catalogue covers every department sheet", () => {
  const codes = Object.keys(catalogue.studies);
  for (const prefix of ["D1-", "D2-", "D3-", "D4-", "D5-", "D6-"]) {
    assert.ok(codes.some((code) => code.startsWith(prefix)), prefix);
  }
  assert.equal(catalogue.studies["D6-SIA"].formSchema.modifications.length, 15);
  assert.ok(catalogue.studies["D2-HAZOP"].inputs.length >= 10);
  assert.ok(catalogue.studies["D5-LH"].inputs.length >= 5);
});
