import { spawnSync } from 'node:child_process';

const allowedPath = 'node_modules/aws-cdk-lib/node_modules/brace-expansion';
const allowedAdvisories = new Set([
  'https://github.com/advisories/GHSA-q2hr-2g5m-vwhr',
  'https://github.com/advisories/GHSA-qhr7-859c-m2p7',
  'https://github.com/advisories/GHSA-6j4f-fj2g-mc7p',
]);

const result = spawnSync('npm', ['audit', '--audit-level=high', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

let report;
try {
  report = JSON.parse(result.stdout || '{}');
} catch {
  process.stderr.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  console.error('npm audit did not return valid JSON.');
  process.exit(1);
}

const severityRank = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const blocking = [];
const temporarilyAccepted = [];

for (const [name, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
  const severity = vulnerability?.severity ?? 'info';
  if ((severityRank[severity] ?? 0) < severityRank.high) continue;

  const nodes = Array.isArray(vulnerability.nodes) ? vulnerability.nodes : [];
  const advisoryUrls = (Array.isArray(vulnerability.via) ? vulnerability.via : [])
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => entry.url)
    .filter(Boolean);

  const isKnownCdkBundle =
    name === 'brace-expansion' &&
    nodes.length > 0 &&
    nodes.every((node) => node === allowedPath) &&
    advisoryUrls.length > 0 &&
    advisoryUrls.every((url) => allowedAdvisories.has(url));

  if (isKnownCdkBundle) {
    temporarilyAccepted.push({ name, severity, nodes, advisoryUrls });
  } else {
    blocking.push({ name, ...vulnerability });
  }
}

if (temporarilyAccepted.length > 0) {
  console.warn(
    'Temporary exception: aws-cdk-lib 2.272.0 bundles brace-expansion 5.0.9. ' +
    'The exception is limited to the CDK-only path and three known DoS advisories. ' +
    'Remove it when AWS CDK publishes a bundle with brace-expansion >=5.0.12.',
  );
}

if (blocking.length > 0) {
  console.error('Blocking high/critical npm audit findings:');
  console.error(JSON.stringify(blocking, null, 2));
  process.exit(1);
}

if (result.status !== 0 && temporarilyAccepted.length === 0) {
  process.stderr.write(result.stderr || '');
  console.error('npm audit failed unexpectedly.');
  process.exit(result.status || 1);
}

console.log('npm high/critical security gate passed.');
