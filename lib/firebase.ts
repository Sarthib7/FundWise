import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Validate Firebase configuration
if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
  console.error('Firebase configuration error:', {
    projectId: firebaseConfig.projectId,
    databaseURL: firebaseConfig.databaseURL,
    apiKey: firebaseConfig.apiKey ? '***' : 'missing'
  })
  throw new Error('Firebase configuration is incomplete. Check your .env.local file.')
}

// Initialize Firebase (avoid duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Realtime Database with explicit URL
export const db = getDatabase(app, firebaseConfig.databaseURL)
