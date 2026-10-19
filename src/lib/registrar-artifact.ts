// Generated from contracts/out/IsWorkingRegistrar.sol (forge build). Do not edit by hand.
export const REGISTRAR_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_nameWrapper",
        "type": "address",
        "internalType": "contract INameWrapper"
      },
      {
        "name": "_ens",
        "type": "address",
        "internalType": "contract IENS"
      },
      {
        "name": "_resolver",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_parentNode",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "_ethUsdFeed",
        "type": "address",
        "internalType": "contract IPriceFeed"
      },
      {
        "name": "_admin",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_relayer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "admin",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "available",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "coupons",
    "inputs": [
      {
        "name": "codeHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "percentOff",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "sponsored",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "maxUses",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "uses",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "expiresAt",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deployedAt",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "devconClaimed",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "devconEndsAt",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "devconPercentOff",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "devconSponsored",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "disableTicket",
    "inputs": [
      {
        "name": "ticket",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "discountOf",
    "inputs": [
      {
        "name": "v",
        "type": "tuple",
        "internalType": "struct IsWorkingRegistrar.Voucher",
        "components": [
          {
            "name": "labelhash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "owner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "codeHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "ticket",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "deadline",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "percentOff",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "sponsored",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "eip712Domain",
    "inputs": [],
    "outputs": [
      {
        "name": "fields",
        "type": "bytes1",
        "internalType": "bytes1"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "version",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "chainId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifyingContract",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "extensions",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ens",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IENS"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "ethUsdFeed",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IPriceFeed"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashVoucher",
    "inputs": [
      {
        "name": "v",
        "type": "tuple",
        "internalType": "struct IsWorkingRegistrar.Voucher",
        "components": [
          {
            "name": "labelhash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "owner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "codeHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "ticket",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "deadline",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lockPeriod",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lockedUntil",
    "inputs": [
      {
        "name": "labelhash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nameWrapper",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract INameWrapper"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nodeOf",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "onERC1155Received",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "from",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "parentNode",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "policy",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "priceAfter",
    "inputs": [
      {
        "name": "percentOff",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "priceCents",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quoteToken",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "cents",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "quoteWei",
    "inputs": [
      {
        "name": "cents",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "refundOwed",
    "inputs": [
      {
        "name": "node",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "refundPeriod",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "registerSponsored",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "v",
        "type": "tuple",
        "internalType": "struct IsWorkingRegistrar.Voucher",
        "components": [
          {
            "name": "labelhash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "owner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "codeHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "ticket",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "deadline",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      },
      {
        "name": "sig",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerWithETH",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "v",
        "type": "tuple",
        "internalType": "struct IsWorkingRegistrar.Voucher",
        "components": [
          {
            "name": "labelhash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "owner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "codeHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "ticket",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "deadline",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      },
      {
        "name": "sig",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "registerWithToken",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "v",
        "type": "tuple",
        "internalType": "struct IsWorkingRegistrar.Voucher",
        "components": [
          {
            "name": "labelhash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "owner",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "codeHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "ticket",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "deadline",
            "type": "uint64",
            "internalType": "uint64"
          }
        ]
      },
      {
        "name": "sig",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "relayer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "reserved",
    "inputs": [
      {
        "name": "labelhash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "resolver",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "revoke",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "reserve",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "sales",
    "inputs": [
      {
        "name": "node",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "buyer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "soldAt",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "paid",
        "type": "uint128",
        "internalType": "uint128"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setCoupon",
    "inputs": [
      {
        "name": "codeHash",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "percentOff",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "sponsored",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "active",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "maxUses",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "expiresAt",
        "type": "uint64",
        "internalType": "uint64"
      },
      {
        "name": "note",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setDevcon",
    "inputs": [
      {
        "name": "percentOff",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "sponsored",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "endsAt",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setLock",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "until",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setPolicy",
    "inputs": [
      {
        "name": "_policy",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setPricing",
    "inputs": [
      {
        "name": "_priceCents",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_refundPeriod",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "_lockPeriod",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setReserved",
    "inputs": [
      {
        "name": "labels",
        "type": "string[]",
        "internalType": "string[]"
      },
      {
        "name": "isReserved",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setRoles",
    "inputs": [
      {
        "name": "_admin",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_treasury",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_relayer",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setToken",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "decimals",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "ticketUsed",
    "inputs": [
      {
        "name": "ticket",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenDecimals",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "decimals",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "treasury",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ConfigChanged",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "CouponSet",
    "inputs": [
      {
        "name": "codeHash",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "percentOff",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "sponsored",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      },
      {
        "name": "active",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      },
      {
        "name": "maxUses",
        "type": "uint32",
        "indexed": false,
        "internalType": "uint32"
      },
      {
        "name": "expiresAt",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      },
      {
        "name": "note",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "EIP712DomainChanged",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LockSet",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "until",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Registered",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "node",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "paid",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "percentOff",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "codeHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "ticket",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "sponsored",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ReservedSet",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "reserved",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Revoked",
    "inputs": [
      {
        "name": "label",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "node",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      },
      {
        "name": "refundedTo",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "refund",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "lockedUntil",
        "type": "uint64",
        "indexed": false,
        "internalType": "uint64"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketDisabled",
    "inputs": [
      {
        "name": "ticket",
        "type": "bytes32",
        "indexed": true,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "BadVoucher",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CouponUnusable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignature",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureLength",
    "inputs": [
      {
        "name": "length",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ECDSAInvalidSignatureS",
    "inputs": [
      {
        "name": "s",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidLabel",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidShortString",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NameLocked",
    "inputs": [
      {
        "name": "until",
        "type": "uint64",
        "internalType": "uint64"
      }
    ]
  },
  {
    "type": "error",
    "name": "NameReserved",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NameTaken",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotAdmin",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRegistered",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotRelayer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotSponsored",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RefundRequired",
    "inputs": [
      {
        "name": "required",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "StalePrice",
    "inputs": []
  },
  {
    "type": "error",
    "name": "StringTooLong",
    "inputs": [
      {
        "name": "str",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "TicketUnusable",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenNotAccepted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TransferFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Underpaid",
    "inputs": [
      {
        "name": "required",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "VoucherExpired",
    "inputs": []
  }
] as const;

export const REGISTRAR_BYTECODE = "0x610220604052348015610010575f5ffd5b50604051613df5380380613df583398101604081905261002f91610259565b6040518060400160405280601381526020017f6973776f726b696e672e657468206e616d657300000000000000000000000000815250604051806040016040528060018152602001603160f81b81525061008e826101fc60201b60201c565b6101205261009b816101fc565b61014052815160208084019190912060e052815190820120610100524660a05261012760e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c05260017f9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00556001600160a01b0396871661016052948616610180529285166101a0526101c09190915283166101e0524361020052600280546001600160a01b031990811692851692831790915560038054909116909117905560048054919092166001600160c01b031990911617606360a01b179055600880546001600160401b0319166701e1338000278d00179055600b80546001600160501b031916656aee1ca70164179055610341565b5f5f829050601f8151111561022f578260405163305a27a960e01b815260040161022691906102e6565b60405180910390fd5b805161023a8261031b565b179392505050565b6001600160a01b0381168114610256575f5ffd5b50565b5f5f5f5f5f5f5f60e0888a03121561026f575f5ffd5b875161027a81610242565b602089015190975061028b81610242565b604089015190965061029c81610242565b606089015160808a015191965094506102b481610242565b60a08901519093506102c581610242565b60c08901519092506102d681610242565b8091505092959891949750929550565b602081525f82518060208401528060208501604085015e5f604082850101526040601f19601f83011684010191505092915050565b8051602080830151919081101561033b575f198160200360031b1b821691505b50919050565b60805160a05160c05160e05161010051610120516101405161016051610180516101a0516101c0516101e051610200516139c56104305f395f6109b301525f81816106d6015261186d01525f8181610a1e01528181611c4801528181611e0c01526123b701525f81816102c9015281816123df015261247a01525f818161049b015261269701525f81816108c3015281816119b601528181611c1b01528181611d830152818161238a0152818161250f0152818161272301526127b001525f61261b01525f6125eb01525f6128c401525f61289c01525f6127f701525f61282101525f61284b01526139c55ff3fe608060405260043610610280575f3560e01c80638406c07911610155578063c1f52e6c116100be578063f23a6e6111610078578063f23a6e61146109d5578063f3068a0014610a0d578063f851a44014610a40578063f9f7c9e514610a5f578063fbff18df14610a7d578063fc4264cc14610a9c575f5ffd5b8063c1f52e6c14610904578063c4767b9514610923578063ca60758314610942578063d4bc8edd14610961578063d5b73ac914610974578063eae4c19f146109a2575f5ffd5b8063926988141161010f578063926988141461080d578063990f9bf71461083b578063a6a3b5b41461086f578063a8aadd0f14610893578063a8e5fbc0146108b2578063aeb8ce9b146108e5575f5ffd5b80638406c0791461072357806384b0196e14610742578063856e6b06146107695780638ec42094146107a15780638ee573ac146107c057806392187ba8146107ee575f5ffd5b8063508226e4116101f75780636b4c991b116101b15780636b4c991b146105b45780636dc35bfc146105d357806372f39a81146105f2578063742b20cd146106115780638009b7bd146106c5578063824ed471146106f8575f5ffd5b8063508226e4146104d957806354841e94146104ec5780635c91f50e1461050b57806361d027b3146105485780636951f70b146105675780636af96f5a14610595575f5ffd5b8063282de6b811610248578063282de6b8146103f357806333c465271461042b578063385ab76c1461044c5780633b206cb81461046b5780633f15457f1461048a5780633fd8b02f146104bd575f5ffd5b806301ffc9a71461028457806304f3bcec146102b85780630505c8c9146103035780630c2afd72146103245780631e1cc0c8146103c6575b5f5ffd5b34801561028f575f5ffd5b506102a361029e366004612cdc565b610abb565b60405190151581526020015b60405180910390f35b3480156102c3575f5ffd5b506102eb7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b0390911681526020016102af565b34801561030e575f5ffd5b50610317610af1565b6040516102af9190612d31565b34801561032f575f5ffd5b5061038461033e366004612d43565b60096020525f90815260409020805460018201546002909201546001600160a01b0380831693600160a01b9093046001600160401b03169216906001600160801b031684565b604080516001600160a01b0395861681526001600160401b0394909416602085015291909316908201526001600160801b0390911660608201526080016102af565b3480156103d1575f5ffd5b506103e56103e0366004612d70565b610b7d565b6040519081526020016102af565b3480156103fe575f5ffd5b5060045461041690600160a01b900463ffffffff1681565b60405163ffffffff90911681526020016102af565b348015610436575f5ffd5b5061044a610445366004612d43565b610c26565b005b348015610457575f5ffd5b5061044a610466366004612e1b565b610c93565b348015610476575f5ffd5b5061044a610485366004612eb4565b610df8565b348015610495575f5ffd5b506102eb7f000000000000000000000000000000000000000000000000000000000000000081565b3480156104c8575f5ffd5b506008546104169063ffffffff1681565b61044a6104e7366004612f48565b610ef9565b3480156104f7575f5ffd5b5061044a610506366004612fda565b610fce565b348015610516575f5ffd5b50600b54610530906201000090046001600160401b031681565b6040516001600160401b0390911681526020016102af565b348015610553575f5ffd5b506003546102eb906001600160a01b031681565b348015610572575f5ffd5b506102a3610581366004613022565b600d6020525f908152604090205460ff1681565b3480156105a0575f5ffd5b5061044a6105af36600461303d565b61108b565b3480156105bf575f5ffd5b5061044a6105ce366004613074565b611120565b3480156105de575f5ffd5b5061044a6105ed3660046130b2565b611172565b3480156105fd575f5ffd5b506103e561060c3660046130f8565b611229565b34801561061c575f5ffd5b5061067d61062b366004612d43565b600a6020525f908152604090205460ff808216916101008104821691620100008204169063ffffffff63010000008204811691600160381b8104909116906001600160401b03600160581b9091041686565b6040805160ff909716875294151560208701529215159385019390935263ffffffff908116606085015290911660808301526001600160401b031660a082015260c0016102af565b3480156106d0575f5ffd5b506102eb7f000000000000000000000000000000000000000000000000000000000000000081565b348015610703575f5ffd5b50600b546107119060ff1681565b60405160ff90911681526020016102af565b34801561072e575f5ffd5b506004546102eb906001600160a01b031681565b34801561074d575f5ffd5b5061075661128d565b6040516102af9796959493929190613122565b348015610774575f5ffd5b50610788610783366004612d70565b6112cf565b6040805160ff90931683529015156020830152016102af565b3480156107ac575f5ffd5b5061044a6107bb3660046131b8565b6114ba565b3480156107cb575f5ffd5b506107116107da366004613022565b60056020525f908152604090205460ff1681565b3480156107f9575f5ffd5b5061044a6108083660046131ef565b61155b565b348015610818575f5ffd5b506102a3610827366004612d43565b60066020525f908152604090205460ff1681565b348015610846575f5ffd5b50610530610855366004612d43565b60076020525f90815260409020546001600160401b031681565b34801561087a575f5ffd5b5060085461041690640100000000900463ffffffff1681565b34801561089e575f5ffd5b5061044a6108ad366004612f48565b6115fa565b3480156108bd575f5ffd5b506102eb7f000000000000000000000000000000000000000000000000000000000000000081565b3480156108f0575f5ffd5b506102a36108ff366004613074565b611688565b34801561090f575f5ffd5b506103e561091e366004612d43565b6116fb565b34801561092e575f5ffd5b5061044a61093d366004613294565b6117f4565b34801561094d575f5ffd5b506103e561095c366004612d43565b61185a565b61044a61096f3660046132c7565b611955565b34801561097f575f5ffd5b506102a361098e366004612d43565b600c6020525f908152604090205460ff1681565b3480156109ad575f5ffd5b506103e57f000000000000000000000000000000000000000000000000000000000000000081565b3480156109e0575f5ffd5b506109f46109ef36600461330d565b611d77565b6040516001600160e01b031990911681526020016102af565b348015610a18575f5ffd5b506103e57f000000000000000000000000000000000000000000000000000000000000000081565b348015610a4b575f5ffd5b506002546102eb906001600160a01b031681565b348015610a6a575f5ffd5b50600b546102a390610100900460ff1681565b348015610a88575f5ffd5b506103e5610a97366004613074565b611e09565b348015610aa7575f5ffd5b506103e5610ab6366004613365565b611e78565b5f630271189760e51b6001600160e01b031983161480610aeb57506301ffc9a760e01b6001600160e01b03198316145b92915050565b600e8054610afe9061337e565b80601f0160208091040260200160405190810160405280929190818152602001828054610b2a9061337e565b8015610b755780601f10610b4c57610100808354040283529160200191610b75565b820191905f5260205f20905b815481529060010190602001808311610b5857829003601f168201915b505050505081565b5f610aeb7f734ad7f13bb008ca586b40842f5c0362ea9491477c504f3d6d4131a37207ad638335610bb46040860160208701613022565b60408601356060870135610bce60a0890160808a016133b0565b6040805160208101979097528601949094526001600160a01b039092166060850152608084015260a08301526001600160401b031660c082015260e00160405160208183030381529060405280519060200120611eac565b6002546001600160a01b03163314610c5157604051637bfa4b9f60e01b815260040160405180910390fd5b5f818152600c6020526040808220805460ff191660011790555182917ff49236b56499f17b1ca1dfbccf7caa67966aad2aac1a9919c1ed0e5dd6404d4d91a250565b6002546001600160a01b03163314610cbe57604051637bfa4b9f60e01b815260040160405180910390fd5b60ff87161580610cd1575060648760ff16115b15610cef576040516334b1aba360e01b815260040160405180910390fd5b8515610cfa57606496505b5f600a5f8a81526020019081526020015f20905087815f015f6101000a81548160ff021916908360ff16021790555086815f0160016101000a81548160ff02191690831515021790555085815f0160026101000a81548160ff02191690831515021790555084815f0160036101000a81548163ffffffff021916908363ffffffff16021790555083815f01600b6101000a8154816001600160401b0302191690836001600160401b03160217905550887fd5840902673b691456fdc1ba11f20589cadcc1565a6762f9577c6ac8cf5a9cdb89898989898989604051610de597969594939291906133f1565b60405180910390a2505050505050505050565b6002546001600160a01b03163314610e2357604051637bfa4b9f60e01b815260040160405180910390fd5b5f5b82811015610ef3578160065f868685818110610e4357610e43613445565b9050602002810190610e559190613459565b604051610e6392919061349b565b604051809103902081526020019081526020015f205f6101000a81548160ff0219169083151502179055507f3597aba134e1964252220425a6b7bc5552c03b43adb90a766b278521acef4969848483818110610ec157610ec1613445565b9050602002810190610ed39190613459565b84604051610ee3939291906134aa565b60405180910390a1600101610e25565b50505050565b610f01611ed8565b5f5f610f11888888888888611ef3565b915091508015610f345760405163a3624f6560e01b815260040160405180910390fd5b5f610f4161095c84611e78565b905080341015610f6c5760405163a5cc3e3560e01b8152600481018290526024015b60405180910390fd5b610f7c8989895f85888c5f6120eb565b600354610f92906001600160a01b031682612574565b80341115610fad57610fad33610fa883346134e3565b612574565b505050610fc660015f5160206139705f395f51905f5255565b505050505050565b6002546001600160a01b03163314610ff957604051637bfa4b9f60e01b815260040160405180910390fd5b6001600160a01b038316158061101657506001600160a01b038216155b15611034576040516349e27cff60e01b815260040160405180910390fd5b600280546001600160a01b038086166001600160a01b0319928316179092556003805485841690831617905560048054928416929091169190911790556040515f5160206139505f395f51905f52905f90a1505050565b6002546001600160a01b031633146110b657604051637bfa4b9f60e01b815260040160405180910390fd5b6004805463ffffffff60a01b1916600160a01b63ffffffff86811691909102919091179091556008805467ffffffffffffffff19166401000000008584160263ffffffff1916179183169190911790556040515f5160206139505f395f51905f52905f90a1505050565b6002546001600160a01b0316331461114b57604051637bfa4b9f60e01b815260040160405180910390fd5b600e611158828483613558565b506040515f5160206139505f395f51905f52905f90a15050565b6002546001600160a01b0316331461119d57604051637bfa4b9f60e01b815260040160405180910390fd5b8060075f85856040516111b192919061349b565b604051809103902081526020019081526020015f205f6101000a8154816001600160401b0302191690836001600160401b031602179055507fd18a3edaf4aa2a19b367a5c4e9b766271566c2ed547112caec36a42551ab0ca083838360405161121c93929190613611565b60405180910390a1505050565b6001600160a01b0382165f9081526005602052604081205460ff168082036112645760405163e51cf7bf60e01b815260040160405180910390fd5b606461127182600a613720565b61127b908561372e565b6112859190613745565b949350505050565b5f6060805f5f5f606061129e6125e4565b6112a6612614565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f806040830135156113f8576040838101355f908152600a602090815290829020825160c081018452905460ff80821680845261010083048216151594840194909452620100008204161515938201939093526301000000830463ffffffff9081166060830152600160381b8404166080820152600160581b9092046001600160401b031660a0830152158061136757508060400151155b8061139a5750606081015163ffffffff161580159061139a5750806060015163ffffffff16816080015163ffffffff1610155b806113c8575060a08101516001600160401b0316158015906113c85750428160a001516001600160401b0316105b156113e6576040516334b1aba360e01b815260040160405180910390fd5b80516020909101519094909350915050565b6060830135156114b05760608301355f908152600c602052604090205460ff168061144e5750600d5f6114316040860160208701613022565b6001600160a01b0316815260208101919091526040015f205460ff165b806114695750600b546201000090046001600160401b031642115b15611487576040516327eac61760e01b815260040160405180910390fd5b600b5460ff8082169161010090041680156114a75750600b5460ff166064145b91509150915091565b505f928392509050565b6002546001600160a01b031633146114e557604051637bfa4b9f60e01b815260040160405180910390fd5b60648360ff16111561150a576040516334b1aba360e01b815260040160405180910390fd5b600b805460ff851661ffff1990911617610100841515021769ffffffffffffffff00001916620100006001600160401b038416021790556040515f5160206139505f395f51905f52905f90a1505050565b611563611ed8565b5f5f611573898989888888611ef3565b9150915080156115965760405163a3624f6560e01b815260040160405180910390fd5b5f6115a48761060c85611e78565b90506115b68a8a8a8a85888c5f6120eb565b80156115d8576003546115d8906001600160a01b03898116913391168461263f565b5050506115f160015f5160206139705f395f51905f5255565b50505050505050565b611602611ed8565b6004546001600160a01b0316331461162d5760405163c64891a560e01b815260040160405180910390fd5b5f5f61163d888888888888611ef3565b915091508061165f5760405163a3624f6560e01b815260040160405180910390fd5b6116708888885f5f878b60016120eb565b5050610fc660015f5160206139705f395f51905f5255565b5f5f838360405161169a92919061349b565b60408051918290039091205f8181526006602052919091205490915060ff16806116db57505f81815260076020526040902054426001600160401b03909116115b156116e9575f915050610aeb565b6112856116f68585611e09565b612675565b5f818152600960209081526040808320815160808101835281546001600160a01b038082168352600160a01b9091046001600160401b031694820194909452600182015490931691830191909152600201546001600160801b03166060820181905215806117775750600854640100000000900463ffffffff16155b1561178457505f92915050565b5f81602001516001600160401b03164261179e91906134e3565b600854909150640100000000900463ffffffff1681106117c157505f9392505050565b600854640100000000900463ffffffff166117dc82826134e3565b83606001516001600160801b031661127b919061372e565b6002546001600160a01b0316331461181f57604051637bfa4b9f60e01b815260040160405180910390fd5b6001600160a01b0382165f90815260056020526040808220805460ff191660ff8516179055515f5160206139505f395f51905f529190a15050565b5f815f0361186957505f919050565b5f5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663feaf968c6040518163ffffffff1660e01b815260040160a060405180830381865afa1580156118c7573d5f5f3e3d5ffd5b505050506040513d601f19601f820116820180604052508101906118eb919061377d565b509350509250505f8213158061190b5750612a3061190982426134e3565b115b1561192957604051630cd5fa0760e11b815260040160405180910390fd5b816001816119418769d3c21bcecceda100000061372e565b61194b91906137cb565b61127b91906134e3565b6002546001600160a01b0316331461198057604051637bfa4b9f60e01b815260040160405180910390fd5b611988611ed8565b5f6119938484611e09565b6040516331a9108f60e11b8152600481018290529091505f906001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001690636352211e90602401602060405180830381865afa1580156119fb573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611a1f91906137de565b6001600160a01b031603611a465760405163aba4733960e01b815260040160405180910390fd5b5f818152600960209081526040808320815160808101835281546001600160a01b038082168352600160a01b9091046001600160401b031694820194909452600182015490931691830191909152600201546001600160801b0316606082015290611ab0836116fb565b5f8481526009602052604080822080546001600160e01b03191681556001810180546001600160a01b031916905560020180546fffffffffffffffffffffffffffffffff191690555191925090611b0a908890889061349b565b604051809103902090505f8515611b76575f8281526006602052604090819020805460ff1916600190811790915590517f3597aba134e1964252220425a6b7bc5552c03b43adb90a766b278521acef496991611b69918b918b916134aa565b60405180910390a1611bc1565b60085463ffffffff1615611bc157600854611b979063ffffffff16426137cb565b5f838152600760205260409020805467ffffffffffffffff19166001600160401b03831617905590505b847f43bb1ee86f0ec6e361186ccb9d53fbcda8032e5e6852e0dd67547682f0b4feee8989875f01518786604051611bfc9594939291906137f9565b60405180910390a26040516309306bd160e21b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906324c1af4490611c7e907f0000000000000000000000000000000000000000000000000000000000000000908c908c905f90819081908190819060040161383b565b6020604051808303815f875af1158015611c9a573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190611cbe919061389c565b5060408401516001600160a01b0316611d225782341015611cf55760405163308f295f60e01b815260048101849052602401610f63565b8215611d07578351611d079084612574565b82341115611d1d57611d1d33610fa885346134e3565b611d57565b8215611d475783516040850151611d47916001600160a01b039091169033908661263f565b3415611d5757611d573334612574565b5050505050611d7260015f5160206139705f395f51905f5255565b505050565b5f336001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148015611db757506001600160a01b038616155b611df65760405162461bcd60e51b815260206004820152601060248201526f3ab732bc3832b1ba32b2103a37b5b2b760811b6044820152606401610f63565b5063f23a6e6160e01b9695505050505050565b5f7f00000000000000000000000000000000000000000000000000000000000000008383604051611e3b92919061349b565b604051908190038120611e5a9291602001918252602082015260400190565b60405160208183030381529060405280519060200120905092915050565b5f6064611e8583826138b3565b600454611ea29160ff1690600160a01b900463ffffffff1661372e565b610aeb9190613745565b5f610aeb611eb86127eb565b8360405161190160f01b8152600281019290925260228201526042902090565b611ee0612914565b60025f5160206139705f395f51905f5255565b5f806040850135158015611f0957506060850135155b15611f1857505f9050806120e0565b8787604051611f2892919061349b565b6040519081900390208535141580611f6157506001600160a01b038616611f556040870160208801613022565b6001600160a01b031614155b15611f7f57604051630de54e5d60e31b815260040160405180910390fd5b42611f9060a08701608088016133b0565b6001600160401b03161015611fb857604051630abfec3f60e11b815260040160405180910390fd5b6004546001600160a01b031661200b611fd087610b7d565b86868080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525061294592505050565b6001600160a01b03161461203257604051630de54e5d60e31b815260040160405180910390fd5b61203b856112cf565b909250905060408501351561209e576040858101355f908152600a6020522080546001919060079061207b908490600160381b900463ffffffff166138cc565b92506101000a81548163ffffffff021916908363ffffffff1602179055506120e0565b60608501355f908152600c602090815260408083208054600160ff1991821681179092556001600160a01b038b168552600d9093529220805490911690911790555b965096945050505050565b6001600160a01b038616158061210957506001600160a01b03861630145b15612127576040516349e27cff60e01b815260040160405180910390fd5b612131888861296d565b5f888860405161214292919061349b565b60408051918290039091205f8181526006602052919091205490915060ff161561217f57604051632bbd1e6760e11b815260040160405180910390fd5b5f81815260076020526040902054426001600160401b0390911611156121d3575f8181526007602052604090819020549051630495ce9b60e01b81526001600160401b039091166004820152602401610f63565b5f6121de8a8a611e09565b90506121e981612675565b61220657604051639e4b268560e01b815260040160405180910390fd5b60405180608001604052805f881161221e5789612220565b335b6001600160a01b03168152602001426001600160401b03168152602001886001600160a01b03168152602001876001600160801b031681525060095f8381526020019081526020015f205f820151815f015f6101000a8154816001600160a01b0302191690836001600160a01b031602179055506020820151815f0160146101000a8154816001600160401b0302191690836001600160401b031602179055506040820151816001015f6101000a8154816001600160a01b0302191690836001600160a01b031602179055506060820151816002015f6101000a8154816001600160801b0302191690836001600160801b03160217905550905050876001600160a01b0316817f682c357c0ecc9191d927cb60f6d061daa733aef23f4257bd09f215272ac3fed48c8c8b8b8b8b604001358c606001358c60405161236b9897969594939291906138e8565b60405180910390a36040516309306bd160e21b81526001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906324c1af4490612414907f0000000000000000000000000000000000000000000000000000000000000000908e908e9030907f0000000000000000000000000000000000000000000000000000000000000000905f9081906001600160401b039060040161383b565b6020604051808303815f875af1158015612430573d5f5f3e3d5ffd5b505050506040513d601f19601f82011682018060405250810190612454919061389c565b5060405162d5fa2b60e81b8152600481018290526001600160a01b0389811660248301527f0000000000000000000000000000000000000000000000000000000000000000169063d5fa2b00906044015f604051808303815f87803b1580156124bb575f5ffd5b505af11580156124cd573d5f5f3e3d5ffd5b5050604051637921219560e11b81523060048201526001600160a01b038b81166024830152604482018590526001606483015260a060848301525f60a48301527f000000000000000000000000000000000000000000000000000000000000000016925063f242432a915060c4015f604051808303815f87803b158015612552575f5ffd5b505af1158015612564573d5f5f3e3d5ffd5b5050505050505050505050505050565b5f826001600160a01b0316826040515f6040518083038185875af1925050503d805f81146125bd576040519150601f19603f3d011682016040523d82523d5f602084013e6125c2565b606091505b5050905080611d72576040516312171d8360e31b815260040160405180910390fd5b606061260f7f0000000000000000000000000000000000000000000000000000000000000000612a3e565b905090565b606061260f7f0000000000000000000000000000000000000000000000000000000000000000612a3e565b61264d848484846001612a7b565b610ef357604051635274afe760e01b81526001600160a01b0385166004820152602401610f63565b6040516302571be360e01b8152600481018290525f9081906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906302571be390602401602060405180830381865afa1580156126dc573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061270091906137de565b6040516331a9108f60e11b8152600481018590529091505f906001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001690636352211e90602401602060405180830381865afa158015612768573d5f5f3e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061278c91906137de565b6001600160a01b03161480156127e457506001600160a01b03811615806127e457507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316816001600160a01b0316145b9392505050565b5f306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614801561284357507f000000000000000000000000000000000000000000000000000000000000000046145b1561286d57507f000000000000000000000000000000000000000000000000000000000000000090565b61260f604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f5160206139705f395f51905f525460020361294357604051633ee5aeb560e01b815260040160405180910390fd5b565b5f5f5f5f6129538686612ae8565b9250925092506129638282612b31565b5090949350505050565b818180158061297c5750603f81115b1561299a57604051633d36cb8d60e01b815260040160405180910390fd5b5f5b81811015612a37575f8383838181106129b7576129b7613445565b909101356001600160f81b031916915050601760f91b811480612a015750604160f81b6001600160f81b0319821610801590612a015750602d60f91b6001600160f81b0319821611155b80612a105750602160f882901c105b15612a2e57604051633d36cb8d60e01b815260040160405180910390fd5b5060010161299c565b5050505050565b60605f612a4a83612bed565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b6040516323b872dd60e01b5f8181526001600160a01b038781166004528616602452604485905291602083606481808c5af1925060015f51148316612ad7578383151615612acb573d5f823e3d81fd5b5f883b113d1516831692505b604052505f60605295945050505050565b5f5f5f8351604103612b1f576020840151604085015160608601515f1a612b1188828585612c14565b955095509550505050612b2a565b505081515f91506002905b9250925092565b5f826003811115612b4457612b4461393b565b03612b4d575050565b6001826003811115612b6157612b6161393b565b03612b7f5760405163f645eedf60e01b815260040160405180910390fd5b6002826003811115612b9357612b9361393b565b03612bb45760405163fce698f760e01b815260048101829052602401610f63565b6003826003811115612bc857612bc861393b565b03612be9576040516335e2f38360e21b815260048101829052602401610f63565b5050565b5f60ff8216601f811115610aeb57604051632cd44ac360e21b815260040160405180910390fd5b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0841115612c4d57505f91506003905082612cd2565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa158015612c9e573d5f5f3e3d5ffd5b5050604051601f1901519150506001600160a01b038116612cc957505f925060019150829050612cd2565b92505f91508190505b9450945094915050565b5f60208284031215612cec575f5ffd5b81356001600160e01b0319811681146127e4575f5ffd5b5f81518084528060208401602086015e5f602082860101526020601f19601f83011685010191505092915050565b602081525f6127e46020830184612d03565b5f60208284031215612d53575f5ffd5b5035919050565b5f60a08284031215612d6a575f5ffd5b50919050565b5f60a08284031215612d80575f5ffd5b6127e48383612d5a565b803560ff81168114612d9a575f5ffd5b919050565b80358015158114612d9a575f5ffd5b803563ffffffff81168114612d9a575f5ffd5b80356001600160401b0381168114612d9a575f5ffd5b5f5f83601f840112612de7575f5ffd5b5081356001600160401b03811115612dfd575f5ffd5b602083019150836020828501011115612e14575f5ffd5b9250929050565b5f5f5f5f5f5f5f5f60e0898b031215612e32575f5ffd5b88359750612e4260208a01612d8a565b9650612e5060408a01612d9f565b9550612e5e60608a01612d9f565b9450612e6c60808a01612dae565b9350612e7a60a08a01612dc1565b925060c08901356001600160401b03811115612e94575f5ffd5b612ea08b828c01612dd7565b999c989b5096995094979396929594505050565b5f5f5f60408486031215612ec6575f5ffd5b83356001600160401b03811115612edb575f5ffd5b8401601f81018613612eeb575f5ffd5b80356001600160401b03811115612f00575f5ffd5b8660208260051b8401011115612f14575f5ffd5b602091820194509250612f28908501612d9f565b90509250925092565b6001600160a01b0381168114612f45575f5ffd5b50565b5f5f5f5f5f5f6101008789031215612f5e575f5ffd5b86356001600160401b03811115612f73575f5ffd5b612f7f89828a01612dd7565b9097509550506020870135612f9381612f31565b9350612fa28860408901612d5a565b925060e08701356001600160401b03811115612fbc575f5ffd5b612fc889828a01612dd7565b979a9699509497509295939492505050565b5f5f5f60608486031215612fec575f5ffd5b8335612ff781612f31565b9250602084013561300781612f31565b9150604084013561301781612f31565b809150509250925092565b5f60208284031215613032575f5ffd5b81356127e481612f31565b5f5f5f6060848603121561304f575f5ffd5b61305884612dae565b925061306660208501612dae565b9150612f2860408501612dae565b5f5f60208385031215613085575f5ffd5b82356001600160401b0381111561309a575f5ffd5b6130a685828601612dd7565b90969095509350505050565b5f5f5f604084860312156130c4575f5ffd5b83356001600160401b038111156130d9575f5ffd5b6130e586828701612dd7565b9094509250612f28905060208501612dc1565b5f5f60408385031215613109575f5ffd5b823561311481612f31565b946020939093013593505050565b60ff60f81b8816815260e060208201525f61314060e0830189612d03565b82810360408401526131528189612d03565b606084018890526001600160a01b038716608085015260a0840186905283810360c0850152845180825260208087019350909101905f5b818110156131a7578351835260209384019390920191600101613189565b50909b9a5050505050505050505050565b5f5f5f606084860312156131ca575f5ffd5b6131d384612d8a565b92506131e160208501612d9f565b9150612f2860408501612dc1565b5f5f5f5f5f5f5f610120888a031215613206575f5ffd5b87356001600160401b0381111561321b575f5ffd5b6132278a828b01612dd7565b909850965050602088013561323b81612f31565b9450604088013561324b81612f31565b935061325a8960608a01612d5a565b92506101008801356001600160401b03811115613275575f5ffd5b6132818a828b01612dd7565b989b979a50959850939692959293505050565b5f5f604083850312156132a5575f5ffd5b82356132b081612f31565b91506132be60208401612d8a565b90509250929050565b5f5f5f604084860312156132d9575f5ffd5b83356001600160401b038111156132ee575f5ffd5b6132fa86828701612dd7565b9094509250612f28905060208501612d9f565b5f5f5f5f5f5f60a08789031215613322575f5ffd5b863561332d81612f31565b9550602087013561333d81612f31565b9450604087013593506060870135925060808701356001600160401b03811115612fbc575f5ffd5b5f60208284031215613375575f5ffd5b6127e482612d8a565b600181811c9082168061339257607f821691505b602082108103612d6a57634e487b7160e01b5f52602260045260245ffd5b5f602082840312156133c0575f5ffd5b6127e482612dc1565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b60ff881681528615156020820152851515604082015263ffffffff851660608201526001600160401b038416608082015260c060a08201525f61343860c0830184866133c9565b9998505050505050505050565b634e487b7160e01b5f52603260045260245ffd5b5f5f8335601e1984360301811261346e575f5ffd5b8301803591506001600160401b03821115613487575f5ffd5b602001915036819003821315612e14575f5ffd5b818382375f9101908152919050565b604081525f6134bd6040830185876133c9565b90508215156020830152949350505050565b634e487b7160e01b5f52601160045260245ffd5b81810381811115610aeb57610aeb6134cf565b634e487b7160e01b5f52604160045260245ffd5b601f821115611d725782821115611d7257805f5260205f20601f840160051c602085101561353557505f5b90810190601f840160051c035f5b81811015610fc6575f83820155600101613543565b6001600160401b0383111561356f5761356f6134f6565b6135838361357d835461337e565b8361350a565b5f601f8411600181146135b4575f851561359d5750838201355b5f19600387901b1c1916600186901b178355612a37565b5f83815260208120601f198716915b828110156135e357868501358255602094850194600190920191016135c3565b50868210156135ff575f1960f88860031b161c19848701351681555b505060018560011b0183555050505050565b604081525f6136246040830185876133c9565b90506001600160401b0383166020830152949350505050565b6001815b60018411156136785780850481111561365c5761365c6134cf565b600184161561366a57908102905b60019390931c928002613641565b935093915050565b5f8261368e57506001610aeb565b8161369a57505f610aeb565b81600181146136b057600281146136ba576136d6565b6001915050610aeb565b60ff8411156136cb576136cb6134cf565b50506001821b610aeb565b5060208310610133831016604e8410600b84101617156136f9575081810a610aeb565b6137055f19848461363d565b805f1904821115613718576137186134cf565b029392505050565b5f6127e460ff841683613680565b8082028115828204841417610aeb57610aeb6134cf565b5f8261375f57634e487b7160e01b5f52601260045260245ffd5b500490565b805169ffffffffffffffffffff81168114612d9a575f5ffd5b5f5f5f5f5f60a08688031215613791575f5ffd5b61379a86613764565b602087015160408801516060890151929750909550935091506137bf60808701613764565b90509295509295909350565b80820180821115610aeb57610aeb6134cf565b5f602082840312156137ee575f5ffd5b81516127e481612f31565b608081525f61380c6080830187896133c9565b6001600160a01b039590951660208301525060408101929092526001600160401b031660609091015292915050565b88815260e060208201525f61385460e08301898b6133c9565b6001600160a01b0397881660408401529590961660608201526001600160401b03938416608082015263ffffffff9290921660a083015290911660c090910152949350505050565b5f602082840312156138ac575f5ffd5b5051919050565b60ff8281168282160390811115610aeb57610aeb6134cf565b63ffffffff8181168382160190811115610aeb57610aeb6134cf565b60e081525f6138fb60e083018a8c6133c9565b6001600160a01b0398909816602083015250604081019590955260ff939093166060850152608084019190915260a0830152151560c09091015292915050565b634e487b7160e01b5f52602160045260245ffdfeb9b6902016bd1219d5fa6161243b61e7e9f7f959526dd94ef8fa3e403bf881c39b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00a2646970667358221220fddb229fceabf43efb6713692abdb9be2dda745b3540ae146f76f7e5bee87baa64736f6c63430008250033" as const;
