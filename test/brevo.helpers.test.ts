import { describe, expect, it } from 'vitest';

import {
	buildContactListMembershipBody,
	normalizeBrevoWebhookPayload,
	normalizeIdentifierValues,
	parseIdentifierValues,
} from '../nodes/Brevo/helpers';

describe('Brevo helper functions', () => {
	it('builds an email add-to-list body from comma and newline separated values', () => {
		const values = parseIdentifierValues('jeff32@example.com, jim56@example.com\nsam@example.com', 'emails');

		expect(values).toEqual(['jeff32@example.com', 'jim56@example.com', 'sam@example.com']);
		expect(buildContactListMembershipBody('emails', values)).toEqual({
			emails: ['jeff32@example.com', 'jim56@example.com', 'sam@example.com'],
		});
	});

	it('builds an ID add-to-list body using numeric contact IDs', () => {
		const values = parseIdentifierValues('123, 456\n789', 'ids');

		expect(values).toEqual([123, 456, 789]);
		expect(buildContactListMembershipBody('ids', values)).toEqual({
			ids: [123, 456, 789],
		});
	});

	it('builds an external ID add-to-list body', () => {
		const values = parseIdentifierValues('customer-1\ncustomer-2', 'extIds');

		expect(values).toEqual(['customer-1', 'customer-2']);
		expect(buildContactListMembershipBody('extIds', values)).toEqual({
			extIds: ['customer-1', 'customer-2'],
		});
	});

	it('normalizes fixed collection contact ID values', () => {
		const values = normalizeIdentifierValues(['123', '456'], 'ids');

		expect(values).toEqual([123, 456]);
	});

	it('rejects non-numeric contact IDs', () => {
		expect(() => parseIdentifierValues('123, abc', 'ids')).toThrow(
			'Contact IDs must be positive integers',
		);
	});

	it('normalizes a contact updated webhook payload while preserving the raw payload', () => {
		const payload = {
			id: 123456,
			email: 'example@domain.com',
			event: 'contact_updated',
			key: 'xxxxxxxxxxxxxxxxxx',
			content: [
				{
					name: 'John',
					lastname: 'Doe',
				},
			],
			date: '2020-10-09 00:00:00',
			ts: 1604937111,
		};

		expect(normalizeBrevoWebhookPayload(payload)).toEqual({
			event: 'contact_updated',
			email: 'example@domain.com',
			id: 123456,
			date: '2020-10-09 00:00:00',
			ts: 1604937111,
			raw: payload,
		});
	});

	it('normalizes an unsubscribe webhook payload using date_event and ts_event fallback fields', () => {
		const payload = {
			id: 123456,
			camp_id: 42,
			email: 'example@domain.com',
			campaign_name: 'My First Campaign',
			date_sent: '2020-10-09 00:00:00',
			date_event: '2020-10-09 00:00:00',
			event: 'unsubscribe',
			list_id: [3, 42],
			ts_sent: 1604933619,
			ts_event: 1604933737,
		};

		expect(normalizeBrevoWebhookPayload(payload)).toEqual({
			event: 'unsubscribe',
			email: 'example@domain.com',
			id: 123456,
			date: '2020-10-09 00:00:00',
			ts: 1604933737,
			raw: payload,
		});
	});
});
