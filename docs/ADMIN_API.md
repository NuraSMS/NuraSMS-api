# NuraSMS Admin API

Base URL: `{{API_BASE_URL}}/api/admin` (e.g. `http://localhost:4000/api/admin`)

All admin data lives in its own Mongoose schema/collection (`Admin`, `AdminSettings`), completely separate from the
`User` collection — admin accounts are not users and can't log into the regular `/api` auth endpoints, and vice versa.

## Conventions

- All request/response bodies are JSON. Send `Content-Type: application/json`.
- All authenticated routes require an `Authorization: Bearer <accessToken>` header. The token is returned from login.
- Access tokens expire after **45 minutes**. There is no admin refresh endpoint yet — re-login when it expires
  (a `refresh` endpoint can be added later using the `adminRefreshToken` cookie that login already sets).
- List endpoints are paginated and accept `?page=1&limit=20`, returning:
  ```json
  {
    "data": [ /* ... */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 134,
      "totalPages": 7,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- Error responses are always `{ "message": "..." }` with a non-2xx status code.
- Two admin roles exist: `admin` and `superadmin`. A few destructive actions (deleting a user, overriding a
  transaction's status, changing platform settings) require `superadmin`. Everything else just requires a valid
  admin session.

---

## 0. One-time setup: creating your admin account

`POST /api/admin/auth/register` is a **temporary** endpoint for bootstrapping admin accounts. It's guarded by a
setup key so it isn't a public signup route while it's live, but you should still delete it once you're done
registering whoever needs admin access.

1. Call the register endpoint (see below) once per admin you need, using the `ADMIN_SETUP_KEY` value from `.env`.
2. When finished, delete this line from `routes/admin/adminAuthRoute.js`:
   ```js
   router.post("/register", registerAdmin);
   ```
   (You can also delete `controllers/admin/auth/AdminRegisterController.js` and the `ADMIN_SETUP_KEY` env var at
   that point — login no longer needs them.)

### `POST /api/admin/auth/register`

**Headers:** `x-admin-setup-key: <ADMIN_SETUP_KEY from .env>`

**Body:**
```json
{
  "name": "Ikenna",
  "email": "admin@nurasms.com",
  "password": "at-least-8-characters",
  "role": "superadmin"
}
```
`role` is optional, defaults to `"admin"`. Valid values: `"admin" | "superadmin"`.

**Response `201`:**
```json
{ "message": "Admin registered successfully", "adminId": "..." }
```

**Errors:** `400` missing/invalid fields · `403` missing/wrong setup key · `409` email already registered.

---

## 1. Admin Auth

### `POST /api/admin/auth/login`
**Body:** `{ "email": "admin@nurasms.com", "password": "..." }`

**Response `200`:**
```json
{
  "message": "Login successful",
  "admin": {
    "_id": "...",
    "name": "Ikenna",
    "email": "admin@nurasms.com",
    "role": "superadmin",
    "isActive": true,
    "lastLoginAt": "2026-10-03T12:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "accessToken": "eyJ..."
}
```
Also sets an httpOnly `adminRefreshToken` cookie (7 days). Store `accessToken` in memory and send it as
`Authorization: Bearer <accessToken>` on every subsequent request.

**Errors:** `400` missing fields · `401` invalid credentials · `403` admin deactivated.

### `GET /api/admin/auth/me` — 🔒 admin
Returns the logged-in admin's profile.
**Response `200`:** `{ "admin": { ...same shape as above... } }`

### `POST /api/admin/auth/logout` — 🔒 admin
Clears the refresh cookie and invalidates the stored refresh token server-side.
**Response `200`:** `{ "message": "Logged out successfully" }`

---

## 2. Dashboard

### `GET /api/admin/dashboard/stats` — 🔒 admin
One call to populate the admin home page.

**Response `200`:**
```json
{
  "users": { "total": 134, "suspended": 2, "active": 132 },
  "wallets": { "totalBalance": 4820500, "frozen": 1 },
  "transactions": {
    "totalCredited": 9000000,
    "totalDebited": 4200000,
    "creditCount": 310,
    "debitCount": 288
  },
  "virtualAccounts": { "total": 97 },
  "recent": {
    "users": [ { "username": "...", "email": "...", "firstName": "...", "lastName": "...", "createdAt": "..." } ],
    "transactions": [ { "...transaction fields...", "user": { "username": "...", "email": "..." } } ]
  }
}
```
`transactions.totalCredited` / `totalDebited` only sum `status: "success"` transactions.

---

## 3. Users

### `GET /api/admin/users` — 🔒 admin
**Query params:** `page`, `limit`, `search` (matches username/email/phone/first/last name), `isSuspended` (`true`/`false`)

**Response `200`:** paginated list of users (password/tokens stripped).

### `GET /api/admin/users/:id` — 🔒 admin
**Response `200`:**
```json
{
  "user": { /* user fields, no password */ },
  "wallet": { "balance": 5000, "isFrozen": false, "...": "..." },
  "virtualAccount": { "customer": {}, "dedicatedAccount": {}, "...": "..." }
}
```
`wallet`/`virtualAccount` are `null` if the user hasn't got one yet.

### `PATCH /api/admin/users/:id` — 🔒 admin
**Body (any subset):** `{ "firstName", "lastName", "email", "phoneNumber", "username" }`
**Response `200`:** `{ "message": "User updated", "user": { ... } }`
**Errors:** `404` not found · `409` email/username/phone already in use.

### `DELETE /api/admin/users/:id` — 🔒 superadmin
Permanently deletes the user document. Their wallet, transactions, and virtual account records are **not**
cascade-deleted (kept for audit trail) — delete those separately if needed.
**Response `200`:** `{ "message": "User deleted" }`

### `POST /api/admin/users/:id/suspend` — 🔒 admin
**Body:** `{ "reason": "optional free text" }`
Suspended users get `403 "This account has been suspended"` when they try to log in on the regular `/api/login`.
**Response `200`:** `{ "message": "User suspended", "user": { ... } }`

### `POST /api/admin/users/:id/unsuspend` — 🔒 admin
**Response `200`:** `{ "message": "User unsuspended", "user": { ... } }`

---

## 4. Wallets

### `GET /api/admin/wallets` — 🔒 admin
**Query params:** `page`, `limit`, `isFrozen` (`true`/`false`). Sorted by balance, highest first.
**Response `200`:** paginated list, each wallet's `user` field populated with `username, email, firstName, lastName`.

### `GET /api/admin/wallets/:userId` — 🔒 admin
Look up by **user ID**, not wallet ID.
**Response `200`:** `{ "wallet": { ... } }`

### `POST /api/admin/wallets/:userId/credit` — 🔒 admin
Manual top-up. Goes through the same ledgered `creditWallet` service transactions use, so it shows up correctly
in the user's transaction history (`source: "ADMIN"`).
**Body:** `{ "amount": 5000, "reason": "Goodwill credit after support ticket #42" }`
**Response `200`:** `{ "message": "Wallet credited", "wallet": { ... } }`
**Errors:** `400` amount missing/≤0.

### `POST /api/admin/wallets/:userId/debit` — 🔒 admin
**Body:** `{ "amount": 1000, "reason": "Chargeback correction" }`
**Response `200`:** `{ "message": "Wallet debited", "success": true, "previousBalance": 6000, "currentBalance": 5000 }`
**Errors:** `400` amount missing/≤0, insufficient balance, or wallet frozen.

### `POST /api/admin/wallets/:userId/freeze` — 🔒 admin
Blocks the user from any further debits (purchases) until unfrozen.
**Response `200`:** `{ "message": "Wallet frozen", "wallet": { ... } }`

### `POST /api/admin/wallets/:userId/unfreeze` — 🔒 admin
**Response `200`:** `{ "message": "Wallet unfrozen", "wallet": { ... } }`

---

## 5. Transactions

### `GET /api/admin/transactions` — 🔒 admin
**Query params:** `page`, `limit`, `user` (user ID), `type` (`credit`/`debit`), `status` (`pending`/`success`/`failed`),
`from`, `to` (ISO date strings, filters on `createdAt`).
**Response `200`:** paginated list, `user` field populated with `username, email`.

### `GET /api/admin/transactions/:id` — 🔒 admin
**Response `200`:** `{ "transaction": { ... } }`

### `PATCH /api/admin/transactions/:id/status` — 🔒 superadmin
Manual override for reconciliation (e.g. a webhook that never landed).
**Body:** `{ "status": "success" }` (`pending` | `success` | `failed`)
**Response `200`:** `{ "message": "Transaction updated", "transaction": { ... } }`

---

## 6. Virtual Accounts

### `GET /api/admin/virtual-accounts` — 🔒 admin
**Query params:** `page`, `limit`.
**Response `200`:** paginated list, `user` populated.

### `GET /api/admin/virtual-accounts/:userId` — 🔒 admin
Look up by **user ID**.
**Response `200`:** `{ "account": { ... } }`
**Errors:** `404` user has no virtual account.

---

## 7. 5sim (SMS numbers / orders)

These proxy the 5sim provider, scoped for platform-wide (not per-user) visibility.

### `GET /api/admin/fivesim/balance` — 🔒 admin
Platform's balance with the 5sim provider (how much credit you have left to buy numbers with).

### `GET /api/admin/fivesim/profile` — 🔒 admin
Platform's 5sim account profile.

### `GET /api/admin/fivesim/orders` — 🔒 admin
Orders aren't stored as their own collection — this reconstructs the list from the debit transactions created when
a user buys an activation number.
**Query params:** `page`, `limit`, `user` (user ID), `country`, `product`.
**Response `200`:** paginated list of transactions (each has `meta.orderId`, `meta.country`, `meta.product`,
`meta.operator`), `user` populated.

### `GET /api/admin/fivesim/orders/:orderId` — 🔒 admin
Live status check against the provider.
**Response `200`:** `{ "order": { ... 5sim order object ... } }`

### `POST /api/admin/fivesim/orders/:orderId/finish` — 🔒 admin
### `POST /api/admin/fivesim/orders/:orderId/cancel` — 🔒 admin
### `POST /api/admin/fivesim/orders/:orderId/ban` — 🔒 admin
Each returns `{ "message": "...", "order": { ... } }`. Unlike the user-facing `/api/order/:orderId/cancel` route,
these do **not** automatically refund the user's wallet — do that via the wallet credit endpoint if needed.

---

## 8. Platform Settings

Stored in their own `AdminSettings` collection (one document, falls back to `.env` values when unset), so markup
and FX rate can be tuned live without a redeploy. This directly affects the price shown to users on
`GET /api/products/:country` and what they're charged on purchase.

### `GET /api/admin/settings` — 🔒 admin
**Response `200`:**
```json
{
  "settings": {
    "markupAmount": 1100,
    "usdNgnRate": 1347,
    "fivesimOperator": "virtual8"
  }
}
```

### `PATCH /api/admin/settings` — 🔒 superadmin
**Body (any subset):** `{ "markupAmount": 1200, "usdNgnRate": 1400, "fivesimOperator": "any" }`
**Response `200`:** `{ "message": "Settings updated", "settings": { ... } }`
**Errors:** `400` `markupAmount` negative or `usdNgnRate` ≤ 0.

---

## Route summary

| Method | Path | Auth |
|---|---|---|
| POST | /api/admin/auth/register | setup key (temporary) |
| POST | /api/admin/auth/login | none |
| GET | /api/admin/auth/me | admin |
| POST | /api/admin/auth/logout | admin |
| GET | /api/admin/dashboard/stats | admin |
| GET | /api/admin/users | admin |
| GET | /api/admin/users/:id | admin |
| PATCH | /api/admin/users/:id | admin |
| DELETE | /api/admin/users/:id | superadmin |
| POST | /api/admin/users/:id/suspend | admin |
| POST | /api/admin/users/:id/unsuspend | admin |
| GET | /api/admin/wallets | admin |
| GET | /api/admin/wallets/:userId | admin |
| POST | /api/admin/wallets/:userId/credit | admin |
| POST | /api/admin/wallets/:userId/debit | admin |
| POST | /api/admin/wallets/:userId/freeze | admin |
| POST | /api/admin/wallets/:userId/unfreeze | admin |
| GET | /api/admin/transactions | admin |
| GET | /api/admin/transactions/:id | admin |
| PATCH | /api/admin/transactions/:id/status | superadmin |
| GET | /api/admin/virtual-accounts | admin |
| GET | /api/admin/virtual-accounts/:userId | admin |
| GET | /api/admin/fivesim/balance | admin |
| GET | /api/admin/fivesim/profile | admin |
| GET | /api/admin/fivesim/orders | admin |
| GET | /api/admin/fivesim/orders/:orderId | admin |
| POST | /api/admin/fivesim/orders/:orderId/finish | admin |
| POST | /api/admin/fivesim/orders/:orderId/cancel | admin |
| POST | /api/admin/fivesim/orders/:orderId/ban | admin |
| GET | /api/admin/settings | admin |
| PATCH | /api/admin/settings | superadmin |
