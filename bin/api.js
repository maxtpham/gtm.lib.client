"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('es6-promise').polyfill();
require('isomorphic-fetch');
class ApiClient {
    constructor(basePath, accessToken) {
        this._basePath = 'http://localhost';
        if (!!basePath) {
            this._basePath = basePath;
        }
        if (!!accessToken) {
            this.accessToken = accessToken;
        }
    }
    get defaultHeaders() {
        return {};
    }
    queryParams(params) {
        return Object.keys(params)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&');
    }
    execute(method, path, queryParameters, headerParams, formParams, isFile, isResponseFile, bodyParam, ...authMethods) {
        const requestOptions = {
            method: method,
            headers: headerParams
        };
        requestOptions.headers["content-type"] = "application/json";
        if (bodyParam) {
            requestOptions.body = JSON.stringify(bodyParam);
        }
        if (queryParameters) {
            var esc = encodeURIComponent;
            var query = Object.keys(queryParameters)
                .map(k => esc(k) + '=' + esc(queryParameters[k]))
                .join('&');
            if (query.length > 0) {
                path += '?' + query;
            }
        }
        if (this.accessToken && requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }
        return new Promise((resolve, reject) => {
            fetch(this._basePath + path, requestOptions)
                .then(response => {
                if (!!response && response.status >= 200 && response.status < 300) {
                    if (response.status === 204) {
                        resolve({ response: response });
                    }
                    else {
                        response.json()
                            .then(body => resolve({ response: response, body: body }))
                            .catch(e => reject({ response: response, body: e }));
                    }
                }
                else {
                    reject({ response: response });
                }
            })
                .catch(e => reject(e));
        });
    }
}
exports.ApiClient = ApiClient;
function registerApiClient(iocContainer, serviceIdentifier, ctor, basePath, token) {
    if (!!iocContainer.bind(serviceIdentifier)) {
        iocContainer.rebind(serviceIdentifier).toDynamicValue(new ApiClientFactory(ctor, basePath, token).handler);
    }
    else {
        iocContainer.bind(serviceIdentifier).toDynamicValue(new ApiClientFactory(ctor, basePath, token).handler);
    }
}
exports.registerApiClient = registerApiClient;
class ApiClientFactory {
    constructor(ctor, basePath, token) {
        this.ctor = ctor;
        this.basePath = basePath;
        if (!!token) {
            this.token = token;
        }
    }
    createWithGetter() {
        return new this.ctor(this.basePath, this.token());
    }
    createWithValue() {
        return new this.ctor(this.basePath, this.token);
    }
    get handler() {
        return typeof (this.token) === 'function' ? this.createWithGetter.bind(this) : this.createWithValue.bind(this);
    }
}
//# sourceMappingURL=api.js.map