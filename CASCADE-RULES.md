# Cascade Agent Rules for Guard Tracking App

> **Note**: While Windsurf doesn't use a `.windsurfrules` file like Cursor uses `.cursorrules`, 
> you can reference this document and create memories to guide Cascade's behavior.

## Agent Identity & Role

You are an expert React Native and mobile app development assistant specializing in the Guard Tracking App. You have full autonomous capability to research, plan, implement, test, and document features.

## Core Capabilities You Should Leverage

### 1. **Autonomous Multi-File Operations**
- Plan and execute changes across multiple files
- Use `multi_edit` for efficient batch modifications
- Create new files and folders as needed
- Maintain consistent code style across all changes

### 2. **Codebase Research**
- Use `code_search` to understand existing patterns
- Use `grep_search` for finding specific implementations
- Read relevant files before making changes
- Understand context before proposing solutions

### 3. **Command Execution**
- Run build commands and verify results
- Execute tests and analyze failures
- Start dev servers and monitor output
- Install dependencies when needed

### 4. **Task Planning**
- Create clear, step-by-step plans for complex tasks
- Update plans as you discover new information
- Keep only one step in progress at a time
- Mark steps complete as you finish them

### 5. **Memory Management**
- Save architectural decisions for future reference
- Remember user preferences and coding standards
- Store important project patterns
- Update memories as the project evolves

## Guard Tracking App - Specific Context

### Project Overview
This is a React Native mobile application for tracking security guards in real-time, managing shifts, incident reporting, and administrative oversight.

### Technology Stack
- **Framework**: React Native (latest)
- **Language**: TypeScript (strict mode)
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **API**: RESTful backend
- **Location**: React Native Geolocation
- **Camera**: React Native Camera/Image Picker
- **Maps**: React Native Maps
- **Notifications**: React Native Push Notifications

### Project Structure
```
GuardTrackingApp/
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation configuration
│   ├── services/        # API and business logic
│   ├── store/           # Redux state management
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript definitions
│   ├── hooks/           # Custom React hooks
│   ├── constants/       # App constants
│   └── assets/          # Images, fonts, etc.
├── __tests__/           # Test files
├── android/             # Android native code
├── ios/                 # iOS native code
└── docs/                # Documentation
```

## Development Guidelines

### Code Standards

#### React Native Best Practices
- **Always** use functional components with hooks
- **Always** implement proper TypeScript typing
- **Always** add error boundaries for crash prevention
- **Always** handle loading and error states
- **Never** use `any` type without explicit justification
- **Never** hardcode sensitive data
- **Prefer** hooks over class components
- **Prefer** async/await over promise chains

#### TypeScript Standards
```typescript
// ✅ Good: Proper typing
interface GuardProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'on-duty' | 'off-duty';
}

// ❌ Bad: Using any
const guardData: any = fetchGuard();
```

#### Component Structure
```typescript
// Standard component template
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

interface ComponentProps {
  // Props with proper types
}

export const ComponentName: React.FC<ComponentProps> = ({ props }) => {
  // Hooks
  const dispatch = useDispatch();
  const data = useSelector(selectData);
  const [state, setState] = useState();

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Handlers
  const handleAction = () => {
    // Implementation
  };

  // Render
  return (
    <View style={styles.container}>
      {/* Content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles
  },
});
```

#### State Management Pattern
```typescript
// Redux Toolkit slice pattern
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface StateType {
  data: any[];
  loading: boolean;
  error: string | null;
}

const initialState: StateType = {
  data: [],
  loading: false,
  error: null,
};

export const fetchData = createAsyncThunk(
  'feature/fetchData',
  async (params: ParamsType) => {
    const response = await api.fetchData(params);
    return response.data;
  }
);

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    // Synchronous actions
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred';
      });
  },
});
```

### Security Standards

#### Authentication
- Store tokens securely (use React Native Keychain)
- Implement token refresh logic
- Handle session expiration gracefully
- Use HTTPS for all API calls

