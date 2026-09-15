/**
 * Duplicate protection for re-imported Excel sheets: a project is "the same"
 * if owner + project + client + professional all match after normalizing
 * away case and whitespace differences a person retyping/copy-pasting would
 * never intend as a real change.
 */
function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildProjectFingerprint(
  ownerId: string,
  projectName: string,
  clientName: string,
  professionalName: string | null | undefined,
): string {
  return [normalize(ownerId), normalize(projectName), normalize(clientName), normalize(professionalName)].join('::');
}
