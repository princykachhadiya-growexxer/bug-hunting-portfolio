# Day 1 — "The Onboarding"

## Your Scenario

You just joined **Velox**, a fintech startup building a payments SaaS platform. The previous backend developer left suddenly last week. The team is going live with the auth system **tomorrow morning**.

Your manager has asked you to review the entire auth codebase before it goes to production. No one has reviewed it since the AI assistant wrote it two weeks ago.

**Your job: Find everything that could go wrong before it ships.**

---

## Files to Review

```
models/User.js                  User schema and instance methods
middleware/auth.js              JWT authentication and authorization middleware
routes/auth.js                  Auth route definitions
controllers/authController.js   All auth business logic
client/AuthContext.jsx          React auth state management
client/LoginPage.jsx            Login UI component
```

Read all files. Issues are spread across the codebase and some connect across files.

---

## Your Deliverable

Submit a written review with:

1. **Findings list** — every issue you found, tagged P1 / P2 / P3
   - P1 = must fix before going live (security, crash, data loss)
   - P2 = should fix soon (incorrect behaviour, bad practice)
   - P3 = nice to fix (code quality, minor improvements)

2. **Business impact paragraph** — in plain English, what actually breaks or gets exploited if this ships as-is?

---

## Time

No time limit today. Take the full session. Read carefully.

---

## Scoring

You are scored on:
- Issues found (weighted by severity — basic / medium / advanced)
- Quality of your explanation (do you understand *why* it's wrong?)
- Prioritization accuracy (did your P1s match the real critical issues?)
- Business impact statement (did you articulate real consequences?)
- False positives (flagging things that are actually correct costs points)
