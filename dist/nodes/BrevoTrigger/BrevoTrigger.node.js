"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrevoTrigger = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("../Brevo/GenericFunctions");
const helpers_1 = require("../Brevo/helpers");
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
class BrevoTrigger {
    description = {
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
        outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                displayName: 'Brevo must be able to reach your n8n production webhook URL. Localhost URLs cannot receive Brevo webhooks.',
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
            async checkExists() {
                const webhookData = this.getWorkflowStaticData('node');
                if (webhookData.webhookId === undefined) {
                    return false;
                }
                try {
                    await GenericFunctions_1.brevoApiRequest.call(this, 'GET', `/webhooks/${webhookData.webhookId}`);
                    return true;
                }
                catch (error) {
                    delete webhookData.webhookId;
                    delete webhookData.webhookEvents;
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)));
                }
            },
            async create() {
                const webhookUrl = this.getNodeWebhookUrl('default');
                if (webhookUrl.includes('//localhost') || webhookUrl.includes('//127.0.0.1')) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Brevo webhooks cannot be registered to localhost. Configure n8n with a public WEBHOOK_URL.');
                }
                const events = this.getNodeParameter('events', []);
                const description = this.getNodeParameter('description', '');
                if (events.length === 0) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Select at least one Brevo event.');
                }
                const responseData = (await GenericFunctions_1.brevoApiRequest.call(this, 'POST', '/webhooks', {
                    url: webhookUrl,
                    type: 'marketing',
                    events,
                    description,
                }));
                if (responseData.id === undefined) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Brevo webhook creation response did not include an id.');
                }
                const webhookData = this.getWorkflowStaticData('node');
                webhookData.webhookId = responseData.id;
                webhookData.webhookEvents = events;
                return true;
            },
            async delete() {
                const webhookData = this.getWorkflowStaticData('node');
                if (webhookData.webhookId === undefined) {
                    return true;
                }
                try {
                    await GenericFunctions_1.brevoApiRequest.call(this, 'DELETE', `/webhooks/${webhookData.webhookId}`);
                }
                catch {
                    return false;
                }
                delete webhookData.webhookId;
                delete webhookData.webhookEvents;
                return true;
            },
        },
    };
    async webhook() {
        const payload = this.getBodyData();
        const subscribedEvents = this.getNodeParameter('events', []);
        const event = payload.event;
        const brevoEventMap = {
            contact_updated: 'contactUpdated',
            unsubscribe: 'unsubscribed',
        };
        const normalizedEvent = event === undefined ? undefined : (brevoEventMap[event] ?? event);
        if (normalizedEvent !== undefined && !subscribedEvents.includes(normalizedEvent)) {
            return {
                webhookResponse: 'OK',
            };
        }
        const normalizedPayload = (0, helpers_1.normalizeBrevoWebhookPayload)(payload);
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
exports.BrevoTrigger = BrevoTrigger;
//# sourceMappingURL=BrevoTrigger.node.js.map