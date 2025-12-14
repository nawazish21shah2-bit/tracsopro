import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';

const require = createRequire(import.meta.url);

let firebaseAdmin: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Supports multiple initialization methods:
 * 1. Service account JSON file path (FIREBASE_SERVICE_ACCOUNT_PATH)
 * 2. Service account JSON content as environment variable (FIREBASE_SERVICE_ACCOUNT)
 * 3. Individual credentials from environment variables
 * 4. Default credentials (for GCP environments)
 */
export function initializeFirebaseAdmin(): admin.app.App | null {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      firebaseAdmin = admin.apps[0] as admin.app.App;
      logger.info('Firebase Admin already initialized');
      return firebaseAdmin;
    }

    // Method 1: Service account JSON file path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      const resolvedPath = serviceAccountPath.startsWith('/') 
        ? serviceAccountPath 
        : resolve(process.cwd(), serviceAccountPath);
      
      if (!existsSync(resolvedPath)) {
        logger.error(`Firebase service account file not found: ${resolvedPath}`);
        return null;
      }

      const serviceAccount = require(resolvedPath);
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info(`Firebase Admin initialized from service account file: ${resolvedPath}`);
      return firebaseAdmin;
    }

    // Method 2: Service account JSON as environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase Admin initialized from service account JSON');
      return firebaseAdmin;
    }

    // Method 3: Individual credentials from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      logger.info('Firebase Admin initialized from environment variables');
      return firebaseAdmin;
    }

    // Method 4: Try default credentials (for GCP environments)
    try {
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      logger.info('Firebase Admin initialized with default credentials (GCP)');
      return firebaseAdmin;
    } catch (defaultError: any) {
      logger.warn('Firebase Admin not initialized: No credentials found. Push notifications will be disabled.');
      return null;
    }
  } catch (error: any) {
    logger.error('Error initializing Firebase Admin:', error);
    return null;
  }
}

export function getFirebaseAdmin(): admin.app.App | null {
  if (!firebaseAdmin) {
    return initializeFirebaseAdmin();
  }
  return firebaseAdmin;
}

export function isFirebaseAdminInitialized(): boolean {
  return firebaseAdmin !== null && admin.apps.length > 0;
}

export default getFirebaseAdmin;

