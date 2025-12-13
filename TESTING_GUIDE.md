# Complete Testing Guide - Multi-Tenant Auth System

## 🧪 TESTING CHECKLIST

### Prerequisites
1. ✅ Run Prisma generate:
   ```bash
   cd backend
   npx prisma generate
   ```

2. ✅ Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

3. ✅ Start frontend (if testing mobile app):
   ```bash
   cd GuardTrackingApp
   npm start
   ```

---

## 📋 TEST SCENARIOS

### 1. Admin Registration & Company Creation

**Test Case 1.1: Admin Self-Registration**
```
Steps:
1. Navigate to Admin Signup screen
2. Fill in personal details:
   - Full Name: "John Admin"
   - Email: "admin@testcompany.com"
   - Phone: "+1234567890"
   - Password: "Test1234!"
   - Confirm Password: "Test1234!"
3. Fill in company details:
   - Company Name: "Test Security Co"
   - Company Email: "info@testcompany.com"
   - Company Phone: "+1234567891" (optional)
4. Click "Continue"

Expected Results:
✅ User created with ADMIN role
✅ SecurityCompany created with:
   - name: "Test Security Co"
   - email: "info@testcompany.com"
   - subscriptionPlan: "BASIC"
   - subscriptionStatus: "ACTIVE"
   - maxGuards: 2
   - maxClients: 1
   - maxSites: 1
✅ CompanyUser created linking admin to company as OWNER
✅ Admin can login and access dashboard
✅ Dashboard shows only this admin's data
```

**Test Case 1.2: Admin Registration - Missing Company Details**
```
Steps:
1. Navigate to Admin Signup screen
2. Fill in personal details only
3. Leave company name or email empty
4. Click "Continue"

Expected Results:
✅ Validation error shown
✅ Cannot proceed without company details
✅ Error message: "Company name is required" or "Company email is required"
```

---

### 2. Guard Registration with Invitation

**Test Case 2.1: Guard Registration - Valid Invitation**
```
Prerequisites:
- Admin must be registered and logged in
- Admin creates invitation for GUARD role

Steps:
1. Admin creates invitation:
   - Role: GUARD
   - Email: (optional)
   - Expires: 7 days
   - Max Uses: 1
2. Copy invitation code
3. Navigate to Guard Signup screen
4. Fill in details:
   - Full Name: "Jane Guard"
   - Email: "guard@example.com"
   - Phone: "+1234567892"
   - Password: "Test1234!"
   - Confirm Password: "Test1234!"
   - Invitation Code: [paste code]
5. Click "Continue"

Expected Results:
✅ Invitation validated
✅ User created with GUARD role
✅ Guard profile created
✅ CompanyGuard created linking guard to admin's company
✅ Guard can login and see assigned shifts
```

**Test Case 2.2: Guard Registration - Missing Invitation Code**
```
Steps:
1. Navigate to Guard Signup screen
2. Fill in all details except invitation code
3. Click "Continue"

Expected Results:
✅ Validation error shown
✅ Error: "Invitation code is required. Please contact your security company administrator."
✅ Cannot proceed without invitation code
```

**Test Case 2.3: Guard Registration - Invalid Invitation Code**
```
Steps:
1. Navigate to Guard Signup screen
2. Fill in all details
3. Enter invalid invitation code: "INV-INVALID"
4. Click "Continue"

Expected Results:
✅ Registration fails
✅ Error: "Invalid invitation code" or similar
✅ User not created
```

**Test Case 2.4: Guard Registration - Expired Invitation**
```
Steps:
1. Admin creates invitation with 1 day expiration
2. Wait for invitation to expire (or manually set expiration)
3. Try to register with expired code

Expected Results:
✅ Registration fails
✅ Error: "Invitation has expired"
✅ User not created
```

---

### 3. Client Registration with Invitation

