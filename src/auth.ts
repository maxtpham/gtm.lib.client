export module auth {

    export type OAuth2Provider = 'google' | 'facebook';

    export function getLoginUrl(userServiceUrl: string, provider: OAuth2Provider, applicationScheme: string) {
        return `${userServiceUrl}/pub/auth/login/${provider}?callback=` +
        encodeURIComponent(`${userServiceUrl}/web/auth/to?uri=` +
            encodeURIComponent(`${applicationScheme}://login/${provider}?token={TOKEN}`)
        )
    }

    export async function logout(
        dataRemover: (key: string) => Promise<void>
    ): Promise<void> {
        await dataRemover('auth.jwt');
    }

    export function token(
        dataGetter: (key: string) => Promise<string>
    ): Promise<string> {
        return dataGetter('auth.jwt');
    }
    
    export async function authenticate(
        userServiceUrl: string,
        initialUrlGetter: (() => Promise<string>) | string,
        dataGetter: (key: string) => Promise<string>,
        dataSetter: (key: string, value: string) => Promise<void>,
        dataRemover: (key: string) => Promise<void>
    ): Promise<string> {
        let initialUrlValue = await dataGetter('auth.initialUrl.value');
        let initialUrlProcessed = await dataGetter('auth.initialUrl.processed');
    
        const initialUrl = !initialUrlGetter ? (<string>undefined) : (typeof(initialUrlGetter) === 'function') ?  (await initialUrlGetter()) : (<string>initialUrlGetter);
        if (!!initialUrl && initialUrlValue !== initialUrl) {
            await dataSetter('auth.initialUrl.value', initialUrlValue = initialUrl);
            await dataSetter('auth.initialUrl.processed', initialUrlProcessed = '0');
            console.log(`[Auth] Found new InitialUrl: ${initialUrl}`);
        }
        let jwt: string;
        try {
            if (!!initialUrlValue && (!initialUrlProcessed || initialUrlProcessed == '0')) {
                jwt = await handleNewInitialUrl(userServiceUrl, initialUrlValue);
                await dataSetter('auth.jwt', jwt);
                await dataSetter('auth.initialUrl.processed', '1');
            }
        
            jwt = await dataGetter('auth.jwt');
            if (!!jwt && !(await isLoggedIn(userServiceUrl, jwt))) {
                console.log(`[Auth] Current Jwt Token is timed out & will be cleared`)
                await dataRemover('auth.jwt');
                return <any>undefined;
            }
        }
        catch (e) {
            console.log(`Error while logging in`, e);
            if (e && !(e instanceof String)) {
                // Logout only
                logout(dataRemover);
            }
            throw e;
        }
        return jwt;
    }
    
    async function handleNewInitialUrl(userServiceUrl: string, initialUrlValue: string): Promise<string> {
        const pos = initialUrlValue.indexOf('?token=');
        if (pos < 0) {
            return Promise.reject('[Auth] Invalid OAuth token InitialUrl');
        } else {
            let token = initialUrlValue.substr(pos + '?token='.length);
            const sharp = token.indexOf('#');
            if (sharp > 0) {
                token = token.substr(0, sharp);
            }
            console.log(`[Auth] Exchanging OAuth token: ${token}`);
            const jwt = await exchangeToken(userServiceUrl, token);
            console.log(`[Auth] New JWT token: ${jwt}`);
            return jwt;
        }
    }
    
    async function exchangeToken(userServiceUrl: string, token: string): Promise<string> {
        const response = await fetch(`${userServiceUrl}/web/auth/jwt?t=${encodeURIComponent(token)}`);
        if (!response.ok) {
            return Promise.reject(response.status === 401 ? response : `${response.status} - ${response.statusText}`);
        } else {
            return response.text();
        }
    }
    
    async function isLoggedIn(userServiceUrl: string, jwt: string): Promise<boolean> {
        const response = await fetch(`${userServiceUrl}/api/user/v1/system/loggedin`, {
            headers: {
                'Authorization': 'Bearer ' + jwt,
            }
        });
        if (!response.ok) {
            return Promise.reject(response.status === 401 ? response : `${response.status} - ${response.statusText}`);
        } else {
            return response.json();
        }
    }
}