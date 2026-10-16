import optimized from "../data/optimizedAssets.json";

/** Keep source provenance in data; serve smaller content-addressed derivatives. */
export const assetURL = (src: string) => (optimized as Record<string, string>)[src] ?? src;
