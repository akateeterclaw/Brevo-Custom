# n8n-nodes-brevo-custom

Custom n8n community nodes for Brevo contact webhooks and list membership actions.

## Nodes

- **Brevo Trigger**: Registers a Brevo marketing webhook and starts workflows for:
  - `contactUpdated`
  - `unsubscribed`
- **Brevo**: Adds existing contacts to a Brevo list with:
  - Emails
  - Brevo contact IDs
  - External IDs

## Credentials

Create **Brevo API** credentials with a Brevo API key. The node sends it as the `api-key` header.

## Development

```bash
npm install
npm run lint
npm test
npm run build
npm run dev
```

The trigger needs a public n8n production webhook URL so Brevo can deliver events. If n8n is behind a reverse proxy, configure `WEBHOOK_URL` in n8n before activating the workflow.

## Brevo API Coverage

This package intentionally implements only:

- `POST /v3/webhooks` and `DELETE /v3/webhooks/:webhookId` for trigger lifecycle
- `POST /v3/contacts/lists/:listId/contacts/add` for adding existing contacts to lists

It does not create missing contacts and does not subscribe to transactional `blocked` events.
