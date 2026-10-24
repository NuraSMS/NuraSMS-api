# NuraSMS User API

Base URL: `{{API_BASE_URL}}/api` (e.g. `http://localhost:4000/api`)

This is the public/user-facing API — what the main app frontend talks to. (The separate admin panel API lives at
`/api/admin` and is documented in `docs/ADMIN_API.md`.)

## Conventions

- All request/response bodies are JSON. Send `Content-Type: application/json`.
- Authenticated routes require `Authorization: Bearer <accessToken>`. You get `accessToken` from login.
- Access tokens expire after **45 minutes**. Login also sets an httpOnly `refreshToken` cookie (7 days) for future
  use — there's no `/refresh` endpoint wired up yet, so for now just re-login when the access token expires.
- Error responses are always `{ "message": "..." }` with a non-2xx status.
- Money amounts are always in **NGN** (Naira) unless stated otherwise.

---

## 1. Auth

### `POST /api/signup`
**Body:**
```json
{
  "username": "ikenna",
  "email": "user@example.com",
  "password": "at-least-8-characters",
  "firstName": "Ikenna",
  "lastName": "Example",
  "phoneNumber": "08012345678"
}
```
All fields required. `username` must be ≥3 chars, lowercase letters/numbers/underscores only (it's lowercased for
you, so send it however, but duplicates are checked lowercase).

**Response `201`:** `{ "message": "Registration successful", "userId": "..." }`
**Errors:** `400` validation · `409` username/email/phone already taken.

### `POST /api/login`
**Body:** `{ "identifier": "user@example.com", "password": "..." }` — `identifier` can be email **or** username.

**Response `200`:**
```json
{
  "message": "Login successful",
  "user": { "_id": "...", "username": "...", "email": "...", "firstName": "...", "lastName": "...", "phoneNumber": "...", "isSuspended": false, "createdAt": "...", "updatedAt": "..." },
  "accessToken": "eyJ..."
}
```
Also sets the httpOnly `refreshToken` cookie.

**Errors:**
- `400` missing identifier/password
- `401` invalid credentials
- `403 { "message": "This account has been suspended" }` — **new**: handle this distinctly if you want a dedicated
  "your account is suspended, contact support" message instead of a generic login error.

### `POST /api/forgot-password`
**Body:** `{ "email": "user@example.com" }`
Always responds `200` with a generic message regardless of whether the email exists (prevents account enumeration):
`{ "message": "If an account exists with this email, a password reset link has been sent." }`
If the account exists, an email is sent (via Resend) containing a reset link/token.

### `POST /api/reset-password`
**Body:** `{ "token": "<token from the email link>", "password": "new-password-min-8-chars" }`
**Response `200`:** `{ "message": "Password reset successful" }`
**Errors:** `400` missing fields, weak password, or invalid/expired token (tokens expire 1 hour after request).

---

## 2. Buying a number (5sim)

This is a three-step picker (country → service → operator) followed by a purchase call. All the lookup endpoints
below are **public** (no auth needed); only the buy/order-management endpoints require login.

Prices returned anywhere in this section are already converted from 5sim's USD cost to NGN and include your
platform markup — they're exactly what the customer should see and be charged.

