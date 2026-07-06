# Security Policy

## Supported Branch

Security fixes are applied to the `main` branch.

## Reporting a Vulnerability

Please do not open a public issue for sensitive vulnerabilities. Report security concerns by contacting the maintainer through the contact information listed on the DoraHacks BUIDL page.

Include:

- A short description of the issue.
- Steps to reproduce or a proof of concept.
- Affected package, API route, contract, or frontend workflow.
- Whether any Casper Testnet deploy, private key, or credential material may be affected.

The project does not require private keys for normal review. Never commit `.env`, `.secrets`, wallet exports, or Casper private keys.

## Security Scope

In scope:

- API validation and report generation.
- Credential hashing and registry persistence.
- Casper Testnet registry contract integration.
- Frontend display of credential and transaction evidence.

Out of scope:

- Mainnet funds.
- Third-party services not controlled by this repository.
- Social engineering or attacks against individual accounts.
