# Day 2 — "The Sprint"

## Your Scenario

The Velox engineering team shipped a **user management and reporting system** over the weekend. There's a demo with the client in **3 hours**.

Your manager needs a clear answer: **Ship or Don't Ship?**

Some of this code might look suspicious but actually be fine. Some things that look fine might be critically broken. Be precise — you're making a real recommendation.

---

## Files to Review

```
models/User.js                   Extended user schema
models/Report.js                 Report storage model
routes/users.js                  User management endpoints
routes/reports.js                Reporting endpoints
controllers/userController.js    All management + reporting logic
client/UsersTable.jsx            React admin table UI
```

---

## Your Deliverable

1. **Findings list** — every issue with P1/P2/P3 tags
2. **Ship / Don't Ship recommendation** — one paragraph with clear justification
   - If Don't Ship: what are the absolute minimum fixes to make it shippable?
   - If Ship: what must be fixed in the next sprint?

---

## Time

Full day. Take your time on the controller — it is the most complex file.

---

## Watch out

Some code in this codebase looks wrong but is intentionally correct. Flagging correct code costs you points. Be confident in what you flag.
