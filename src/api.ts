require('es6-promise').polyfill();
require('isomorphic-fetch');

import { interfaces } from "inversify";

export interface ApiResponse<T> {
    response: Response;
    body?: T;
}

export abstract class ApiClient {
    protected _basePath = 'http://localhost';
    protected accessToken: string;

    constructor(basePath?: string, accessToken?: string) {
        if (!!basePath) {
            this._basePath = basePath;
        }
        if (!!accessToken) {
            this.accessToken = accessToken;
        }
    }

    protected get defaultHeaders() {
        return {};
    }

    protected queryParams(params) {
        return Object.keys(params)
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&');
    }

    public execute<T>(
        method: string, path: string, queryParameters: {}, headerParams: {}, formParams: {},
        isFile: boolean, isResponseFile: boolean, bodyParam, ...authMethods: string[]
    ): Promise<ApiResponse<T>> {
        const requestOptions: RequestInit = {
            method: method,
            headers: headerParams
        };
        requestOptions.headers["content-type"] = "application/json";
        if (bodyParam) {
            requestOptions.body = JSON.stringify(bodyParam);
        }

        if (method === 'GET') {
            path += '?t=' + Date.now();
        }

        if (queryParameters) {
            var esc = encodeURIComponent;
            var query = Object.keys(queryParameters)
                .map(k => esc(k) + '=' + esc(queryParameters[k]))
                .join('&');
            if (query.length > 0) {
                path += (method === 'GET' ? '&' : '?') + query;
            }
        }

        if (this.accessToken && requestOptions && requestOptions.headers) {
            requestOptions.headers["Authorization"] = "Bearer " + this.accessToken;
        }

        return new Promise<ApiResponse<T>>((resolve, reject) => {
            fetch(this._basePath + path, requestOptions)
                .then(response => {
                    if (!!response && response.status >= 200 && response.status < 300) {
                        if (response.status === 204) { // no content
                            resolve(<ApiResponse<T>>{ response: response});
                        } else {
                            response.json()
                                .then(body => resolve(<ApiResponse<T>>{ response: response, body: body }))
                                .catch(e => reject(<ApiResponse<T>>{ response: response, body: e }));
                        }
                    } else {
                        reject(<ApiResponse<T>>{ response: response });
                    }
                })
                .catch(e => reject(e));
        });
    }
}

export function registerApiClient<T extends ApiClient>(iocContainer: interfaces.Container, serviceIdentifier: interfaces.ServiceIdentifier<T>, ctor: new (basePath?: string, accessToken?: string) => T, basePath: string, token?: string | (() => string)) {
    if (!!iocContainer.bind<T>(serviceIdentifier)) {
        iocContainer.rebind<T>(serviceIdentifier).toDynamicValue(new ApiClientFactory<T>(ctor, basePath, token).handler);
    } else {
        iocContainer.bind<T>(serviceIdentifier).toDynamicValue(new ApiClientFactory<T>(ctor, basePath, token).handler);
    }
}

class ApiClientFactory<T extends ApiClient> {
    private ctor: new (basePath?: string, accessToken?: string) => T;
    private basePath: string;
    private token: string | (() => string);

    constructor(ctor: new (basePath?: string, accessToken?: string) => T, basePath: string, token?: string | (() => string)) {
        this.ctor = ctor;
        this.basePath = basePath;
        if (!!token) {
            this.token = token;
        }
    }

    private createWithGetter(): T {
        return new this.ctor(this.basePath, (<() => string>this.token)());
    }

    private createWithValue(): T {
        return new this.ctor(this.basePath, <string>this.token);
    }

    get handler(): (context: interfaces.Context) => T {
        return typeof (this.token) === 'function' ? this.createWithGetter.bind(this) : this.createWithValue.bind(this);
    }
}
