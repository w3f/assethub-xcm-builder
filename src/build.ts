import { Binary, Enum, type PolkadotClient } from "polkadot-api";
import { Blake2256 } from "@polkadot-api/substrate-bindings";
import {
  dotAh,
  ksmAh,
  MultiAddress,
  XcmV3MultiassetFungibility,
  XcmV3WeightLimit,
  XcmV5AssetFilter,
  XcmV5Instruction,
  XcmV5Junction,
  XcmV5Junctions,
  XcmV5NetworkId,
  XcmV5WildAsset,
  XcmVersionedAssetId,
  XcmVersionedAssets,
  XcmVersionedLocation,
  XcmVersionedXcm,
} from "@polkadot-api/descriptors";
import { SourceChain, TARGET_PARACHAIN } from "./config";
import { resolveAccount, toSs58 } from "./inputs";

export interface BuildParams {
  source: SourceChain;
  amountPlanck: bigint;
  beneficiaryBytes: Uint8Array;
  proxyRealBytes?: Uint8Array;
}

export interface BuiltCall {
  callData: string;
  callHash: string;
}

const here = () => ({ parents: 1, interior: XcmV5Junctions.Here() });

function transferArgs(params: BuildParams) {
  const network =
    params.source.targetNetwork === "Kusama"
      ? XcmV5NetworkId.Kusama()
      : XcmV5NetworkId.Polkadot();

  return {
    dest: XcmVersionedLocation.V5({
      parents: 2,
      interior: XcmV5Junctions.X2([
        XcmV5Junction.GlobalConsensus(network),
        XcmV5Junction.Parachain(TARGET_PARACHAIN),
      ]),
    }),
    assets: XcmVersionedAssets.V5([
      { id: here(), fun: XcmV3MultiassetFungibility.Fungible(params.amountPlanck) },
    ]),
    assets_transfer_type: Enum("LocalReserve"),
    remote_fees_id: XcmVersionedAssetId.V5(here()),
    fees_transfer_type: Enum("LocalReserve"),
    custom_xcm_on_dest: XcmVersionedXcm.V5([
      XcmV5Instruction.DepositAsset({
        assets: XcmV5AssetFilter.Wild(XcmV5WildAsset.AllCounted(1)),
        beneficiary: {
          parents: 0,
          interior: XcmV5Junctions.X1(
            XcmV5Junction.AccountId32({
              network: undefined,
              id: Binary.fromBytes(params.beneficiaryBytes),
            }),
          ),
        },
      }),
    ]),
    weight_limit: XcmV3WeightLimit.Unlimited(),
  };
}

export async function prewarm(client: PolkadotClient, source: SourceChain): Promise<void> {
  const api = source.id === "dotAh" ? client.getTypedApi(dotAh) : client.getTypedApi(ksmAh);
  await api.compatibilityToken;
}

export async function buildCall(
  client: PolkadotClient,
  params: BuildParams,
): Promise<BuiltCall> {
  const api =
    params.source.id === "dotAh"
      ? client.getTypedApi(dotAh)
      : client.getTypedApi(ksmAh);

  const transfer = api.tx.PolkadotXcm.transfer_assets_using_type_and_then(
    transferArgs(params),
  );

  const tx = params.proxyRealBytes
    ? api.tx.Proxy.proxy({
        real: MultiAddress.Id(toSs58(params.proxyRealBytes, params.source.ss58Prefix)),
        force_proxy_type: undefined,
        call: transfer.decodedCall,
      })
    : transfer;

  const encoded = await tx.getEncodedData();
  return {
    callData: encoded.asHex(),
    callHash: Binary.fromBytes(Blake2256(encoded.asBytes())).asHex(),
  };
}

export { resolveAccount };
