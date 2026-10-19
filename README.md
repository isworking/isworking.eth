# get.isworking.dev

Permanent, on-chain `name.isworking.eth` ENS names for **$0.99 one-time + gas**. Wallet-only: no
email, no accounts, no database. Open source and open to everyone.

**→ Setup, local testing and production deployment: [docs/SETUP.md](docs/SETUP.md)**

## How it works

```
buyer wallet ── registerWithETH / registerWithToken ──▶ IsWorkingRegistrar ──▶ payment → isworking.eth wallet
                                                              └──────────────▶ ENS NameWrapper: name minted to buyer
                      (one transaction: pay and mint together, or nothing happens)
```

- **[`IsWorkingRegistrar`](contracts/src/IsWorkingRegistrar.sol)** is the whole backend's state. It:
  - takes ETH (priced with Chainlink ETH/USD) or USDT/USDC/DAI, forwards the payment to the treasury
    in the same transaction, and mints;
  - stores the price, accepted tokens, coupons (as hashes), reserved names, revocation locks, Devcon
    claims, sales and an off-chain policy blob;
  - revokes names and refunds the payer pro-rata in one call.

  It never holds funds, and it can only create or revoke isworking.eth subnames, never move or change
  isworking.eth. Its NameWrapper rights come from the owner's `setApprovalForAll`.
- **Names** are wrapped subnames with no fuses burned: permanent, usable as primary names, and
  revocable for abuse (revoking also clears the resolver, so the name stops resolving at once).
- **Discounts** are EIP-712 vouchers signed by the app's relayer and bound to one name and one wallet,
  so a coupon code seen in the mempool is useless to anyone else.
  - **Coupons:** % off; buyers still pay gas.
  - **Sponsored** coupons and **Devcon 8** tickets: free, with the relayer sending the mint and
    paying the gas. Each Devcon ticket is a single-use `DEVCON8_…` coupon, one per wallet, valid until
    Devcon ends. The contract enforces all of this.
- **The server** (Next.js API routes on Vercel) is stateless. It reads the contract, checks Devcon
  tickets (the Apple Wallet signature up to Apple's root, Google Wallet links against Google's
  published keys), signs vouchers and relays sponsored claims.
- **Admin** (`/admin`) talks to the contract directly from the isworking.eth wallet: setup (deploy +
  approve), sales, coupons, revoke & refund, locks, reserved names, Devcon and settings.

## Stack

Solidity + OpenZeppelin + Foundry · Next.js 16 · Reown AppKit + wagmi + viem · Tailwind CSS 4 · Bun.

## Commands

```bash
bun install
bun run dev                 # app on http://localhost:3000
bun run fork                # local Ethereum mainnet fork (anvil) on :8545
bun run fork:setup -- 0x…   # deploy + approve the registrar on the fork; your wallet becomes admin
bun run contracts:test      # contract tests (mainnet fork)
bun run contracts:export    # refresh the app's ABI/bytecode after changing the contract
bun run build               # production build
```

Questions: [raj@isworking.dev](mailto:raj@isworking.dev)
