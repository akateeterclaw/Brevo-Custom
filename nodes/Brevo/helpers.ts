import type { IDataObject } from 'n8n-workflow';

export type IdentifierType = 'emails' | 'ids' | 'extIds';

export function parseIdentifierValues(values: string, identifierType: IdentifierType): Array<string | number> {
	const parsedValues = values
		.split(/[\n,]/)
		.map((value) => value.trim())
		.filter((value) => value.length > 0);

	return normalizeIdentifierValues(parsedValues, identifierType);
}

export function normalizeIdentifierValues(
	values: string[],
	identifierType: IdentifierType,
): Array<string | number> {
	if (identifierType !== 'ids') {
		return values;
	}

	return values.map((value) => {
		const parsed = Number(value);
		if (!Number.isInteger(parsed) || parsed <= 0) {
			throw new Error(`Contact IDs must be positive integers. Received "${value}".`);
		}
		return parsed;
	});
}

export function buildContactListMembershipBody(
	identifierType: IdentifierType,
	values: Array<string | number>,
): IDataObject {
	return {
		[identifierType]: values,
	};
}

export function normalizeBrevoWebhookPayload(payload: IDataObject): IDataObject {
	return {
		event: payload.event,
		email: payload.email,
		id: payload.id,
		date: payload.date ?? payload.date_event,
		ts: payload.ts ?? payload.ts_event,
		raw: payload,
	};
}
