/**
 * How the UI names a household member without using personal names (we never ask for
 * them): "Person 2 (child, age 4)". Shared by results, what-if, and the review page so a
 * person is named the same way everywhere.
 */
import type { i18n as I18n } from 'i18next';
import type { HouseholdProfile } from '@openbridge/shared';
import { resolveAgeYears } from '@openbridge/shared';

export function memberLabel(
  i18n: I18n,
  profile: Pick<HouseholdProfile, 'members'>,
  memberId: string,
  asOf: string,
): string {
  const index = profile.members.findIndex((m) => m.id === memberId);
  const member = profile.members[index];
  if (!member) return i18n.t('memberLabel.unknown');
  const relationship = i18n.t(`relationship.${member.relationship}`);
  const age = resolveAgeYears(member, asOf);
  return age === undefined
    ? i18n.t('memberLabel.noAge', { n: index + 1, relationship })
    : i18n.t('memberLabel.withAge', { n: index + 1, relationship, age });
}
