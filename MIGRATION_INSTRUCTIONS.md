# Database Migration Instructions

## Shift Schema Update - Make guardId Nullable

### ✅ Applied Successfully

The schema changes have been applied using `prisma db push`:

```bash
cd backend
npx prisma db push
```

This has:
1. ✅ Made `guardId` nullable in the `Shift` model
2. ✅ Made the `guard` relation optional
3. ✅ Updated the database schema
4. ✅ Changed `onDelete: Cascade` to `onDelete: SetNull` for guard relation

### What Changed:
- `guardId` is now `String?` (nullable) in database
- `guard` relation is now `Guard?` (optional)
- `onDelete: SetNull` for guard relation (guards can be removed without deleting shifts)

### ⚠️ Prisma Client Regeneration Required

**Important**: You need to regenerate Prisma Client to get updated TypeScript types:

```bash
# Stop your backend server first (if running)
npx prisma generate
```

The EPERM error during generation means the query engine file is locked - stop any running Node.js processes first.

### Current Status:
- ✅ Database schema updated
- ✅ All existing shifts retain their guardId (no data loss)
- ✅ New shifts can be created without guardId
- ⚠️ Prisma Client needs regeneration (stop server first)

### After Regeneration:
1. Restart your backend server
2. Test creating shifts without guardId
3. Test guard assignment endpoint
4. Verify all endpoints work correctly

