module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
  dependencies: {
    '@stripe/stripe-react-native': {
      platforms: {
        android: null, // Disable Android platform, causing build errors
      },
    },
  },
};
