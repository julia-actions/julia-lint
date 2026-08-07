import test from 'node:test';
import assert from 'node:assert';
import { annotationsFromSarif } from '../src/annotations';

function sarifWith(results: unknown[]): unknown {
    return {
        version: '2.1.0',
        runs: [
            {
                tool: { driver: { name: 'julialint', version: '0.1.0' } },
                results,
            },
        ],
    };
}

function result(level: string | undefined, ruleId: string, uri: string, startLine: number): unknown {
    return {
        ruleId,
        level,
        message: { text: `message for ${ruleId}` },
        locations: [
            {
                physicalLocation: {
                    artifactLocation: { uri, uriBaseId: '%SRCROOT%' },
                    region: { startLine, startColumn: 1, endLine: startLine, endColumn: 5 },
                },
            },
        ],
    };
}

test('maps julialint SARIF results to annotations', () => {
    const annotations = annotationsFromSarif(sarifWith([result('error', 'syntax_errors', 'src/a.jl', 3)]));
    assert.strictEqual(annotations.length, 1);
    assert.deepStrictEqual(annotations[0], {
        level: 'error',
        message: 'message for syntax_errors',
        title: 'syntax_errors',
        file: 'src/a.jl',
        startLine: 3,
        startColumn: 1,
        endLine: 3,
        endColumn: 5,
    });
});

test('sorts errors before warnings before notices', () => {
    const annotations = annotationsFromSarif(
        sarifWith([
            result('note', 'unused_binding', 'src/a.jl', 1),
            result('warning', 'missing_reference', 'src/b.jl', 2),
            result('error', 'syntax_errors', 'src/c.jl', 3),
            result('warning', 'unresolved_import', 'src/d.jl', 4),
        ])
    );
    assert.deepStrictEqual(
        annotations.map(a => a.level),
        ['error', 'warning', 'warning', 'notice']
    );
    // stable within level
    assert.deepStrictEqual(
        annotations.filter(a => a.level === 'warning').map(a => a.title),
        ['missing_reference', 'unresolved_import']
    );
});

test('missing level defaults to warning, none maps to notice', () => {
    const annotations = annotationsFromSarif(
        sarifWith([result(undefined, 'r1', 'a.jl', 1), result('none', 'r2', 'b.jl', 2)])
    );
    assert.deepStrictEqual(
        annotations.map(a => a.level),
        ['warning', 'notice']
    );
});

test('tolerates results without locations', () => {
    const annotations = annotationsFromSarif(sarifWith([{ ruleId: 'r', level: 'error', message: { text: 'm' } }]));
    assert.strictEqual(annotations[0].file, null);
    assert.strictEqual(annotations[0].startLine, null);
});

test('empty results and multiple runs', () => {
    const sarif = {
        runs: [
            { tool: { driver: { name: 'julialint' } }, results: [] },
            { tool: { driver: { name: 'julialint' } }, results: [result('error', 'r', 'a.jl', 1)] },
        ],
    };
    assert.strictEqual(annotationsFromSarif(sarif).length, 1);
});

test('rejects non-SARIF input', () => {
    assert.throws(() => annotationsFromSarif({ foo: 1 }), /missing "runs"/);
});
