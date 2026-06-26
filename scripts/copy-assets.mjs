import { cp, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const assets = [
	['nodes/Brevo/brevo.svg', 'dist/nodes/Brevo/brevo.svg'],
	['nodes/Brevo/brevo.dark.svg', 'dist/nodes/Brevo/brevo.dark.svg'],
	['nodes/BrevoTrigger/brevo.svg', 'dist/nodes/BrevoTrigger/brevo.svg'],
	['nodes/BrevoTrigger/brevo.dark.svg', 'dist/nodes/BrevoTrigger/brevo.dark.svg'],
	['credentials/brevo.svg', 'dist/credentials/brevo.svg'],
	['credentials/brevo.dark.svg', 'dist/credentials/brevo.dark.svg'],
];

await Promise.all(
	assets.map(async ([from, to]) => {
		await mkdir(dirname(to), { recursive: true });
		await cp(from, to);
	}),
);
