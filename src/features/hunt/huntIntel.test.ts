import { describe, expect, it } from 'vitest';
import { MANUAL_POWER_BI_SNAPSHOT, OWN_TEAM } from '../../data/manualPowerBiSnapshot';
import { getHuntIntel } from './huntIntel';
import { HUNT_TEST_STANDINGS } from './huntTestStandings';

describe('getHuntIntel — Hunt Mode / ribbon numbers from the official standings', () => {
  it('reads VCDB rank, Net FTE rank, factor and final position from Zwolle’s official row', () => {
    const intel = getHuntIntel(HUNT_TEST_STANDINGS, OWN_TEAM, 0);
    expect(intel).toMatchObject({ vcdbRank: 1, netFteRank: 10, factor: 1.3, finalPosition: 2, openFte: 0, projectedNetFteRank: 10 });
  });

  it('next target is the first team above Zwolle in Net FTE, with the FTE needed to pass it', () => {
    const intel = getHuntIntel(HUNT_TEST_STANDINGS, OWN_TEAM, 0);
    // Utrecht −7,60 vs Zwolle −7,78 → 0,18 + the 0,01 pass margin.
    expect(intel.nextTarget).toEqual({ rank: 9, team: 'Utrecht', netFte: -7.6, fteNeeded: 0.19 });
  });

  it('counts the open FTE-bonnen: projected rank moves up and the next target moves on', () => {
    const intel = getHuntIntel(HUNT_TEST_STANDINGS, OWN_TEAM, 0.5);
    expect(intel.projectedNetFte).toBe(-7.28);
    expect(intel.projectedNetFteRank).toBe(9);
    expect(intel.nextTarget).toEqual({ rank: 8, team: 'Leeuwarden', netFte: -4.9, fteNeeded: 2.39 });
  });

  it('has no next target once Zwolle is #1 in Net FTE', () => {
    expect(getHuntIntel(HUNT_TEST_STANDINGS, OWN_TEAM, 20).nextTarget).toBeNull();
  });

  it('follows the live snapshot — never hardcoded', () => {
    const live = MANUAL_POWER_BI_SNAPSHOT.standings;
    const own = live.find((row) => row.team === OWN_TEAM)!;
    const intel = getHuntIntel(live, OWN_TEAM, 0);
    expect(intel.vcdbRank).toBe(own.vcdbRanking);
    expect(intel.netFteRank).toBe(own.netFteRanking);
    expect(intel.factor).toBe(own.factor);
    expect(intel.finalPosition).toBe(own.finalRanking);
    if (intel.nextTarget) {
      expect(intel.nextTarget.rank).toBeLessThan(own.netFteRanking);
      expect(intel.nextTarget.fteNeeded).toBeGreaterThan(0);
    }
  });
});
