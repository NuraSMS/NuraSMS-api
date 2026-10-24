 # NuraSMS — Plain English Guide for Frontend

This explains, in simple terms, how the app works from the frontend's point of view: what to call, in what
order, and what you get back. For every tiny detail (every field, every error code), see `docs/USER_API.md` —
this file is just the "how the whole thing fits together" version.

**Base URL:** everything below starts with `http://localhost:4000/api` (swap the domain when it's live).

---

## The big picture

A user signs up, logs in, puts money in their wallet, picks a country + service (like "Facebook" or
"WhatsApp") + operator, buys a phone number with their wallet balance, waits for an SMS code to arrive, and
uses that code. That's it. Everything below is just the step-by-step of making that happen.

---

## 1. Signing up and logging in

**Sign up** — one-time, when someone creates an account:
```
POST /api/signup
{
  "username": "ikenna",
  "email": "user@example.com",
  "password": "at-least-8-characters",
  "firstName": "Ikenna",
  "lastName": "Example",
  "phoneNumber": "08012345678"
}
```
You get back a success message. That's it — now they log in.

**Log in** — every time someone opens the app:
```
POST /api/login
{
  "identifier": "user@example.com",   <- email OR username, either works
  "password": "..."
}
```
You get back:
```json
{
  "user": { "username": "ikenna", "email": "...", "...": "..." },
  "accessToken": "eyJhbGciOi..."
}
```
**Save that `accessToken`.** Every single request after this (except the public ones below) needs it, sent as
a header:
```
Authorization: Bearer eyJhbGciOi...
```
Think of it like a wristband — you show it every time you want to do something that requires being logged in.
It stops working after 45 minutes, so if you suddenly start getting "token is not valid" errors, just log in
again to get a fresh one.

If login gives you a `403` saying the account is suspended — that's a real suspension, not a bug. Show the
user a "your account has been suspended, contact support" message instead of a generic error.

---

## 2. Letting the user pick a number to buy

This is a 3-step picker: **country → service → operator.** None of these three calls need the wristband
(they're public), because the user hasn't bought anything yet — they're just browsing.

### Step A — show a list of countries
```
GET /api/countries
```
This gives you a big object where every country is a key, like `"nigeria"`, `"usa"`, `"england"`. Each one
has a `text_en` field — that's the human-readable name to show on screen (e.g. "Nigeria"). The key itself
(`"nigeria"`) is what you send back in later steps — don't show that raw key to the user, just use it behind
the scenes.

### Step B — once they pick a country, show them the list of services
```
GET /api/prices?country=nigeria
```
This gives you every service available in that country — Facebook, WhatsApp, Telegram, whatever — each one
with a breakdown of prices per operator. You don't need to understand all of it yet; just show the user the
list of service names (the top-level keys) so they can pick one, like a menu.

### Step C — once they pick a service, show them the operator choices
```
GET /api/prices?country=nigeria&product=facebook
```
Now you get back something like this:
```json
{
  "prices": {
    "facebook": {
      "virtual2":  { "cost": 1300, "count": 0,      "rate": 0 },
      "virtual34": { "cost": 1300, "count": 336673, "rate": 15.75 },
      "virtual4":  { "cost": 1400, "count": 25000,  "rate": 19.59 }
    }
  }
}
```
Each key inside (`virtual2`, `virtual34`, `virtual4`) is an **option** the user can pick. For each one, show:
- **`cost`** — the price in Naira. This is exactly what they'll pay, nothing to calculate.
- **`count`** — how many numbers are actually available right now. **If this is `0`, that option is out of
  stock — don't let them pick it** (grey it out, or just hide it).
- **`rate`** — a rough "success rate" percentage, i.e. how often this option actually delivers the code.
  Higher is better. Sometimes this field is just missing — if so, show "no data" instead of a number, don't
  show "0%" (that would wrongly imply it always fails).

Whichever option the user taps, remember its key (e.g. `"virtual34"`) — that's the `operator` value you'll
send in the next step.

---

## 3. Making sure they have enough money

Before letting them buy, check their wallet:
```
GET /api/get-wallet-balance        (needs the wristband)
```
Returns `{ "balance": 5000, "isFrozen": false, ... }`. If `balance` is less than the `cost` from step 2C,
don't let them buy — tell them to fund their wallet first.

**How funding works:** there's no "pay with card right now" button today. Instead, each user gets their own
personal bank account number, and they top up by transferring money into it like paying anyone else:

```
POST /api/create-virtual-account    (needs the wristband, no body — call once per user, the first time)
GET  /api/get-virtual-account       (needs the wristband — call again later just to re-show the same details)
```
Both give you back an account number + bank name. Show that to the user with a "transfer money here to fund
your wallet" message. A few seconds after they transfer, their wallet balance updates automatically — you
don't have to do anything else, just maybe poll `/api/get-wallet-balance` for a bit after showing the transfer
screen so the UI updates once the money lands.

---

## 4. Buying the number

Now that they've picked country + service + operator, and have enough balance:
```
POST /api/buy/activation            (needs the wristband)
{
  "country": "nigeria",
  "product": "facebook",
  "operator": "virtual34"
}
```
You get back:
```json
{
  "order": { "id": 11631253, "phone": "+2347350690992", "status": "PENDING", "...": "..." },
  "amount": 1300
}
```
- **`order.phone`** — the phone number they now own. Show it to them.
- **`order.id`** — save this, you need it for the next step.
- **`amount`** — what got deducted from their wallet.
- **`order.status`** starts as `"PENDING"` — meaning "waiting for the SMS to arrive."

If something goes wrong here (not enough balance, number unavailable, etc.) you'll get an error message back
instead — show that message to the user as-is, it's already written to be user-friendly.

---

## 5. Waiting for the code

Keep asking 5sim if the code has arrived, every few seconds:
```
GET /api/order/<the order id from step 4>       (needs the wristband)
```
Keep checking `order.status`:
- `"PENDING"` → still waiting, check again in a few seconds.
- `"RECEIVED"` → the code is here! Look at `order.sms[0].code` — that's it, show it to the user.
- `"CANCELED"` / `"TIMEOUT"` / `"BANNED"` → something went wrong, number is dead, stop polling.
- `"FINISHED"` → all done.

Once they've got the code and used it successfully, you can (optionally) call:
```
POST /api/order/<orderId>/finish      (needs the wristband)
```
to mark it as done on 5sim's side. Not strictly required, but good practice.

If the user wants to cancel instead (gave up waiting, no code came):
```
POST /api/order/<orderId>/cancel      (needs the wristband)
```
This automatically refunds their wallet — you don't need to do anything extra for that.

---

## Cheat sheet

| What the user is doing | Call this | Needs login? |
|---|---|---|
| Creating an account | `POST /api/signup` | No |
| Logging in | `POST /api/login` | No |
| Browsing countries | `GET /api/countries` | No |
| Browsing services for a country | `GET /api/prices?country=X` | No |
| Browsing operators for a service | `GET /api/prices?country=X&product=Y` | No |
| Checking their wallet balance | `GET /api/get-wallet-balance` | Yes |
| Getting their top-up account number | `POST /api/create-virtual-account` (first time) / `GET /api/get-virtual-account` (after) | Yes |
| Buying a number | `POST /api/buy/activation` | Yes |
| Checking if the code has arrived | `GET /api/order/:orderId` | Yes |
| Marking an order done | `POST /api/order/:orderId/finish` | Yes |
| Cancelling an order (auto-refund) | `POST /api/order/:orderId/cancel` | Yes |
| Viewing past purchases/transactions | `GET /api/get-transactions` | Yes |

"Needs login" = send `Authorization: Bearer <accessToken>` on that request, or it'll be rejected.
