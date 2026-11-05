import { describe, it, expect } from 'vitest';
import { documentModelToBlob } from './renderPdf.js';
import type { DocumentModel } from './types.js';

const model: DocumentModel = {
  title: 'Application summary',
  subtitle: 'Prepared with OpenBridge',
  sections: [
    {
      heading: 'Household',
      rows: [
        { label: 'People', value: '3' },
        { label: 'State', value: 'OH' },
      ],
      notes: ['Ages are as of the evaluation date.'],
    },
    { rows: [{ label: 'Monthly income', value: '$1,500.00' }] },
  ],
  footer: 'This is an estimate, not a decision.',
};

describe('documentModelToBlob', () => {
  it('renders a document model to a non-empty PDF blob', async () => {
    const blob = await documentModelToBlob(model);
    expect(blob.size).toBeGreaterThan(0);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    // PDF magic number: %PDF
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('%PDF');
  });

  it('renders a minimal model without optional fields', async () => {
    const blob = await documentModelToBlob({ title: 'Empty', sections: [] });
    expect(blob.size).toBeGreaterThan(0);
  });
});
