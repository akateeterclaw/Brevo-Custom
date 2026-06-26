import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

type BrevoRequestContext =
	| IExecuteFunctions
	| IHookFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

export async function brevoApiRequest(
	this: BrevoRequestContext,
	method: IHttpRequestOptions['method'],
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
) {
	const options: IHttpRequestOptions = {
		method,
		url: `https://api.brevo.com/v3${endpoint}`,
		json: true,
		body,
		qs,
	};

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	if (Object.keys(qs).length === 0) {
		delete options.qs;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'brevoApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
