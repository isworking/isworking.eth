# get.isworking.dev: setup, local testing and production

This guide takes you from nothing to a live site. It covers every account and key, how to test
locally with fake money, and how to deploy. Plan on under an hour the first time.

**How it fits together**

| Piece | What it is | Cost |
|---|---|---|
| **Registrar contract** | `IsWorkingRegistrar` on Ethereum: takes payments (straight to your wallet), mints, revokes, refunds, and stores every setting, coupon, lock and sale | One deploy |
| Website + API | This Next.js app on **Vercel**. The API has no database: it reads the contract, signs discount vouchers and relays sponsored claims. | Free (Hobby) |
| Ethereum access | **Alchemy** RPC (or Infura) | Free tier |
| Wallet connection | **Reown** (WalletConnect) project | Free |
| Relayer wallet | Hot wallet that signs vouchers and pays gas for sponsored claims | ~0.01 ETH to start |

Buying is one transaction from the buyer's wallet, so they pay their own gas (cents). The relayer
only pays for **sponsored** claims: Devcon 8 tickets and sponsored coupons.

---

## 0. Renew isworking.eth first

**isworking.eth's registration expires on Oct 18, 2027.** If it lapses, the registrar can't create
or revoke names. After ENS's 90-day grace period, *every* isworking.eth name stops resolving. Renew
it for several years at <https://app.ens.domains/isworking.eth> before you launch. The admin Overview
warns you when it's within a year of expiring.

---

## 1. Install the tools

```bash
curl -fsSL https://bun.sh/install | bash                 # Bun (package manager + runtime)
curl -L https://foundry.paradigm.xyz | bash && foundryup # Foundry (contract build/tests, local fork, wallet tool)

cd get_isworking
bun install
```

---

## 2. Create the accounts and keys

### 2.1 Reown project ID (wallet connections)

1. Go to <https://dashboard.reown.com> and sign up.
2. **Create project**, choose **AppKit**, and name it `get.isworking.dev`.
3. Copy the **Project ID** into `NEXT_PUBLIC_REOWN_PROJECT_ID`.
4. Under the project's **Domain** allowlist, add `https://get.isworking.dev` and `http://localhost:3000`.

### 2.2 Alchemy RPC

1. Go to <https://dashboard.alchemy.com> and **Create new app**. Choose **Ethereum** (Mainnet).
2. Copy its HTTPS URL (`https://eth-mainnet.g.alchemy.com/v2/<key>`) into `RPC_URL_1`.
3. *(Recommended)* Create a second app for the browser. Under **Security → Allowlist**, restrict it to
   `get.isworking.dev`, then put its URL in `NEXT_PUBLIC_RPC_URL_1`. The browser uses it to wait for
   transactions and to read the admin history. Browser keys are public, so domain-lock them.

**Infura instead?** Create a key at <https://app.infura.io> and use `https://mainnet.infura.io/v3/<key>`.

### 2.3 Relayer wallet

```bash
cast wallet new
```

The **private key** goes in `RELAYER_PRIVATE_KEY`; keep it in your password manager. You'll see the
**address** in the admin panel. Send it **~0.01 ETH on Ethereum**. Each sponsored claim costs it a few
cents of gas, and the Overview warns when it runs low.

If the key leaks, someone could sign themselves discount vouchers or sponsored claims until you
replace it (see section 6). Each voucher is still bound to one name and one wallet, and still
limited by the coupon's uses and expiry. They **can't** touch payments, isworking.eth, or your wallet.

### 2.4 Etherscan API key (to publish the contract source)

Create one at <https://etherscan.io/myapikey>. It's used once, in step 5.3.

---

## 3. Run it locally and test it (fake money)

Local testing uses a **fork of Ethereum mainnet**: a private copy with the real ENS, Chainlink and
token contracts, and the real isworking.eth, but no real money.

```bash
cp .env.example .env.local
```

In `.env.local`, set:

