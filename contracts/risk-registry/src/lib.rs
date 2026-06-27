#![no_std]

extern crate alloc;

use alloc::string::String;
use odra::prelude::*;

#[odra::odra_type]
#[derive(Clone, PartialEq, Eq)]
pub enum RiskDecision {
    Eligible,
    Review,
    Rejected,
}

#[odra::odra_type]
#[derive(Clone)]
pub struct RiskCredential {
    pub asset_id: String,
    pub risk_score: u8,
    pub decision: RiskDecision,
    pub report_hash: String,
    pub evidence_hash: String,
    pub issuer: Address,
    pub created_at_ms: u64,
}

#[odra::event]
pub struct RiskCredentialRecorded {
    pub asset_id: String,
    pub risk_score: u8,
    pub decision: RiskDecision,
    pub report_hash: String,
    pub evidence_hash: String,
    pub issuer: Address,
}

#[odra::module]
pub struct RiskRegistry {
    owner: Var<Address>,
    records: Mapping<String, RiskCredential>,
}

#[odra::module]
impl RiskRegistry {
    pub fn init(&mut self) {
        self.owner.set(self.env().caller());
    }

    pub fn record_credential(
        &mut self,
        asset_id: String,
        risk_score: u8,
        decision: RiskDecision,
        report_hash: String,
        evidence_hash: String,
        created_at_ms: u64,
    ) {
        self.assert_owner();
        self.assert_score(risk_score);

        let credential = RiskCredential {
            asset_id: asset_id.clone(),
            risk_score,
            decision: decision.clone(),
            report_hash: report_hash.clone(),
            evidence_hash: evidence_hash.clone(),
            issuer: self.env().caller(),
            created_at_ms,
        };

        self.records.set(&asset_id, credential);
        self.env().emit_event(RiskCredentialRecorded {
            asset_id,
            risk_score,
            decision,
            report_hash,
            evidence_hash,
            issuer: self.env().caller(),
        });
    }

    pub fn get_credential(&self, asset_id: String) -> Option<RiskCredential> {
        self.records.get(&asset_id)
    }

    pub fn owner(&self) -> Address {
        self.owner.get_or_default()
    }

    fn assert_owner(&self) {
        if self.env().caller() != self.owner.get_or_default() {
            self.env().revert(RegistryError::NotOwner);
        }
    }

    fn assert_score(&self, risk_score: u8) {
        if risk_score > 100 {
            self.env().revert(RegistryError::InvalidScore);
        }
    }
}

#[odra::odra_error]
pub enum RegistryError {
    NotOwner = 1,
    InvalidScore = 2,
}