**Test Case 3.1: Client Registration - Valid Invitation**
```
Prerequisites:
- Admin must be registered and logged in
- Admin creates invitation for CLIENT role

Steps:
1. Admin creates invitation:
   - Role: CLIENT
   - Email: (optional)
   - Expires: 7 days
   - Max Uses: 1
2. Copy invitation code
3. Navigate to Client Signup screen
4. Fill in details:
   - Full Name: "Bob Client"
   - Email: "client@example.com"
   - Phone: "+1234567893"
   - Password: "Test1234!"
   - Confirm Password: "Test1234!"
   - Invitation Code: [paste code]
5. Click "Continue"

Expected Results:
✅ Invitation validated
✅ User created with CLIENT role
✅ Client profile created
✅ CompanyClient created linking client to admin's company
✅ Client can login and create sites/shifts
```

**Test Case 3.2: Client Registration - Missing Invitation Code**
```
Steps:
1. Navigate to Client Signup screen
2. Fill in all details except invitation code
3. Click "Continue"

Expected Results:
✅ Validation error shown
✅ Error: "Invitation code is required. Please contact your security company administrator."
✅ Cannot proceed without invitation code
```

---

### 4. Invitation Management

**Test Case 4.1: Create Guard Invitation - Within Free Tier**
```
Prerequisites:
- Admin logged in
- Current guard count < 2

Steps:
1. Navigate to Invitation Management screen
2. Click "Create Invitation"
3. Select Role: GUARD
4. (Optional) Enter email
5. Set expiration: 7 days
6. Set max uses: 1
7. Click "Create Invitation"

Expected Results:
✅ Invitation created successfully
✅ Invitation code displayed
✅ Free tier hint shown: "Free tier: Up to 2 guards"
✅ Invitation appears in list
```

**Test Case 4.2: Create Guard Invitation - Free Tier Limit Reached**
```
Prerequisites:
- Admin logged in
- Already has 2 guards (free tier limit)

Steps:
1. Navigate to Invitation Management screen
2. Click "Create Invitation"
3. Select Role: GUARD
4. Fill in details
5. Click "Create Invitation"

Expected Results:
✅ Backend rejects request
✅ Error: "You have reached the maximum limit of 2 guards for your current subscription plan"
✅ Upgrade prompt shown
✅ Invitation not created
```

**Test Case 4.3: Create Client Invitation - Within Free Tier**
```
Prerequisites:
- Admin logged in
- Current client count < 1

Steps:
1. Navigate to Invitation Management screen
2. Click "Create Invitation"
3. Select Role: CLIENT
4. Fill in details
5. Click "Create Invitation"

Expected Results:
✅ Invitation created successfully
✅ Free tier hint shown: "Free tier: Up to 1 client"
✅ Invitation appears in list
```

**Test Case 4.4: Create Client Invitation - Free Tier Limit Reached**
```
Prerequisites:
- Admin logged in
- Already has 1 client (free tier limit)

Steps:
1. Navigate to Invitation Management screen
2. Click "Create Invitation"
3. Select Role: CLIENT
4. Fill in details
5. Click "Create Invitation"

Expected Results:
✅ Backend rejects request
✅ Error: "You have reached the maximum limit of 1 client for your current subscription plan"
✅ Upgrade prompt shown
✅ Invitation not created
```

---

### 5. Site Creation - Free Tier Limit

**Test Case 5.1: Create Site - Within Free Tier**
```
Prerequisites:
- Admin logged in
- Has at least 1 client
- Current site count < 1

Steps:
1. Navigate to Site Management screen
2. Click "Create Site"
3. Select client
4. Enter site name and address
5. Click "Create"

Expected Results:
✅ Site created successfully
✅ Site linked to client and company
✅ Site appears in list
```

**Test Case 5.2: Create Site - Free Tier Limit Reached**
```
Prerequisites:
- Admin logged in
- Already has 1 site (free tier limit)

Steps:
1. Navigate to Site Management screen
2. Click "Create Site"
3. Fill in details
4. Click "Create"

Expected Results:
✅ Backend rejects request
✅ Error: "You have reached the maximum limit of 1 site for your current subscription plan"
✅ Upgrade prompt shown
✅ Site not created
```

