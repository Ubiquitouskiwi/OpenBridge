/**
 * Renders a DocumentModel to a PDF Blob using @react-pdf/renderer (design §7). Uses
 * React.createElement (no JSX) so the package needs no JSX build config. Components are
 * cast to a loose type to avoid friction with the library's element typings.
 */
import { createElement as h, type ReactNode } from 'react';
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import type { DocumentModel } from './types.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
const Doc = Document as any;
const Pg = Page as any;
const T = Text as any;
const Box = View as any;

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, fontFamily: 'Helvetica', color: '#16202b' },
  title: { fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 11, marginBottom: 12, color: '#55636e' },
  heading: { fontSize: 13, marginTop: 12, marginBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 2 },
  label: { width: '45%', color: '#55636e' },
  value: { width: '55%' },
  note: { marginTop: 2, color: '#55636e' },
  footer: { marginTop: 16, fontSize: 9, color: '#55636e' },
});

function renderModel(model: DocumentModel) {
  const children: ReactNode[] = [
    h(T, { key: 't', style: styles.title }, model.title),
    model.subtitle ? h(T, { key: 's', style: styles.subtitle }, model.subtitle) : null,
  ];

  model.sections.forEach((section, si) => {
    if (section.heading) {
      children.push(h(T, { key: `h${si}`, style: styles.heading }, section.heading));
    }
    (section.rows ?? []).forEach((r, ri) =>
      children.push(
        h(Box, { key: `r${si}-${ri}`, style: styles.row }, [
          h(T, { key: 'l', style: styles.label }, r.label),
          h(T, { key: 'v', style: styles.value }, r.value),
        ]),
      ),
    );
    (section.notes ?? []).forEach((n, ni) =>
      children.push(h(T, { key: `n${si}-${ni}`, style: styles.note }, n)),
    );
  });

  if (model.footer) children.push(h(T, { key: 'f', style: styles.footer }, model.footer));

  return h(Doc, null, h(Pg, { size: 'LETTER', style: styles.page }, children));
}

export async function documentModelToBlob(model: DocumentModel): Promise<Blob> {
  return pdf(renderModel(model) as any).toBlob();
}
