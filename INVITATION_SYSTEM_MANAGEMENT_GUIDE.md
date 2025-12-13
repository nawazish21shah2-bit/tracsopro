# Invitation System - Management Guide 📋

## ✅ YES - Supports Both GUARD and CLIENT

The invitation system **fully supports both roles**:

### Supported Roles:
- ✅ **GUARD** - For inviting security guards
- ✅ **CLIENT** - For inviting clients

---

## 📍 WHERE IT'S MANAGED

### 1. **Admin Dashboard** (Main Entry Point)
**Location:** Admin Dashboard → Quick Actions

**Path:**
```
Admin Dashboard
  └─ Quick Actions Section
      └─ "Invitations" Card
          └─ Opens InvitationManagementScreen
```

**Visual:**
- Card Title: "Invitations"
- Subtitle: "Create & manage invitations"
- Icon: Ticket/Confirmation icon
- Color: Yellow/Amber theme (#FEF3C7 background, #F59E0B icon)

### 2. **Management Tab** (Alternative Access)
**Location:** Admin Navigation → Management Tab

**Path:**
```
Admin Navigation
  └─ Bottom Tab: "Management"
      └─ Stack Navigator
          └─ InvitationManagement (accessible via stack)
```

### 3. **Direct Navigation**
**Screen Name:** `InvitationManagement`

**Code:**
```typescript
navigation.navigate('InvitationManagement');
```

---

## 🎯 HOW TO ACCESS

### Method 1: From Dashboard (Recommended)
1. Login as Admin
2. Open **Admin Dashboard**
3. Scroll to **Quick Actions** section
4. Tap **"Invitations"** card
5. Opens Invitation Management Screen

### Method 2: From Management Tab
1. Login as Admin
2. Go to **Management** tab (bottom navigation)
3. Navigate to Invitation Management (if added to stack)

### Method 3: Direct Navigation
- Programmatically: `navigation.navigate('InvitationManagement')`

---

## 🎨 INVITATION MANAGEMENT SCREEN

### Features:
- ✅ **List all invitations** (for both GUARD and CLIENT)
- ✅ **Filter by role** (All, Guards, Clients)
- ✅ **Filter by status** (All, Active, Used, Expired)
- ✅ **Create new invitations** (for GUARD or CLIENT)
- ✅ **Copy invitation codes**
- ✅ **Revoke active invitations**
- ✅ **Delete invitations**

### Create Invitation Form:
- **Role Selection:** Choose GUARD or CLIENT
- **Email (Optional):** Leave empty for open invitation, or specify for specific user
- **Expires In Days:** 1-365 days
- **Max Uses:** 1-100 uses

---

## 📊 ROLE-SPECIFIC FEATURES

### For GUARD Invitations:
- Role badge: **Blue** (COLORS.primary)
- Creates invitation for guard role
- When guard registers with code → Auto-linked to company via `CompanyGuard`

### For CLIENT Invitations:
- Role badge: **Green** (COLORS.success)
- Creates invitation for client role
- When client registers with code → Auto-linked to company via `CompanyClient`

---

## 🔄 COMPLETE FLOW

### Admin Creates Invitation:
```
1. Admin Dashboard
   ↓
2. Click "Invitations" quick action
   ↓
3. InvitationManagementScreen opens
   ↓
4. Click "+ Create Invitation"
   ↓
5. Select Role: GUARD or CLIENT
   ↓
6. Fill form (email optional, expires, max uses)
   ↓
7. Click "Create Invitation"
   ↓
8. Get invitation code (e.g., "INV-A1B2C3D4E5F6G7H8")
   ↓
9. Copy code and share with guard/client
```

### Guard/Client Registers:
```
1. Open registration screen (GuardSignupScreen or ClientSignupScreen)
   ↓
2. Enter invitation code (optional field)
   ↓
3. Fill other required fields
   ↓
4. Submit registration
   ↓
5. Backend validates code
   ↓
6. User created + Auto-linked to SecurityCompany
   ↓
7. Success! ✅
```

---

## 📱 SCREEN LOCATIONS

### Frontend Files:
- **Management Screen:** `GuardTrackingApp/src/screens/admin/InvitationManagementScreen.tsx`
- **Dashboard Entry:** `GuardTrackingApp/src/screens/admin/AdminDashboard.tsx`
- **Navigation:** `GuardTrackingApp/src/navigation/AdminNavigator.tsx`

### Backend Files:
- **Service:** `backend/src/services/invitationService.ts`
- **Controller:** `backend/src/controllers/invitationController.ts`
- **Routes:** `backend/src/routes/invitations.ts`

---

## 🎯 QUICK REFERENCE

### Create GUARD Invitation:
1. Dashboard → Invitations
2. + Create Invitation
3. Select **GUARD**
4. Fill form → Create
5. Share code with guard

### Create CLIENT Invitation:
1. Dashboard → Invitations
2. + Create Invitation
3. Select **CLIENT**
4. Fill form → Create
5. Share code with client

### View All Invitations:
- Dashboard → Invitations
- See all (GUARD + CLIENT)
- Filter by role or status

---

## ✅ SUMMARY

**Question:** Is invitation system for both client and guard?
**Answer:** ✅ **YES** - Fully supports both GUARD and CLIENT roles

**Question:** Where is it managed?
**Answer:** 
- **Primary:** Admin Dashboard → Quick Actions → "Invitations"
- **Screen:** InvitationManagementScreen
- **Navigation:** Accessible via AdminNavigator stack

---

**🎉 The invitation system is ready to manage invitations for both guards and clients!**

