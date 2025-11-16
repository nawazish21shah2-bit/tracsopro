// Redux Store Configuration for Guard Tracking App
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
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
import chatReducer from './slices/chatSliceNew';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
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
      },
    }),
  devTools: __DEV__,
});

// Persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
