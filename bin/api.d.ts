import { interfaces } from "inversify";
export interface ApiResponse<T> {
    response: Response;
    body?: T;
}
export declare type ApiFilter = (path: string, options: RequestInit) => string;
export declare abstract class ApiClient {
    /** to process the requestOptions then return new path if changed, requestOptions also can be updated */
    static Filters: ApiFilter[];
    protected _basePath: string;
    protected accessToken: string;
    constructor(basePath?: string, accessToken?: string);
    protected readonly defaultHeaders: {};
    protected queryParams(params: any): string;
    execute<T>(method: string, path: string, queryParameters: {}, headerParams: {}, formParams: {}, isFile: boolean, isResponseFile: boolean, bodyParam: any, ...authMethods: string[]): Promise<ApiResponse<T>>;
}
export declare function registerApiClient<T extends ApiClient>(iocContainer: interfaces.Container, serviceIdentifier: interfaces.ServiceIdentifier<T>, ctor: new (basePath?: string, accessToken?: string) => T, basePath: string, token?: string | (() => string)): void;
