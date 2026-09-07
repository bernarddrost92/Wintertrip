import { describe, expect, it } from 'vitest';
import { withBase } from './assetPath';

describe('withBase (deployment-safe asset URLs)', () => {
  it('resolves against the GitHub Pages project-site base', () => {
    expect(withBase('audio/007-james-bond-theme.mp3', '/Wintertrip/')).toBe('/Wintertrip/audio/007-james-bond-theme.mp3');
  });

  it('resolves against a root base for local dev / a custom domain', () => {
    expect(withBase('audio/007-james-bond-theme.mp3', '/')).toBe('/audio/007-james-bond-theme.mp3');
  });

  it('normalizes a base missing its trailing slash', () => {
    expect(withBase('audio/x.mp3', '/Wintertrip')).toBe('/Wintertrip/audio/x.mp3');
  });

  it('normalizes a leading slash on the path so it never doubles up', () => {
    expect(withBase('/audio/x.mp3', '/Wintertrip/')).toBe('/Wintertrip/audio/x.mp3');
  });

  it('defaults to the live Vite BASE_URL when no base is passed', () => {
    expect(withBase('audio/x.mp3')).toBe(`${import.meta.env.BASE_URL}audio/x.mp3`);
  });
});
