import { interfaces } from "inversify";
export interface ApiResponse<T> {
    response: Response;
    body?: T;
}
export declare abstract class ApiClient {
    protected _basePath: string;
    protected accessToken: string;
    constructor(basePath?: string, accessToken?: string);
    protected readonly defaultHeaders: {};
    execute<T>(method: string, path: string, queryParameters: {}, headerParams: {}, formParams: {}, isFile: boolean, isResponseFile: boolean, bodyParam?: string, ...authMethods: string[]): Promise<ApiResponse<T>>;
}
export declare function registerApiClient<T extends ApiClient>(iocContainer: interfaces.Container, serviceIdentifier: interfaces.ServiceIdentifier<T>, ctor: new (basePath?: string, accessToken?: string) => T, basePath: string, token?: string | (() => string)): void;
