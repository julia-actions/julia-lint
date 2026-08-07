// Pure SARIF -> annotation mapping, kept free of fs/@actions so it can be
// unit-tested with plain fixture objects.

export type AnnotationLevel = 'error' | 'warning' | 'notice';

export interface Annotation {
    level: AnnotationLevel;
    message: string;
    title: string;
    file: string | null;
    startLine: number | null;
    startColumn: number | null;
    endLine: number | null;
    endColumn: number | null;
}

const LEVEL_ORDER: Record<AnnotationLevel, number> = { error: 0, warning: 1, notice: 2 };

function toLevel(sarifLevel: unknown): AnnotationLevel {
    // SARIF levels are error/warning/note/none; the spec default is warning.
    switch (sarifLevel) {
        case 'error':
            return 'error';
        case 'note':
        case 'none':
            return 'notice';
        default:
            return 'warning';
    }
}

export function annotationsFromSarif(sarif: unknown): Annotation[] {
    const annotations: Annotation[] = [];

    const runs = (sarif as { runs?: unknown[] })?.runs;
    if (!Array.isArray(runs)) {
        throw new Error('not a SARIF log: missing "runs" array');
    }

    for (const run of runs) {
        const results = (run as { results?: unknown[] })?.results;
        if (!Array.isArray(results)) {
            continue;
        }
        for (const result of results as Record<string, any>[]) {
            const physical = result?.locations?.[0]?.physicalLocation;
            const region = physical?.region;
            annotations.push({
                level: toLevel(result?.level),
                message: result?.message?.text ?? '',
                title: result?.ruleId ?? 'julialint',
                file: physical?.artifactLocation?.uri ?? null,
                startLine: region?.startLine ?? null,
                startColumn: region?.startColumn ?? null,
                endLine: region?.endLine ?? null,
                endColumn: region?.endColumn ?? null,
            });
        }
    }

    // GitHub only displays the first handful of annotations per type, so make
    // sure errors come before warnings before notices. Stable sort keeps the
    // file order within each level.
    annotations.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

    return annotations;
}
