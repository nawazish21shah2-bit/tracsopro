# Cursor Desktop Agent Prompts for Guard Tracking App

## Primary Agent Prompts

### 1. Architecture Planning Prompt
```
You are an expert React Native architect. Help me design a comprehensive guard tracking application with the following requirements:

- Real-time location tracking for security guards
- Incident reporting with photo/video evidence
- Shift management and scheduling
- Supervisor dashboard for monitoring
- Communication system between guards and supervisors
- Performance analytics and reporting

Please provide:
1. Complete system architecture
2. Database schema design
3. API endpoint specifications
4. Component hierarchy
5. State management strategy
6. Security considerations
7. Performance optimization plan

Focus on scalability, security, and maintainability. Use TypeScript throughout and follow React Native best practices.
```

### 2. Component Development Prompt
```
I need to create a React Native component for [SPECIFIC_COMPONENT]. 

Requirements:
- TypeScript with proper type definitions
- Responsive design for mobile devices
- Accessibility compliance
- Error handling and loading states
- Unit tests included
- Performance optimized
- Follow React Native best practices

Please provide:
1. Complete component code with TypeScript
2. Props interface definition
3. Styling with StyleSheet
4. Unit test file
5. Usage examples
6. Documentation comments

Make it production-ready and maintainable.
```

### 3. API Integration Prompt
```
Help me implement API integration for the guard tracking app. I need to:

1. Set up API service layer with TypeScript
2. Implement authentication with JWT tokens
3. Handle real-time data with WebSocket connections
4. Implement offline data synchronization
5. Add proper error handling and retry logic
6. Include loading states and caching

Please provide:
- Complete API service implementation
- TypeScript interfaces for all data models
- Error handling strategies
- Offline synchronization logic
- Testing examples
- Documentation for all endpoints

Use axios for HTTP requests and implement proper state management with Redux Toolkit.
```

### 4. Navigation Setup Prompt
```
Set up React Navigation for the guard tracking app with the following structure:

- Authentication flow (Login, Register, Forgot Password)
- Main app with tab navigation
- Guard-specific screens (Dashboard, Tracking, Incidents, Profile)
- Supervisor screens (Dashboard, Guards, Reports, Settings)
- Modal screens for forms and details

Requirements:
- TypeScript navigation types
- Protected routes based on user roles
- Deep linking support
- Navigation state persistence
- Proper back button handling
- Screen transitions and animations

Please provide complete navigation setup with all necessary configurations.
```

### 5. State Management Prompt
```
Implement Redux Toolkit state management for the guard tracking app with these slices:

- Auth slice (user authentication, tokens, permissions)
- Guards slice (guard profiles, assignments, performance)
- Location slice (tracking data, geofences, history)
- Incidents slice (incident reports, evidence, status)
- Communication slice (messages, notifications, alerts)
- Settings slice (app preferences, user settings)

Requirements:
- TypeScript for all state types
- RTK Query for API calls
- Proper action creators and reducers
- Middleware for side effects
- Persistence with AsyncStorage
- Error handling and loading states

Provide complete Redux store setup with all slices and middleware.
```

### 6. Testing Strategy Prompt
```
Create a comprehensive testing strategy for the guard tracking app including:

1. Unit tests for business logic and utilities
2. Component tests with React Native Testing Library
3. Integration tests for API calls
4. E2E tests with Detox for critical user flows
5. Performance testing for location tracking
6. Security testing for authentication

Please provide:
- Jest configuration for React Native
- Test utilities and helpers
- Mock implementations for external services
- Test data factories
- CI/CD integration setup
- Coverage reporting configuration

Focus on testing critical paths like authentication, location tracking, and incident reporting.
```

