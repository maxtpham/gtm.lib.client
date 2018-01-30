export declare module auth {
    type OAuth2Provider = 'google' | 'facebook';
    function getLoginUrl(userServiceUrl: string, provider: OAuth2Provider, applicationScheme: string): string;
    function logout(dataRemover: (key: string) => Promise<void>): Promise<void>;
    function authenticate(userServiceUrl: string, initialUrlGetter: (() => Promise<string>) | string, dataGetter: (key: string) => Promise<string>, dataSetter: (key: string, value: string) => Promise<void>, dataRemover: (key: string) => Promise<void>): Promise<string>;
}
