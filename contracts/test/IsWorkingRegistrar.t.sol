// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IsWorkingRegistrar, INameWrapper, IENS, IPriceFeed} from "../src/IsWorkingRegistrar.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWrapper {
    function getData(uint256 id) external view returns (address, uint32, uint64);
    function setApprovalForAll(address, bool) external;
    function ownerOf(uint256) external view returns (address);
    function safeTransferFrom(address, address, uint256, uint256, bytes calldata) external;
    function setSubnodeOwner(bytes32, string calldata, address, uint32, uint64) external returns (bytes32);
}

interface IResolver {
    function addr(bytes32) external view returns (address);
}

interface IRegistry {
    function resolver(bytes32) external view returns (address);
}

interface IController {
    function rentPrice(string calldata, uint256) external view returns (uint256 base, uint256 premium);
    function renew(string calldata, uint256) external payable;
}

interface IUSDT {
    function approve(address, uint256) external; // returns nothing on mainnet
}

contract IsWorkingRegistrarTest is Test {
    address constant NW = 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401;
    address constant ENS = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
    address constant RESOLVER = 0xF29100983E058B709F3D539b0c765937B804AC15;
    address constant FEED = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    address constant OWNER = 0xDfFBFc54C6863E6e5ba271E2f0e15FB5d1EFE499;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    bytes32 constant PARENT = 0x3aa5019590d2d265f4befb658bc6e47dd471ba09974692d392dfd5d66f13fe26; // isworking.eth

    IsWorkingRegistrar reg;
    uint256 relayerKey = 0xA11CE;
    address relayer;
    address buyer = makeAddr("buyer");
    address attacker = makeAddr("attacker");

    function setUp() public {
        vm.createSelectFork(vm.envOr("FORK_URL", string("https://ethereum-rpc.publicnode.com")));
        relayer = vm.addr(relayerKey);
        reg = new IsWorkingRegistrar(INameWrapper(NW), IENS(ENS), RESOLVER, PARENT, IPriceFeed(FEED), OWNER, relayer);
        vm.startPrank(OWNER);
        IWrapper(NW).setApprovalForAll(address(reg), true);
        reg.setToken(USDC, 6);
        reg.setToken(USDT, 6);
        reg.setToken(DAI, 18);
        vm.stopPrank();
        vm.deal(buyer, 10 ether);
        vm.deal(attacker, 10 ether);
        vm.deal(OWNER, 10 ether);
    }

    // ─── helpers ──────────────────────────────────────────────────────────

    function none() internal pure returns (IsWorkingRegistrar.Voucher memory v) {}

    function voucher(string memory label, address owner, bytes32 codeHash, bytes32 ticket)
        internal
        view
        returns (IsWorkingRegistrar.Voucher memory v, bytes memory sig)
    {
        v = IsWorkingRegistrar.Voucher(keccak256(bytes(label)), owner, codeHash, ticket, uint64(block.timestamp + 1 hours));
        sig = signVoucher(v, relayerKey);
    }

    function signVoucher(IsWorkingRegistrar.Voucher memory v, uint256 key) internal view returns (bytes memory) {
        (uint8 vv, bytes32 r, bytes32 s) = vm.sign(key, reg.hashVoucher(v));
        return abi.encodePacked(r, s, vv);
    }

    function node(string memory label) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(PARENT, keccak256(bytes(label))));
    }

    function buyETH(string memory label) internal returns (uint256 due) {
        due = reg.quoteWei(reg.priceCents());
        vm.prank(buyer);
        reg.registerWithETH{value: due}(label, buyer, none(), "");
    }

    // ─── paying ───────────────────────────────────────────────────────────

    function test_registerWithETH_forwardsAndRefundsExcess() public {
        uint256 due = reg.quoteWei(99);
        assertGt(due, 0);
        uint256 treasuryBefore = OWNER.balance;
        uint256 buyerBefore = buyer.balance;
        uint256 heldBefore = address(reg).balance; // the fork address may already hold dust
        vm.prank(buyer);
        reg.registerWithETH{value: due + 1 ether}("alice", buyer, none(), "");
        assertEq(OWNER.balance - treasuryBefore, due, "treasury gets exactly the price");
        assertEq(buyerBefore - buyer.balance, due, "excess returned");
        assertEq(address(reg).balance, heldBefore, "nothing held");
        (address owner, uint32 fuses,) = IWrapper(NW).getData(uint256(node("alice")));
        assertEq(owner, buyer);
        assertEq(fuses, 0);
        assertEq(IResolver(RESOLVER).addr(node("alice")), buyer);
        assertFalse(reg.available("alice"));
    }

    function test_underpaidReverts() public {
        uint256 due = reg.quoteWei(99);
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(IsWorkingRegistrar.Underpaid.selector, due));
        reg.registerWithETH{value: due - 1}("alice", buyer, none(), "");
    }

    function test_registerWithUSDC() public {
        deal(USDC, buyer, 10e6);
        vm.startPrank(buyer);
        IERC20(USDC).approve(address(reg), type(uint256).max);
        uint256 before = IERC20(USDC).balanceOf(OWNER);
        reg.registerWithToken("alice", buyer, USDC, none(), "");
        vm.stopPrank();
        assertEq(IERC20(USDC).balanceOf(OWNER) - before, 990_000, "0.99 USDC");
        assertEq(IWrapper(NW).ownerOf(uint256(node("alice"))), buyer);
    }

    function test_registerWithUSDT_nonStandardToken() public {
        deal(USDT, buyer, 10e6);
        vm.startPrank(buyer);
        IUSDT(USDT).approve(address(reg), type(uint256).max);
        reg.registerWithToken("alice", buyer, USDT, none(), "");
        vm.stopPrank();
        assertEq(IWrapper(NW).ownerOf(uint256(node("alice"))), buyer);
    }

    function test_registerWithDAI() public {
        deal(DAI, buyer, 10e18);
        vm.startPrank(buyer);
        IERC20(DAI).approve(address(reg), type(uint256).max);
        reg.registerWithToken("alice", buyer, DAI, none(), "");
        vm.stopPrank();
        assertEq(IERC20(DAI).balanceOf(OWNER) >= 0.99e18, true);
    }

    function test_unacceptedTokenReverts() public {
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.TokenNotAccepted.selector);
        reg.registerWithToken("alice", buyer, address(0xBEEF), none(), "");
    }

    function test_giftingRefundsThePayer() public {
        uint256 due = reg.quoteWei(99);
        vm.prank(buyer);
        reg.registerWithETH{value: due}("gift", attacker, none(), "");
        assertEq(IWrapper(NW).ownerOf(uint256(node("gift"))), attacker);
        (address paidBy,,,) = reg.sales(node("gift"));
        assertEq(paidBy, buyer);
    }

    // ─── names ────────────────────────────────────────────────────────────

    function test_takenReservedLockedInvalid() public {
        buyETH("alice");
        uint256 due = reg.quoteWei(99);
        vm.prank(attacker);
        vm.expectRevert(IsWorkingRegistrar.NameTaken.selector);
        reg.registerWithETH{value: due}("alice", attacker, none(), "");

        string[] memory labels = new string[](1);
        labels[0] = "admin";
        vm.prank(OWNER);
        reg.setReserved(labels, true);
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.NameReserved.selector);
        reg.registerWithETH{value: due}("admin", buyer, none(), "");

        vm.startPrank(buyer);
        vm.expectRevert(IsWorkingRegistrar.InvalidLabel.selector);
        reg.registerWithETH{value: due}("Alice", buyer, none(), "");
        vm.expectRevert(IsWorkingRegistrar.InvalidLabel.selector);
        reg.registerWithETH{value: due}("a.b", buyer, none(), "");
        vm.expectRevert(IsWorkingRegistrar.InvalidLabel.selector);
        reg.registerWithETH{value: due}("", buyer, none(), "");
        vm.stopPrank();
    }

    function test_cannotOverwriteNameCreatedElsewhere() public {
        vm.prank(OWNER);
        IWrapper(NW).setSubnodeOwner(PARENT, "manual", buyer, 0, type(uint64).max);
        uint256 due = reg.quoteWei(99);
        vm.prank(attacker);
        vm.expectRevert(IsWorkingRegistrar.NameTaken.selector);
        reg.registerWithETH{value: due}("manual", attacker, none(), "");
    }

    // ─── coupons & vouchers ───────────────────────────────────────────────

    function test_couponHalfOff_andUsesLimit() public {
        bytes32 code = keccak256("HALF");
        vm.prank(OWNER);
        reg.setCoupon(code, 50, false, true, 1, 0, "test");
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("alice", buyer, code, 0);
        uint256 half = reg.quoteWei(49);
        uint256 before = OWNER.balance;
        vm.prank(buyer);
        reg.registerWithETH{value: half}("alice", buyer, v, sig);
        assertEq(OWNER.balance - before, half);

        (IsWorkingRegistrar.Voucher memory v2, bytes memory sig2) = voucher("bob", buyer, code, 0);
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.CouponUnusable.selector);
        reg.registerWithETH{value: half}("bob", buyer, v2, sig2);
    }

    function test_couponFullOff_buyerStillPaysOnlyGas() public {
        bytes32 code = keccak256("FREE");
        vm.prank(OWNER);
        reg.setCoupon(code, 100, false, true, 0, 0, "");
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("alice", buyer, code, 0);
        vm.prank(buyer);
        reg.registerWithETH{value: 0}("alice", buyer, v, sig);
        assertEq(IWrapper(NW).ownerOf(uint256(node("alice"))), buyer);
    }

    function test_expiredAndInactiveCoupons() public {
        bytes32 code = keccak256("OLD");
        vm.prank(OWNER);
        reg.setCoupon(code, 50, false, true, 0, uint64(block.timestamp + 10), "");
        vm.warp(block.timestamp + 11);
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("alice", buyer, code, 0);
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.CouponUnusable.selector);
        reg.registerWithETH{value: 1 ether}("alice", buyer, v, sig);

        vm.prank(OWNER);
        reg.setCoupon(code, 50, false, false, 0, 0, "");
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.CouponUnusable.selector);
        reg.registerWithETH{value: 1 ether}("alice", buyer, v, sig);
    }

    function test_voucherCantBeStolenFromMempool() public {
        bytes32 code = keccak256("HALF");
        vm.prank(OWNER);
        reg.setCoupon(code, 50, false, true, 0, 0, "");
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("alice", buyer, code, 0);
        vm.startPrank(attacker);
        vm.expectRevert(IsWorkingRegistrar.BadVoucher.selector);
        reg.registerWithETH{value: 1 ether}("alice", attacker, v, sig); // different owner
        vm.expectRevert(IsWorkingRegistrar.BadVoucher.selector);
        reg.registerWithETH{value: 1 ether}("other", buyer, v, sig); // different name
        vm.stopPrank();
    }

    function test_forgedAndExpiredVouchers() public {
        bytes32 code = keccak256("HALF");
        vm.prank(OWNER);
        reg.setCoupon(code, 50, false, true, 0, 0, "");
        IsWorkingRegistrar.Voucher memory v =
            IsWorkingRegistrar.Voucher(keccak256("alice"), buyer, code, 0, uint64(block.timestamp + 1 hours));
        bytes memory forged = signVoucher(v, 0xBAD);
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.BadVoucher.selector);
        reg.registerWithETH{value: 1 ether}("alice", buyer, v, forged);

        (IsWorkingRegistrar.Voucher memory v2, bytes memory sig2) = voucher("alice", buyer, code, 0);
        vm.warp(block.timestamp + 2 hours);
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.VoucherExpired.selector);
        reg.registerWithETH{value: 1 ether}("alice", buyer, v2, sig2);
    }

    function test_sponsoredCoupon_onlyViaRelayer() public {
        bytes32 code = keccak256("SPONSOR");
        vm.prank(OWNER);
        reg.setCoupon(code, 20, true, true, 0, 0, ""); // forced to 100%
        (uint8 pct,, , , ,) = reg.coupons(code);
        assertEq(pct, 100);
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("alice", buyer, code, 0);

        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.NotSponsored.selector);
        reg.registerWithETH{value: 0}("alice", buyer, v, sig);

        vm.prank(attacker);
        vm.expectRevert(IsWorkingRegistrar.NotRelayer.selector);
        reg.registerSponsored("alice", buyer, v, sig);

        vm.prank(relayer);
        reg.registerSponsored("alice", buyer, v, sig);
        assertEq(IWrapper(NW).ownerOf(uint256(node("alice"))), buyer);
    }

    function test_relayerCantSponsorWithoutAVoucher() public {
        vm.prank(relayer);
        vm.expectRevert(IsWorkingRegistrar.NotSponsored.selector);
        reg.registerSponsored("alice", relayer, none(), "");
    }

    // ─── Devcon ───────────────────────────────────────────────────────────

    function test_devconTicket_singleUse_oneWallet_untilEnd() public {
        bytes32 ticket = keccak256("ticket-1");
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("alice", buyer, 0, ticket);
        vm.prank(relayer);
        reg.registerSponsored("alice", buyer, v, sig);
        assertTrue(reg.ticketUsed(ticket));

        (IsWorkingRegistrar.Voucher memory v2, bytes memory sig2) = voucher("bob", attacker, 0, ticket);
        vm.prank(relayer);
        vm.expectRevert(IsWorkingRegistrar.TicketUnusable.selector);
        reg.registerSponsored("bob", attacker, v2, sig2);

        (IsWorkingRegistrar.Voucher memory v3, bytes memory sig3) = voucher("bob", buyer, 0, keccak256("ticket-2"));
        vm.prank(relayer);
        vm.expectRevert(IsWorkingRegistrar.TicketUnusable.selector);
        reg.registerSponsored("bob", buyer, v3, sig3);

        vm.warp(reg.devconEndsAt() + 1);
        (IsWorkingRegistrar.Voucher memory v4, bytes memory sig4) = voucher("carol", attacker, 0, keccak256("ticket-3"));
        vm.prank(relayer);
        vm.expectRevert(IsWorkingRegistrar.TicketUnusable.selector);
        reg.registerSponsored("carol", attacker, v4, sig4);
    }

    function test_disabledTicket() public {
        bytes32 ticket = keccak256("ticket-x");
        vm.prank(OWNER);
        reg.disableTicket(ticket);
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("alice", buyer, 0, ticket);
        vm.prank(relayer);
        vm.expectRevert(IsWorkingRegistrar.TicketUnusable.selector);
        reg.registerSponsored("alice", buyer, v, sig);
    }

    // ─── revoke, refunds, locks ───────────────────────────────────────────

    function test_revoke_proRataETHRefund_lock_lift() public {
        uint256 paid = buyETH("alice");
        vm.warp(block.timestamp + 365 days / 2);
        uint256 owed = reg.refundOwed(node("alice"));
        assertApproxEqRel(owed, paid / 2, 0.01e18);
        uint256 before = buyer.balance;
        uint256 heldBefore = address(reg).balance;

        vm.prank(OWNER);
        vm.expectRevert(abi.encodeWithSelector(IsWorkingRegistrar.RefundRequired.selector, owed));
        reg.revoke{value: owed - 1}("alice", false);

        vm.prank(OWNER);
        reg.revoke{value: owed + 1 ether}("alice", false);
        assertEq(buyer.balance - before, owed, "pro-rata refund");
        assertEq(IWrapper(NW).ownerOf(uint256(node("alice"))), address(0));
        assertEq(IRegistry(ENS).resolver(node("alice")), address(0), "stops resolving");
        assertEq(address(reg).balance, heldBefore, "excess returned to admin");

        // Half a year later on the fork the real feed looks stale; give it a fresh answer.
        vm.mockCall(FEED, abi.encodeWithSelector(IPriceFeed.latestRoundData.selector), abi.encode(1, int256(3000e8), 0, block.timestamp, 1));
        uint256 due = reg.quoteWei(99);
        vm.prank(attacker);
        vm.expectRevert(abi.encodeWithSelector(IsWorkingRegistrar.NameLocked.selector, reg.lockedUntil(keccak256("alice"))));
        reg.registerWithETH{value: due}("alice", attacker, none(), "");

        vm.prank(OWNER);
        reg.setLock("alice", 0);
        vm.prank(attacker);
        reg.registerWithETH{value: due}("alice", attacker, none(), "");
        assertEq(IWrapper(NW).ownerOf(uint256(node("alice"))), attacker);
    }

    function test_revoke_tokenRefund_andReserve() public {
        deal(USDC, buyer, 10e6);
        vm.startPrank(buyer);
        IERC20(USDC).approve(address(reg), type(uint256).max);
        reg.registerWithToken("alice", buyer, USDC, none(), "");
        vm.stopPrank();
        deal(USDC, OWNER, 10e6);
        vm.startPrank(OWNER);
        IERC20(USDC).approve(address(reg), type(uint256).max);
        uint256 before = IERC20(USDC).balanceOf(buyer);
        reg.revoke("alice", true);
        vm.stopPrank();
        assertEq(IERC20(USDC).balanceOf(buyer) - before, 990_000, "full refund right after sale");
        assertTrue(reg.reserved(keccak256("alice")));
        assertFalse(reg.available("alice"));
    }

    function test_revoke_noRefundAfterPeriod_andFreeNames() public {
        // (isworking.eth itself expires within a year on this fork, so use a short refund period.)
        vm.prank(OWNER);
        reg.setPricing(99, 30 days, 30 days);
        buyETH("alice");
        vm.warp(block.timestamp + 31 days);
        assertEq(reg.refundOwed(node("alice")), 0);
        vm.prank(OWNER);
        reg.revoke("alice", false);

        bytes32 code = keccak256("FREE");
        vm.prank(OWNER);
        reg.setCoupon(code, 100, false, true, 0, 0, "");
        (IsWorkingRegistrar.Voucher memory v, bytes memory sig) = voucher("bob", buyer, code, 0);
        vm.prank(buyer);
        reg.registerWithETH("bob", buyer, v, sig);
        assertEq(reg.refundOwed(node("bob")), 0);
        vm.prank(OWNER);
        reg.revoke("bob", false);
    }

    function test_revoke_onlyAdmin_andNotRegistered() public {
        buyETH("alice");
        vm.prank(relayer);
        vm.expectRevert(IsWorkingRegistrar.NotAdmin.selector);
        reg.revoke("alice", false);
        vm.prank(OWNER);
        vm.expectRevert(IsWorkingRegistrar.NotRegistered.selector);
        reg.revoke("nobody", false);
    }

    function test_holderTransferStillRevocable() public {
        buyETH("alice");
        vm.prank(buyer);
        IWrapper(NW).safeTransferFrom(buyer, attacker, uint256(node("alice")), 1, "");
        vm.prank(OWNER);
        reg.revoke{value: 1 ether}("alice", false);
        assertEq(IWrapper(NW).ownerOf(uint256(node("alice"))), address(0));
    }

    // ─── admin & safety ───────────────────────────────────────────────────

    function test_settersAreAdminOnly() public {
        vm.startPrank(attacker);
        vm.expectRevert(IsWorkingRegistrar.NotAdmin.selector);
        reg.setPricing(1, 1, 1);
        vm.expectRevert(IsWorkingRegistrar.NotAdmin.selector);
        reg.setRoles(attacker, attacker, attacker);
        vm.expectRevert(IsWorkingRegistrar.NotAdmin.selector);
        reg.setCoupon(bytes32(uint256(1)), 100, true, true, 0, 0, "");
        vm.expectRevert(IsWorkingRegistrar.NotAdmin.selector);
        reg.setToken(USDC, 0);
        vm.expectRevert(IsWorkingRegistrar.NotAdmin.selector);
        reg.setPolicy("{}");
        vm.stopPrank();
    }

    function test_pricingAndTreasuryChanges() public {
        address newTreasury = makeAddr("treasury");
        vm.etch(newTreasury, ""); // on a mainnet fork the address might be a real contract
        vm.prank(OWNER);
        reg.setRoles(OWNER, newTreasury, relayer);
        vm.prank(OWNER);
        reg.setPricing(199, 30 days, 0);
        uint256 due = reg.quoteWei(199);
        vm.prank(buyer);
        reg.registerWithETH{value: due}("alice", buyer, none(), "");
        assertEq(newTreasury.balance, due);
    }

    function test_stalePriceRejectsETH_butStablecoinsWork() public {
        vm.mockCall(FEED, abi.encodeWithSelector(IPriceFeed.latestRoundData.selector), abi.encode(1, int256(3000e8), 0, block.timestamp - 4 hours, 1));
        vm.prank(buyer);
        vm.expectRevert(IsWorkingRegistrar.StalePrice.selector);
        reg.registerWithETH{value: 1 ether}("alice", buyer, none(), "");
        deal(USDC, buyer, 10e6);
        vm.startPrank(buyer);
        IERC20(USDC).approve(address(reg), type(uint256).max);
        reg.registerWithToken("alice", buyer, USDC, none(), "");
        vm.stopPrank();
    }

    function test_parentIsUntouchable() public {
        vm.prank(OWNER);
        vm.expectRevert();
        IWrapper(NW).safeTransferFrom(OWNER, address(reg), uint256(PARENT), 1, "");
        assertEq(IWrapper(NW).ownerOf(uint256(PARENT)), OWNER);
    }

    function test_withoutApprovalNothingMints() public {
        vm.prank(OWNER);
        IWrapper(NW).setApprovalForAll(address(reg), false);
        uint256 due = reg.quoteWei(99);
        vm.prank(buyer);
        vm.expectRevert();
        reg.registerWithETH{value: due}("alice", buyer, none(), "");
    }

    function test_survivesPastOldExpiryAfterParentRenewal() public {
        buyETH("alice");
        (,, uint64 childExpiry) = IWrapper(NW).getData(uint256(node("alice")));
        IController c = IController(0x253553366Da8546fC250F225fe3d25d0C782303b);
        (uint256 base, uint256 premium) = c.rentPrice("isworking", 5 * 365 days);
        vm.deal(address(this), 10 ether);
        c.renew{value: (base + premium) * 2}("isworking", 5 * 365 days);
        vm.warp(uint256(childExpiry) + 30 days);
        // Chainlink would look stale this far ahead; we only check ownership here.
        (address owner,,) = IWrapper(NW).getData(uint256(node("alice")));
        assertEq(owner, buyer);
        assertEq(IResolver(RESOLVER).addr(node("alice")), buyer);
    }

    receive() external payable {}
}
