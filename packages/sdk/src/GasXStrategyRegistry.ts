export interface StrategyDescriptor {
  strategyId: `0x${string}`;
  kind: "gasx-whitelist" | "gasx-sponsortoken" | "gasx-erc20" | "circle" | "external";
  paymaster: `0x${string}` | null;
  policyManager: `0x${string}`;
  chainId: number;
}

/** Off-chain swap plane (spec §6.2): register strategies, map campaigns → strategy, route. Fail-closed. */
export class GasXStrategyRegistry {
  private byId = new Map<string, StrategyDescriptor>();
  private campaignToStrategy = new Map<string, `0x${string}`>();

  private key(chainId: number, id: `0x${string}`): string {
    return `${chainId}:${id.toLowerCase()}`;
  }

  register(d: StrategyDescriptor): void {
    this.byId.set(this.key(d.chainId, d.strategyId), d);
  }

  mapCampaign(chainId: number, campaignId: `0x${string}`, strategyId: `0x${string}`): void {
    this.campaignToStrategy.set(this.key(chainId, campaignId), strategyId);
  }

  list(chainId: number): StrategyDescriptor[] {
    return [...this.byId.values()].filter((d) => d.chainId === chainId);
  }

  get(chainId: number, strategyId: `0x${string}`): StrategyDescriptor | undefined {
    return this.byId.get(this.key(chainId, strategyId));
  }

  async forCampaign(chainId: number, campaignId: `0x${string}`): Promise<StrategyDescriptor> {
    const sid = this.campaignToStrategy.get(this.key(chainId, campaignId));
    if (!sid) throw new Error(`no strategy mapped for campaign ${campaignId} on chain ${chainId}`);
    const d = this.get(chainId, sid);
    if (!d) throw new Error(`strategy ${sid} not registered on chain ${chainId}`);
    return d;
  }
}
