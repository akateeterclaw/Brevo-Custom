import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class BrevoApi implements ICredentialType {
	name = 'brevoApi';

	displayName = 'Brevo API';

	documentationUrl = 'https://developers.brevo.com/docs/getting-started';

	icon: Icon = {
		light: 'file:brevo.svg',
		dark: 'file:brevo.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Brevo API key. It is sent in the api-key request header.',
		},
	];

	authenticate = {
		type: 'generic' as const,
		properties: {
			headers: {
				'api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.brevo.com/v3',
			url: '/account',
			method: 'GET',
		},
	};
}
