import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';

// Cognito configuration
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID!;
const clientId = process.env.AWS_COGNITO_CLIENT_ID!;
const clientSecret = process.env.AWS_COGNITO_CLIENT_SECRET!;

// Function to generate SECRET_HASH for Cognito
function generateSecretHash(username: string): string {
  return crypto
    .createHmac('SHA256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

export interface CreateCognitoUserParams {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  suppressWelcomeEmail?: boolean;
}

export class CognitoService {
  /**
   * Create a new user in AWS Cognito
   */
  static async createUser(params: CreateCognitoUserParams): Promise<string> {
    const { email, firstName, lastName, password, suppressWelcomeEmail = true } = params;

    try {
      // Create user in Cognito
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: firstName },
          { Name: 'family_name', Value: lastName },
        ],
        TemporaryPassword: password,
        MessageAction: suppressWelcomeEmail ? 'SUPPRESS' : undefined,
      });

      const cognitoUser = await cognitoClient.send(createUserCommand);
      const cognitoUserId = cognitoUser.User?.Username || email;

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);

      return cognitoUserId;
    } catch (error: any) {
      console.error('Cognito user creation failed:', error);
      throw new Error(`Failed to create user in Cognito: ${error.message}`);
    }
  }

  /**
   * Generate SECRET_HASH for Cognito operations
   */
  static generateSecretHash(username: string): string {
    return generateSecretHash(username);
  }

  /**
   * Get Cognito client instance
   */
  static getClient(): CognitoIdentityProviderClient {
    return cognitoClient;
  }

  /**
   * Get Cognito configuration
   */
  static getConfig() {
    return {
      userPoolId,
      clientId,
      clientSecret,
    };
  }
}
