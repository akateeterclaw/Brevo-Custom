"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brevoApiRequest = brevoApiRequest;
const n8n_workflow_1 = require("n8n-workflow");
async function brevoApiRequest(method, endpoint, body = {}, qs = {}) {
    const options = {
        method,
        url: `https://api.brevo.com/v3${endpoint}`,
        json: true,
        body,
        qs,
    };
    if (Object.keys(body).length === 0) {
        delete options.body;
    }
    if (Object.keys(qs).length === 0) {
        delete options.qs;
    }
    try {
        return await this.helpers.httpRequestWithAuthentication.call(this, 'brevoApi', options);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error);
    }
}
//# sourceMappingURL=GenericFunctions.js.map