### 7. Security Implementation Prompt
```
Implement comprehensive security measures for the guard tracking app:

1. Authentication and authorization
2. Data encryption for sensitive information
3. Secure API communication
4. Biometric authentication
5. Session management
6. Input validation and sanitization
7. Secure storage for credentials
8. Network security best practices

Requirements:
- JWT token management with refresh tokens
- Role-based access control
- Data encryption at rest and in transit
- Secure credential storage
- API rate limiting
- Input validation
- Security headers
- Audit logging

Provide complete security implementation with TypeScript and React Native best practices.
```

### 8. Performance Optimization Prompt
```
Optimize the guard tracking app for performance with focus on:

1. Bundle size optimization
2. Image and asset optimization
3. Memory management
4. Location tracking efficiency
5. Database query optimization
6. Caching strategies
7. Background processing
8. Battery optimization

Please provide:
- Bundle analysis and optimization techniques
- Image optimization strategies
- Memory leak prevention
- Efficient location tracking implementation
- Caching mechanisms
- Background task management
- Performance monitoring setup

Include specific React Native optimizations and platform-specific considerations.
```

### 9. Deployment & DevOps Prompt
```
Set up complete deployment and DevOps pipeline for the guard tracking app:

1. Development environment setup
2. Staging environment configuration
3. Production deployment strategy
4. CI/CD pipeline with GitHub Actions
5. App store deployment process
6. Monitoring and logging setup
7. Database migration strategies
8. Rollback procedures

Requirements:
- Docker containerization
- Automated testing in CI/CD
- Code quality checks
- Security scanning
- Performance monitoring
- Error tracking with Sentry
- Analytics integration

Provide complete DevOps setup with all necessary configurations and scripts.
```

### 10. Documentation Generation Prompt
```
Generate comprehensive documentation for the guard tracking app including:

1. API documentation with examples
2. Component documentation with props and usage
3. User guides for different user roles
4. Developer setup and contribution guide
5. Deployment and maintenance procedures
6. Troubleshooting guide
7. Security guidelines
8. Performance optimization guide

Please create:
- Markdown documentation files
- Code examples and snippets
- Diagrams for system architecture
- User flow diagrams
- API endpoint documentation
- Component library documentation
- Deployment guides

Make documentation comprehensive yet easy to follow for developers and users.
```

## Specialized Agent Prompts

### Location Tracking Specialist
```
You are a location tracking expert. Help me implement real-time GPS tracking for security guards with:

- Accurate location updates
- Battery optimization
- Offline location caching
- Geofencing capabilities
- Location history tracking
- Privacy compliance

Focus on React Native location services, background processing, and data efficiency.
```

### Security Expert
```
You are a mobile app security expert. Help me secure the guard tracking app with:

- End-to-end encryption
- Secure authentication
- Data protection
- API security
- Mobile-specific vulnerabilities
- Compliance requirements

Provide comprehensive security implementation with React Native best practices.
```

### UI/UX Specialist
```
You are a mobile UI/UX expert. Help me design the guard tracking app interface with:

- Intuitive navigation
- Accessibility compliance
- Responsive design
- User-friendly forms
- Data visualization
- Mobile-first approach

Focus on React Native components, animations, and user experience optimization.
```

## Usage Instructions

### How to Use These Prompts

1. **Copy the relevant prompt** based on your current development phase
2. **Paste it into Cursor Desktop** chat
3. **Customize the prompt** with specific requirements
4. **Iterate and refine** based on the agent's responses
5. **Save successful prompts** for future use

### Best Practices

1. **Be specific** about your requirements
2. **Include context** about your current setup
3. **Ask for examples** and code snippets
4. **Request documentation** for complex features
5. **Test and validate** all generated code
6. **Iterate based on feedback**

### Prompt Customization

- Replace `[SPECIFIC_COMPONENT]` with actual component names
- Add specific requirements for your use case
- Include existing code context when relevant
- Specify performance or security requirements
- Mention specific technologies or libraries

These prompts will help you leverage Cursor Desktop's AI capabilities to build a comprehensive guard tracking application with proper architecture, security, and performance optimization.
