
// This file is deprecated. Please use hooks from '@/firebase' instead.
// Redirecting to centralized SDKs to avoid "Invalid API Key" errors.
import { initializeFirebase } from "@/firebase";

const sdks = initializeFirebase();
export const auth = sdks.auth;
export const db = sdks.firestore;