### `GET /api/countries`
**Response `200`:** `{ "countries": { "<country>": { "iso": {...}, "prefix": {...}, "text_en": "Nigeria", ... } } }`
One entry per country, keyed by the 5sim country slug (e.g. `"nigeria"`). Use `text_en` as the display label and
the key as the value you send back in later calls. (The `virtualNN` keys inside each country just indicate an
operator *exists* there — no price or stock info, so don't use this response for anything but the country list.)

### `GET /api/prices`
**Query params (send at least one):** `country`, `product`
Drives the service + operator picker. Response is `{ "prices": { ... } }`, shape depends on which params you pass:

- `?country=nigeria` → `{ "<product>": { "<operator>": { cost, count, rate, currency } } }` — every service
  available in that country.
- `?product=facebook` → `{ "<country>": { "<operator>": {...} } }` — that service across every country.
- `?country=nigeria&product=facebook` → `{ "<operator>": {...} }` nested one level — just the operators for that
  one country+service pair (what you want once the user has picked both country and service).

Example, `GET /api/prices?country=nigeria&product=facebook`:
```json
{
  "prices": {
    "facebook": {
      "virtual2":  { "cost": 1300, "count": 0,      "rate": 0,     "currency": "NGN" },
      "virtual34": { "cost": 1300, "count": 341784, "rate": 15.6,  "currency": "NGN" },
      "virtual4":  { "cost": 1400, "count": 25000,  "rate": 16.36, "currency": "NGN" }
    }
  }
}
```
Field meanings:
- `cost` — price to charge the customer, in NGN.
- `count` — numbers currently in stock for that operator. **`0` means out of stock right now** — grey it out,
  don't let the user select it.
- `rate` — delivery success percentage. **Can be missing entirely** (5sim omits it when there's too little data,
  below ~20% history) — render that as "no data yet", don't assume it's always a number.
- `currency` — always `"NGN"`.

**Suggested flow:** call `?country=X` once the country is picked to populate the service list (the top-level keys),
optionally showing a "from ₦N" price hint per service using the cheapest in-stock operator. Once a service is
picked, either reuse that same payload client-side or call `?country=X&product=Y` to re-fetch just that service's
operators fresh (recommended if there's any delay before purchase, since `count` changes in real time).

**Errors:** `400` if neither `country` nor `product` is provided.

### `GET /api/products/:country?operator=any`
Lower-level endpoint, mostly superseded by `/api/prices` for the picker UI — still useful if you already know the
exact operator and just want that operator's product list. `operator` is optional (defaults to the platform's
configured default). Response: `{ "products": { "<product>": { "Category", "Qty", "Price": cost, "currency" } } }`.

### `POST /api/buy/activation` — 🔒 auth required
**Body:**
```json
{ "country": "nigeria", "product": "facebook", "operator": "virtual34" }
```
`operator` is optional — omit it to let the platform pick its configured default (not recommended now that you
have the picker; always send the operator the user chose).

**Response `200`:**
```json
{
  "message": "Activation number purchased successfully",
  "order": {
    "id": 11631253,
    "phone": "+2347350690992",
    "operator": "virtual34",
    "product": "facebook",
    "price": 21,
    "status": "PENDING",
    "expires": "2026-10-22T08:28:38.000Z",
    "sms": null,
    "country": "nigeria"
  },
  "amount": 1300
}
```
`amount` is what was actually debited from the wallet (NGN). `order.status` starts `"PENDING"` — poll
`GET /api/order/:orderId` until an SMS arrives.

**Errors:** `400` missing country/product · `401` not logged in · `404` product not available · `500` insufficient
balance / wallet frozen / purchase failed (wallet is auto-refunded if the 5sim purchase itself fails after the
debit succeeded).

### `POST /api/buy/hosting` — 🔒 auth required
Same body shape as activation (`country`, `product`, `operator`), for long-term rented numbers instead of one-time
activation codes. **Note:** unlike activation, this does not currently charge the user's wallet — it calls 5sim
directly. Flag this to your backend dev if that's not intentional before shipping it in the UI.

---

## 3. Order management — 🔒 all require auth

### `GET /api/order/:orderId`
Checks live status + any received SMS. **Response `200`:**
```json
{
  "order": {
    "id": 11631253, "phone": "+2347350690992", "product": "facebook",
    "price": 21, "status": "RECEIVED",
    "sms": [{ "sender": "Facebook", "text": "Facebook: 09363 - use this code...", "code": "09363", "date": "..." }],
    "expires": "...", "country": "nigeria"
  }
}
```
`status` values: `PENDING` (waiting), `RECEIVED` (code arrived — check `sms[0].code`), `CANCELED`, `TIMEOUT`,
`FINISHED`, `BANNED`. Poll this every few seconds while `status` is `PENDING`.

### `POST /api/order/:orderId/finish`
Marks the order complete (you got your code, you're done with the number). **Response `200`:** `{ "message": "...", "order": {...} }`

### `POST /api/order/:orderId/cancel`
Cancels the order **and automatically refunds the wallet** for the original purchase amount. Only works if you
still own a matching debit transaction for that order (i.e. you can't cancel someone else's order). 5sim also
restricts cancellation — you generally can't cancel once an SMS has already arrived.
**Response `200`:** `{ "message": "Order cancelled and amount refunded successfully", "order": {...}, "amount": 1300 }`

### `POST /api/order/:orderId/ban`
Reports the number as already-used/bad to 5sim (no refund). Use sparingly — only when the number itself was
clearly unusable, not as a general cancel.

### `GET /api/order/:orderId/inbox`
Full SMS inbox for **rented (hosting)** numbers only — doesn't work for one-time activation numbers.
**Response `200`:** `{ "inbox": { "Data": [ { "sender", "text", "code", "date" } ], "Total": 1 } }`

---

## 4. Wallet — 🔒 all require auth

### `GET /api/get-wallet-balance`
**Response `200`:** `{ "_id": "...", "user": "...", "balance": 5000, "isFrozen": false, "createdAt": "...", "updatedAt": "..." }`
**Errors:** `404` if the user has no wallet yet (shouldn't normally happen — a wallet is created on first credit).

### `GET /api/get-transactions?page=1&limit=20`
Paginated history of the logged-in user's own transactions.
**Response `200`:**
```json
{
  "data": [
    { "_id": "...", "type": "debit", "amount": 1300, "status": "success", "reference": "5SIM-ACT-...", "meta": { "service": "5sim_activation", "country": "nigeria", "product": "facebook", "operator": "virtual34" }, "previousBalance": 6300, "currentBalance": 5000, "createdAt": "..." }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 14, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
}
```
`type` is `"credit"` (wallet funded) or `"debit"` (number purchased / manual deduction). `status` is
`"pending" | "success" | "failed"`.

### Funding the wallet
There's no "pay now" endpoint — funding works by bank transfer into the user's own dedicated account number:

#### `POST /api/create-virtual-account`
Creates (once) a personal Nigerian bank account number for the user via Paystack. Call this the first time a user
wants to fund their wallet.
**Response `200`:** `{ "account": { "customer": {...}, "dedicated_account": { "account_number": "...", "bank": { "name": "..." }, ... } } }`

#### `GET /api/get-virtual-account`
Fetches the account created above, for displaying "transfer to this account" details again later.
**Response `200`:** `{ "_id": "...", "user": "...", "customer": {...}, "dedicatedAccount": { "account_number": "...", "bank": {...} } }`
**Errors:** `404` if the user hasn't created one yet — prompt them to call `create-virtual-account` first.

**Flow:** show the user the account number + bank name from either call → they transfer money into it from any
banking app → Paystack notifies the backend via webhook → the wallet balance updates automatically (usually within
seconds). Poll `GET /api/get-wallet-balance` after showing the transfer details, or just let the user refresh.

---

## Route summary

| Method | Path | Auth |
|---|---|---|
| POST | /api/signup | none |
| POST | /api/login | none |
| POST | /api/forgot-password | none |
| POST | /api/reset-password | none |
| GET | /api/countries | none |
| GET | /api/prices | none |
| GET | /api/products/:country | none |
| POST | /api/buy/activation | user |
| POST | /api/buy/hosting | user |
| GET | /api/order/:orderId | user |
| POST | /api/order/:orderId/finish | user |
| POST | /api/order/:orderId/cancel | user |
| POST | /api/order/:orderId/ban | user |
| GET | /api/order/:orderId/inbox | user |
| GET | /api/get-wallet-balance | user |
| GET | /api/get-transactions | user |
| POST | /api/create-virtual-account | user |
| GET | /api/get-virtual-account | user |
