# Auth Code Review — Finding List (P1 / P2 / P3)

---

## 🔴 P1 Breakages (Critical)

### 1. Passwords Stored & Compared as Plain Text
Passwords are stored and compared without hashing. If the DB leaks, all user accounts become accessible.

**Fix:** Hash passwords using `bcrypt`.

---

### 2. Tokens Have No Expiration
Stolen tokens work forever because no expiry is set on JWTs.

**Fix:** Add `expiresIn` when signing tokens.

```js
jwt.sign(payload, secret, { expiresIn: '7d' });
```

---

### 3. No `try-catch` in Controllers & Middleware
Invalid input can crash the server since there is no error handling wrapping the logic.

**Fix:** Wrap all async logic inside `try-catch` blocks.

---

### 4. No `return` After `next()`
Multiple responses can be sent because execution continues after `next()` is called.

**Fix:** Always use `return next()`.

```js
const authorize = (...roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      return next(); // return added
    }
    res.status(403).json({ message: 'Access denied' });
  };
};
```

---

### 5. Form Not Handling Submit Properly
The form does not use `onSubmit` and the button has `type="button"`, so pressing Enter won't submit the form.

**Fix:** Use `onSubmit` on the `<form>` tag and set `type="submit"` on the button.

---

### 6. API Response Exposes User's Password
The `login`, `register`, and `getMe` API responses include the user's password via `toSafeObject`, leaking sensitive data to the frontend.

**Fix:** Remove `password` from `toSafeObject`.

```js
// Before
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    password: this.password  //  must be removed
  };
};

// After — remove the password field entirely
```

---

### 7. Insecure Password Reset Flow
The `resetToken` is exposed in the API response and stored in plain text.

**Fix:** Hash the reset token before storing it and never expose it in the response.

---

### 8. Incorrect Bearer Token Extraction
The backend reads `req.headers.authorization` directly without extracting the actual token from the `Bearer <token>` format.

**Fix:**
```js
const token = req.headers.authorization?.split(' ')[1]; // extract token after "Bearer "
```

---

### 9. `changePassword` Doesn't Check if User Exists
The function directly compares the password without first verifying the user exists.

```js
// Problematic code
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);

  if (!user.comparePassword(currentPassword)) {  // crashes if user is null
    return res.status(400).json({ message: 'Current password incorrect' });
  }

  user.password = newPassword;
  await user.save();
};
```

**Fix:** Check `if (!user)` before accessing any user properties.

---

### 10. No User Existence Check Can Crash the Server
If a user is deleted, not checking for their existence before accessing their data will crash the server.

```js
//  No null check
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user: user.toSafeObject() }); // crashes if user is null
};

//  Fix
if (!user) return res.status(404).json({ message: 'User not found' });
```

---

## 🟡 P2 Breakages (Major)

### 1. `country` Field Has No Validation
The `country` field in `addressSchema` defaults to `'IN'` but has no format restriction.

**Fix:** Add `enum` or a `regex` validator.

---

### 2. No Input Validation on Frontend or Backend
Neither side validates incoming data, opening the door to bad or malicious input.

---

### 3. `loginAttempts` Field Is Never Used
The field exists in the schema but is never used to limit failed login attempts.

```js
user.loginAttempts = 0;
user.lastLogin = new Date();
await user.save();
```

**Fix:** Increment `loginAttempts` on failure and lock the account after a threshold.

---

### 4. `role` Field Is Not Restricted
Any value can be assigned to the `role` field.

**Fix:** Use an `enum` to restrict valid roles.

```js
role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' }
```

---

### 5. Form Submit Without `e.preventDefault()`
Changing to `type="submit"` without calling `e.preventDefault()` causes a browser reload and resets all React state.

**Fix:** Always call `e.preventDefault()` in the submit handler.

---

### 6. Refresh Token Mechanism Is Incomplete
Tokens are being verified without ever being issued, making the refresh endpoint unusable.

**Fix:** Properly issue, store, and securely handle refresh tokens.

---

### 7. No Rate Limiting on Auth Endpoints
`/login` and `/forgot-password` have no rate limiting, making them vulnerable to brute-force attacks.

**Fix:** Use `express-rate-limit` middleware.

```js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many attempts, please try again later.'
});

app.use('/api/auth', authLimiter);
```

---

### 8. Logout Doesn't Invalidate Token on Server
Logout only removes the token from the client. The token remains valid server-side, so a stolen token can still be used after logout.

**Fix:** Maintain a token blocklist (e.g., in Redis) and check it in the auth middleware.

---

## 🟢 P3 Breakages (Minor / Code Quality)

### 1. Incorrect HTTP Status Codes

- `200` returned for invalid credentials → **Fix:** Use `401 Unauthorized`
- `400` returned for duplicate email → **Fix:** Use `409 Conflict`

```js
// Wrong
if (!user || !user.comparePassword(password)) {
  return res.status(200).json({ message: 'Invalid credentials' });
}

// Correct
return res.status(401).json({ message: 'Invalid credentials' });

//  Wrong
const existingUser = await User.findOne({ email });
if (existingUser) {
  return res.status(400).json({ message: 'Email already registered' });
}

// Correct
return res.status(409).json({ message: 'Email already registered' });
```

---

### 2. Invalid Input Types in Forms
Input `type` is set to `"text"` instead of `"email"` or `"password"` where appropriate.

**Fix:** Use correct HTML input types for built-in browser validation.

---

### 3. `createdAt` Stored as String Instead of Date
The `createdAt` field is typed as `String`, losing date functionality.

**Fix:**
```js
createdAt: { type: Date, default: Date.now }
```

---

### 4. React Navigation Called During Render
Calling navigation logic directly during render can cause unexpected re-renders.

**Fix:** Wrap navigation calls inside `useEffect` so they run after the component mounts.

```js
useEffect(() => {
  if (isAuthenticated) navigate('/dashboard');
}, [isAuthenticated]);
```

---

### 5. Duplicated `jwt.sign()` Logic
The same `jwt.sign()` call is repeated in both `login` and `register` controllers, violating DRY principles.

**Fix:** Extract it into a reusable utility function.

```js
// utils/generateToken.js
export const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
```

---

## ⚠️ What Actually Breaks in Production If This Ships As-Is

If deployed without fixes, the system is **highly insecure**:

- **Plain-text passwords** + **exposed API data** put all user accounts at risk.
- An **insecure reset flow** allows unauthorized password changes.
- **Non-expiring JWTs** stored in `localStorage` enable long-term misuse if stolen.
- **No rate limiting** and **missing error handling** make the system vulnerable to brute-force attacks and server crashes.

> **This code is not safe for production in its current state.**