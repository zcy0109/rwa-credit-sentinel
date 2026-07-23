export const finalsEvidence = {
  rpcUrl: "https://node.testnet.casper.network/rpc",
  explorerTransactionBaseUrl: "https://testnet.cspr.live/transaction",
  deploymentHash: "3a305efe3c72339e00655a0eace4d5f0ba11514717241204fab6029a458e591c",
  credentialWriteHash: "da9174726c74f11ae54e47368f933b3e0effc48e1ac376ff0f34a77d632cebd6",
  intentWriteHash: "68175104219126eee20876aa7446301888338838bb1430bd1ce01c5ebbe2542a",
  contractHash: "6a248275de2c4518a9adb4996d62183e0a10899cd0b9080274cf72504ed9cd4f",
  packageHash: "2c34005155776d58709aa092eadb967b60d024a99e2073e131ec500a7e98358f",
  credentialDictionaryKey:
    "dictionary-0d1ae99a898ca2cbcee6372256ed77868577ec045e5071998ffb0caa7fc2ad52",
  intentDictionaryKey:
    "dictionary-eb1679fc5cd63e7b8f27d74990415252d74d36f58ba26ecbb26426d3ea7816db",
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
