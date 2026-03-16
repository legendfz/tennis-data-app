/**
 * Provider registry — manages available providers and selects the active one.
 */

import { BaseProvider } from './base.js';
import { TennisApi1Provider } from './tennisapi.js';
import { MatchStatProvider } from './matchstat.js';
import { UltimateTennisProvider } from './ultimate.js';

export { BaseProvider, TennisApi1Provider, MatchStatProvider, UltimateTennisProvider };
export type { SearchResults } from './base.js';

export type ProviderName = 'tennisapi1' | 'matchstat' | 'ultimate';

export class ProviderRegistry {
  private providers = new Map<ProviderName, BaseProvider>();
  private primaryName: ProviderName;

  constructor(primary: ProviderName, providers: Record<ProviderName, BaseProvider>) {
    this.primaryName = primary;
    for (const [name, provider] of Object.entries(providers) as [ProviderName, BaseProvider][]) {
      this.providers.set(name, provider);
    }
  }

  get primary(): BaseProvider {
    const p = this.providers.get(this.primaryName);
    if (!p) throw new Error(`Primary provider "${this.primaryName}" not registered`);
    return p;
  }

  get(name: ProviderName): BaseProvider | undefined {
    return this.providers.get(name);
  }

  setPrimary(name: ProviderName): void {
    if (!this.providers.has(name)) throw new Error(`Provider "${name}" is not registered`);
    this.primaryName = name;
  }
}

/**
 * Create a registry pre-populated from environment variables.
 */
export function createProviderRegistry(): ProviderRegistry {
  const apiKey = process.env.RAPIDAPI_KEY ?? '';

  const tennisHost = process.env.RAPIDAPI_HOST_TENNIS ?? 'tennisapi1.p.rapidapi.com';
  const matchstatHost = process.env.RAPIDAPI_HOST_MATCHSTAT ?? 'tennis-api-atp-wta-itf.p.rapidapi.com';
  const ultimateHost = process.env.RAPIDAPI_HOST_ULTIMATE ?? 'ultimate-tennis1.p.rapidapi.com';

  return new ProviderRegistry('tennisapi1', {
    tennisapi1: new TennisApi1Provider(apiKey, tennisHost),
    matchstat: new MatchStatProvider(),
    ultimate: new UltimateTennisProvider(),
  });
}
