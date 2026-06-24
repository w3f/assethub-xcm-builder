export type DirectionId = "dotToKsm" | "ksmToDot";

export interface SourceChain {
  id: "dotAh" | "ksmAh";
  label: string;
  symbol: string;
  decimals: number;
  ss58Prefix: number;
  targetNetwork: "Polkadot" | "Kusama";
  targetLabel: string;
  endpoints: { name: string; url: string }[];
}

export const DIRECTIONS: Record<DirectionId, SourceChain> = {
  dotToKsm: {
    id: "dotAh",
    label: "Polkadot Asset Hub",
    symbol: "DOT",
    decimals: 10,
    ss58Prefix: 0,
    targetNetwork: "Kusama",
    targetLabel: "Kusama Asset Hub",
    endpoints: [
      { name: "Parity", url: "wss://polkadot-asset-hub-rpc.polkadot.io" },
      { name: "Dwellir", url: "wss://asset-hub-polkadot-rpc.n.dwellir.com" },
      { name: "LuckyFriday", url: "wss://rpc-asset-hub-polkadot.luckyfriday.io" },
      { name: "OnFinality", url: "wss://statemint.api.onfinality.io/public-ws" },
    ],
  },
  ksmToDot: {
    id: "ksmAh",
    label: "Kusama Asset Hub",
    symbol: "KSM",
    decimals: 12,
    ss58Prefix: 2,
    targetNetwork: "Polkadot",
    targetLabel: "Polkadot Asset Hub",
    endpoints: [
      { name: "Parity", url: "wss://kusama-asset-hub-rpc.polkadot.io" },
      { name: "Dwellir", url: "wss://asset-hub-kusama-rpc.n.dwellir.com" },
      { name: "LuckyFriday", url: "wss://rpc-asset-hub-kusama.luckyfriday.io" },
      { name: "OnFinality", url: "wss://assethub-kusama.api.onfinality.io/public-ws" },
    ],
  },
};

export const TARGET_PARACHAIN = 1000;
