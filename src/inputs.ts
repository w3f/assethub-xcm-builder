import { AccountId, Binary } from "polkadot-api";
import { getSs58AddressInfo } from "@polkadot-api/substrate-bindings";

const HEX_32 = /^0x[0-9a-fA-F]{64}$/;

export interface ResolvedAccount {
  bytes: Uint8Array;
  hex: string;
}

export function resolveAccount(input: string): ResolvedAccount {
  const value = input.trim();
  if (!value) throw new Error("Address is required");

  if (HEX_32.test(value)) {
    const bytes = Binary.fromHex(value.toLowerCase()).asBytes();
    return { bytes, hex: value.toLowerCase() };
  }

  const info = getSs58AddressInfo(value);
  if (!info.isValid) {
    throw new Error("Not a valid 0x 32-byte hex or SS58 address");
  }
  if (info.publicKey.length !== 32) {
    throw new Error("Address is not a 32-byte (AccountId32) account");
  }
  return { bytes: info.publicKey, hex: Binary.fromBytes(info.publicKey).asHex() };
}

export function toSs58(bytes: Uint8Array, ss58Prefix: number): string {
  return AccountId(ss58Prefix).dec(bytes);
}

export function toPlanck(amount: string, decimals: number): bigint {
  const value = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error("Amount must be a positive decimal number");
  }
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals) {
    throw new Error(`At most ${decimals} decimal places for this token`);
  }
  const planck = BigInt(whole + fraction.padEnd(decimals, "0"));
  if (planck <= 0n) throw new Error("Amount must be greater than zero");
  return planck;
}
