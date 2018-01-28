"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    execute(method, path, queryParameters, headerParams, formParams, isFile, isResponseFile, bodyParam, ...authMethods) {
        const requestOptions = {
            method: method,
            headers: headerParams
        };
        if (bodyParam) {
            requestOptions.body = JSON.parse(bodyParam);
        }
        if (this.accessToken && requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }
        return new Promise((resolve, reject) => {
            fetch(this._basePath + path, requestOptions)
                .catch(e => reject(e))
                .then(response => {
                if (!!response && response.status >= 200 && response.status < 300) {
                    response.json()
                        .catch(e => reject({ response: response, body: e }))
                        .then(body => resolve({ response: response, body: body }));
                }
                else {
                    reject({ response: response });
                }
            });
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
//# sourceMappingURL=index.js.map