/**
 * The rule data bundled into the toolkit: every state adapter under data/states/ (picked up
 * automatically, so a new state appears without code changes) plus the federal reference data,
 * assembled the same way the web app does (packages/web-app/src/data/index.ts).
 */
import type { FederalData, StateAdapter } from '@openbridge/shared';

import fplContiguous from '../../../../data/federal/poverty-guidelines.contiguous.json';
import fplAlaska from '../../../../data/federal/poverty-guidelines.alaska.json';
import fplHawaii from '../../../../data/federal/poverty-guidelines.hawaii.json';
import snapFederal from '../../../../data/federal/snap.json';
import federalSources from '../../../../data/federal/sources.json';
import toolkitPackage from '../../package.json';

const adapterModules = import.meta.glob<{ default: unknown }>(
  '../../../../data/states/*/adapter.json',
  { eager: true },
);

/** Adapters keyed by upper-case state code, sorted by state name. */
const adapters: StateAdapter[] = Object.values(adapterModules)
  .map((mod) => mod.default as StateAdapter)
  .sort((a, b) => a.stateName.localeCompare(b.stateName));

export const federal: FederalData = {
  fplTables: {
    contiguous: fplContiguous as FederalData['fplTables']['contiguous'],
    alaska: fplAlaska as FederalData['fplTables']['alaska'],
    hawaii: fplHawaii as FederalData['fplTables']['hawaii'],
  },
  snap: snapFederal as FederalData['snap'],
  sources: federalSources as FederalData['sources'],
};

/** Toolkit version, written into downloaded files for support. */
export const TOOLKIT_VERSION: string = toolkitPackage.version;

/** Rules data version: the poverty-line year, the same value the engine reports as dataVersion. */
export const DATA_VERSION: string = String(federal.fplTables.contiguous.year);

export interface StateOption {
  code: string;
  name: string;
}

export const supportedStates: StateOption[] = adapters.map((a) => ({
  code: a.stateCode,
  name: a.stateName,
}));

/** The adapter for a state code, or undefined when the toolkit has no rules for it. */
export function loadAdapter(stateCode: string): StateAdapter | undefined {
  const code = stateCode.toUpperCase();
  return adapters.find((a) => a.stateCode.toUpperCase() === code);
}
