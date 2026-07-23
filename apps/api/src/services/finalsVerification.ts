import {
  readExecutionIntentState,
  readRiskCredentialState,
  type CasperExecutionIntentRecord,
  type CasperRiskCredentialRecord
} from "@rwa-sentinel/casper";
import { finalsEvidence } from "@rwa-sentinel/shared";

export type VerificationCheck = {
  id: string;
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
};

export type FinalsStateVerification = {
  verified: boolean;
  verifiedAt: string;
  contractHash: string;
  packageHash: string;
  credential: {
    dictionaryKey: string;
    stateRootHash: string;
    record: CasperRiskCredentialRecord;
    checks: VerificationCheck[];
  };
  executionIntent: {
    dictionaryKey: string;
    stateRootHash: string;
    record: CasperExecutionIntentRecord;
    checks: VerificationCheck[];
  };
};

export async function verifyFinalsState(fetchFn: typeof fetch = fetch): Promise<FinalsStateVerification> {
  const [credential, executionIntent] = await Promise.all([
    readRiskCredentialState({
      rpcUrl: finalsEvidence.rpcUrl,
      contractHash: finalsEvidence.contractHash,
      assetId: finalsEvidence.assetId,
      fetchFn
    }),
    readExecutionIntentState({
      rpcUrl: finalsEvidence.rpcUrl,
      contractHash: finalsEvidence.contractHash,
      intentId: finalsEvidence.intentId,
      fetchFn
    })
  ]);
  const credentialChecks = buildCredentialChecks(credential.dictionaryKey, credential.record);
  const intentChecks = buildIntentChecks(executionIntent.dictionaryKey, executionIntent.record);
  const verified = [...credentialChecks, ...intentChecks].every((check) => check.passed);

  return {
    verified,
    verifiedAt: new Date().toISOString(),
    contractHash: finalsEvidence.contractHash,
    packageHash: finalsEvidence.packageHash,
    credential: {
      dictionaryKey: credential.dictionaryKey,
      stateRootHash: credential.stateRootHash,
      record: credential.record,
      checks: credentialChecks
    },
    executionIntent: {
      dictionaryKey: executionIntent.dictionaryKey,
      stateRootHash: executionIntent.stateRootHash,
      record: executionIntent.record,
      checks: intentChecks
    }
  };
}

function buildCredentialChecks(
  dictionaryKey: string,
  record: CasperRiskCredentialRecord
): VerificationCheck[] {
  return [
    check("credential_dictionary", "Credential dictionary key", finalsEvidence.credentialDictionaryKey, dictionaryKey),
    check("credential_asset", "Credential asset ID", finalsEvidence.assetId, record.asset_id),
    check("credential_decision", "Underwriting decision", finalsEvidence.expectedRiskDecision, record.decision),
    check("credential_report", "Credential report hash", finalsEvidence.reportHash, record.report_hash),
    check("credential_evidence", "Credential evidence hash", finalsEvidence.evidenceHash, record.evidence_hash)
  ];
}

function buildIntentChecks(
  dictionaryKey: string,
  record: CasperExecutionIntentRecord
): VerificationCheck[] {
  return [
    check("intent_dictionary", "Intent dictionary key", finalsEvidence.intentDictionaryKey, dictionaryKey),
    check("intent_id", "Execution intent ID", finalsEvidence.intentId, record.intent_id),
    check("intent_asset", "Intent asset ID", finalsEvidence.assetId, record.asset_id),
    check("intent_report", "Intent report hash", finalsEvidence.reportHash, record.report_hash),
    check("intent_decision", "Execution decision", finalsEvidence.expectedExecutionDecision, record.decision),
    check("intent_authorization", "Authorization path", finalsEvidence.expectedAuthorization, record.authorization),
    check(
      "intent_principal",
      "Principal ceiling",
      String(finalsEvidence.expectedPrincipalCapUsd),
      String(record.principal_cap_usd)
    ),
    check("intent_hash", "Canonical intent hash", finalsEvidence.intentHash, record.intent_hash)
  ];
}

function check(id: string, label: string, expected: string, actual: string): VerificationCheck {
  return { id, label, expected, actual, passed: expected === actual };
}
