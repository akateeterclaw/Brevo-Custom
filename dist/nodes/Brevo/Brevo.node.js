"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brevo = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
const helpers_1 = require("./helpers");
class Brevo {
    description = {
        displayName: 'Brevo',
        name: 'brevo',
        icon: {
            light: 'file:brevo.svg',
            dark: 'file:brevo.dark.svg',
        },
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'Work with Brevo contacts and lists',
        usableAsTool: true,
        defaults: {
            name: 'Brevo',
        },
        inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
        outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
        credentials: [
            {
                name: 'brevoApi',
                required: true,
            },
        ],
        requestDefaults: {
            baseURL: 'https://api.brevo.com/v3',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        },
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Contact List',
                        value: 'contactList',
                    },
                ],
                default: 'contactList',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['contactList'],
                    },
                },
                options: [
                    {
                        name: 'Add Contact to List',
                        value: 'addContactToList',
                        action: 'Add contact to list',
                        description: 'Add existing Brevo contacts to a list',
                    },
                ],
                default: 'addContactToList',
            },
            {
                displayName: 'List ID',
                name: 'listId',
                type: 'number',
                required: true,
                default: 0,
                typeOptions: {
                    minValue: 1,
                },
                displayOptions: {
                    show: {
                        resource: ['contactList'],
                        operation: ['addContactToList'],
                    },
                },
                description: 'Brevo contact list ID',
            },
            {
                displayName: 'Identifier Type',
                name: 'identifierType',
                type: 'options',
                required: true,
                default: 'emails',
                displayOptions: {
                    show: {
                        resource: ['contactList'],
                        operation: ['addContactToList'],
                    },
                },
                options: [
                    {
                        name: 'Contact IDs',
                        value: 'ids',
                    },
                    {
                        name: 'Emails',
                        value: 'emails',
                    },
                    {
                        name: 'External IDs',
                        value: 'extIds',
                    },
                ],
                description: 'The kind of existing contact identifier to send to Brevo',
            },
            {
                displayName: 'Input Mode',
                name: 'inputMode',
                type: 'options',
                required: true,
                default: 'text',
                displayOptions: {
                    show: {
                        resource: ['contactList'],
                        operation: ['addContactToList'],
                    },
                },
                options: [
                    {
                        name: 'Fixed Collection',
                        value: 'fixedCollection',
                    },
                    {
                        name: 'Text',
                        value: 'text',
                    },
                ],
                description: 'How to enter the contact identifiers',
            },
            {
                displayName: 'Identifier Values',
                name: 'identifierValues',
                type: 'string',
                required: true,
                default: '',
                typeOptions: {
                    rows: 4,
                },
                placeholder: 'name@example.com\nother@example.com',
                displayOptions: {
                    show: {
                        resource: ['contactList'],
                        operation: ['addContactToList'],
                        inputMode: ['text'],
                    },
                },
                description: 'Comma-separated or newline-separated contact identifiers',
            },
            {
                displayName: 'Identifiers',
                name: 'identifiers',
                type: 'fixedCollection',
                required: true,
                default: {
                    values: [
                        {
                            value: '',
                        },
                    ],
                },
                typeOptions: {
                    multipleValues: true,
                },
                displayOptions: {
                    show: {
                        resource: ['contactList'],
                        operation: ['addContactToList'],
                        inputMode: ['fixedCollection'],
                    },
                },
                options: [
                    {
                        displayName: 'Identifier',
                        name: 'values',
                        values: [
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                                required: true,
                            },
                        ],
                    },
                ],
                description: 'Existing contact identifiers to add to the list',
            },
        ],
    };
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const resource = this.getNodeParameter('resource', itemIndex);
                const operation = this.getNodeParameter('operation', itemIndex);
                if (resource !== 'contactList' || operation !== 'addContactToList') {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Unsupported Brevo operation.', {
                        itemIndex,
                    });
                }
                const listId = this.getNodeParameter('listId', itemIndex);
                const identifierType = this.getNodeParameter('identifierType', itemIndex);
                const inputMode = this.getNodeParameter('inputMode', itemIndex);
                let parsedValues;
                if (inputMode === 'fixedCollection') {
                    const identifiers = this.getNodeParameter('identifiers', itemIndex, {});
                    const values = (identifiers.values ?? [])
                        .map((identifier) => identifier.value?.trim() ?? '')
                        .filter((value) => value.length > 0);
                    parsedValues = (0, helpers_1.normalizeIdentifierValues)(values, identifierType);
                }
                else {
                    const identifierValues = this.getNodeParameter('identifierValues', itemIndex);
                    parsedValues = (0, helpers_1.parseIdentifierValues)(identifierValues, identifierType);
                }
                if (parsedValues.length === 0) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'At least one contact identifier must be provided.', { itemIndex });
                }
                const responseData = (await GenericFunctions_1.brevoApiRequest.call(this, 'POST', `/contacts/lists/${listId}/contacts/add`, (0, helpers_1.buildAddContactToListBody)(identifierType, parsedValues)));
                returnData.push({
                    json: responseData,
                    pairedItem: {
                        item: itemIndex,
                    },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error instanceof Error ? error.message : String(error),
                        },
                        pairedItem: {
                            item: itemIndex,
                        },
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)), { itemIndex });
            }
        }
        return [returnData];
    }
}
exports.Brevo = Brevo;
//# sourceMappingURL=Brevo.node.js.map