// Prepares a local mainnet fork (anvil) for testing get.isworking.dev with fake money:
// funds the relayer, deploys IsWorkingRegistrar as if you were the isworking.eth owner,
// approves it, accepts USDT/USDC/DAI, writes its address to .env.local, and funds your
// test wallet, which also becomes the registrar's admin, so you can use /admin on the fork.
// Restart `bun run dev` afterwards so the new address is picked up.
//
//   bun run fork                        # terminal 1: anvil on :8545
//   bun run fork:setup -- 0xYourWallet  # terminal 2
import { readFileSync, writeFileSync } from "node:fs";
import { createPublicClient, createTestClient, createWalletClient, http, namehash, parseAbi, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const RPC = process.env.FORK_RPC ?? "http://127.0.0.1:8545";
const OWNER = "0xDfFBFc54C6863E6e5ba271E2f0e15FB5d1EFE499"; // isworking.eth
const NAME_WRAPPER = "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401";
const ENS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const RESOLVER = "0xF29100983E058B709F3D539b0c765937B804AC15";
const ETH_USD = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const TOKENS = [
  ["0xdAC17F958D2ee523a2206206994597C13D831ec7", 6], // USDT
  ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6], // USDC
  ["0x6B175474E89094C44Da98b954EedeAC495271d0F", 18], // DAI
];

const envFile = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
if (!env.RELAYER_PRIVATE_KEY) throw new Error("Set RELAYER_PRIVATE_KEY in .env.local first (e.g. from `cast wallet new`)");
const relayer = privateKeyToAccount(env.RELAYER_PRIVATE_KEY);
const artifact = JSON.parse(readFileSync("contracts/out/IsWorkingRegistrar.sol/IsWorkingRegistrar.json", "utf8"));

const pub = createPublicClient({ chain: mainnet, transport: http(RPC) });
const test = createTestClient({ chain: mainnet, mode: "anvil", transport: http(RPC) });
const owner = createWalletClient({ chain: mainnet, transport: http(RPC), account: OWNER });
const wallet = process.argv[2];
const admin = wallet ?? OWNER;

await test.setBalance({ address: relayer.address, value: parseEther("1") });
await test.impersonateAccount({ address: OWNER });
await test.setBalance({ address: OWNER, value: parseEther("10") });

const { contractAddress } = await pub.waitForTransactionReceipt({
  hash: await owner.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode.object,
    args: [NAME_WRAPPER, ENS, RESOLVER, namehash("isworking.eth"), ETH_USD, OWNER, relayer.address],
  }),
});
const send = async (address, abi, functionName, args) =>
  pub.waitForTransactionReceipt({ hash: await owner.writeContract({ address, abi, functionName, args }) });
await send(NAME_WRAPPER, parseAbi(["function setApprovalForAll(address,bool)"]), "setApprovalForAll", [contractAddress, true]);
for (const [token, decimals] of TOKENS) await send(contractAddress, artifact.abi, "setToken", [token, decimals]);
// Hand admin to your test wallet (treasury stays the isworking.eth wallet).
if (admin !== OWNER) await send(contractAddress, artifact.abi, "setRoles", [admin, OWNER, relayer.address]);

const line = `NEXT_PUBLIC_REGISTRAR_ADDRESS=${contractAddress}`;
writeFileSync(
  ".env.local",
  /^NEXT_PUBLIC_REGISTRAR_ADDRESS=.*$/m.test(envFile)
    ? envFile.replace(/^NEXT_PUBLIC_REGISTRAR_ADDRESS=.*$/m, line)
    : `${envFile.trimEnd()}\n${line}\n`,
);

if (wallet) await test.setBalance({ address: wallet, value: parseEther("10") });

console.log(`Registrar deployed, approved and accepting USDT/USDC/DAI: ${contractAddress}`);
console.log(`Wrote ${line} to .env.local (restart \`bun run dev\`)`);
console.log(`Relayer ${relayer.address} funded with 1 ETH`);
if (wallet) console.log(`Your wallet ${wallet} funded with 10 ETH and made the registrar's admin`);