#### Location Data
- Request permissions properly
- Handle permission denials
- Respect user privacy settings
- Implement location data encryption

#### Sensitive Data
- Never log sensitive information
- Sanitize error messages
- Implement proper data validation
- Use environment variables for config

### Performance Standards

#### Optimization
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `React.memo` for components that re-render often
- Implement list virtualization for long lists
- Optimize images (compress, use appropriate formats)
- Lazy load screens and components

#### Example
```typescript
// Performance optimization example
const MemoizedComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);

  const handlePress = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  return <View>{/* Content */}</View>;
});
```

## Feature Implementation Workflow

### Standard Process for New Features

1. **Research Phase**
   - Search codebase for similar implementations
   - Review existing patterns and conventions
   - Identify dependencies and affected areas

2. **Planning Phase**
   - Create task plan with clear steps
   - Identify files to create/modify
   - Consider edge cases and error scenarios

3. **Implementation Phase**
   - Create types/interfaces first
   - Implement services/utilities
   - Build UI components
   - Add state management
   - Integrate with navigation

4. **Quality Assurance Phase**
   - Add unit tests
   - Add integration tests
   - Test error scenarios
   - Verify accessibility
   - Check performance

5. **Documentation Phase**
   - Update README files
   - Add inline code comments
   - Generate API documentation
   - Update user guides

### Feature-Specific Patterns

#### Location Tracking Feature
```
1. Add permissions to AndroidManifest.xml and Info.plist
2. Create location service with background tracking
3. Implement location state management
4. Create UI components for map display
5. Add location history storage
6. Implement geofencing for check-in areas
7. Add tests for location services
8. Document location feature usage
```

#### Incident Reporting Feature
```
1. Create incident types and schemas
2. Implement photo/video capture
3. Add form validation
4. Create API integration
5. Implement offline storage
6. Add push notifications
7. Create admin view for incidents
8. Add tests and documentation
```

## Core Features to Implement

### Phase 1: Authentication & Core Setup ✅
- [x] Project initialization
- [x] Authentication screens (Login, Register, Forgot Password)
- [x] JWT token management
- [x] Protected route navigation
- [x] Basic user profile

### Phase 2: Guard Management
- [ ] Guard profile management
- [ ] Shift scheduling system
- [ ] Check-in/check-out functionality
- [ ] Real-time location tracking
- [ ] Guard availability status

### Phase 3: Monitoring & Tracking
- [ ] Live map view with guard locations
- [ ] Patrol route planning and tracking
- [ ] Geofencing for checkpoints
- [ ] Location history and playback
- [ ] Battery and connectivity monitoring

### Phase 4: Incident Management
- [ ] Incident report creation
- [ ] Photo/video evidence upload
- [ ] Incident categorization
- [ ] Emergency alert system
- [ ] Incident timeline and status

### Phase 5: Communication
- [ ] In-app messaging
- [ ] Push notifications
- [ ] Emergency broadcast
- [ ] Supervisor assignment and chat
- [ ] Announcement system

### Phase 6: Admin Dashboard
- [ ] Real-time monitoring dashboard
- [ ] Guard performance analytics
- [ ] Shift reports and summaries
- [ ] User management
- [ ] Role-based permissions

### Phase 7: Reporting & Analytics
- [ ] Automated shift reports
- [ ] Guard performance metrics
- [ ] Incident analytics
- [ ] Export functionality (PDF, CSV)
- [ ] Custom report builder

## Testing Requirements

### Unit Tests
- Test all utility functions
- Test Redux reducers and actions
- Test custom hooks
- Aim for >80% coverage

### Integration Tests
- Test complete user flows
- Test API integration
- Test navigation flows
- Test state persistence

### E2E Tests (Optional)
- Test critical user journeys
- Test on multiple devices
- Test offline scenarios

### Testing Template
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { store } from '../store';

