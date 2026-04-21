import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

let cachedApp: FirebaseApp | null = null
let cachedDb: Database | null = null

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp
  if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    throw new Error(
      'Firebase configuration is incomplete. Set NEXT_PUBLIC_FIREBASE_* env vars in .env.local.'
    )
  }
  cachedApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  return cachedApp
}

export function getDb(): Database {
  if (cachedDb) return cachedDb
  cachedDb = getDatabase(getFirebaseApp(), firebaseConfig.databaseURL)
  return cachedDb
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    return Reflect.get(getDb() as unknown as object, prop)
  },
})
