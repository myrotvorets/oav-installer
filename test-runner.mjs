import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { readdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ghaReporter from 'node-reporter-gha';
import sonarReporter from 'node-reporter-sonarqube';

/**
 * @returns {Promise<string[]>}
 */
async function getFiles() {
    const base = dirname(fileURLToPath(import.meta.url));
    const dir = join(base, 'test');
    const files = await readdir(dir, { recursive: true });
    return files.filter((file) => /\.(test|spec)\.[cm]?[jt]s$/u.test(file)).map((file) => join(dir, file));
}

const stream = run({
    files: await getFiles(),
});

stream.on('test:fail', () => {
    process.exitCode = 1;
});

stream.compose(spec).pipe(process.stdout);

if (process.env['CI'] === 'true' && process.env['GITHUB_ACTIONS'] === 'true') {
    stream.compose(ghaReporter).pipe(process.stdout);
}

if (process.env['SONARSCANNER'] === 'true') {
    const testReportStream = createWriteStream('test-report.xml');
    stream.compose(sonarReporter).pipe(testReportStream);
}