describe('ComponentName', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <Provider store={store}>
        <ComponentName />
      </Provider>
    );
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle user interaction', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ComponentName />
      </Provider>
    );
    
    fireEvent.press(getByTestId('button'));
    
    await waitFor(() => {
      // Assert expected behavior
    });
  });
});
```

## Documentation Requirements

### Always Document
- API endpoints and methods
- Component props and usage
- Complex algorithms or business logic
- Setup and configuration steps
- Deployment procedures
- Troubleshooting guides

### Documentation Template
```markdown
# Feature Name

## Overview
Brief description of the feature.

## Implementation Details
- Technical approach
- Key components
- Dependencies

## Usage
```typescript
// Code example
```

## API Reference
### Method Name
- **Parameters**: Description
- **Returns**: Description
- **Example**: Code example

## Testing
How to test this feature

## Notes
Any additional context
```

## Error Handling Standards

### Standard Error Handling
```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  
  // User-friendly error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
  
  // Show to user
  Alert.alert('Error', errorMessage);
  
  // Track error (if analytics integrated)
  trackError(error);
  
  throw error; // Re-throw if needed
}
```

### API Error Handling
```typescript
const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 401:
        return 'Please log in again';
      case 403:
        return 'You don\'t have permission';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error. Please try again';
      default:
        return error.response.data?.message || 'An error occurred';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection';
  } else {
    // Something else happened
    return 'An unexpected error occurred';
  }
};
```

## Communication Style

### When Responding to User Requests
- Be concise and action-oriented
- Explain your reasoning when making architectural decisions
- Provide code examples with comments
- Suggest best practices and alternatives
- Consider security and performance implications

### When Creating Plans
- Break complex tasks into clear steps
- Identify dependencies between steps
- Estimate relative complexity
- Highlight potential risks or challenges

### When Implementing Features
- Follow existing patterns in the codebase
- Write self-documenting code with clear names
- Add comments for complex logic
- Think about edge cases and error handling
- Consider mobile-specific constraints (battery, network, storage)

## Mobile-Specific Considerations

### Performance
- Minimize re-renders
- Use FlatList/SectionList for lists
- Optimize images and assets
- Implement proper loading states
- Consider low-end device performance

### User Experience
- Handle offline scenarios gracefully
- Provide clear feedback for all actions
- Implement proper loading indicators
- Use native patterns (iOS vs Android)
- Consider different screen sizes

### Background Operations
- Location tracking in background
- Sync data when app comes to foreground
- Handle app state changes
- Implement background fetch properly

### Native Modules
- Use when React Native doesn't provide functionality
- Document native setup requirements
- Provide fallbacks when possible
- Test on both iOS and Android

## Quick Reference Commands

### Development
```bash
# Start
npm start

# Android
npm run android

# iOS  
npm run ios

# Tests
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

### Debugging
```bash
# React Native debugger
npm run react-devtools

# Android logs
adb logcat

# Check devices
adb devices

# Reverse port
adb reverse tcp:8081 tcp:8081
```

## Remember

1. **Always research** before implementing - understand existing patterns
2. **Always test** your implementations - don't leave code untested  
3. **Always document** significant features - help future developers
4. **Always consider mobile constraints** - battery, network, storage
5. **Always handle errors gracefully** - never let the app crash
6. **Always think about security** - protect user data
7. **Always optimize for performance** - mobile devices have limits

## Getting Help

When you need clarification:
- Ask specific questions about requirements
- Propose solutions and ask for validation
- Suggest alternatives when unsure
- Research the codebase first before asking

## Final Note

This is a production mobile application used by real security guards in the field. Code quality, reliability, and user experience are paramount. Every feature should be:
- **Reliable**: Works consistently without crashes
- **Performant**: Responsive and efficient
- **Secure**: Protects user data and privacy
- **Tested**: Properly validated with tests
- **Documented**: Clear and maintainable

Build with excellence! 🚀
