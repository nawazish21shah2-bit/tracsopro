# 📱 Figma Screen Update Example

A practical example showing how to update an existing screen to match Figma designs.

## 🎯 Example: LoginScreen Update

Let's update the `LoginScreen` to use the design system and match Figma designs.

## Step 1: Design in Figma

### What to Design:

1. **Layout Structure**
   - Logo at top
   - Welcome text
   - Email input field
   - Password input field
   - Remember me checkbox
   - Login button
   - Forgot password link
   - Sign up link

2. **Design Specifications** (from Figma):
   - Background: `#FFFFFF` (White)
   - Primary color: `#1C6CA9` (Blue)
   - Input border: `#E0E0E0` (Light gray)
   - Input focus border: `#1C6CA9` (Blue, 2px)
   - Button height: 48px
   - Border radius: 8px
   - Spacing: 16px between elements

## Step 2: Extract Design Tokens

From Figma Dev Mode, you'll get:

```typescript
// Colors
Background: #FFFFFF
Primary: #1C6CA9
Border: #E0E0E0
Text Primary: #212121
Text Secondary: #757575

// Spacing
Screen padding: 16px
Element spacing: 16px
Input padding: 16px

// Typography
Title: 24px, Semibold (600)
Body: 16px, Regular (400)
Label: 14px, Medium (500)

// Components
Button height: 48px
Input height: 48px
Border radius: 8px
```

## Step 3: Update the Code

### Before (Current Code):

```typescript
// Current imports
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../styles/globalStyles';

// Current styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1C6CA9',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### After (Using Design System):

```typescript
// Updated imports
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  CommonStyles,
} from '../../design-system';
import {
  DesignSystemButton,
  DesignSystemInput,
} from '../../design-system/components';

// Updated component
const LoginScreen: React.FC = () => {
  // ... existing state and logic ...

  return (
    <SafeAreaView style={CommonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={Logo} style={styles.logo} />
        </View>

        {/* Welcome Text */}
        <View style={styles.header}>
          <Text style={[CommonStyles.textH2, styles.title]}>
            Welcome Back
          </Text>
          <Text style={[CommonStyles.textBodySmall, styles.subtitle]}>
            Sign in to continue
          </Text>
        </View>

        {/* Email Input */}
        <DesignSystemInput
          label="Email"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={validationErrors.email}
          style={{ marginBottom: Spacing.lg }}
        />

        {/* Password Input */}
        <DesignSystemInput
          label="Password"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          error={validationErrors.password}
          style={{ marginBottom: Spacing.md }}
        />

        {/* Remember Me */}
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.checkboxContainer}
          >
            <View
              style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked,
              ]}
            >
              {rememberMe && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={[CommonStyles.textBodySmall, styles.rememberMeText]}>
              Remember me
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={[CommonStyles.textBodySmall, styles.forgotPassword]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <DesignSystemButton
          title="Sign In"
          onPress={handleLogin}
          variant="primary"
          fullWidth
          loading={isLoading}
          style={{ marginTop: Spacing.xl }}
        />

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={CommonStyles.textBodySmall}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={[CommonStyles.textBodySmall, styles.signUpLink]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Updated styles (minimal, using design system)
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    marginTop: Spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  header: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    // Uses CommonStyles.textBodySmall
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  rememberMeText: {
    // Uses CommonStyles.textBodySmall
  },
  forgotPassword: {
    color: Colors.primary,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  signUpLink: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
});
```

## Step 4: Key Changes Made

### ✅ Replaced Hardcoded Values

| Before | After |
|--------|-------|
| `backgroundColor: '#FFFFFF'` | `CommonStyles.container` |
| `padding: 16` | `padding: Spacing.lg` |
| `fontSize: 24` | `CommonStyles.textH2` |
| `color: '#212121'` | `Colors.text.primary` |
| `borderColor: '#E0E0E0'` | `Colors.border.light` |
| `borderRadius: 8` | `BorderRadius.md` |

### ✅ Used Design System Components

- Replaced custom `Input` → `DesignSystemInput`
- Replaced custom `Button` → `DesignSystemButton`
- Used `CommonStyles` for containers and text

### ✅ Matched Figma Specifications

- Exact spacing from Figma
- Exact colors from Figma
- Exact typography from Figma
- Exact component dimensions

## Step 5: Verify Against Figma

1. **Open Figma Design**
   - Select Login Screen
   - Enable Dev Mode (`Shift + D`)

2. **Compare Elements**
   - Logo position and size
   - Text styles and sizes
   - Input field styles
   - Button styles
   - Spacing between elements

3. **Check Values**
   - Colors match exactly
   - Spacing matches exactly
   - Typography matches exactly
   - Component dimensions match

## Step 6: Test

1. **Visual Test**
   - Run the app
   - Compare with Figma design
   - Check on different screen sizes

2. **Functional Test**
   - Test form validation
   - Test login flow
   - Test navigation

3. **Device Test**
   - Test on iOS
   - Test on Android
   - Test on different screen sizes

## 📋 Checklist for Each Screen

When updating any screen:

- [ ] Design exists in Figma
- [ ] Design tokens extracted
- [ ] Imports updated to use design system
- [ ] Hardcoded colors replaced
- [ ] Hardcoded spacing replaced
- [ ] Hardcoded typography replaced
- [ ] Components use design system components
- [ ] Matches Figma design exactly
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Responsive on different sizes

## 🎯 Result

After updating:

✅ **Consistent Design** - Matches Figma exactly  
✅ **Maintainable** - Uses design system tokens  
✅ **Professional** - Modern, clean look  
✅ **Scalable** - Easy to update globally  

## 🔄 Next Screen

Repeat this process for:
1. RegisterScreen
2. ForgotPasswordScreen
3. DashboardScreen
4. And all other screens...

---

**This is the pattern to follow for all 80+ screens!**













