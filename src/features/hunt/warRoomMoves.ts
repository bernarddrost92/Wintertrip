import { formatSignedFte } from '../../utils/format';
import type { NetFteTarget } from '../../services/netFteProjection';

/**
 * WAR ROOM — the four Net FTE moves, each with one concrete assignment and
 * three steps. Local copy, no API. The impact line is only quantified where
 * a move adds FTE (a verlenging keeps FTE, it doesn't add it).
 */
export type WarRoomMoveKey = 'VERLENGEN' | 'PO_CONTRACT' | 'NIEUW' | 'UREN';

export interface WarRoomMove {
  key: WarRoomMoveKey;
  label: string;
  /** One line under the tile: what the move is. */
  hint: string;
  assignment: string;
  steps: [string, string, string];
}

export const WAR_ROOM_MOVES: readonly WarRoomMove[] = [
  {
    key: 'VERLENGEN',
    label: 'Verlengen',
    hint: 'Een BPT/VD-contract langer laten lopen.',
    assignment: 'Bel vandaag één professional van wie het contract vóór 31 januari afloopt.',
    steps: ['Pak je lijst met contracten die vóór 31 januari aflopen.', 'Kies er één en plan vandaag het verlenggesprek.', 'Rond hem af en leg hem vast als FTE-bon.'],
  },
  {
    key: 'PO_CONTRACT',
    label: 'PO → contract',
    hint: 'Een PO-professional op contract zetten.',
    assignment: 'Kies één PO-professional en bespreek deze week de overstap naar contract.',
    steps: ['Kies de PO-professional die het langst bij dezelfde klant zit.', 'Check met de klant of contract voor hen werkt.', 'Plan het gesprek en leg de move vast als FTE-bon.'],
  },
  {
    key: 'NIEUW',
    label: 'Nieuwe contractant',
    hint: 'Een nieuwe BPT/VD-professional binnenhalen.',
    assignment: 'Bel vandaag één klant met een openstaande vacature voor een nieuwe contractant.',
    steps: ['Zoek een klant met een openstaande vacature.', 'Stel één kandidaat voor op contractbasis.', 'Zodra hij tekent: leg hem vast als FTE-bon.'],
  },
  {
    key: 'UREN',
    label: 'Uren ophogen',
    hint: 'Meer uren voor een bestaande contractant.',
    assignment: 'Vind één parttime contractant die een dag extra kan werken.',
    steps: ['Pak je parttime contractanten erbij.', 'Vraag wie er een dag bij wil, en check het bij de klant.', 'Leg de extra uren vast als FTE-bon.'],
  },
];

/** What the move does toward the next Net FTE target, in plain numbers. */
export function warRoomImpact(move: WarRoomMoveKey, target: NetFteTarget | null): string {
  if (!target) return 'We staan #1 in Net FTE. Elke move houdt die plek vast.';
  const needed = `${formatSignedFte(target.fteNeeded)} FTE voor #${target.rank} ${target.team}`;
  switch (move) {
    case 'VERLENGEN':
      return `Een verlenging houdt FTE vast die anders wegvalt op 31 januari. Nodig: ${needed}.`;
    case 'PO_CONTRACT':
    case 'NIEUW': {
      const count = Math.max(1, Math.ceil(target.fteNeeded / 0.8));
      return `32 uur = +0,8 FTE. Nodig: ${needed}, dat is ${count} × deze move.`;
    }
    case 'UREN': {
      const days = Math.max(1, Math.ceil(target.fteNeeded / 0.2));
      return `Eén dag extra per week = +0,2 FTE. Nodig: ${needed}, dat is ${days} extra dagen.`;
    }
  }
}
