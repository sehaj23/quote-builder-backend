import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
export interface CreateCognitoUserParams {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    suppressWelcomeEmail?: boolean;
}
export declare class CognitoService {
    static createUser(params: CreateCognitoUserParams): Promise<string>;
    static generateSecretHash(username: string): string;
    static getClient(): CognitoIdentityProviderClient;
    static getConfig(): {
        userPoolId: string;
        clientId: string;
        clientSecret: string;
    };
}
//# sourceMappingURL=CognitoService.d.ts.map