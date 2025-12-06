import { jest } from '@jest/globals';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.AWS_REGION = process.env.AWS_REGION || 'ap-southeast-2';
process.env.AWS_S3_REGION = process.env.AWS_S3_REGION || 'ap-southeast-2';
process.env.AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'test-bucket';
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test-secret-key';
process.env.AWS_COGNITO_USER_POOL_ID = process.env.AWS_COGNITO_USER_POOL_ID || 'test-user-pool';
process.env.AWS_COGNITO_CLIENT_ID = process.env.AWS_COGNITO_CLIENT_ID || 'test-client-id';
process.env.AWS_COGNITO_CLIENT_SECRET = process.env.AWS_COGNITO_CLIENT_SECRET || 'test-client-secret';

jest.mock('express-validator', () => {
  const actual = jest.requireActual<typeof import('express-validator')>('express-validator');
  return {
    ...actual,
    validationResult: jest.fn().mockImplementation(() => ({
      isEmpty: () => true,
      array: () => []
    }))
  };
});

jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn(async () => ({} as Record<string, unknown>));
  class MockS3Client {
    send = mockSend;
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: jest.fn().mockImplementation((input) => input),
    DeleteObjectCommand: jest.fn().mockImplementation((input) => input),
    CreateBucketCommand: jest.fn().mockImplementation((input) => input),
    HeadBucketCommand: jest.fn().mockImplementation((input) => input),
    PutBucketPolicyCommand: jest.fn().mockImplementation((input) => input),
    PutBucketCorsCommand: jest.fn().mockImplementation((input) => input),
    PutPublicAccessBlockCommand: jest.fn().mockImplementation((input) => input),
    BucketLocationConstraint: {}
  };
});

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  const mockSend = jest.fn(async () => ({
    User: { Username: 'test-user' },
    AuthenticationResult: {
      AccessToken: 'access',
      IdToken: 'id',
      RefreshToken: 'refresh'
    }
  }));

  class MockCognitoClient {
    send = mockSend;
  }

  return {
    CognitoIdentityProviderClient: MockCognitoClient,
    AdminCreateUserCommand: jest.fn().mockImplementation((input) => input),
    AdminSetUserPasswordCommand: jest.fn().mockImplementation((input) => input),
    AdminInitiateAuthCommand: jest.fn().mockImplementation((input) => input),
    AdminDeleteUserCommand: jest.fn().mockImplementation((input) => input),
    ForgotPasswordCommand: jest.fn().mockImplementation((input) => input),
    AuthFlowType: { ADMIN_USER_PASSWORD_AUTH: 'ADMIN_USER_PASSWORD_AUTH' }
  };
});

jest.mock('../src/services/UserService.js', () => {
  return {
    UserService: {
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateLastActivity: jest.fn(),
      deleteUser: jest.fn()
    }
  };
});

