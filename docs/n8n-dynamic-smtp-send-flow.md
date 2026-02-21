# n8n: Dynamic SMTP send (no-code, nodes only)

Your webhook receives **dynamic** SMTP (host, port, user, password, fromEmail) and **prospects** (to, subject, body). The built-in **Send Email** node normally uses static credentials, but n8n lets you use **expressions** in the credential fields so each request can use the SMTP from the webhook. No custom code and no external gateway.

---

## Webhook payload shape (what your app sends)

```json
{
  "smtp": {
    "host": "mail.privateemail.com",
    "port": 465,
    "secure": true,
    "user": "nick@xyz.dev",
    "password": "xxxxxxxxxxx",
    "fromEmail": "Nick"
  },
  "prospects": [
    {
      "leadId": "...",
      "email": "recipient@example.com",
      "subject": "Quick question – Nick",
      "body": "Hi ..."
    }
  ]
}
```

---

## n8n workflow (nodes only)

### 1. Webhook

- **Node:** Webhook  
- **HTTP Method:** POST  
- **Path:** e.g. `agentible-send-mail` (your current path)  
- **Response Mode:** When Last Node Finishes (so you respond after all emails are sent)  
- **Output:** One item with `body` = the JSON above (with `smtp` and `prospects`).

---

### 2. Split prospects into one item per email

You need one workflow item per prospect, so you can loop and send one email per item.

- **Node:** **Item Lists** (or **Split Out**, depending on your n8n version)  
  - **Operation:** “Split Out Items” / “Split Items”  
  - **Field to Split Out:** the array of prospects  

If your Webhook puts the payload in `body`:

- **Field to Split Out:** `{{ $json.body.prospects }}`  

**Result:** Multiple items; each item is one prospect object: `leadId`, `email`, `subject`, `body`.  
You still need to attach `smtp` to each item (next step).

---

### 3. Attach SMTP to each item

Each item must carry both one prospect and the same `smtp` so the Send Email node can read everything from the current item.

- **Node:** **Set** (or **Edit Fields**)  
- **Mode:** “Manual Mapping” / “Add or update fields”  
- Add one field:
  - **Name:** `smtp`  
  - **Value (expression):**  
    `{{ $('Webhook').first().json.body.smtp }}`  
    (Reference the Webhook node by the name you gave it; `first()` gets the single webhook item.)

**Result:** Each item now has:  
`leadId`, `email`, `subject`, `body`, and `smtp` (host, port, secure, user, password, fromEmail).

---

### 4. Send Email (dynamic SMTP from current item)

- **Node:** **Send Email**  
- **Operation:** Send  

**Credential (dynamic):**  
Create one “Send Email” credential and use **expressions** for every SMTP field so they come from the current item’s `smtp`:

- **Host:** `{{ $json.smtp.host }}`  
- **User:** `{{ $json.smtp.user }}`  
- **Password:** `{{ $json.smtp.password }}`  
- **Port:** `{{ $json.smtp.port }}`  
- **SSL/TLS:** `{{ $json.smtp.secure }}`  

(If your n8n credential has “Disable STARTTLS”, set it according to your provider; for port 465 with `secure: true`, SSL is usually on, STARTTLS off.)

**Message fields (also from current item):**

- **From Email:**  
  `{{ $json.smtp.fromEmail }} <{{ $json.smtp.user }}>`  
  (or only `{{ $json.smtp.fromEmail }}` if your provider accepts that)
- **To Email:** `{{ $json.email }}`  
- **Subject:** `{{ $json.subject }}`  
- **Email Format:** Text (or HTML if you store HTML in `body`)  
- **Message / Text:** `{{ $json.body }}`  

**Options:**

- Turn off “Append n8n Attribution” if you don’t want the n8n footer.

**Result:** One email sent per item, each using that item’s SMTP and prospect data.

---

### 5. (Optional) Collect results and respond to webhook

If you want to return a summary to your app:

- **Node:** **Respond to Webhook**  
- **Respond With:** JSON  
- **Response Body:** e.g.  
  `{{ { ok: true, sent: $items().length } }}`  
  or build an array of `{ leadId, email, status: 'sent' }` from the Send Email output if you need per-recipient status.

Make sure the Webhook node is configured to “Respond When: Last Node Finishes” so this response is sent after the loop finishes.

---

## Flow summary

```
Webhook (POST)
  → Item Lists / Split Out (split body.prospects)
  → Set (add smtp from Webhook to each item)
  → Send Email (credential + From/To/Subject/Body from expressions)
  → Respond to Webhook (optional)
```

---

## Enabling expressions in the Send Email credential

1. In the Send Email node, open the credential (create new or edit existing).  
2. For each field (Host, User, Password, Port, SSL/TLS), use the **expression** toggle (often a “fx” or “Expression” switch).  
3. Enter the expressions above (e.g. `{{ $json.smtp.host }}`).  
4. Save the credential.

The credential is still “one” credential in n8n; at runtime each field is evaluated from the **current item** in the loop, so each request uses the SMTP from the webhook.

---

## If expressions are not available in your Send Email credential

Some n8n versions or deployments restrict expressions in credentials. In that case you have two options:

1. **Upgrade or enable dynamic credentials** (see n8n docs / “Set credentials dynamically using expressions”).  
2. **Use an HTTP gateway:** a small endpoint that accepts `{ smtp, to, subject, body }` and sends one email (e.g. with nodemailer). Then in n8n: same Webhook → Split → Set (smtp) → **HTTP Request** (POST to that gateway with `$json`) instead of Send Email. The workflow stays no-code; only the gateway is code.

For most recent n8n versions, the node-based approach above (with expressions in the Send Email credential) is enough to pass dynamic SMTP and deliver each message to the recipient’s inbox.
