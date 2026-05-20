# GhostPay

Private payment links for Solana.

## Current implementation

GhostPay currently includes a Tippit V1 path with:
- creator pages
- MagicBlock-first private USDC tipping
- creator dashboard with wallet-authenticated private balance reads
- cookie-persisted MagicBlock auth session
- Aiven Postgres-backed Tippit persistence via Prisma
- Aiven Valkey available for cache/session support

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
POSTGRES_AIVEN_URL=
AIVEN_VALKEY_URL=
NEXT_PUBLIC_UMBRA_INDEXER_API_ENDPOINT=https://utxo-indexer.api.umbraprivacy.com
NEXT_PUBLIC_UMBRA_RELAYER_API_ENDPOINT=https://relayer.api.umbraprivacy.com
```

Supported Postgres aliases in app code:
```bash
POSTGRES_AIVEN_URL=
AIVEN_POSTGRES_URL=
POSTGRES_URL=
DATABASE_URL=
POSTGRES_AIVEN_KEY=
```

Use a Redis-compatible connection string from Aiven Valkey, for example:
```bash
AIVEN_VALKEY_URL=rediss://default:<password>@<host>:<port>/0
```

Use an Aiven Postgres connection string, for example:
```bash
POSTGRES_AIVEN_URL=postgres://user:password@host:port/dbname?sslmode=require
```

### 3. Start
```bash
corepack yarn prisma:generate
yarn dev
```

### 4. Verify
```bash
yarn typecheck
yarn build
npm run check:valkey
```

### 5. Apply Prisma migrations
```bash
corepack yarn prisma:migrate:deploy
```

## Testing flow

### Tippit V1
1. Connect creator wallet
2. Create a creator page
3. Open `/tip/[creatorSlug]` from another wallet
4. Send a private USDC tip via MagicBlock
5. Return to creator dashboard
6. Unlock private balance with wallet challenge login
7. Withdraw back to the public wallet

## Known limitations

- MagicBlock flows depend on valid API credentials/endpoints in your runtime environment
- Prisma migrations must be applied before Tippit creator/tip routes can persist data
- `snarkjs` causes a non-blocking webpack warning during build
- Next.js should still be upgraded to a patched version
