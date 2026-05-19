# GhostPay

Private payment links for Solana.

## Current implementation

GhostPay currently supports:
- polished payment-link UX in Next.js
- wallet-based checkout on Solana
- public SPL USDC payment fallback
- Solana Pay QR generation
- Aiven Valkey-backed persistence when configured
- Umbra beta flows for:
  - wallet registration
  - private receiver-claimable payment creation
  - merchant-side private claim attempts

## Local setup

### 1. Install
```bash
yarn install
```

### 2. Environment
```bash
cp .env.example .env.local
```

Fill these values:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SOLANA_RPC_URL=
AIVEN_VALKEY_URL=
NEXT_PUBLIC_UMBRA_INDEXER_API_ENDPOINT=https://utxo-indexer.api.umbraprivacy.com
NEXT_PUBLIC_UMBRA_RELAYER_API_ENDPOINT=https://relayer.api.umbraprivacy.com
```

If Valkey is omitted, GhostPay falls back to in-memory demo storage.

Use a Redis-compatible connection string from Aiven Valkey, for example:
```bash
AIVEN_VALKEY_URL=rediss://default:<password>@<host>:<port>/0
```

### 3. Start
```bash
yarn dev
```

### 4. Verify
```bash
yarn typecheck
yarn build
npm run check:valkey
```

## Testing flow

### Public fallback
1. Connect wallet
2. Create payment link
3. Open checkout
4. Pay via direct SPL transfer
5. Confirm receipt

### Umbra beta
1. Connect merchant wallet
2. Open dashboard and register with Umbra
3. Create a payment link
4. Open checkout from another wallet
5. Click `Pay privately with Umbra beta`
6. Return to merchant dashboard
7. Claim privately with Umbra

## Known limitations

- Umbra flow depends on wallet-standard browser wallets
- private claim matching is heuristic: exact receiver + exact amount + newest matching claimable UTXO
- `snarkjs` causes a non-blocking webpack warning during build
- Next.js should still be upgraded to a patched version
