# Bug Report — P1 / P2 / P3 Issues

---

## 🔴 P1 Breakages (Critical)

### 1. No Async Error Handling in Controllers

Express does not catch async errors automatically — unhandled promise rejections will crash the server.

**Fix:** Wrap every async controller in `try/catch`.

```js
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    // ...handler logic
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

---

### 2. Mass Assignment — No Field Filtering on Update

Any logged-in user can update any user, including escalating their own role to `admin`, because `req.body` is passed directly to `findByIdAndUpdate` with zero field filtering.

```js
// VULNERABLE
const { id } = req.params;
const updates = req.body;
const user = await User.findByIdAndUpdate(id, updates, { new: true });
res.json({ message: 'User updated', user });
```

**Fix:** Whitelist allowed fields explicitly.

```js
// SAFE
const allowedFields = ['name', 'email', 'department'];
const updates = Object.fromEntries(
  Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
);
const user = await User.findByIdAndUpdate(id, updates, { new: true });
```

---

### 3. Missing `authorize('admin')` on Delete Route

The route comment says "admin only" but the `authorize('admin')` middleware is absent. Any authenticated user can delete or soft-delete any account, including other admins.

```js
// Missing authorization middleware
// DELETE /api/users/:id
// Soft delete user — admin only
router.delete('/:id', authenticate, userController.deleteUser);
```

**Fix:**

```js
// Add authorize middleware
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);
```

---

### 4. Missing `authenticate` Middleware on Report Route

`req.user` is `undefined` on an unauthenticated request. If a private report is accessed by an unauthenticated caller, `req.user.id` throws a runtime error. Additionally, if the report ID doesn't exist, `report.isPublic` crashes on `null`.

```js
// No authenticate middleware
router.get('/:id', reportController.getReportById);

const getReportById = async (req, res) => {
  const report = await Report.findById(req.params.id);
  // crashes if report is null OR req.user is undefined
  if (!report.isPublic && report.generatedBy !== req.user.id) {
    return res.status(403).json({ message: 'Access denied' });
  }
  res.json({ report });
};
```

**Fix:**

```js
// Add middleware + null checks
router.get('/:id', authenticate, reportController.getReportById);

const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (!report.isPublic && report.generatedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

---

### 5. Bearer Token Not Extracted from Authorization Header

The backend reads the raw `Authorization` header instead of splitting out the token.

```js
// Wrong
const token = req.headers.authorization;
```

**Fix:**

```js
// Correct
const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
```

---

### 6. Passwords Stored in Plaintext

The `pre('save')` hook only sets `updatedAt` — no hashing is applied. Passwords are also returned in API responses for `createUser`, `getUserById`, and `updateUser`.

```js
// No password hashing
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
```

**Fix:**

```js
// Hash on save
const bcrypt = require('bcrypt');

userSchema.pre('save', async function (next) {
  this.updatedAt = new Date();
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});
```

**Also:** Exclude the password field in all responses:

```js
const user = await User.findById(id).select('-password');
```

---

### 7. Sensitive Data Exposed to Any Authenticated User

Any authenticated user can call `GET /api/users/:id` and receive the full profile including plaintext password. Only the user themselves or an admin should be allowed.

```js
// No ownership check
router.get('/:id', authenticate, userController.getUserById);

const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ user }); // password included
};
```

**Fix:**

```js
// Restrict access + strip password
const getUserById = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

---

## 🟠 P2 Breakages (High Impact)

### 1. `managerId` Stored as String Instead of ObjectId

This breaks Mongoose population (`.populate('managerId')`).

```js
// Wrong
managerId: {
  type: String,
},
```

**Fix:**

```js
// Correct
managerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
},
```

---

### 2. `updatedAt` Not Updated on `findByIdAndUpdate`

The `pre('save')` hook does not run on `findByIdAndUpdate`, `findOneAndUpdate`, etc.

```js
// Only works on .save()
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});
```

**Fix:** Pass `updatedAt` explicitly or use a `pre('findOneAndUpdate')` hook.

```js
// Option A — inline
await User.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });

