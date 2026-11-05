/**
 * A localization-free document model (design §7). The web app builds these models with
 * already-localized strings; this package renders them to PDF. Keeping the model plain
 * makes content testable without a PDF runtime.
 */
export interface DocRow {
  label: string;
  value: string;
}

export interface DocSection {
  heading?: string;
  rows?: DocRow[];
  notes?: string[];
}

export interface DocumentModel {
  title: string;
  subtitle?: string;
  sections: DocSection[];
  footer?: string;
}
