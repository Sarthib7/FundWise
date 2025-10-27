export type GroupManager = {
  "version": "0.1.0",
  "name": "group_manager",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "multisigAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Multi-sig authority (from Squads)"
          ]
        },
        {
          "name": "poolMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Compressed token mint (will be created separately via compressed-pool program)"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "fundraisingTarget",
          "type": "u64"
        },
        {
          "name": "paymentSchedule",
          "type": {
            "defined": "PaymentSchedule"
          }
        },
        {
          "name": "contributionAmount",
          "type": "u64"
        },
        {
          "name": "allocationStrategy",
          "type": {
            "defined": "AllocationStrategy"
          }
        }
      ]
    },
    {
      "name": "contribute",
      "accounts": [
        {
          "name": "contributor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createInvite",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorMember",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Verify creator is a member of the group"
          ]
        },
        {
          "name": "inviteCode",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "codeString",
          "type": "string"
        },
        {
          "name": "tipAmount",
          "type": "u64"
        },
        {
          "name": "expiryDays",
          "type": {
            "option": "u8"
          }
        }
      ]
    },
    {
      "name": "joinWithInvite",
      "accounts": [
        {
          "name": "newMember",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inviteCode",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inviteCreator",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The invite creator who receives the tip"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "codeHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "inviteId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "batchContributions",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer who signs the transaction (can be any member or group authority)"
          ]
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amounts",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "proposeWithdrawal",
      "accounts": [
        {
          "name": "proposer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposerMember",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Verify proposer is a member"
          ]
        },
        {
          "name": "withdrawalProposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "groupPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "poolMint",
            "type": "publicKey"
          },
          {
            "name": "fundraisingTarget",
            "type": "u64"
          },
          {
            "name": "currentAmount",
            "type": "u64"
          },
          {
            "name": "paymentSchedule",
            "type": {
              "defined": "PaymentSchedule"
            }
          },
          {
            "name": "contributionAmount",
            "type": "u64"
          },
          {
            "name": "allocationStrategy",
            "type": {
              "defined": "AllocationStrategy"
            }
          },
          {
            "name": "splitRatio",
            "type": "u8"
          },
          {
            "name": "membersCount",
            "type": "u16"
          },
          {
            "name": "invitesCreated",
            "type": "u64"
          },
          {
            "name": "withdrawalProposalsCount",
            "type": "u64"
          },
          {
            "name": "totalContributions",
            "type": "u64"
          },
          {
            "name": "yieldEarned",
            "type": "u64"
          },
          {
            "name": "liquidityPool",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "inviteCode",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "group",
            "type": "publicKey"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "codeHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "tipAmount",
            "type": "u64"
          },
          {
            "name": "isUsed",
            "type": "bool"
          },
          {
            "name": "usedBy",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "inviteId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "member",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "group",
            "type": "publicKey"
          },
          {
            "name": "wallet",
            "type": "publicKey"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          },
          {
            "name": "allocationBps",
            "type": "u16"
          },
          {
            "name": "lastContribution",
            "type": "i64"
          },
          {
            "name": "contributionCount",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "joinedViaInvite",
            "type": "bool"
          },
          {
            "name": "inviteTipReceived",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "withdrawalProposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupPool",
            "type": "publicKey"
          },
          {
            "name": "proposer",
            "type": "publicKey"
          },
          {
            "name": "recipient",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "executed",
            "type": "bool"
          },
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "PaymentSchedule",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Weekly"
          },
          {
            "name": "Monthly"
          },
          {
            "name": "Quarterly"
          },
          {
            "name": "OneTime"
          }
        ]
      }
    },
    {
      "name": "AllocationStrategy",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FullyCompressed"
          },
          {
            "name": "Split",
            "fields": [
              {
                "name": "ratio",
                "type": "u8"
              }
            ]
          },
          {
            "name": "FullyYield"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NameTooLong",
      "msg": "Group name is too long"
    },
    {
      "code": 6001,
      "name": "InvalidTarget",
      "msg": "Invalid fundraising target"
    },
    {
      "code": 6002,
      "name": "InvalidInviteCode",
      "msg": "Invite code is invalid"
    },
    {
      "code": 6003,
      "name": "InviteAlreadyUsed",
      "msg": "Invite has already been used"
    },
    {
      "code": 6004,
      "name": "InviteExpired",
      "msg": "Invite has expired"
    },
    {
      "code": 6005,
      "name": "NotGroupMember",
      "msg": "User is not a group member"
    },
    {
      "code": 6006,
      "name": "InactiveMember",
      "msg": "Member is inactive"
    },
    {
      "code": 6007,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6008,
      "name": "InvalidSplitRatio",
      "msg": "Invalid split ratio"
    },
    {
      "code": 6009,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6010,
      "name": "UnauthorizedAction",
      "msg": "Unauthorized action"
    },
    {
      "code": 6011,
      "name": "InvalidBatchSize",
      "msg": "Invalid batch size (must be 1-10)"
    },
    {
      "code": 6012,
      "name": "ProposalAlreadyExecuted",
      "msg": "Proposal already executed"
    }
  ]
};

