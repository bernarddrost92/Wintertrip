import { normalizeEmail } from '../utils/normalizeEmail';

/**
 * Duplicate protection for the central Team Placement Import: a placement
 * is "the same" if the normalized owner email, professional, client, start
 * date, and end date all match after normalizing away case/whitespace
 * differences a re-export or re-paste would never intend as a real change.
 * Deliberately NOT based on ownerId — the import may run before that
 * person has ever logged in.
 */
function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildPlacementFingerprint(
  ownerEmail: string,
  professionalName: string,
  clientName: string,
  startDate: string,
  endDate: string,
): string {
  return [normalizeEmail(ownerEmail), normalizeText(professionalName), normalizeText(clientName), startDate, endDate].join('::');
}
