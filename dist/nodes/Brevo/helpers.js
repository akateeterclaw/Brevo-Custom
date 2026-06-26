"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIdentifierValues = parseIdentifierValues;
exports.normalizeIdentifierValues = normalizeIdentifierValues;
exports.buildContactListMembershipBody = buildContactListMembershipBody;
exports.normalizeBrevoWebhookPayload = normalizeBrevoWebhookPayload;
function parseIdentifierValues(values, identifierType) {
    const parsedValues = values
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    return normalizeIdentifierValues(parsedValues, identifierType);
}
function normalizeIdentifierValues(values, identifierType) {
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
function buildContactListMembershipBody(identifierType, values) {
    return {
        [identifierType]: values,
    };
}
function normalizeBrevoWebhookPayload(payload) {
    return {
        event: payload.event,
        email: payload.email,
        id: payload.id,
        date: payload.date ?? payload.date_event,
        ts: payload.ts ?? payload.ts_event,
        raw: payload,
    };
}
//# sourceMappingURL=helpers.js.map