// Jest Setup File
// Note: react-native-reanimated has been removed, so no mock needed

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

// Mock react-native-push-notification
jest.mock('react-native-push-notification', () => ({
  configure: jest.fn(),
  localNotification: jest.fn(),
  localNotificationSchedule: jest.fn(),
  cancelLocalNotifications: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
}));

// Mock @react-native-firebase/messaging
jest.mock('@react-native-firebase/messaging', () => () => ({
  requestPermission: jest.fn(() => Promise.resolve(1)),
  hasPermission: jest.fn(() => Promise.resolve(1)),
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  onMessage: jest.fn(),
  onNotificationOpenedApp: jest.fn(),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  setBackgroundMessageHandler: jest.fn(),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  addEventListener: jest.fn(),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

// Mock Image component for logo
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Image = RN.View; // Mock Image as View for tests
  return RN;
});

// Mock Alert properly
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert.alert = jest.fn();
  return RN;
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Svg: (props) => React.createElement(View, { ...props, testID: 'svg' }),
    Circle: (props) => React.createElement(View, props),
    Ellipse: (props) => React.createElement(View, props),
    G: (props) => React.createElement(View, props),
    Text: (props) => React.createElement(View, props),
    TSpan: (props) => React.createElement(View, props),
    TextPath: (props) => React.createElement(View, props),
    Path: (props) => React.createElement(View, props),
    Polygon: (props) => React.createElement(View, props),
    Polyline: (props) => React.createElement(View, props),
    Line: (props) => React.createElement(View, props),
    Rect: (props) => React.createElement(View, props),
    Use: (props) => React.createElement(View, props),
    Image: (props) => React.createElement(View, props),
    Symbol: (props) => React.createElement(View, props),
    Defs: (props) => React.createElement(View, props),
    LinearGradient: (props) => React.createElement(View, props),
    RadialGradient: (props) => React.createElement(View, props),
    Stop: (props) => React.createElement(View, props),
    ClipPath: (props) => React.createElement(View, props),
    Pattern: (props) => React.createElement(View, props),
    Mask: (props) => React.createElement(View, props),
    Marker: (props) => React.createElement(View, props),
    ForeignObject: (props) => React.createElement(View, props),
  };
});

// Mock react-native-background-job
jest.mock('react-native-background-job', () => ({
  register: jest.fn(),
  on: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
}));

// Mock crypto-js
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((data, key) => ({ toString: () => `encrypted_${data}` })),
    decrypt: jest.fn((data, key) => ({ toString: () => data.toString().replace('encrypted_', '') })),
  },
}));

// Mock AppIcons to avoid SVG rendering issues in tests
jest.mock('./src/components/ui/AppIcons', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const MockIcon = (props) => React.createElement(View, { testID: props.testID || 'icon', ...props });
  const MockAppIcon = (props) => {
    // AppIcon can take type and name props
    const testID = props.name ? `app-icon-${props.name}` : 'app-icon-default';
    return React.createElement(View, { testID, ...props });
  };
  return {
    ArrowRightIcon: (props) => MockIcon({ testID: 'arrow-right-icon', ...props }),
    ArrowUpOutlineIcon: (props) => MockIcon({ testID: 'arrow-up-icon', ...props }),
    HomeIcon: (props) => MockIcon({ testID: 'home-icon', ...props }),
    LocationIcon: (props) => MockIcon({ testID: 'location-icon', ...props }),
    ShiftsIcon: (props) => MockIcon({ testID: 'shifts-icon', ...props }),
    ReportsIcon: (props) => MockIcon({ testID: 'reports-icon', ...props }),
    JobsIcon: (props) => MockIcon({ testID: 'jobs-icon', ...props }),
    UserIcon: (props) => MockIcon({ testID: 'user-icon', ...props }),
    AppIcon: MockAppIcon,
    EyeIcon: (props) => MockIcon({ testID: 'eye-icon', ...props }),
    EyeSlashIcon: (props) => MockIcon({ testID: 'eye-slash-icon', ...props }),
    DashboardIcon: (props) => MockIcon({ testID: 'dashboard-icon', ...props }),
    SettingsIcon: (props) => MockIcon({ testID: 'settings-icon', ...props }),
    MenuIcon: (props) => MockIcon({ testID: 'menu-icon', ...props }),
  };
});

// Silence console warnings
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};