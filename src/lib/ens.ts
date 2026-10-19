// ENS contracts shared by the admin UI and the server.
//
// ENSv2 readiness: the app only talks to "a registrar" through
// available(label) / mint(label, owner) / revoke(label). Today that's
// IsWorkingRegistrar on the v1 NameWrapper; a v2 registrar exposing the same
// three functions can replace it by changing the registrar address in settings.
import { namehash, parseAbi, type Address } from "viem";
import { isTestnet, PARENT_NAME } from "./chains";

export const ENS_REGISTRY: Address = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"; // same on mainnet & Sepolia

export const NAME_WRAPPER: Address = isTestnet
  ? "0x0635513f179D50A207757E05759CbD106d7dFcE8" // Sepolia
  : "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401"; // Mainnet

/** Latest ENS Public Resolver (the one isworking.eth itself uses). */
export const PUBLIC_RESOLVER: Address = isTestnet
  ? "0xE99638b40E4Fff0129D56f03b55b6bbC4BBE49b5"
  : "0xF29100983E058B709F3D539b0c765937B804AC15";

export const PARENT_NODE = namehash(PARENT_NAME);

export const NAME_WRAPPER_ABI = parseAbi([
  "function getData(uint256 id) view returns (address owner, uint32 fuses, uint64 expiry)",
  "function ownerOf(uint256 id) view returns (address)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved)",
]);

export const FUSE_PARENT_CANNOT_CONTROL = 0x10000;

export type NameState =
  | { state: "unregistered" }
  | { state: "revocable"; owner: Address; expiry: number }
  /** PARENT_CANNOT_CONTROL is burned (e.g. minted elsewhere): can't be taken back until it expires. */
  | { state: "locked"; owner: Address; expiry: number };
