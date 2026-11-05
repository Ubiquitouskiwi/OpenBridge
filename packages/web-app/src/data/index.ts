/**
 * Bundles the versioned reference data (federal + state adapters) and the deployment
 * config into the app. Phase 1 imports statically (three pilot states); the loadAdapter
 * seam lets Phase 2+ switch to lazy fetching without changing callers (design §4.1).
 */
import type { DeploymentConfig, FederalData, StateAdapter } from '@openbridge/shared';

import ohAdapter from '../../../../data/states/oh/adapter.json';
import txAdapter from '../../../../data/states/tx/adapter.json';
import waAdapter from '../../../../data/states/wa/adapter.json';

import fplContiguous from '../../../../data/federal/poverty-guidelines.contiguous.json';
import fplAlaska from '../../../../data/federal/poverty-guidelines.alaska.json';
import fplHawaii from '../../../../data/federal/poverty-guidelines.hawaii.json';
import snapFederal from '../../../../data/federal/snap.json';
import federalSources from '../../../../data/federal/sources.json';

const adapters: Record<string, StateAdapter> = {
  OH: ohAdapter as unknown as StateAdapter,
  TX: txAdapter as unknown as StateAdapter,
  WA: waAdapter as unknown as StateAdapter,
};

export const federal: FederalData = {
  fplTables: {
    contiguous: fplContiguous as FederalData['fplTables']['contiguous'],
    alaska: fplAlaska as FederalData['fplTables']['alaska'],
    hawaii: fplHawaii as FederalData['fplTables']['hawaii'],
  },
  snap: snapFederal as FederalData['snap'],
  sources: federalSources as FederalData['sources'],
};

/** Supported pilot states, for the state picker. */
export const supportedStates = Object.values(adapters).map((a) => ({
  code: a.stateCode,
  name: a.stateName,
}));

/** Returns the adapter for a state, or undefined when the state is not yet supported. */
export function loadAdapter(stateCode: string): StateAdapter | undefined {
  return adapters[stateCode.toUpperCase()];
}

export const defaultDeploymentConfig: DeploymentConfig = {
  defaultMode: 'individual',
  autoClearTimeoutSeconds: 180,
  localResources: [],
};
