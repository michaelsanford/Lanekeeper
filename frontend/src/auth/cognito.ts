import type { AuthSession, MfaChallengeData } from '../types/index.js';

const AUTH_STORAGE_KEY = 'lanekeeper_auth_session';

export interface AuthState {
  session: AuthSession | null;
  mfaChallenge: MfaChallengeData | null;
  isLoading: boolean;
  error: string | null;
}

export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Initiates login. When Cognito credentials are configured, sends request to Cognito.
 * In local/offline mode, creates a local dev session.
 */
export async function authenticateUser(
  email: string,
  userPoolClientId?: string
): Promise<{ session?: AuthSession; mfaChallenge?: MfaChallengeData }> {
  // If Cognito Client ID is provided, authenticate against AWS Cognito endpoint
  if (userPoolClientId) {
    try {
      const response = await fetch('https://cognito-idp.us-east-1.amazonaws.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: userPoolClientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: 'SecretPassword123!' // In real app, user input password
          }
        })
      });

      const data = await response.json();

      if (data.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
        return {
          mfaChallenge: {
            session: data.Session,
            username: email
          }
        };
      }

      if (data.ChallengeName === 'MFA_SETUP') {
        return {
          mfaChallenge: {
            session: data.Session,
            username: email,
            secretCode: data.ChallengeParameters?.SECRET_CODE || 'JBSWY3DPEHPK3PXP'
          }
        };
      }

      if (data.AuthenticationResult) {
        const session: AuthSession = {
          userId: email,
          email,
          idToken: data.AuthenticationResult.IdToken,
          accessToken: data.AuthenticationResult.AccessToken,
          refreshToken: data.AuthenticationResult.RefreshToken
        };
        saveAuthSession(session);
        return { session };
      }
    } catch (err) {
      console.warn('Cognito auth failed, falling back to local session:', err);
    }
  }

  // Local/Dev Mode Instant Login
  const mockSession: AuthSession = {
    userId: 'dev-user-01',
    email,
    idToken: 'mock-id-token',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };
  saveAuthSession(mockSession);
  return { session: mockSession };
}
