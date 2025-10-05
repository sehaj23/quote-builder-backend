import { Request, Response } from 'express';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminInitiateAuthCommand, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserService } from '../services/UserService.js';
import { CompanyService } from '../services/CompanyService.js';
import { CompanyRepository } from '../repositories/CompanyRepository.js';
import { QuoteRepository } from '../repositories/QuoteRepository.js';

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

export class AuthController {
  static validateSignup = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ];

  static validateSignupWithCompany = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
    body('companyName').trim().isLength({ min: 1 }),
    body('companyAddress').optional().trim(),
    body('companyEmail').optional().isEmail().normalizeEmail(),
    body('companyPhone').optional().trim(),
  ];

  static validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
  ];

  static async signup(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists in database
      const existingUser = await UserService.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

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
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      const cognitoUser = await cognitoClient.send(createUserCommand);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true,
      });

      await cognitoClient.send(setPasswordCommand);

      // Create user in database (not approved by default)
      const user = await UserService.create({
        email,
        firstName,
        lastName,
        cognitoId: cognitoUser.User?.Username || email,
        isApproved: false,
      });

      return res.status(201).json({
        success: true,
        message: 'User created successfully. Awaiting admin approval.',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isApproved: user.isApproved,
        }
      });

    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.name === 'UsernameExistsException') {
        return res.status(400).json({
          success: false,
          message: 'User already exists in Cognito'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  }

  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Check if user exists in database
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found in database'
        });
      }

      // Check if user is approved
      if (user.isApproved === false) {
        return res.status(403).json({
          success: false,
          message: 'User account is not approved yet'
        });
      }

      // Authenticate with Cognito
      const authCommand = new AdminInitiateAuthCommand({
        UserPoolId: userPoolId,
        ClientId: clientId,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: generateSecretHash(email),
        },
      });

      const authResult = await cognitoClient.send(authCommand);

      if (!authResult.AuthenticationResult) {
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }

      // Update user's last activity
      await UserService.updateLastActivity(user.id);

      // Generate our own JWT token for session management
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          cognitoId: user.cognito_id,
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isApproved: user.isApproved || user.is_approved,
            isSuperUser: user.isSuperUser || user.is_super_user,
            company_id: user.company_id,
          },
          token,
          cognitoTokens: {
            accessToken: authResult.AuthenticationResult.AccessToken,
            idToken: authResult.AuthenticationResult.IdToken,
            refreshToken: authResult.AuthenticationResult.RefreshToken,
          }
        }
      });

    } catch (error: any) {
      console.error('Login error:', error);

      if (error.name === 'NotAuthorizedException') {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      if (error.name === 'UserNotConfirmedException') {
        return res.status(401).json({
          success: false,
          message: 'User account is not confirmed'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  static async getUserInfo(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email parameter is required'
        });
      }

      // Get user from database
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isApproved: user.isApproved,
          isSuperUser: user.isSuperUser,
          createdAt: user.createdAt,
          lastActivityAt: user.lastActivityAt,
        }
      });

    } catch (error: any) {
      console.error('Get user info error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user info',
        error: error.message
      });
    }
  }

  static async forgotPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      // Check if user exists in database
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Initiate password reset in Cognito
      const { ForgotPasswordCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const forgotPasswordCommand = new ForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
      });

      await cognitoClient.send(forgotPasswordCommand);

      return res.json({
        success: true,
        message: 'Password reset email sent'
      });

    } catch (error: any) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate password reset',
        error: error.message
      });
    }
  }

  static async signupWithCompany(req: Request, res: Response): Promise<Response> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        companyName, 
        companyAddress, 
        companyEmail, 
        companyPhone 
      } = req.body;

      // Check if user already exists in database
      const existingUser = await UserService.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Initialize company service
      const companyRepository = new CompanyRepository();
      const quoteRepository = new QuoteRepository();
      const companyService = new CompanyService(companyRepository, quoteRepository);

      let cognitoUser;
      let createdCompany;
      let user;

      try {
        // Step 1: Create user in Cognito
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
          MessageAction: 'SUPPRESS',
        });

        cognitoUser = await cognitoClient.send(createUserCommand);

        // Set permanent password
        const setPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: email,
          Password: password,
          Permanent: true,
        });

        await cognitoClient.send(setPasswordCommand);

        // Step 2: Create company
        createdCompany = await companyService.createCompany({
          name: companyName,
          address: companyAddress || undefined,
          email: companyEmail || undefined,
          phone: companyPhone || undefined,
        });

        // Step 3: Create user in database with company_id
        user = await UserService.create({
          email,
          firstName,
          lastName,
          cognitoId: cognitoUser.User?.Username || email,
          isApproved: true,
          company_id: createdCompany.id,
        });

        // Generate JWT token for immediate login
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            cognitoId: user.cognito_id,
          },
          process.env.JWT_SECRET!,
          { expiresIn: '24h' }
        );

        // Authenticate with Cognito to get tokens
        const authCommand = new AdminInitiateAuthCommand({
          UserPoolId: userPoolId,
          ClientId: clientId,
          AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: generateSecretHash(email),
          },
        });

        const authResult = await cognitoClient.send(authCommand);

        return res.status(201).json({
          success: true,
          message: 'User and company created successfully',
          data: {
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              isApproved: user.isApproved || user.is_approved,
              isSuperUser: user.isSuperUser || user.is_super_user,
              company_id: user.company_id,
            },
            token,
            cognitoTokens: {
              accessToken: authResult.AuthenticationResult?.AccessToken,
              idToken: authResult.AuthenticationResult?.IdToken,
              refreshToken: authResult.AuthenticationResult?.RefreshToken,
            }
          }
        });

      } catch (cleanupError) {
        console.error('Error during signup process, attempting cleanup:', cleanupError);
        
        // Cleanup in reverse order
        if (user) {
          try {
            await UserService.deleteUser(user.id);
          } catch (e) {
            console.error('Failed to cleanup user:', e);
          }
        }
        
        if (createdCompany) {
          try {
            await companyService.deleteCompany(createdCompany.id);
          } catch (e) {
            console.error('Failed to cleanup company:', e);
          }
        }
        
        if (cognitoUser) {
          try {
            const { AdminDeleteUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
            const deleteUserCommand = new AdminDeleteUserCommand({
              UserPoolId: userPoolId,
              Username: email,
            });
            await cognitoClient.send(deleteUserCommand);
          } catch (e) {
            console.error('Failed to cleanup Cognito user:', e);
          }
        }
        
        throw cleanupError;
      }

    } catch (error: any) {
      console.error('SignupWithCompany error:', error);
      
      if (error.name === 'UsernameExistsException') {
        return res.status(400).json({
          success: false,
          message: 'User already exists in Cognito'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create user and company',
        error: error.message
      });
    }
  }

  static async validateSession(req: Request, res: Response): Promise<Response> {
    try {
      // The authenticateToken middleware has already validated the JWT token
      // If we reach this point, the session is valid
      const user = (req as any).user; // Set by authenticateToken middleware

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session - no user data'
        });
      }

      // Get fresh user data from database to ensure user still exists and is approved
      const currentUser = await UserService.findByEmail(user.email);
      
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session - user not found'
        });
      }

      if (currentUser.isApproved === false) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session - user not approved'
        });
      }

      // Update user's last activity
      await UserService.updateLastActivity(currentUser.id);

      return res.json({
        success: true,
        message: 'Session is valid',
        data: {
          user: {
            id: currentUser.id,
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            isApproved: currentUser.isApproved || currentUser.is_approved,
            isSuperUser: currentUser.isSuperUser || currentUser.is_super_user,
            company_id: currentUser.company_id,
          }
        }
      });

    } catch (error: any) {
      console.error('Validate session error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate session',
        error: error.message
      });
    }
  }
}