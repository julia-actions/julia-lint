import * as fs from 'fs';
import * as core from '@actions/core';
import { annotationsFromSarif } from './annotations';

function run(): void {
    const sarifPath = process.argv[2] ?? 'lint-results.sarif';

    if (!fs.existsSync(sarifPath)) {
        core.notice(`No SARIF file found at ${sarifPath}; skipping lint annotations.`);
        return;
    }

    const annotations = annotationsFromSarif(JSON.parse(fs.readFileSync(sarifPath, 'utf8')));

    for (const a of annotations) {
        const properties = {
            title: a.title,
            file: a.file ?? undefined,
            startLine: a.startLine ?? undefined,
            startColumn: a.startColumn ?? undefined,
            endLine: a.endLine ?? undefined,
            endColumn: a.endColumn ?? undefined,
        };
        if (a.level === 'error') {
            core.error(a.message, properties);
        } else if (a.level === 'warning') {
            core.warning(a.message, properties);
        } else {
            core.notice(a.message, properties);
        }
    }

    console.log(`Emitted ${annotations.length} lint annotation(s) from ${sarifPath}`);
}

try {
    run();
} catch (error) {
    core.setFailed((error as Error).message);
}
