/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/freedumbs_controller_program.json`.
 */
export type FreedumbsControllerProgram = {
  "address": "ED1wFswBBfem6T3CnQBjz3pBcqJ2xCr1t1EC2j6tacW",
  "metadata": {
    "name": "freedumbsControllerProgram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "burn",
      "discriminator": [
        116,
        110,
        29,
        56,
        107,
        219,
        42,
        93
      ],
      "accounts": [
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "curve",
          "writable": true
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
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
      "name": "calculateBurnAmount",
      "discriminator": [
        79,
        227,
        161,
        152,
        33,
        127,
        68,
        80
      ],
      "accounts": [
        {
          "name": "curve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "curve"
          ]
        }
      ],
      "args": [
        {
          "name": "outputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "calculateMintAmount",
      "discriminator": [
        204,
        242,
        57,
        86,
        101,
        243,
        149,
        115
      ],
      "accounts": [
        {
          "name": "curve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "curve"
          ]
        }
      ],
      "args": [
        {
          "name": "inputAmount",
          "type": "u64"
        }
      ],
      "returns": "u64"
    },
    {
      "name": "distributeFees",
      "discriminator": [
        120,
        56,
        27,
        7,
        53,
        176,
        113,
        186
      ],
      "accounts": [
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "curve",
          "writable": true
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "emergencyIntervention",
      "discriminator": [
        112,
        123,
        161,
        71,
        243,
        91,
        165,
        20
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "actionType",
          "type": {
            "defined": {
              "name": "emergencyActionType"
            }
          }
        }
      ]
    },
    {
      "name": "initializeAgent",
      "discriminator": [
        212,
        81,
        156,
        211,
        212,
        110,
        21,
        28
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  103,
                  101,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "agentType",
          "type": {
            "defined": {
              "name": "agentType"
            }
          }
        },
        {
          "name": "config",
          "type": {
            "defined": {
              "name": "agentConfig"
            }
          }
        }
      ]
    },
    {
      "name": "initializeController",
      "discriminator": [
        137,
        255,
        100,
        190,
        201,
        247,
        241,
        81
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  108,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "config",
          "type": {
            "defined": {
              "name": "controllerConfig"
            }
          }
        }
      ]
    },
    {
      "name": "initializeCurve",
      "discriminator": [
        170,
        84,
        186,
        253,
        131,
        149,
        95,
        213
      ],
      "accounts": [
        {
          "name": "curve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "config",
          "type": {
            "defined": {
              "name": "curveConfig"
            }
          }
        }
      ]
    },
    {
      "name": "initializeTreasury",
      "discriminator": [
        124,
        186,
        211,
        195,
        85,
        165,
        129,
        166
      ],
      "accounts": [
        {
          "name": "treasury",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "config",
          "type": {
            "defined": {
              "name": "treasuryConfig"
            }
          }
        }
      ]
    },
    {
      "name": "mint",
      "discriminator": [
        51,
        57,
        225,
        47,
        182,
        146,
        137,
        166
      ],
      "accounts": [
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "curve",
          "writable": true
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
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
      "name": "rebalanceReserves",
      "discriminator": [
        3,
        43,
        48,
        7,
        195,
        65,
        64,
        245
      ],
      "accounts": [
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "curve",
          "writable": true
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "submitMarketAnalysis",
      "discriminator": [
        17,
        107,
        250,
        148,
        253,
        147,
        41,
        160
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "analysis",
          "type": {
            "defined": {
              "name": "marketAnalysis"
            }
          }
        }
      ]
    },
    {
      "name": "updateControllerLimits",
      "discriminator": [
        17,
        27,
        43,
        84,
        166,
        7,
        198,
        106
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newLimits",
          "type": {
            "defined": {
              "name": "controlLimits"
            }
          }
        }
      ]
    },
    {
      "name": "updateControllerMode",
      "discriminator": [
        32,
        92,
        249,
        239,
        190,
        110,
        220,
        179
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newMode",
          "type": {
            "defined": {
              "name": "operationMode"
            }
          }
        }
      ]
    },
    {
      "name": "updateControllerParameters",
      "discriminator": [
        251,
        210,
        0,
        125,
        124,
        15,
        0,
        83
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "controlParameters"
            }
          }
        }
      ]
    },
    {
      "name": "updateCurveDynamics",
      "discriminator": [
        50,
        6,
        5,
        126,
        144,
        124,
        125,
        32
      ],
      "accounts": [
        {
          "name": "curve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "curve"
          ]
        }
      ],
      "args": [
        {
          "name": "newRates",
          "type": {
            "defined": {
              "name": "curveRates"
            }
          }
        },
        {
          "name": "marketVolatility",
          "type": "u64"
        },
        {
          "name": "liquidityDepth",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateCurveParameters",
      "discriminator": [
        234,
        55,
        20,
        133,
        66,
        185,
        60,
        201
      ],
      "accounts": [
        {
          "name": "curve",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  117,
                  114,
                  118,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "curve"
          ]
        }
      ],
      "args": [
        {
          "name": "newConfig",
          "type": {
            "defined": {
              "name": "curveConfig"
            }
          }
        }
      ]
    },
    {
      "name": "updateHealthMetrics",
      "discriminator": [
        249,
        242,
        157,
        49,
        53,
        241,
        76,
        110
      ],
      "accounts": [
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "newMetrics",
          "type": {
            "defined": {
              "name": "healthMetricsCalculator"
            }
          }
        }
      ]
    },
    {
      "name": "updatePidParameters",
      "discriminator": [
        11,
        156,
        231,
        56,
        113,
        156,
        108,
        177
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true
        },
        {
          "name": "controller",
          "writable": true
        },
        {
          "name": "marketState",
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "pidParameters"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "agent",
      "discriminator": [
        47,
        166,
        112,
        147,
        155,
        197,
        86,
        7
      ]
    },
    {
      "name": "controller",
      "discriminator": [
        184,
        79,
        171,
        0,
        183,
        43,
        113,
        110
      ]
    },
    {
      "name": "curve",
      "discriminator": [
        191,
        180,
        249,
        66,
        180,
        71,
        51,
        182
      ]
    },
    {
      "name": "marketState",
      "discriminator": [
        0,
        125,
        123,
        215,
        95,
        96,
        164,
        194
      ]
    },
    {
      "name": "treasury",
      "discriminator": [
        238,
        239,
        123,
        238,
        89,
        1,
        168,
        253
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "arithmeticError",
      "msg": "Arithmetic operation failed"
    },
    {
      "code": 6001,
      "name": "invalidParameter",
      "msg": "Invalid parameter value provided"
    },
    {
      "code": 6002,
      "name": "timeout",
      "msg": "Operation timeout exceeded"
    },
    {
      "code": 6003,
      "name": "notInitialized",
      "msg": "Account not initialized"
    },
    {
      "code": 6004,
      "name": "bumpNotFound",
      "msg": "Bump not found in seeds"
    },
    {
      "code": 6005,
      "name": "unauthorizedAgentType",
      "msg": "Unauthorized agent type for this operation"
    },
    {
      "code": 6006,
      "name": "unauthorizedAgent",
      "msg": "Unauthorized agent for this action"
    },
    {
      "code": 6007,
      "name": "unauthorizedEmergencyAction",
      "msg": "Unauthorized emergency action"
    },
    {
      "code": 6008,
      "name": "invalidAuthority",
      "msg": "Invalid authority for this operation"
    },
    {
      "code": 6009,
      "name": "unauthorizedAccess",
      "msg": "Unauthorized access"
    },
    {
      "code": 6010,
      "name": "invalidAgentAuthority",
      "msg": "Invalid agent authority"
    },
    {
      "code": 6011,
      "name": "unauthorizedAuthority",
      "msg": "Unauthorized authority"
    },
    {
      "code": 6012,
      "name": "alreadyInitialized",
      "msg": "Already Initialized"
    },
    {
      "code": 6013,
      "name": "unstableMarketConditions",
      "msg": "Market conditions too unstable for operation"
    },
    {
      "code": 6014,
      "name": "excessiveVolatility",
      "msg": "Market volatility exceeds threshold"
    },
    {
      "code": 6015,
      "name": "insufficientLiquidity",
      "msg": "Insufficient market liquidity"
    },
    {
      "code": 6016,
      "name": "marketConditionsNotMet",
      "msg": "Market conditions not met for operation"
    },
    {
      "code": 6017,
      "name": "invalidMarketTrend",
      "msg": "Invalid market trend direction"
    },
    {
      "code": 6018,
      "name": "invalidMarketRelationship",
      "msg": "Invalid Market Relationship"
    },
    {
      "code": 6019,
      "name": "outsideMarketHours",
      "msg": "Operation outside market hours"
    },
    {
      "code": 6020,
      "name": "marketTimeout",
      "msg": "Market time out"
    },
    {
      "code": 6021,
      "name": "spreadTooLarge",
      "msg": "Spread exceeds maximum allowed"
    },
    {
      "code": 6022,
      "name": "invalidPrice",
      "msg": "Invalid price"
    },
    {
      "code": 6023,
      "name": "invalidTradeLimits",
      "msg": "Invalid trade limits"
    },
    {
      "code": 6024,
      "name": "invalidTradeSize",
      "msg": "Invalid Trade Size"
    },
    {
      "code": 6025,
      "name": "insufficientReserves",
      "msg": "Insufficient treasury reserves"
    },
    {
      "code": 6026,
      "name": "invalidReserveRatio",
      "msg": "Invalid reserve ratio"
    },
    {
      "code": 6027,
      "name": "excessiveRatioChange",
      "msg": "Reserve ratio change exceeds maximum allowed"
    },
    {
      "code": 6028,
      "name": "tooEarlyForDistribution",
      "msg": "Too early for fee distribution"
    },
    {
      "code": 6029,
      "name": "insufficientFeesForDistribution",
      "msg": "Insufficient fees accumulated for distribution"
    },
    {
      "code": 6030,
      "name": "treasuryTimeout",
      "msg": "Treasury Timeout"
    },
    {
      "code": 6031,
      "name": "treasuryFrozen",
      "msg": "Treasury is frozen"
    },
    {
      "code": 6032,
      "name": "invalidModeTransition",
      "msg": "Invalid operation mode transition"
    },
    {
      "code": 6033,
      "name": "emergencyModeActive",
      "msg": "Emergency mode active"
    },
    {
      "code": 6034,
      "name": "emergencyConditionsNotMet",
      "msg": "Emergency conditions not met"
    },
    {
      "code": 6035,
      "name": "controllerParameterOutOfBounds",
      "msg": "Controller parameters out of bounds"
    },
    {
      "code": 6036,
      "name": "controllerNotInitialized",
      "msg": "Controller not initialized"
    },
    {
      "code": 6037,
      "name": "invalidOperationMode",
      "msg": "Invalid operation mode"
    },
    {
      "code": 6038,
      "name": "slippageExceeded",
      "msg": "Slippage exceeds maximum allowed"
    },
    {
      "code": 6039,
      "name": "slippageTooHigh",
      "msg": "Slippage too high for operation"
    },
    {
      "code": 6040,
      "name": "mintLimitExceeded",
      "msg": "Mint amount exceeds daily limit"
    },
    {
      "code": 6041,
      "name": "burnLimitExceeded",
      "msg": "Burn amount exceeds daily limit"
    },
    {
      "code": 6042,
      "name": "invalidTokenAccount",
      "msg": "Invalid token account"
    },
    {
      "code": 6043,
      "name": "excessivePriceImpact",
      "msg": "Excessive Price Impact"
    },
    {
      "code": 6044,
      "name": "invalidPidParameters",
      "msg": "Invalid PID parameters"
    },
    {
      "code": 6045,
      "name": "invalidActionBounds",
      "msg": "Invalid action bounds"
    },
    {
      "code": 6046,
      "name": "invalidMarketAnalysis",
      "msg": "Invalid market analysis data"
    },
    {
      "code": 6047,
      "name": "agentPerformanceBelowThreshold",
      "msg": "Agent performance below threshold"
    },
    {
      "code": 6048,
      "name": "agentNotActive",
      "msg": "Agent not active"
    },
    {
      "code": 6049,
      "name": "agentUnhealthy",
      "msg": "Agent unhealthy"
    },
    {
      "code": 6050,
      "name": "invalidAmount",
      "msg": "Invalid Amount"
    },
    {
      "code": 6051,
      "name": "invalidSignature",
      "msg": "Invalid signature"
    },
    {
      "code": 6052,
      "name": "operationNotAllowed",
      "msg": "Operation not allowed in current mode"
    },
    {
      "code": 6053,
      "name": "rateLimitExceeded",
      "msg": "Rate limit exceeded"
    },
    {
      "code": 6054,
      "name": "invalidTransactionOrder",
      "msg": "Invalid transaction ordering"
    },
    {
      "code": 6055,
      "name": "transactionTooSoon",
      "msg": "Transaction too soon"
    },
    {
      "code": 6056,
      "name": "cooldownNotMet",
      "msg": "Cooldown period not met"
    },
    {
      "code": 6057,
      "name": "operationPaused",
      "msg": "Operation Paused"
    },
    {
      "code": 6058,
      "name": "systemPaused",
      "msg": "System paused"
    },
    {
      "code": 6059,
      "name": "invalidStateTransition",
      "msg": "Invalid system state transition"
    },
    {
      "code": 6060,
      "name": "upgradeRequired",
      "msg": "System upgrade required"
    },
    {
      "code": 6061,
      "name": "invalidTimestamp",
      "msg": "Invalid timestamp for operation"
    },
    {
      "code": 6062,
      "name": "unhealthyState",
      "msg": "Unhealthy system state"
    },
    {
      "code": 6063,
      "name": "priceDeviationTooLarge",
      "msg": "Price deviation exceeds allowed threshold"
    },
    {
      "code": 6064,
      "name": "invalidAccountRelationship",
      "msg": "Invalid relationship between accounts"
    },
    {
      "code": 6065,
      "name": "invalidConfidenceScore",
      "msg": "Invalid confidence score provided"
    },
    {
      "code": 6066,
      "name": "boundsExceedLimit",
      "msg": "Bounds exceed limit"
    },
    {
      "code": 6067,
      "name": "boundsBelowLimit",
      "msg": "Bounds below limit"
    },
    {
      "code": 6068,
      "name": "invalidBounds",
      "msg": "Invalid bounds provided"
    },
    {
      "code": 6069,
      "name": "rebalanceNotNeeded",
      "msg": "Rebalance not needed"
    },
    {
      "code": 6070,
      "name": "distributionNotReady",
      "msg": "Distribution not ready"
    },
    {
      "code": 6071,
      "name": "insufficientFees",
      "msg": "Insufficient fees"
    },
    {
      "code": 6072,
      "name": "controllerUnhealthy",
      "msg": "Controller unhealthy"
    },
    {
      "code": 6073,
      "name": "invalidControllerRelationship",
      "msg": "Invalid controller relationship"
    },
    {
      "code": 6074,
      "name": "invalidAgentRelationship",
      "msg": "Invalid agent relationship"
    },
    {
      "code": 6075,
      "name": "operationModesMisaligned",
      "msg": "Operation modes misaligned"
    },
    {
      "code": 6076,
      "name": "emergencyStateMisaligned",
      "msg": "Emergency state misaligned"
    },
    {
      "code": 6077,
      "name": "invalidCalculation",
      "msg": "Invalid calculation parameters"
    },
    {
      "code": 6078,
      "name": "divisionByZero",
      "msg": "Division by zero attempted"
    },
    {
      "code": 6079,
      "name": "insufficientPriceHistory",
      "msg": "Insufficient price history for calculation"
    },
    {
      "code": 6080,
      "name": "insufficientVolumeHistory",
      "msg": "Insufficient volume history for calculation"
    },
    {
      "code": 6081,
      "name": "invalidFeeRate",
      "msg": "Invalid fee rate provided"
    },
    {
      "code": 6082,
      "name": "invalidRatio",
      "msg": "Invalid ratio value"
    }
  ],
  "types": [
    {
      "name": "actionBounds",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minAmount",
            "type": "u64"
          },
          {
            "name": "maxAmount",
            "type": "u64"
          },
          {
            "name": "maxPriceImpact",
            "type": "u64"
          },
          {
            "name": "minPriceImpact",
            "type": "u64"
          },
          {
            "name": "timeBounds",
            "type": {
              "defined": {
                "name": "timeBounds"
              }
            }
          }
        ]
      }
    },
    {
      "name": "actionMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalActions",
            "type": "u64"
          },
          {
            "name": "successfulActions",
            "type": "u64"
          },
          {
            "name": "failedActions",
            "type": "u64"
          },
          {
            "name": "successRate",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "agent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "controller",
            "type": "pubkey"
          },
          {
            "name": "agentType",
            "type": {
              "defined": {
                "name": "agentType"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "pidParameters",
            "type": {
              "defined": {
                "name": "pidParameters"
              }
            }
          },
          {
            "name": "actionBounds",
            "type": {
              "defined": {
                "name": "actionBounds"
              }
            }
          },
          {
            "name": "performanceMetrics",
            "type": {
              "defined": {
                "name": "performanceMetrics"
              }
            }
          },
          {
            "name": "operationMode",
            "type": {
              "defined": {
                "name": "operationMode"
              }
            }
          },
          {
            "name": "healthStatus",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::agent::HealthStatus"
              }
            }
          },
          {
            "name": "timing",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::agent::TimeTracking"
              }
            }
          },
          {
            "name": "permissions",
            "type": "u64"
          },
          {
            "name": "activeStatus",
            "type": "bool"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "metrics",
            "type": {
              "defined": {
                "name": "agentMetrics"
              }
            }
          }
        ]
      }
    },
    {
      "name": "agentConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxOperations",
            "type": "u64"
          },
          {
            "name": "cooldownPeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "agentMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintWindow",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::agent::MetricWindow"
              }
            }
          },
          {
            "name": "burnWindow",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::agent::MetricWindow"
              }
            }
          },
          {
            "name": "transferWindow",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::agent::MetricWindow"
              }
            }
          },
          {
            "name": "swapWindow",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::agent::MetricWindow"
              }
            }
          }
        ]
      }
    },
    {
      "name": "agentType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "primary"
          },
          {
            "name": "secondary"
          },
          {
            "name": "observer"
          },
          {
            "name": "emergency"
          }
        ]
      }
    },
    {
      "name": "controlLimits",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxLeverage",
            "type": "u64"
          },
          {
            "name": "minCollateral",
            "type": "u64"
          },
          {
            "name": "maxDrawdown",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "controlParameters",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "kp",
            "type": "u64"
          },
          {
            "name": "ki",
            "type": "u64"
          },
          {
            "name": "kd",
            "type": "u64"
          },
          {
            "name": "responseSpeed",
            "type": "u64"
          },
          {
            "name": "dampingFactor",
            "type": "u64"
          },
          {
            "name": "maxSpread",
            "type": "u64"
          },
          {
            "name": "minTransactionSize",
            "type": "u64"
          },
          {
            "name": "maxTransactionSize",
            "type": "u64"
          },
          {
            "name": "minStabilityThreshold",
            "type": "u64"
          },
          {
            "name": "analysisWindow",
            "type": "u64"
          },
          {
            "name": "actionDelay",
            "type": "u64"
          },
          {
            "name": "recoveryPeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "controller",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "controllerType",
            "type": {
              "defined": {
                "name": "controllerType"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "controllerState",
            "type": {
              "defined": {
                "name": "controllerState"
              }
            }
          },
          {
            "name": "controlParameters",
            "type": {
              "defined": {
                "name": "controlParameters"
              }
            }
          },
          {
            "name": "healthMetrics",
            "type": {
              "defined": {
                "name": "healthMetrics"
              }
            }
          },
          {
            "name": "timing",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::controller::TimeTracking"
              }
            }
          },
          {
            "name": "maxTransactionAmount",
            "type": "u64"
          },
          {
            "name": "feeBasisPoints",
            "type": "u64"
          },
          {
            "name": "initialized",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "controllerConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxLeverage",
            "type": "u64"
          },
          {
            "name": "minCollateral",
            "type": "u64"
          },
          {
            "name": "maxDrawdown",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "controllerState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "currentMode",
            "type": {
              "defined": {
                "name": "operationMode"
              }
            }
          },
          {
            "name": "targetPrice",
            "type": "u64"
          },
          {
            "name": "priceBandUpper",
            "type": "u64"
          },
          {
            "name": "priceBandLower",
            "type": "u64"
          },
          {
            "name": "lastPrice",
            "type": "u64"
          },
          {
            "name": "lastUpdate",
            "type": "u64"
          },
          {
            "name": "marketVolatility",
            "type": "u64"
          },
          {
            "name": "marketDirection",
            "type": "u64"
          },
          {
            "name": "confidenceLevel",
            "type": "u64"
          },
          {
            "name": "mintSignal",
            "type": "u64"
          },
          {
            "name": "burnSignal",
            "type": "u64"
          },
          {
            "name": "curveAdjustmentSignal",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "controllerType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "mainNet"
          },
          {
            "name": "testNet"
          },
          {
            "name": "simulation"
          }
        ]
      }
    },
    {
      "name": "curve",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialPrice",
            "type": "u64"
          },
          {
            "name": "currentPrice",
            "type": "u64"
          },
          {
            "name": "minPrice",
            "type": "u64"
          },
          {
            "name": "maxPrice",
            "type": "u64"
          },
          {
            "name": "reserveRatio",
            "type": "u64"
          },
          {
            "name": "minReserveRatio",
            "type": "u64"
          },
          {
            "name": "slope",
            "type": "u64"
          },
          {
            "name": "k",
            "type": "u64"
          },
          {
            "name": "x0",
            "type": "u64"
          },
          {
            "name": "supply",
            "type": "u64"
          },
          {
            "name": "currentSupply",
            "type": "u64"
          },
          {
            "name": "reserves",
            "type": "u64"
          },
          {
            "name": "rates",
            "type": {
              "defined": {
                "name": "curveRates"
              }
            }
          },
          {
            "name": "feePercentage",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "timing",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::curve::TimeTracking"
              }
            }
          },
          {
            "name": "targetPrice",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "curveConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minPrice",
            "type": "u64"
          },
          {
            "name": "maxPrice",
            "type": "u64"
          },
          {
            "name": "targetPrice",
            "type": "u64"
          },
          {
            "name": "reserveRatio",
            "type": "u64"
          },
          {
            "name": "slope",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "curveRates",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintMultiplier",
            "type": "u64"
          },
          {
            "name": "burnMultiplier",
            "type": "u64"
          },
          {
            "name": "slippageMultiplier",
            "type": "u64"
          },
          {
            "name": "feeMultiplier",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "distributionMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "accumulatedFees",
            "type": "u64"
          },
          {
            "name": "totalDistributedFees",
            "type": "u64"
          },
          {
            "name": "distributionCount",
            "type": "u64"
          },
          {
            "name": "lastDistribution",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "emergencyActionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pauseMinting"
          },
          {
            "name": "adjustBounds"
          },
          {
            "name": "forceRebalance"
          }
        ]
      }
    },
    {
      "name": "feeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "protocolFeeRate",
            "type": "u64"
          },
          {
            "name": "agentFeeRate",
            "type": "u64"
          },
          {
            "name": "protocolShare",
            "type": "u64"
          },
          {
            "name": "agentShare",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "healthMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceStabilityScore",
            "type": "u64"
          },
          {
            "name": "volumeEfficiency",
            "type": "u64"
          },
          {
            "name": "controlEffectiveness",
            "type": "u64"
          },
          {
            "name": "cumulativeError",
            "type": "u64"
          },
          {
            "name": "errorRate",
            "type": "u64"
          },
          {
            "name": "lastErrorTimestamp",
            "type": "u64"
          },
          {
            "name": "systemUptime",
            "type": "u64"
          },
          {
            "name": "successfulActions",
            "type": "u64"
          },
          {
            "name": "failedActions",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "healthMetricsCalculator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceStabilityScore",
            "type": "u64"
          },
          {
            "name": "reserveRatio",
            "type": "u64"
          },
          {
            "name": "volatility",
            "type": "u64"
          },
          {
            "name": "timeWindow",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketAnalysis",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trend",
            "type": "u64"
          },
          {
            "name": "volatility",
            "type": "u64"
          },
          {
            "name": "liquidity",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketLimits",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minTradeSize",
            "type": "u64"
          },
          {
            "name": "maxTradeSize",
            "type": "u64"
          },
          {
            "name": "maxPriceImpact",
            "type": "u64"
          },
          {
            "name": "minLiquidity",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "volatility",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::market::MetricWindow"
              }
            }
          },
          {
            "name": "volume",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::market::MetricWindow"
              }
            }
          },
          {
            "name": "liquidity",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::market::MetricWindow"
              }
            }
          },
          {
            "name": "uniqueTraders",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "currentPrice",
            "type": "u64"
          },
          {
            "name": "previousPrice",
            "type": "u64"
          },
          {
            "name": "marketTrend",
            "type": {
              "defined": {
                "name": "marketTrend"
              }
            }
          },
          {
            "name": "operationMode",
            "type": {
              "defined": {
                "name": "operationMode"
              }
            }
          },
          {
            "name": "metrics",
            "type": {
              "defined": {
                "name": "marketMetrics"
              }
            }
          },
          {
            "name": "limits",
            "type": {
              "defined": {
                "name": "marketLimits"
              }
            }
          },
          {
            "name": "currentReserveRatio",
            "type": "u64"
          },
          {
            "name": "targetReserveRatio",
            "type": "u64"
          },
          {
            "name": "minReserveRatio",
            "type": "u64"
          },
          {
            "name": "timing",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::market::TimeTracking"
              }
            }
          }
        ]
      }
    },
    {
      "name": "marketTrend",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "neutral"
          },
          {
            "name": "bullish"
          },
          {
            "name": "bearish"
          },
          {
            "name": "volatile"
          },
          {
            "name": "stable"
          }
        ]
      }
    },
    {
      "name": "operationMode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "normal"
          },
          {
            "name": "defensive"
          },
          {
            "name": "recovery"
          },
          {
            "name": "emergency"
          },
          {
            "name": "paused"
          },
          {
            "name": "uninitialized"
          }
        ]
      }
    },
    {
      "name": "pidParameters",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "kp",
            "type": "u64"
          },
          {
            "name": "ki",
            "type": "u64"
          },
          {
            "name": "kd",
            "type": "u64"
          },
          {
            "name": "integralWindupLimit",
            "type": "u64"
          },
          {
            "name": "lastError",
            "type": "u64"
          },
          {
            "name": "integralSum",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "performanceMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceStabilityScore",
            "type": "u64"
          },
          {
            "name": "liquidityEfficiency",
            "type": "u64"
          },
          {
            "name": "interventionFrequency",
            "type": "u64"
          },
          {
            "name": "actionMetrics",
            "type": {
              "defined": {
                "name": "actionMetrics"
              }
            }
          },
          {
            "name": "responseMetrics",
            "type": {
              "defined": {
                "name": "responseMetrics"
              }
            }
          }
        ]
      }
    },
    {
      "name": "reserveMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalReserves",
            "type": "u64"
          },
          {
            "name": "currentReserves",
            "type": "u64"
          },
          {
            "name": "minimumReserves",
            "type": "u64"
          },
          {
            "name": "targetReserves",
            "type": "u64"
          },
          {
            "name": "reserveRatio",
            "type": "u64"
          },
          {
            "name": "targetReserveRatio",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "responseMetrics",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "averageResponseTime",
            "type": "u64"
          },
          {
            "name": "totalVolumeHandled",
            "type": "u64"
          },
          {
            "name": "errorCount",
            "type": "u64"
          },
          {
            "name": "lastActionTimestamp",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "timeBounds",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minTimeBetweenActions",
            "type": "u64"
          },
          {
            "name": "maxTimeBetweenActions",
            "type": "u64"
          },
          {
            "name": "cooldownPeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "treasury",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "treasuryConfig",
            "type": {
              "defined": {
                "name": "treasuryConfig"
              }
            }
          },
          {
            "name": "feeConfig",
            "type": {
              "defined": {
                "name": "feeConfig"
              }
            }
          },
          {
            "name": "reserveMetrics",
            "type": {
              "defined": {
                "name": "reserveMetrics"
              }
            }
          },
          {
            "name": "distributionMetrics",
            "type": {
              "defined": {
                "name": "distributionMetrics"
              }
            }
          },
          {
            "name": "healthStatus",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::treasury::HealthStatus"
              }
            }
          },
          {
            "name": "operationMode",
            "type": {
              "defined": {
                "name": "operationMode"
              }
            }
          },
          {
            "name": "timing",
            "type": {
              "defined": {
                "name": "freedumbs_controller_program::state::treasury::TimeTracking"
              }
            }
          },
          {
            "name": "isBuying",
            "type": "bool"
          },
          {
            "name": "isFrozen",
            "type": "bool"
          },
          {
            "name": "emergencyActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "treasuryConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "minReserveRatio",
            "type": "u64"
          },
          {
            "name": "targetReserveRatio",
            "type": "u64"
          },
          {
            "name": "maxReserveRatio",
            "type": "u64"
          },
          {
            "name": "emergencyThreshold",
            "type": "u64"
          },
          {
            "name": "distributionFrequency",
            "type": "u64"
          },
          {
            "name": "minDistributionAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::agent::HealthStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "healthy"
          },
          {
            "name": "warning"
          },
          {
            "name": "critical"
          },
          {
            "name": "emergency"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::agent::MetricWindow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "duration",
            "type": "u64"
          },
          {
            "name": "value",
            "type": "u64"
          },
          {
            "name": "count",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::agent::TimeTracking",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lastUpdate",
            "type": "u64"
          },
          {
            "name": "lastAction",
            "type": "u64"
          },
          {
            "name": "cooldownPeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::controller::TimeTracking",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lastUpdate",
            "type": "u64"
          },
          {
            "name": "lastAction",
            "type": "u64"
          },
          {
            "name": "cooldownPeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::curve::TimeTracking",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lastUpdate",
            "type": "u64"
          },
          {
            "name": "lastAction",
            "type": "u64"
          },
          {
            "name": "cooldownPeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::market::MetricWindow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startTime",
            "type": "u64"
          },
          {
            "name": "duration",
            "type": "u64"
          },
          {
            "name": "value",
            "type": "u64"
          },
          {
            "name": "count",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::market::TimeTracking",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lastUpdate",
            "type": "u64"
          },
          {
            "name": "lastAction",
            "type": "u64"
          },
          {
            "name": "cooldownPeriod",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::treasury::HealthStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "healthy"
          },
          {
            "name": "warning"
          },
          {
            "name": "critical"
          },
          {
            "name": "emergency"
          }
        ]
      }
    },
    {
      "name": "freedumbs_controller_program::state::treasury::TimeTracking",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lastUpdate",
            "type": "u64"
          },
          {
            "name": "lastAction",
            "type": "u64"
          },
          {
            "name": "cooldownPeriod",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
