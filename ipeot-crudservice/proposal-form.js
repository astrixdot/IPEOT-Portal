const CATEGORIES = ["scheduled", "unscheduled", "short_term"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

function planningFields(body) {
  const raw = body?.priority;
  const priority = raw == null || raw === "" ? null : Number(raw);
  if (priority != null && (!Number.isInteger(priority) || priority < 1 || priority > 5)) return { error: "invalid_priority" };
  const preferredQuarter = textValue(body?.preferredQuarter, 2).toUpperCase();
  if (preferredQuarter && !QUARTERS.includes(preferredQuarter)) return { error: "invalid_quarter" };
  const intake = body?.category === "unscheduled" || body?.intake === "in_year" ? "in_year" : "awp";
  return { priority, preferredQuarter: preferredQuarter || null, intake };
}

function textValue(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanField(field, value) {
  const text = textValue(value, field.maxLength || 2000);
  if (field.type === "select" && text && !(field.options || []).includes(text)) return "";
  return text;
}

export function validateProposal(study, body) {
  const title = textValue(body?.title, 200);
  if (!title) return { error: "title_required" };
  const schema = study.formSchema || null;
  const allowed = schema?.categories || CATEGORIES;
  const category = String(body?.category || "");
  if (!allowed.includes(category)) return { error: "invalid_category" };
  const asset = textValue(body?.asset, 120);
  const plan = planningFields(body);
  if (plan.error) return plan;
  if (schema?.kind === "structure-sia") return validateSia(schema, body, { title, category, asset, ...plan });
  if (schema?.kind === "structure-life") return validateLife(schema, body, { title, category, asset, ...plan });
  const answers = {};
  (study.inputs || []).forEach((_label, index) => {
    answers[String(index)] = textValue(body?.answers?.[index] ?? body?.answers?.[String(index)]);
  });
  const specimens = {};
  (study.specimens || []).forEach((_label, index) => {
    specimens[String(index)] = textValue(body?.specimens?.[index] ?? body?.specimens?.[String(index)]);
  });
  return { value: { title, category, asset, ...plan, form: { asset, answers, specimens } } };
}

function platformValue(schema, body) {
  const platform = textValue(body?.platform, 40);
  const pattern = schema.platform?.pattern || schema.fields?.find((field) => field.key === "platform")?.pattern;
  if (!pattern || !new RegExp(pattern).test(platform)) return { error: "invalid_platform" };
  return { platform };
}

function validateLife(schema, body, base) {
  const checked = platformValue(schema, body);
  if (checked.error) return checked;
  const shared = {};
  for (const field of schema.fields || []) {
    if (field.key === "platform") continue;
    shared[field.key] = cleanField(field, body?.[field.key]);
  }
  return {
    value: {
      ...base,
      form: { asset: base.asset, platform: checked.platform, fields: shared },
    },
  };
}

function validateSia(schema, body, base) {
  const checked = platformValue(schema, body);
  if (checked.error) return checked;
  const chosen = Array.isArray(body?.modifications) ? body.modifications : [];
  if (chosen.length === 0) return { error: "modification_required" };
  const modifications = [];
  for (const entry of chosen) {
    const definition = (schema.modifications || []).find((item) => item.code === entry?.code);
    if (!definition) return { error: "invalid_modification" };
    const repeatField = definition.fields.find((field) => field.repeat);
    let count = 1;
    if (repeatField) {
      count = Number(entry.count);
      if (!Number.isInteger(count) || count < 1 || count > 12) return { error: "invalid_count" };
    }
    const shared = {};
    for (const field of definition.fields) {
      if (field.perItem || field.repeat) continue;
      shared[field.key] = cleanField(field, entry.shared?.[field.key]);
    }
    const perItem = definition.fields.filter((field) => field.perItem);
    const items = [];
    if (perItem.length > 0) {
      const source = Array.isArray(entry.items) ? entry.items : [];
      for (let index = 0; index < count; index += 1) {
        const item = {};
        for (const field of perItem) item[field.key] = cleanField(field, source[index]?.[field.key]);
        items.push(item);
      }
    }
    modifications.push({
      code: definition.code,
      name: definition.name,
      sampleReport: definition.sampleReport,
      count,
      shared,
      items,
    });
  }
  return {
    value: {
      ...base,
      form: { asset: base.asset, platform: checked.platform, modifications },
    },
  };
}
