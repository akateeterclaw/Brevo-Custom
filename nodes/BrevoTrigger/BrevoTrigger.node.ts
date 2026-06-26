import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { brevoApiRequest } from '../Brevo/GenericFunctions';
import { normalizeBrevoWebhookPayload } from '../Brevo/helpers';

const eventOptions = [
	{
		name: 'Contact Updated',
		value: 'contactUpdated',
		description: 'Triggered when a Brevo contact is updated',
	},
	{
		name: 'Unsubscribed',
		value: 'unsubscribed',
		description: 'Triggered when a Brevo contact unsubscribes from a marketing email',
	},
];

export class BrevoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Brevo Trigger',
		name: 'brevoTrigger',
		icon: {
			light: 'file:brevo.svg',
			dark: 'file:brevo.dark.svg',
		},
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow from Brevo marketing contact webhooks',
		usableAsTool: true,
		defaults: {
			name: 'Brevo Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'brevoApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'Brevo must be able to reach your n8n production webhook URL. Localhost URLs cannot receive Brevo webhooks.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['contactUpdated'],
				options: eventOptions,
				description: 'Brevo marketing webhook events to subscribe to',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: 'n8n Brevo Trigger',
				description: 'Description to store on the Brevo webhook',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined) {
					return false;
				}

				try {
					await brevoApiRequest.call(this, 'GET', `/webhooks/${webhookData.webhookId}`);
					return true;
				} catch (error) {
					delete webhookData.webhookId;
					delete webhookData.webhookEvents;
					throw new NodeOperationError(
						this.getNode(),
						error instanceof Error ? error : new Error(String(error)),
					);
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				if (webhookUrl.includes('//localhost') || webhookUrl.includes('//127.0.0.1')) {
					throw new NodeOperationError(
						this.getNode(),
						'Brevo webhooks cannot be registered to localhost. Configure n8n with a public WEBHOOK_URL.',
					);
				}

				const events = this.getNodeParameter('events', []) as string[];
				const description = this.getNodeParameter('description', '') as string;

				if (events.length === 0) {
					throw new NodeOperationError(this.getNode(), 'Select at least one Brevo event.');
				}

				const responseData = (await brevoApiRequest.call(this, 'POST', '/webhooks', {
					url: webhookUrl,
					type: 'marketing',
					events,
					description,
				})) as IDataObject;

				if (responseData.id === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						'Brevo webhook creation response did not include an id.',
					);
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = responseData.id as string | number;
				webhookData.webhookEvents = events;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined) {
					return true;
				}

				try {
					await brevoApiRequest.call(this, 'DELETE', `/webhooks/${webhookData.webhookId}`);
				} catch {
					return false;
				}

				delete webhookData.webhookId;
				delete webhookData.webhookEvents;

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const payload = this.getBodyData() as IDataObject;
		const subscribedEvents = this.getNodeParameter('events', []) as string[];
		const event = payload.event as string | undefined;
		const brevoEventMap: Record<string, string> = {
			contact_updated: 'contactUpdated',
			unsubscribe: 'unsubscribed',
		};
		const normalizedEvent = event === undefined ? undefined : (brevoEventMap[event] ?? event);

		if (normalizedEvent !== undefined && !subscribedEvents.includes(normalizedEvent)) {
			return {
				webhookResponse: 'OK',
			};
		}

		const normalizedPayload = normalizeBrevoWebhookPayload(payload);

		return {
			workflowData: [
				this.helpers.returnJsonArray([
					{
						...normalizedPayload,
						raw: payload,
					},
				]),
			],
		};
	}
}