export const IDL: GroupManager = {
  "version": "0.1.0",
  "name": "group_manager",
  "instructions": [
    {
      "name": "createGroup",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "multisigAuthority",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Multi-sig authority (from Squads)"
          ]
        },
        {
          "name": "poolMint",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Compressed token mint (will be created separately via compressed-pool program)"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "fundraisingTarget",
          "type": "u64"
        },
        {
          "name": "paymentSchedule",
          "type": {
            "defined": "PaymentSchedule"
          }
        },
        {
          "name": "contributionAmount",
          "type": "u64"
        },
        {
          "name": "allocationStrategy",
          "type": {
            "defined": "AllocationStrategy"
          }
        }
      ]
    },
    {
      "name": "contribute",
      "accounts": [
        {
          "name": "contributor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createInvite",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorMember",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Verify creator is a member of the group"
          ]
        },
        {
          "name": "inviteCode",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "codeString",
          "type": "string"
        },
        {
          "name": "tipAmount",
          "type": "u64"
        },
        {
          "name": "expiryDays",
          "type": {
            "option": "u8"
          }
        }
      ]
    },
    {
      "name": "joinWithInvite",
      "accounts": [
        {
          "name": "newMember",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inviteCode",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inviteCreator",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The invite creator who receives the tip"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "codeHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "inviteId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "batchContributions",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The payer who signs the transaction (can be any member or group authority)"
          ]
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amounts",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "proposeWithdrawal",
      "accounts": [
        {
          "name": "proposer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupPool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proposerMember",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Verify proposer is a member"
          ]
        },
        {
          "name": "withdrawalProposal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "recipient",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "groupPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "poolMint",
            "type": "publicKey"
          },
          {
            "name": "fundraisingTarget",
            "type": "u64"
          },
          {
            "name": "currentAmount",
            "type": "u64"
          },
          {
            "name": "paymentSchedule",
            "type": {
              "defined": "PaymentSchedule"
            }
          },
          {
            "name": "contributionAmount",
            "type": "u64"
          },
          {
            "name": "allocationStrategy",
            "type": {
              "defined": "AllocationStrategy"
            }
          },
          {
            "name": "splitRatio",
            "type": "u8"
          },
          {
            "name": "membersCount",
            "type": "u16"
          },
          {
            "name": "invitesCreated",
            "type": "u64"
          },
          {
            "name": "withdrawalProposalsCount",
            "type": "u64"
          },
          {
            "name": "totalContributions",
            "type": "u64"
          },
          {
            "name": "yieldEarned",
            "type": "u64"
          },
          {
            "name": "liquidityPool",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "inviteCode",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "group",
            "type": "publicKey"
          },
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "codeHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "tipAmount",
            "type": "u64"
          },
          {
            "name": "isUsed",
            "type": "bool"
          },
          {
            "name": "usedBy",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "inviteId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "member",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "group",
            "type": "publicKey"
          },
          {
            "name": "wallet",
            "type": "publicKey"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          },
          {
            "name": "allocationBps",
            "type": "u16"
          },
          {
            "name": "lastContribution",
            "type": "i64"
          },
          {
            "name": "contributionCount",
            "type": "u32"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "joinedViaInvite",
            "type": "bool"
          },
          {
            "name": "inviteTipReceived",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "withdrawalProposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "groupPool",
            "type": "publicKey"
          },
          {
            "name": "proposer",
            "type": "publicKey"
          },
          {
            "name": "recipient",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "executed",
            "type": "bool"
          },
          {
            "name": "proposalId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "PaymentSchedule",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Weekly"
          },
          {
            "name": "Monthly"
          },
          {
            "name": "Quarterly"
          },
          {
            "name": "OneTime"
          }
        ]
      }
    },
    {
      "name": "AllocationStrategy",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "FullyCompressed"
          },
          {
            "name": "Split",
            "fields": [
              {
                "name": "ratio",
                "type": "u8"
              }
            ]
          },
          {
            "name": "FullyYield"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NameTooLong",
      "msg": "Group name is too long"
    },
    {
      "code": 6001,
      "name": "InvalidTarget",
      "msg": "Invalid fundraising target"
    },
    {
      "code": 6002,
      "name": "InvalidInviteCode",
      "msg": "Invite code is invalid"
    },
    {
      "code": 6003,
      "name": "InviteAlreadyUsed",
      "msg": "Invite has already been used"
    },
    {
      "code": 6004,
      "name": "InviteExpired",
      "msg": "Invite has expired"
    },
    {
      "code": 6005,
      "name": "NotGroupMember",
      "msg": "User is not a group member"
    },
    {
      "code": 6006,
      "name": "InactiveMember",
      "msg": "Member is inactive"
    },
    {
      "code": 6007,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6008,
      "name": "InvalidSplitRatio",
      "msg": "Invalid split ratio"
    },
    {
      "code": 6009,
      "name": "InsufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6010,
      "name": "UnauthorizedAction",
      "msg": "Unauthorized action"
    },
    {
      "code": 6011,
      "name": "InvalidBatchSize",
      "msg": "Invalid batch size (must be 1-10)"
    },
    {
      "code": 6012,
      "name": "ProposalAlreadyExecuted",
      "msg": "Proposal already executed"
    }
  ]
};
