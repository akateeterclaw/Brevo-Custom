import { describe, expect, it, vi } from 'vitest';

import { BrevoTrigger } from '../nodes/BrevoTrigger/BrevoTrigger.node';

describe('BrevoTrigger webhook lifecycle', () => {
	it('stores the Brevo webhook ID and selected events on create', async () => {
		const trigger = new BrevoTrigger();
		const staticData: Record<string, unknown> = {};
		const create = trigger.webhookMethods.default.create;
		const httpRequestWithAuthentication = vi.fn().mockResolvedValue({ id: 987 });
		const context = {
			getNode: () => ({ name: 'Brevo Trigger', type: 'brevoTrigger' }),
			getNodeWebhookUrl: () => 'https://n8n.example.com/webhook/brevo',
			getNodeParameter: (name: string) => {
				if (name === 'events') return ['contactUpdated', 'unsubscribed'];
				if (name === 'description') return 'n8n Brevo Trigger';
				return undefined;
			},
			getWorkflowStaticData: () => staticData,
			helpers: {
				httpRequestWithAuthentication,
			},
		};

		await expect(create.call(context as never)).resolves.toBe(true);

		expect(staticData).toEqual({
			webhookId: 987,
			webhookEvents: ['contactUpdated', 'unsubscribed'],
		});
		expect(httpRequestWithAuthentication).toHaveBeenCalledWith('brevoApi', {
			method: 'POST',
			url: 'https://api.brevo.com/v3/webhooks',
			json: true,
			body: {
				url: 'https://n8n.example.com/webhook/brevo',
				type: 'marketing',
				events: ['contactUpdated', 'unsubscribed'],
				description: 'n8n Brevo Trigger',
			},
		});
	});

	it('deletes the stored Brevo webhook ID on deactivate', async () => {
		const trigger = new BrevoTrigger();
		const staticData: Record<string, unknown> = {
			webhookId: 987,
			webhookEvents: ['contactUpdated'],
		};
		const deleteWebhook = trigger.webhookMethods.default.delete;
		const httpRequestWithAuthentication = vi.fn().mockResolvedValue({});
		const context = {
			getNode: () => ({ name: 'Brevo Trigger', type: 'brevoTrigger' }),
			getWorkflowStaticData: () => staticData,
			helpers: {
				httpRequestWithAuthentication,
			},
		};

		await expect(deleteWebhook.call(context as never)).resolves.toBe(true);

		expect(staticData).toEqual({});
		expect(httpRequestWithAuthentication).toHaveBeenCalledWith('brevoApi', {
			method: 'DELETE',
			url: 'https://api.brevo.com/v3/webhooks/987',
			json: true,
		});
	});
});
