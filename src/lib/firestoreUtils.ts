import { User as FirebaseUser } from 'firebase/auth';

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null, user: FirebaseUser | null) {
  if (error.code === 'permission-denied') {
    const errorInfo: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: user?.uid || 'anonymous',
        email: user?.email || 'none',
        emailVerified: user?.emailVerified || false,
        isAnonymous: user?.isAnonymous || true,
        providerInfo: user?.providerData.map(p => ({
            providerId: p.providerId,
            displayName: p.displayName || '',
            email: p.email || ''
        })) || []
      }
    };
    console.warn('[FIRESTORE] Permission Denied (might resolve after sync):', JSON.stringify(errorInfo));
    // We log but don't THROW here to avoid crashing the whole React tree during state transitions
    // return errorInfo; 
  } else {
    console.error('[FIRESTORE] Error:', error);
    throw error;
  }
}
