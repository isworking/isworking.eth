// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface INameWrapper {
    function ownerOf(uint256 id) external view returns (address);
    function setSubnodeRecord(
        bytes32 parentNode,
        string calldata label,
        address owner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

interface IENS {
    function owner(bytes32 node) external view returns (address);
}

interface IAddrResolver {
    function setAddr(bytes32 node, address a) external;
}

interface IPriceFeed {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

/// @title isworking.eth names
/// @notice Sells permanent, revocable subnames of isworking.eth. Payment and minting
/// happen in one transaction: the buyer pays this contract, which forwards the money
/// straight to the treasury and mints the name to them. Nothing is ever held here.
///
/// Everything the service needs lives on-chain: price, accepted tokens, coupons,
/// reserved names, revocation locks, Devcon claims, refunds and an off-chain policy blob.
///
/// The parent's owner grants this contract NameWrapper operator rights
/// (setApprovalForAll). The contract can only create or revoke subnames of
/// `parentNode`; it has no way to transfer, unwrap or reconfigure the parent or any
/// other name, and no arbitrary-call function.
contract IsWorkingRegistrar is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Immutable wiring ─────────────────────────────────────────────────
    INameWrapper public immutable nameWrapper;
    IENS public immutable ens;
    address public immutable resolver;
    bytes32 public immutable parentNode;
    IPriceFeed public immutable ethUsdFeed;
    /// Block this contract was deployed in, so apps know where to start reading events.
    uint256 public immutable deployedAt;

    // ─── Roles ────────────────────────────────────────────────────────────
    /// The isworking.eth owner: configures everything, revokes names.
    address public admin;
    /// Receives every payment.
    address public treasury;
    /// The app's hot key: signs vouchers (discounts) and relays sponsored claims.
    address public relayer;

    // ─── Pricing ──────────────────────────────────────────────────────────
    /// One-time price of a name, in US cents.
    uint32 public priceCents;
    /// Accepted ERC-20s (USD stablecoins priced 1:1) and their decimals; 0 = not accepted.
    mapping(address token => uint8 decimals) public tokenDecimals;

    // ─── Names ────────────────────────────────────────────────────────────
    mapping(bytes32 labelhash => bool) public reserved;
    mapping(bytes32 labelhash => uint64) public lockedUntil;
    /// Revoked names can't be claimed again for this long.
    uint32 public lockPeriod;
    /// Refunds on revoke shrink linearly to zero over this long after the sale.
    uint32 public refundPeriod;

    struct Sale {
        address buyer;
        uint64 soldAt;
        address token; // address(0) = ETH
        uint128 paid; // what the buyer paid for the name, in `token` units
    }

    mapping(bytes32 node => Sale) public sales;

    // ─── Discounts ────────────────────────────────────────────────────────
    struct Coupon {
        uint8 percentOff; // 1..100; 0 = doesn't exist
        bool sponsored; // 100% off and the gas is covered (relayed)
        bool active;
        uint32 maxUses; // 0 = unlimited
        uint32 uses;
        uint64 expiresAt; // 0 = never
    }

    /// Coupons are keyed by keccak256 of the code, so codes never appear on-chain.
    mapping(bytes32 codeHash => Coupon) public coupons;

    uint8 public devconPercentOff;
    bool public devconSponsored;
    uint64 public devconEndsAt;
    mapping(bytes32 ticket => bool) public ticketUsed;
    mapping(address wallet => bool) public devconClaimed;

    /// JSON for off-chain checks the contract can't do itself (pinned Devcon pass
    /// issuers, minimum name length…). Read by the app's server.
    string public policy;

    // ─── Vouchers ─────────────────────────────────────────────────────────
    /// A discount authorised by the relayer for one name and one owner, so a coupon
    /// code seen in the mempool is useless to anyone else.
    struct Voucher {
        bytes32 labelhash;
        address owner;
        bytes32 codeHash; // 0 = no coupon
        bytes32 ticket; // 0 = no Devcon ticket (fingerprint of the ticket otherwise)
        uint64 deadline;
    }

    bytes32 private constant VOUCHER_TYPEHASH =
        keccak256("Voucher(bytes32 labelhash,address owner,bytes32 codeHash,bytes32 ticket,uint64 deadline)");

    // ─── Events ───────────────────────────────────────────────────────────
    event Registered(
        string label,
        bytes32 indexed node,
        address indexed owner,
        address token,
        uint256 paid,
        uint8 percentOff,
        bytes32 codeHash,
        bytes32 ticket,
        bool sponsored
    );
    event Revoked(string label, bytes32 indexed node, address refundedTo, uint256 refund, uint64 lockedUntil);
    event ReservedSet(string label, bool reserved);
    event LockSet(string label, uint64 until);
    event CouponSet(bytes32 indexed codeHash, uint8 percentOff, bool sponsored, bool active, uint32 maxUses, uint64 expiresAt, string note);
    event TicketDisabled(bytes32 indexed ticket);
    event ConfigChanged();

    // ─── Errors ───────────────────────────────────────────────────────────
    error NotAdmin();
    error NotRelayer();
    error InvalidLabel();
    error InvalidOwner();
    error NameTaken();
    error NameReserved();
    error NameLocked(uint64 until);
    error NotRegistered();
    error BadVoucher();
    error VoucherExpired();
    error CouponUnusable();
    error TicketUnusable();
    error NotSponsored();
    error TokenNotAccepted();
    error Underpaid(uint256 required);
    error RefundRequired(uint256 required);
    error StalePrice();
    error TransferFailed();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(
        INameWrapper _nameWrapper,
        IENS _ens,
        address _resolver,
        bytes32 _parentNode,
        IPriceFeed _ethUsdFeed,
        address _admin,
        address _relayer
    ) EIP712("isworking.eth names", "1") {
        nameWrapper = _nameWrapper;
        ens = _ens;
        resolver = _resolver;
        parentNode = _parentNode;
        ethUsdFeed = _ethUsdFeed;
        deployedAt = block.number;
        admin = _admin;
        treasury = _admin;
        relayer = _relayer;
        priceCents = 99;
        lockPeriod = 30 days;
        refundPeriod = 365 days;
        devconPercentOff = 100;
        devconSponsored = true;
        devconEndsAt = 1793989799; // Nov 6, 2026, 23:59:59 IST, when Devcon 8 ends
    }

    // ═════════════════════════════ Views ═════════════════════════════════

    function nodeOf(string calldata label) public view returns (bytes32) {
        return keccak256(abi.encodePacked(parentNode, keccak256(bytes(label))));
    }

    /// Free in the registry, not reserved and not locked after a revoke.
    function available(string calldata label) public view returns (bool) {
        bytes32 lh = keccak256(bytes(label));
        if (reserved[lh] || lockedUntil[lh] > block.timestamp) return false;
        return _free(nodeOf(label));
    }

    /// The discount and sponsorship a voucher gives, or reverts if it can't be used now.
    function discountOf(Voucher calldata v) public view returns (uint8 percentOff, bool sponsored) {
        if (v.codeHash != bytes32(0)) {
            Coupon memory c = coupons[v.codeHash];
            if (
                c.percentOff == 0 || !c.active || (c.maxUses != 0 && c.uses >= c.maxUses)
                    || (c.expiresAt != 0 && c.expiresAt < block.timestamp)
            ) revert CouponUnusable();
            return (c.percentOff, c.sponsored);
        }
        if (v.ticket != bytes32(0)) {
            if (ticketUsed[v.ticket] || devconClaimed[v.owner] || block.timestamp > devconEndsAt) revert TicketUnusable();
            return (devconPercentOff, devconSponsored && devconPercentOff == 100);
        }
        return (0, false);
    }

    /// Price in US cents after a discount.
    function priceAfter(uint8 percentOff) public view returns (uint256) {
        return (uint256(priceCents) * (100 - percentOff)) / 100;
    }

    /// Wei for a USD-cents amount at the current Chainlink ETH/USD price.
    function quoteWei(uint256 cents) public view returns (uint256) {
        if (cents == 0) return 0;
        (, int256 answer,, uint256 updatedAt,) = ethUsdFeed.latestRoundData();
        if (answer <= 0 || block.timestamp - updatedAt > 3 hours) revert StalePrice();
        // cents/100 USD ÷ (answer/1e8 USD per ETH) × 1e18 wei
        return (cents * 1e24 + uint256(answer) - 1) / uint256(answer);
    }

    function quoteToken(address token, uint256 cents) public view returns (uint256) {
        uint8 d = tokenDecimals[token];
        if (d == 0) revert TokenNotAccepted();
        return (cents * 10 ** d) / 100;
    }

    /// What revoking a name would refund its buyer right now.
    function refundOwed(bytes32 node) public view returns (uint256) {
        Sale memory s = sales[node];
        if (s.paid == 0 || refundPeriod == 0) return 0;
        uint256 elapsed = block.timestamp - s.soldAt;
        if (elapsed >= refundPeriod) return 0;
        return (uint256(s.paid) * (refundPeriod - elapsed)) / refundPeriod;
    }

    function hashVoucher(Voucher calldata v) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(VOUCHER_TYPEHASH, v.labelhash, v.owner, v.codeHash, v.ticket, v.deadline)));
    }

    // ═══════════════════════════ Registering ═════════════════════════════

    /// Buy a name with ETH. Send at least quoteWei(priceAfter(discount)); any excess
    /// is returned. Pass an empty voucher (all zero) and signature for no discount.
    function registerWithETH(string calldata label, address owner, Voucher calldata v, bytes calldata sig)
        external
        payable
        nonReentrant
    {
        (uint8 pct, bool sponsoredDiscount) = _useVoucher(label, owner, v, sig);
        if (sponsoredDiscount) revert NotSponsored(); // sponsored claims go through the relayer
        uint256 due = quoteWei(priceAfter(pct));
        if (msg.value < due) revert Underpaid(due);
        _mint(label, owner, address(0), due, pct, v, false);
        _sendETH(treasury, due);
        if (msg.value > due) _sendETH(msg.sender, msg.value - due);
    }

    /// Buy a name with an accepted stablecoin (approve this contract first).
    function registerWithToken(string calldata label, address owner, address token, Voucher calldata v, bytes calldata sig)
        external
        nonReentrant
    {
        (uint8 pct, bool sponsoredDiscount) = _useVoucher(label, owner, v, sig);
        if (sponsoredDiscount) revert NotSponsored();
        uint256 due = quoteToken(token, priceAfter(pct));
        _mint(label, owner, token, due, pct, v, false);
        if (due > 0) IERC20(token).safeTransferFrom(msg.sender, treasury, due);
    }

    /// Sponsored claims (sponsored coupons, Devcon): free, and the relayer pays the gas.
    function registerSponsored(string calldata label, address owner, Voucher calldata v, bytes calldata sig)
        external
        nonReentrant
    {
        if (msg.sender != relayer) revert NotRelayer();
        (uint8 pct, bool sponsoredDiscount) = _useVoucher(label, owner, v, sig);
        if (!sponsoredDiscount) revert NotSponsored();
        _mint(label, owner, address(0), 0, pct, v, true);
    }

    function _useVoucher(string calldata label, address owner, Voucher calldata v, bytes calldata sig)
        internal
        returns (uint8 pct, bool sponsoredDiscount)
    {
        if (v.codeHash == bytes32(0) && v.ticket == bytes32(0)) return (0, false);
        if (v.labelhash != keccak256(bytes(label)) || v.owner != owner) revert BadVoucher();
        if (v.deadline < block.timestamp) revert VoucherExpired();
        if (ECDSA.recover(hashVoucher(v), sig) != relayer) revert BadVoucher();
        (pct, sponsoredDiscount) = discountOf(v);
        if (v.codeHash != bytes32(0)) {
            coupons[v.codeHash].uses += 1;
        } else {
            ticketUsed[v.ticket] = true;
            devconClaimed[owner] = true;
        }
    }

    function _mint(
        string calldata label,
        address owner,
        address token,
        uint256 paid,
        uint8 pct,
        Voucher calldata v,
        bool sponsored
    ) internal {
        if (owner == address(0) || owner == address(this)) revert InvalidOwner();
        _checkLabel(label);
        bytes32 lh = keccak256(bytes(label));
        if (reserved[lh]) revert NameReserved();
        if (lockedUntil[lh] > block.timestamp) revert NameLocked(lockedUntil[lh]);
        bytes32 node = nodeOf(label);
        if (!_free(node)) revert NameTaken();

        // Refunds go to whoever paid (the buyer may be gifting the name to `owner`).
        sales[node] = Sale({buyer: paid > 0 ? msg.sender : owner, soldAt: uint64(block.timestamp), token: token, paid: uint128(paid)});
        emit Registered(label, node, owner, token, paid, pct, v.codeHash, v.ticket, sponsored);

        // No fuses burned: permanent (never expires while isworking.eth lives) and revocable.
        nameWrapper.setSubnodeRecord(parentNode, label, address(this), resolver, 0, 0, type(uint64).max);
        IAddrResolver(resolver).setAddr(node, owner);
        nameWrapper.safeTransferFrom(address(this), owner, uint256(node), 1, "");
    }

    /// Cheap on-chain sanity checks; full ENS normalisation happens in the app.
    function _checkLabel(string calldata label) internal pure {
        bytes calldata b = bytes(label);
        if (b.length == 0 || b.length > 63) revert InvalidLabel();
        for (uint256 i; i < b.length; ++i) {
            bytes1 c = b[i];
            if (c == "." || (c >= "A" && c <= "Z") || uint8(c) < 0x21) revert InvalidLabel();
        }
    }

    function _free(bytes32 node) internal view returns (bool) {
        address registryOwner = ens.owner(node);
        return nameWrapper.ownerOf(uint256(node)) == address(0)
            && (registryOwner == address(0) || registryOwner == address(nameWrapper));
    }

    // ═════════════════════════════ Admin ═════════════════════════════════

    /// Takes a name back (it stops resolving immediately) and refunds its buyer the
    /// pro-rated name fee, sent along with this call (ETH as msg.value; tokens are
    /// pulled from the admin, who must approve them first). Excess ETH is returned.
    /// With `reserve`, the name is reserved forever instead of locked for lockPeriod.
    function revoke(string calldata label, bool reserve) external payable onlyAdmin nonReentrant {
        bytes32 node = nodeOf(label);
        if (nameWrapper.ownerOf(uint256(node)) == address(0)) revert NotRegistered();
        Sale memory s = sales[node];
        uint256 refund = refundOwed(node);
        delete sales[node];

        bytes32 lh = keccak256(bytes(label));
        uint64 until;
        if (reserve) {
            reserved[lh] = true;
            emit ReservedSet(label, true);
        } else if (lockPeriod > 0) {
            until = uint64(block.timestamp + lockPeriod);
            lockedUntil[lh] = until;
        }
        emit Revoked(label, node, s.buyer, refund, until);

        // Clearing the resolver too makes the name stop resolving (and stop being anyone's primary name).
        nameWrapper.setSubnodeRecord(parentNode, label, address(0), address(0), 0, 0, 0);

        if (s.token == address(0)) {
            if (msg.value < refund) revert RefundRequired(refund);
            if (refund > 0) _sendETH(s.buyer, refund);
            if (msg.value > refund) _sendETH(msg.sender, msg.value - refund);
        } else {
            if (refund > 0) IERC20(s.token).safeTransferFrom(msg.sender, s.buyer, refund);
            if (msg.value > 0) _sendETH(msg.sender, msg.value);
        }
    }

    function setReserved(string[] calldata labels, bool isReserved) external onlyAdmin {
        for (uint256 i; i < labels.length; ++i) {
            reserved[keccak256(bytes(labels[i]))] = isReserved;
            emit ReservedSet(labels[i], isReserved);
        }
    }

    /// Lifts (until = 0) or sets a revocation lock.
    function setLock(string calldata label, uint64 until) external onlyAdmin {
        lockedUntil[keccak256(bytes(label))] = until;
        emit LockSet(label, until);
    }

    /// Creates or updates a coupon. `note` is public; never put the code in it.
    function setCoupon(
        bytes32 codeHash,
        uint8 percentOff,
        bool sponsored,
        bool active,
        uint32 maxUses,
        uint64 expiresAt,
        string calldata note
    ) external onlyAdmin {
        if (percentOff == 0 || percentOff > 100) revert CouponUnusable();
        if (sponsored) percentOff = 100;
        Coupon storage c = coupons[codeHash];
        c.percentOff = percentOff;
        c.sponsored = sponsored;
        c.active = active;
        c.maxUses = maxUses;
        c.expiresAt = expiresAt;
        emit CouponSet(codeHash, percentOff, sponsored, active, maxUses, expiresAt, note);
    }

    function disableTicket(bytes32 ticket) external onlyAdmin {
        ticketUsed[ticket] = true;
        emit TicketDisabled(ticket);
    }

    function setDevcon(uint8 percentOff, bool sponsored, uint64 endsAt) external onlyAdmin {
        if (percentOff > 100) revert CouponUnusable();
        devconPercentOff = percentOff;
        devconSponsored = sponsored;
        devconEndsAt = endsAt;
        emit ConfigChanged();
    }

    function setPricing(uint32 _priceCents, uint32 _refundPeriod, uint32 _lockPeriod) external onlyAdmin {
        priceCents = _priceCents;
        refundPeriod = _refundPeriod;
        lockPeriod = _lockPeriod;
        emit ConfigChanged();
    }

    /// Accepts (decimals > 0) or stops accepting (0) a USD stablecoin.
    function setToken(address token, uint8 decimals) external onlyAdmin {
        tokenDecimals[token] = decimals;
        emit ConfigChanged();
    }

    function setPolicy(string calldata _policy) external onlyAdmin {
        policy = _policy;
        emit ConfigChanged();
    }

    function setRoles(address _admin, address _treasury, address _relayer) external onlyAdmin {
        if (_admin == address(0) || _treasury == address(0)) revert InvalidOwner();
        admin = _admin;
        treasury = _treasury;
        relayer = _relayer;
        emit ConfigChanged();
    }

    // ═════════════════════════════ Internals ═════════════════════════════

    function _sendETH(address to, uint256 amount) internal {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// Only accepts the subnames it is minting, so nothing else can be parked here.
    function onERC1155Received(address, address from, uint256, uint256, bytes calldata) external view returns (bytes4) {
        require(msg.sender == address(nameWrapper) && from == address(0), "unexpected token");
        return this.onERC1155Received.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x4e2312e0 /* ERC1155Receiver */ || interfaceId == 0x01ffc9a7 /* ERC165 */;
    }
}
