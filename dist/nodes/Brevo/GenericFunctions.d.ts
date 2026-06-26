import type { IDataObject, IExecuteFunctions, IHookFunctions, IHttpRequestOptions, ILoadOptionsFunctions, IWebhookFunctions } from 'n8n-workflow';
type BrevoRequestContext = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IWebhookFunctions;
export declare function brevoApiRequest(this: BrevoRequestContext, method: IHttpRequestOptions['method'], endpoint: string, body?: IDataObject, qs?: IDataObject): Promise<any>;
export {};
