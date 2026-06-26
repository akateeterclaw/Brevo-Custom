import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { brevoApiRequest } from './GenericFunctions';
import {
	buildAddContactToListBody,
	type IdentifierType,
	normalizeIdentifierValues,
	parseIdentifierValues,
} from './helpers';

export class Brevo implements INodeType {
	description: INodeTypeDescription = {
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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				if (resource !== 'contactList' || operation !== 'addContactToList') {
					throw new NodeOperationError(this.getNode(), 'Unsupported Brevo operation.', {
						itemIndex,
					});
				}

				const listId = this.getNodeParameter('listId', itemIndex) as number;
				const identifierType = this.getNodeParameter(
					'identifierType',
					itemIndex,
				) as IdentifierType;
				const inputMode = this.getNodeParameter('inputMode', itemIndex) as string;
				let parsedValues: Array<string | number>;

				if (inputMode === 'fixedCollection') {
					const identifiers = this.getNodeParameter('identifiers', itemIndex, {}) as {
						values?: Array<{ value?: string }>;
					};
					const values = (identifiers.values ?? [])
						.map((identifier) => identifier.value?.trim() ?? '')
						.filter((value) => value.length > 0);
					parsedValues = normalizeIdentifierValues(values, identifierType);
				} else {
					const identifierValues = this.getNodeParameter('identifierValues', itemIndex) as string;
					parsedValues = parseIdentifierValues(identifierValues, identifierType);
				}

				if (parsedValues.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one contact identifier must be provided.',
						{ itemIndex },
					);
				}

				const responseData = (await brevoApiRequest.call(
					this,
					'POST',
					`/contacts/lists/${listId}/contacts/add`,
					buildAddContactToListBody(identifierType, parsedValues),
				)) as IDataObject;

				returnData.push({
					json: responseData,
					pairedItem: {
						item: itemIndex,
					},
				});
			} catch (error) {
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

				throw new NodeOperationError(
					this.getNode(),
					error instanceof Error ? error : new Error(String(error)),
					{ itemIndex },
				);
			}
		}

		return [returnData];
	}
}