- `NEXT_PUBLIC_REOWN_PROJECT_ID`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- `RELAYER_PRIVATE_KEY` (any fresh key)
- `RPC_URL_1=http://127.0.0.1:8545`
- `NEXT_PUBLIC_RPC_URL_1=http://127.0.0.1:8545`

Then:

```bash
bun run fork                                  # terminal 1: mainnet fork on :8545
bun run contracts:build                       # terminal 2
bun run fork:setup -- 0xYourTestWallet        # deploys + approves the registrar, enables USDT/USDC/DAI,
                                              # funds the relayer and your wallet, makes your wallet the admin,
                                              # and writes NEXT_PUBLIC_REGISTRAR_ADDRESS into .env.local
bun run dev                                   # → http://localhost:3000 (restart it after fork:setup)
```

**Point a browser wallet at the fork.** In Rabby or MetaMask, change Ethereum's RPC to
`http://127.0.0.1:8545`, and use the wallet you passed to `fork:setup` (it has 10 fake ETH).
Mobile WalletConnect can't reach `localhost`. Use a **fresh** wallet: well-known dev keys have
smart-account code on mainnet, and the app rightly refuses to mint to them.

**Things to try:**
- Buy with ETH (one transaction), or with USDC (approve, then buy).
- In `/admin`, create a coupon and buy with it. Then create a **Sponsor** coupon and claim for free.
- Devcon: drop a `.pkpass`, or paste a Google Wallet link.
- Names tab: revoke a name (the refund goes back in the same transaction), see the lock, then lift it.
  Reserve a name.

**Automated checks:**

```bash
bun run contracts:test     # 29 contract tests against a mainnet fork
bun run lint && bunx tsc --noEmit
bun run build
```

After changing the contract, run `bun run contracts:build && bun run contracts:export` to refresh the
ABI and bytecode in `src/lib/registrar-artifact.ts`.

---

## 4. Deploy the website

### 4.1 Publish the code (it's open source)

1. Create a **public** GitHub repo, e.g. `isworking/get.isworking.dev`.
2. Push:

   ```bash
   git add -A && git commit -m "get.isworking.dev"
   git remote add origin git@github.com:isworking/get.isworking.dev.git
   git push -u origin main
   ```

   `.env*` files are ignored, except `.env.example`.

### 4.2 Vercel

1. Go to <https://vercel.com>, then **Add New → Project** and import the repo. Next.js and Bun are
   detected automatically.
2. Under **Environment Variables** (Production), add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_REOWN_PROJECT_ID` | 2.1 |
   | `NEXT_PUBLIC_SITE_URL` | `https://get.isworking.dev` |
   | `NEXT_PUBLIC_SOURCE_URL` | your repo URL |
   | `NEXT_PUBLIC_RPC_URL_1` | domain-locked Alchemy URL (2.2) |
   | `RPC_URL_1` | Alchemy URL (2.2) |
   | `RELAYER_PRIVATE_KEY` | 2.3 |
   | `NEXT_PUBLIC_REGISTRAR_ADDRESS` | leave empty for now (set in step 5.2) |

3. **Deploy**, then go to **Settings → Domains**, add `get.isworking.dev`, and at your DNS provider
   create `get CNAME cname.vercel-dns.com`.

---

## 5. Go live on Ethereum

### 5.1 Deploy and approve the registrar

Open `https://get.isworking.dev/admin` and connect the wallet whose **primary name is isworking.eth**
(`0xDfFB…E499`). In **Setup**:

1. **Fund the relayer:** the step shows its address and balance.
2. **Deploy registrar:** one transaction. Your wallet becomes the contract's admin **and** treasury
   (all payments land there), and the app's relayer becomes its relayer. Price starts at $0.99, the
   refund period at 1 year, the revocation lock at 30 days, and Devcon 8 at 100% off, sponsored,
   until Nov 6, 2026.
3. **Approve it in the NameWrapper:** one transaction (`setApprovalForAll`). It lets the registrar
   create and revoke isworking.eth subnames. The contract has no function that can move or change
   isworking.eth.