---

### 6. Multi-Tenant Data Isolation

**Test Case 6.1: Admin Only Sees Own Data**
```
Prerequisites:
- Two admins registered (Admin A and Admin B)
- Each has their own guards, clients, sites

Steps:
1. Login as Admin A
2. Navigate to User Management
3. Check guards list
4. Navigate to Site Management
5. Check sites list

Expected Results:
✅ Admin A only sees their own guards
✅ Admin A only sees their own clients
✅ Admin A only sees their own sites
✅ No data from Admin B visible
```

**Test Case 6.2: Guard Only Sees Assigned Shifts**
```
Prerequisites:
- Admin A has Guard 1
- Admin B has Guard 2
- Admin A creates shift for Guard 1

Steps:
1. Login as Guard 1
2. Navigate to Shifts/Upcoming Shifts

Expected Results:
✅ Guard 1 only sees shifts assigned to them
✅ Guard 1 does not see shifts for Guard 2
✅ All shifts belong to Admin A's company
```

**Test Case 6.3: Client Only Sees Own Sites**
```
Prerequisites:
- Admin A has Client 1 and Client 2
- Client 1 has Site 1
- Client 2 has Site 2

Steps:
1. Login as Client 1
2. Navigate to Sites

Expected Results:
✅ Client 1 only sees Site 1
✅ Client 1 does not see Site 2
✅ All sites belong to Admin A's company
```

---

### 7. Dashboard & Statistics

**Test Case 7.1: Admin Dashboard Stats**
```
Prerequisites:
- Admin logged in
- Has guards, clients, sites, shifts

Steps:
1. Login as Admin
2. Navigate to Dashboard
3. Check statistics

Expected Results:
✅ Total guards count matches admin's guards only
✅ Total clients count matches admin's clients only
✅ Total sites count matches admin's sites only
✅ Scheduled shifts count matches admin's shifts only
✅ No data from other companies visible
```

---

## 🔍 API TESTING

### Test Admin Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test1234!",
    "firstName": "John",
    "lastName": "Admin",
    "phone": "+1234567890",
    "role": "ADMIN",
    "companyName": "Test Security Co",
    "companyEmail": "info@test.com",
    "companyPhone": "+1234567891"
  }'
```

### Test Guard Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guard@test.com",
    "password": "Test1234!",
    "firstName": "Jane",
    "lastName": "Guard",
    "phone": "+1234567892",
    "role": "GUARD",
    "invitationCode": "INV-XXXXXXXX"
  }'
```

### Test Create Invitation
```bash
curl -X POST http://localhost:3000/api/admin/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "role": "GUARD",
    "email": "guard@example.com",
    "expiresInDays": 7,
    "maxUses": 1
  }'
```

---

## ✅ VERIFICATION CHECKLIST

After testing, verify:
- [ ] Admin can register with company details
- [ ] Guard can register with invitation code
- [ ] Client can register with invitation code
- [ ] Invitation creation checks free tier limits
- [ ] Site creation checks free tier limit
- [ ] Each admin only sees their own data
- [ ] Guards only see their assigned shifts
- [ ] Clients only see their own sites
- [ ] Dashboard stats filtered by company
- [ ] Error messages are user-friendly
- [ ] Free tier limits enforced correctly

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Property 'invitation' does not exist"
**Fix:** Run `npx prisma generate` in backend directory

### Issue: "Security company ID not found"
**Fix:** Ensure admin is properly linked to company via CompanyUser

### Issue: "Invitation code is required"
**Fix:** Ensure invitation code is provided for Guard/Client registration

### Issue: "Free tier limit reached"
**Fix:** This is expected behavior. Upgrade plan or remove existing resources.

---

## 🎉 SUCCESS CRITERIA

All tests pass when:
- ✅ All registration flows work
- ✅ Free tier limits enforced
- ✅ Multi-tenant isolation working
- ✅ Error handling complete
- ✅ UI shows helpful messages

**Ready for production!** 🚀

