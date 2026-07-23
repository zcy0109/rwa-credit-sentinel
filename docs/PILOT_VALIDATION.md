# Pilot Validation

## Current Status

The project is a public Testnet MVP and has not completed a production lender pilot. No bank,
lender, protocol, or auditor endorsement is claimed. This document defines an honest,
reproducible design-partner validation process.

## Target Reviewers

- RWA originator or invoice-finance operator
- credit or treasury risk reviewer
- DeFi lending or Casper integration developer

One person may test more than one role, but feedback should identify the role being represented.

## Thirty-Minute Review

1. Run the Judge Quickstart or open the hosted demo.
2. Inspect the submitted evidence manifest and its integrity limitation.
3. Run underwriting and review factor scores, agent tools, and provenance.
4. Produce one approved case, one reviewer-multisig case, and one blocked case.
5. Export the decision receipt.
6. Verify the published credential and execution-intent state from Casper RPC.

## Feedback Questions

1. Which evidence fields are missing for a real invoice-finance review?
2. Are the nine policy checks understandable and operationally relevant?
3. Which policy exceptions require a named human role?
4. Is the receipt sufficient to reproduce why an intent was approved, reviewed, or blocked?
5. What would prevent a shadow-mode integration?
6. Which data must never enter a model or public chain?

## Evidence to Record

For each review, record only:

- date
- reviewer role
- test environment
- completed test paths
- confirmed pain points
- requested changes
- changes accepted or rejected, with rationale

Do not publish names, employers, private documents, or endorsements without explicit consent.
Use the repository's Pilot Feedback issue template for public, consented feedback.

## Pilot Exit Gate

The first design-partner milestone is complete only when an external reviewer can submit a
non-sensitive sample, reproduce both hashes, understand the policy boundary, and retrieve the
same decision receipt without author assistance.
