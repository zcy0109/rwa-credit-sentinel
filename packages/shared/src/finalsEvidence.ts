export const finalsEvidence = {
  rpcUrl: "https://node.testnet.casper.network/rpc",
  explorerTransactionBaseUrl: "https://testnet.cspr.live/transaction",
  deploymentHash: "694147496b0af6dfe83bf0a32cecd16ae6e09b8a141087f6cc0bcffea0f252c0",
  credentialWriteHash: "b52e4471e09e34a25a5b059bf19ba47764772d46f2c4b328ec6cf57784e0f2ec",
  intentWriteHash: "78e23db0c0d8aa1f4077c9983fa8b6e394730c21bb6773458c544299456fa3e7",
  contractHash: "e5c63c54f0c147703548976c174087d4a8e087da191adc2f466fa101e1154a3a",
  packageHash: "aacf4a08413e873bb3f67b2d7ce78230e3d3e2bde558c2203bd55b1a37853345",
  credentialDictionaryKey:
    "dictionary-c8aa1ed7710b32d36e4af3a54101716cdc9d03932f3ee13b988bcf4da656d21b",
  intentDictionaryKey:
    "dictionary-ee8964520c7812b6cd1e5b5d6f6098b42a0f4f59b3f578929a4de054d7b2928d",
  assetId: "invoice:acme-export-invoice-pool-finals",
  intentId: "intent-b781ee81",
  reportHash: "13ae257c3ebc1b7390992c06fce80e80a48d108205b72ee8a462481c2c574626",
  evidenceHash: "4ea1bedb46c13cb700c8f33a4f958da6bb91bb34243a6df50bfa88cb90ef8394",
  evidenceManifestHash: "06e0a311d67f64e116fc2f0f134bbfa9b438e8f0e7c733d636080ff8a2a3420d",
  intentHash: "7485dc82989896680b6f6353c170ab9e4327541973c3dabca0118c57d560aa0b",
  expectedRiskDecision: "Eligible",
  expectedExecutionDecision: "Approve",
  expectedAuthorization: "policy_key",
  expectedPrincipalCapUsd: 125000
} as const;

export const qualificationEvidence = {
  deploymentHash: "735dab5995084abfe4494398ff6f3c6677055a4d5025b79918ae9c4a202a93b9",
  recordHash: "096907b2961fe30d01d0267a2876922225d2b43e37f124a40608330e500341f0",
  contractHash: "aeda10dacdee9cefa8b857c3f6c8a0b2edeb6c19421f16189016ab1a2359b391",
  packageHash: "2765865230aba876704f1b793b2a124adcdf532336c9b455de692ea885637df3"
} as const;

export function testnetTransactionUrl(hash: string): string {
  return `${finalsEvidence.explorerTransactionBaseUrl}/${hash}`;
}
