import type { ICredentialTestRequest, ICredentialType, INodeProperties, Icon } from 'n8n-workflow';
export declare class BrevoApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: Icon;
    properties: INodeProperties[];
    authenticate: {
        type: "generic";
        properties: {
            headers: {
                'api-key': string;
            };
        };
    };
    test: ICredentialTestRequest;
}
