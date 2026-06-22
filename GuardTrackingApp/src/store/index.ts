// Redux Store Configuration for Guard Tracking App
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Import reducers
import authReducer from './slices/authSlice';
import guardReducer from './slices/guardSlice';
import locationReducer from './slices/locationSlice';
import incidentReducer from './slices/incidentSlice';
import messageReducer from './slices/messageSlice';
import notificationReducer from './slices/notificationSlice';
import shiftReducer from './slices/shiftSlice';
import shiftReportReducer from './slices/shiftReportSlice';
import clientReducer from './slices/clientSlice';
import emergencyReducer from './slices/emergencySlice';
import chatReducer from './slices/chatSlice';
import adminReducer from './slices/adminSlice';

// Strip legacy token fields from persisted auth state
const authTransform = createTransform(
  (inboundState: Record<string, unknown>) => {
    if (!inboundState) return inboundState;
    const { token, refreshToken, ...safe } = inboundState;
    return safe;
  },
  (outboundState) => outboundState,
  { whitelist: ['auth'] }
);

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'],
  transforms: [authTransform],
};

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  guards: guardReducer,
  locations: locationReducer,
  incidents: incidentReducer,
  messages: messageReducer,
  notifications: notificationReducer,
  shifts: shiftReducer,
  shiftReports: shiftReportReducer,
  client: clientReducer,
  chat: chatReducer,
  emergency: emergencyReducer,
  admin: adminReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['locations.trackingData', 'incidents'],
      },
    }),
  devTools: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
});

// Persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
