"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevoApi = void 0;
class BrevoApi {
    name = 'brevoApi';
    displayName = 'Brevo API';
    documentationUrl = 'https://developers.brevo.com/docs/getting-started';
    icon = {
        light: 'file:brevo.svg',
        dark: 'file:brevo.dark.svg',
    };
    properties = [
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
        type: 'generic',
        properties: {
            headers: {
                'api-key': '={{$credentials.apiKey}}',
            },
        },
    };
    test = {
        request: {
            baseURL: 'https://api.brevo.com/v3',
            url: '/account',
            method: 'GET',
        },
    };
}
exports.BrevoApi = BrevoApi;
//# sourceMappingURL=BrevoApi.credentials.js.map