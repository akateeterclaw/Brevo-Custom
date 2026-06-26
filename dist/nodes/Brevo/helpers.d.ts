import type { IDataObject } from 'n8n-workflow';
export type IdentifierType = 'emails' | 'ids' | 'extIds';
export declare function parseIdentifierValues(values: string, identifierType: IdentifierType): Array<string | number>;
export declare function normalizeIdentifierValues(values: string[], identifierType: IdentifierType): Array<string | number>;
export declare function buildContactListMembershipBody(identifierType: IdentifierType, values: Array<string | number>): IDataObject;
export declare function normalizeBrevoWebhookPayload(payload: IDataObject): IDataObject;
