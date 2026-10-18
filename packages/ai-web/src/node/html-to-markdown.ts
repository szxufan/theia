// *****************************************************************************
// Copyright (C) 2026 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

/**
 * Minimal, dependency-free HTML to Markdown conversion for agent web access.
 * It is deliberately lossy: the goal is readable text for a language model,
 * not a faithful document conversion.
 */
export function htmlToMarkdown(html: string): string {
    let text = stripNoise(html);

    // Protect pre/code contents from all further rewriting by replacing them with placeholders.
    const literals: string[] = [];
    const stash = (code: string): string => {
        literals.push(code);
        return `\u0000${literals.length - 1}\u0000`;
    };
    text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, body: string) =>
        stash('\n```\n' + decodeEntities(body.replace(/<[^>]+>/g, '')).trim() + '\n```\n'));
    text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, body: string) =>
        stash('`' + decodeEntities(body.replace(/<[^>]+>/g, '')).trim() + '`'));

    text = text
        // Headings
        .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level: string, body: string) =>
            `\n${'#'.repeat(Number(level))} ${inlineText(body)}\n`)
        // Links: keep the reference, drop styling around it
        .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, body: string) => {
            const label = inlineText(body).trim();
            return label && href && !href.startsWith('javascript:') ? `[${label}](${href})` : label;
        })
        // Images: alt text only
        .replace(/<img\b[^>]*alt=["']([^"']*)["'][^>]*>/gi, (_, alt: string) => alt.trim() ? `（图片：${alt.trim()}）` : '')
        .replace(/<img\b[^>]*>/gi, '')
        // Emphasis
        .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, body: string) => `**${inlineText(body)}**`)
        .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, body: string) => `*${inlineText(body)}*`)
        .replace(/<del\b[^>]*>([\s\S]*?)<\/del>/gi, (_, body: string) => `~~${inlineText(body)}~~`)
        // Line structure
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|section|article|main|table|tr|figcaption)>/gi, '\n')
        .replace(/<(p|div|section|article|main)\b[^>]*>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '\n- ')
        .replace(/<blockquote\b[^>]*>/gi, '\n> ')
        .replace(/<hr\b[^>]*\/?>/gi, '\n---\n')
        // Definition lists rendered as "term: description"
        .replace(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*(?:<dd\b[^>]*>([\s\S]*?)<\/dd>)?/gi,
            (_, term: string, desc: string | undefined) =>
                `\n- ${inlineText(term)}${desc ? ': ' + inlineText(desc) : ''}`)
        // Whatever tags remain are dropped; their inner text stays
        .replace(/<[^>]+>/g, '');

    text = decodeEntities(text);
    text = text
        .replace(/\r\n?/g, '\n')
        // Blank-line runs and trailing whitespace, but keep literal blocks untouched
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // Restore stashed literals
    return text.replace(/\u0000(\d+)\u0000/g, (_, index: string) => literals[Number(index)] ?? '');
}

function stripNoise(html: string): string {
    return html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style|noscript|svg|template|iframe|object|embed|canvas|head)\b[\s\S]*?<\/\1>/gi, '')
        .replace(/<(nav|footer|header|aside|form|button|select)\b[\s\S]*?<\/\1>/gi, '');
}

/** Collapses nested tags inside one inline element body and normalizes whitespace. */
function inlineText(body: string): string {
    return body.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
}

const NAMED_ENTITIES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', copy: '©', reg: '®',
    trade: '™', hellip: '…', mdash: '—', ndash: '–', lsquo: '\u2018', rsquo: '\u2019',
    ldquo: '\u201C', rdquo: '\u201D', laquo: '«', raquo: '»', deg: '°', plusmn: '±',
    times: '×', divide: '÷', middot: '·', bull: '•', dagger: '†', prime: '\u2032',
    Euro: '€', pound: '£', yen: '¥', cent: '¢', sect: '§', para: '¶', larr: '←',
    rarr: '→', uarr: '↑', darr: '↓', infin: '∞', ne: '≠', le: '≤', ge: '≥'
};

export function decodeEntities(text: string): string {
    return text
        .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec: string) => safeCodePoint(parseInt(dec, 10)))
        .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name: string) => NAMED_ENTITIES[name] ?? match);
}

function safeCodePoint(code: number): string {
    return Number.isFinite(code) && code > 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : '';
}
