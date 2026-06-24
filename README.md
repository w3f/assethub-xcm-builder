# Asset Hub XCM Builder

A static web page that generates **call data** and **call hash** for
`polkadotXcm.transferAssetsUsingTypeAndThen`, transferring the native token
between the Polkadot and Kusama Asset Hubs (DOT ⇄ KSM), optionally wrapped in
`proxy.proxy`.

It connects to a public RPC of the **source** chain to fetch live metadata,
encodes the call entirely in the browser, and never signs or submits anything.
Always verify the output before signing.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs static site to dist/
```

## Updating chain metadata

The PAPI descriptors in `.papi/` are committed so builds are deterministic.
After a runtime upgrade, refresh them with:

```bash
npx papi update     # re-fetch metadata for the configured chains
npx papi generate
```