4. **Accept stablecoins:** toggle USDT, USDC and DAI (one transaction each).
5. **Check roles:** confirm the relayer matches.

### 5.2 Point the site at it

Copy the registrar address from the Setup tab into Vercel as `NEXT_PUBLIC_REGISTRAR_ADDRESS`, then
**redeploy**. The site is now live.

### 5.3 Publish the contract source on Etherscan

```bash
cd contracts
forge verify-contract <REGISTRAR_ADDRESS> src/IsWorkingRegistrar.sol:IsWorkingRegistrar \
  --chain mainnet --etherscan-api-key <ETHERSCAN_KEY> --watch \
  --constructor-args $(cast abi-encode "constructor(address,address,address,bytes32,address,address,address)" \
    0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401 \
    0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e \
    0xF29100983E058B709F3D539b0c765937B804AC15 \
    $(cast namehash isworking.eth) \
    0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 \
    0xDfFBFc54C6863E6e5ba271E2f0e15FB5d1EFE499 \
    <RELAYER_ADDRESS>)
```

### 5.4 Retire the Namespace listing

In <https://app.namespace.ninja/onchain>, select isworking.eth and deactivate it (the ✕ next to
ACTIVATED), so there's only one way to mint names.

### 5.5 Devcon 8

In the **Devcon** tab:
- Drop your own Devcon 8 `.pkpass` and click **Pin this issuer**.
- Paste your own "Add to Google Wallet" link and click **Pin this issuer**.

From then on, only genuine Devcon passes are accepted.

### 5.6 Smoke test with real money

From a **second** wallet, buy a name with ETH. Check it in the ENS app, set it as that wallet's primary
name, and confirm the payment arrived in your isworking.eth wallet and the sale shows in **Sales**.

---

## 6. Running it day to day

Every change is a transaction from your admin wallet. The contract enforces who can do what.

- **Overview:** warnings for isworking.eth's expiry, a low relayer balance, missing approval, or a
  stale ETH price (while the price is stale, ETH payments pause automatically and stablecoins still work).
- **Sales:** every sale, read from on-chain events.
- **Coupons:**
  - Regular coupons are % off the name; buyers still pay gas.
  - **Sponsor** coupons are 100% off with gas covered. Set **max uses**.
  - Only a code's *hash* goes on-chain, so the browser you create a code in remembers it. Copy it
    when you create it.
  - Long random codes can't be guessed; short ones can.
- **Names:**
  - **Revoke & refund** in one transaction. The contract works out the pro-rata refund of what was
    paid and sends it to whoever paid. For stablecoin sales, your wallet is asked to allow the refund first.
  - The name stops resolving immediately and is locked for the lock period, or reserved forever if you tick the box.
  - Lift locks early under **Revocation locks**.
  - **Reserved names** can't be claimed.
- **Settings:** price, refund period, lock period, minimum name length, and roles (admin / treasury / relayer).
- **Pause everything:** Setup → **Pause sales** withdraws the NameWrapper approval. Existing names are unaffected.

**Rotating the relayer key:**
1. Run `cast wallet new` and fund the new address.
2. Update `RELAYER_PRIVATE_KEY` in Vercel and redeploy.
3. Setup → **Use this app's relayer** (or Settings → Roles).

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| "Minting isn't set up yet" | `NEXT_PUBLIC_REGISTRAR_ADDRESS` isn't set; finish 5.1–5.2 and redeploy. |
| Connect wallet does nothing / 403 in console | Add the domain to the Reown allowlist (2.1). |
| "Couldn't reach Ethereum" | Check `RPC_URL_1`. |
| "Your wallet can't receive ENS names" | The buyer's wallet is a smart account without ERC-1155 support. Use another wallet. |
| ETH checkout fails with a price error | Chainlink's feed is stale; pay with a stablecoin or wait. |
| Sponsored claims fail | The relayer is out of ETH (Overview), or its key doesn't match the contract's relayer (Setup step 5). |
| Admin panel says "isn't the admin" | Connect the wallet that deployed the registrar (or the one set under Roles). |
