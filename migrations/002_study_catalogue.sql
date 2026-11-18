-- Study catalogue used by the proposal forms. Rows are loaded from the consolidate workbook.

CREATE TABLE IF NOT EXISTS ipeot.study_catalogue (
  project_type_code text PRIMARY KEY REFERENCES ipeot.project_types (code),
  sample_report text,
  inputs jsonb NOT NULL DEFAULT '[]',
  specimens jsonb NOT NULL DEFAULT '[]',
  equipment jsonb NOT NULL DEFAULT '[]',
  tests jsonb NOT NULL DEFAULT '[]',
  software jsonb NOT NULL DEFAULT '[]',
  form_schema jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS ipeot.proposal_number_seq;