// Option B — schema hook
userSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});
```

---

### 3. Soft-Deleted Users Appear in Queries

Users are deactivated with `isActive: false`, but read queries don't filter them out.

```js
// Returns inactive users too
const users = await User.find(filter).sort(...).skip(...).limit(limit);
```

**Fix:** Always include `isActive: true` in read queries unless explicitly fetching inactive users.

```js
// Correct
const users = await User.find({ ...filter, isActive: true })
  .sort({ [sortBy]: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
```

---

### 4. `deleteReport` Has No Ownership Check

Any authenticated user can delete any report by ID — no ownership or role validation.

```js
// No ownership check
// DELETE /api/reports/:id
router.delete('/:id', authenticate, reportController.deleteReport);
```

**Fix:**

```js
// Check ownership or admin role
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Not found' });
    if (report.generatedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await report.deleteOne();
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

---

### 5. Deactivate Button Visible to Non-Admin Users

Non-admin users see and can click the Deactivate button even though the backend blocks them, causing a confusing UX error.

```jsx
// Only disabled for self, still visible to all
<button
  onClick={() => handleDelete(user._id)}
  className="btn-sm btn-danger"
  disabled={user._id === currentUser._id}
>
  Deactivate
</button>
```

**Fix:**

```jsx
// Render only for admins
{currentUser.role === 'admin' ? (
  <button
    onClick={() => handleDelete(user._id)}
    className="btn-sm btn-danger"
    disabled={user._id === currentUser._id}
  >
    Deactivate
  </button>
) : '-' }
```

---

### 6. Raw User Input Used in Regex Without Sanitization or `$options: 'i'`

Search is case-sensitive and potentially vulnerable to ReDoS.

```js
// No options, no sanitization
filter.$or = [
  { name: { $regex: search } },
  { email: { $regex: search } },
];
```

**Fix:**

```js
// Add case-insensitive flag
filter.$or = [
  { name: { $regex: search, $options: 'i' } },
  { email: { $regex: search, $options: 'i' } },
];
```

---

### 7. `getSummary` Loads Entire User Collection Into Memory

`User.find(filter)` fetches every document just to count by role — this will timeout at scale.

```js
// Loads all users into memory
const allUsers = await User.find(filter);
```

**Fix:** Use aggregation or `countDocuments` per role.

```js
// Efficient aggregation
const totalUsers = await User.countDocuments(filter);
const activeUsers = await User.countDocuments({ ...filter, isActive: true });
const roleCounts = await User.aggregate([
  { $match: filter },
  { $group: { _id: '$role', count: { $sum: 1 } } },
]);
```

---

## 🟡 P3 Breakages (Minor / Polish)

### 1. Search Fires on Every Keystroke

Every keypress triggers a network request.

```js
// No debounce
useEffect(() => {
  fetchUsers();
}, [search, roleFilter, page]);
```

**Fix:** Debounce the search input.

```js
// Debounced
useEffect(() => {
  const timer = setTimeout(() => fetchUsers(), 400);
  return () => clearTimeout(timer);
}, [search, roleFilter, page]);
```

---

### 2. `bulkDelete` Runs Sequentially — No Parallel Execution

Deletes run one-by-one; if one fails, the rest are skipped.

```js
// Sequential
for (const id of selectedUsers) {
  await fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  });
}
```

**Fix:** Use `Promise.allSettled` for parallel execution with partial failure handling.

```js
// Parallel with error handling
const results = await Promise.allSettled(
  selectedUsers.map(id =>
    fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: token } })
  )
);
const failed = results.filter(r => r.status === 'rejected');
if (failed.length) console.warn(`${failed.length} deletions failed`);
```

---

### 3. "Next" Button Not Disabled When No Users Exist

The disable condition is off — `page === totalPages` is `true` when there are 0 pages, but `totalPages` may be `0` while `page` is `1`.

```jsx
// Incorrect condition
<button
  onClick={() => setPage(page + 1)}
  disabled={page === totalPages}
>
  Next
</button>
```

**Fix:**

```jsx
// Correct condition
<button
  onClick={() => setPage(page + 1)}
  disabled={page >= totalPages || totalPages === 0}
>
  Next
</button>
```

---

### 4. Using `PUT` Instead of `PATCH` for Partial Updates

`PUT` implies full replacement. Use `PATCH` for partial updates.

```js
// Semantically incorrect
router.put('/:id', authenticate, userController.updateUser);
```

**Fix:**

```js
// 
router.patch('/:id', authenticate, userController.updateUser);
```

---

### 5. Missing HTTP Status Codes in Responses

All responses default to `200 OK` even on creation or specific error scenarios.

```js
// No status code
res.json({ message: 'User created', user });
```

**Fix:**

```js
// Explicit status codes
res.status(201).json({ message: 'User created', user }); // Created
res.status(400).json({ message: 'Bad request' });        // Validation error
res.status(401).json({ message: 'Unauthorized' });       // Auth failure
res.status(403).json({ message: 'Forbidden' });          // Authorization failure
res.status(404).json({ message: 'Not found' });          // Missing resource
```

---

## 🚢 Ship / Don't Ship Recommendation

> **❌ Do NOT ship.**

The system has critical P1 issues including missing error handling, security vulnerabilities (mass assignment, plaintext passwords, broken auth), and unauthenticated route access that can crash the server or break the demo.

Several P2 issues (data inconsistency from soft-delete gaps, poor UX, inefficient DB operations) further reduce reliability.

### Minimum Fixes Before Shipping

**Must Fix (P1):**
- Add `try/catch` error handling to all async controllers
- Secure reports API: add `authenticate` + restrict delete by ownership
- Hash passwords with bcrypt; strip `password` from all responses
- Add `authorize('admin')` to admin-only routes
- Fix Bearer token extraction

**High-Impact (P2):**
- Filter soft-deleted users with `isActive: true` in all read queries
- Restrict UI Deactivate button to admin users only
- Parallelize bulk delete with `Promise.allSettled`
- Sanitize regex input and add `$options: 'i'`
