"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var auth;
(function (auth) {
    function getLoginUrl(userServiceUrl, provider, applicationScheme) {
        return `${userServiceUrl}/pub/auth/login/${provider}?callback=` +
            encodeURIComponent(`${userServiceUrl}/web/auth/to?uri=` +
                encodeURIComponent(`${applicationScheme}://login/${provider}?token={TOKEN}`));
    }
    auth.getLoginUrl = getLoginUrl;
    function logout(dataRemover) {
        return __awaiter(this, void 0, void 0, function* () {
            yield dataRemover('auth.jwt');
        });
    }
    auth.logout = logout;
    function authenticate(userServiceUrl, initialUrlGetter, dataGetter, dataSetter, dataRemover) {
        return __awaiter(this, void 0, void 0, function* () {
            let initialUrlValue = yield dataGetter('auth.initialUrl.value');
            let initialUrlProcessed = yield dataGetter('auth.initialUrl.processed');
            const initialUrl = !initialUrlGetter ? undefined : (typeof (initialUrlGetter) === 'function') ? (yield initialUrlGetter()) : initialUrlGetter;
            if (!!initialUrl && initialUrlValue !== initialUrl) {
                yield dataSetter('auth.initialUrl.value', initialUrlValue = initialUrl);
                yield dataSetter('auth.initialUrl.processed', initialUrlProcessed = '0');
                console.log(`[Auth] Found new InitialUrl: ${initialUrl}`);
            }
            if (!!initialUrlValue && (!initialUrlProcessed || initialUrlProcessed == '0')) {
                const jwt = yield handleNewInitialUrl(userServiceUrl, initialUrlValue);
                yield dataSetter('auth.jwt', jwt);
                yield dataSetter('auth.initialUrl.processed', '1');
            }
            const jwt = yield dataGetter('auth.jwt');
            if (!!jwt && !isLoggedIn(userServiceUrl, jwt)) {
                console.log(`[Auth] Current Jwt Token is timed out & will be cleared`);
                yield dataRemover('auth.jwt');
                return undefined;
            }
            return jwt;
        });
    }
    auth.authenticate = authenticate;
    function handleNewInitialUrl(userServiceUrl, initialUrlValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const pos = initialUrlValue.indexOf('?token=');
            if (pos < 0) {
                return Promise.reject('[Auth] Invalid OAuth token InitialUrl');
            }
            else {
                let token = initialUrlValue.substr(pos + '?token='.length);
                while (token.length > 0 && token.endsWith('#')) {
                    token = token.substr(0, token.length - 1);
                }
                console.log(`[Auth] Exchanging OAuth token: ${token}`);
                const jwt = yield exchangeToken(userServiceUrl, token);
                console.log(`[Auth] New JWT token: ${jwt}`);
                return jwt;
            }
        });
    }
    function exchangeToken(userServiceUrl, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${userServiceUrl}/web/auth/jwt?t=${encodeURIComponent(token)}`);
            if (!response.ok) {
                return Promise.reject(`${response.status} - ${response.statusText}`);
            }
            else {
                return response.text();
            }
        });
    }
    function isLoggedIn(userServiceUrl, jwt) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${userServiceUrl}/api/v1/system/loggedin`, {
                headers: {
                    'Authorization': 'Bearer ' + jwt,
                }
            });
            if (!response.ok) {
                return Promise.reject(`${response.status} - ${response.statusText}`);
            }
            else {
                return response.json();
            }
        });
    }
})(auth = exports.auth || (exports.auth = {}));
//# sourceMappingURL=auth.js.map