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

import { expect } from 'chai';
import { decodeEntities, htmlToMarkdown } from './html-to-markdown';

describe('htmlToMarkdown', () => {

    it('converts headings, paragraphs, and links', () => {
        const markdown = htmlToMarkdown(`
            <html><body>
                <h1>Title</h1>
                <p>See <a href="https://example.com/docs">the docs</a> for details.</p>
            </body></html>`);
        expect(markdown).to.include('# Title');
        expect(markdown).to.include('[the docs](https://example.com/docs)');
        expect(markdown).to.not.include('<a');
    });

    it('drops scripts, styles, and navigation chrome', () => {
        const markdown = htmlToMarkdown(`
            <html><head><style>.x { color: red }</style></head><body>
                <nav><a href="/menu">menu</a></nav>
                <script>alert('evil instructions')</script>
                <main><p>real content</p></main>
                <footer>footer noise</footer>
            </body></html>`);
        expect(markdown).to.include('real content');
        expect(markdown).to.not.include('menu');
        expect(markdown).to.not.include('evil instructions');
        expect(markdown).to.not.include('footer noise');
        expect(markdown).to.not.include('color: red');
    });

    it('preserves code blocks without converting their markup', () => {
        const markdown = htmlToMarkdown(`
            <p>Example:</p>
            <pre><code>if (a &lt; b) { return &amp; }</code></pre>
            <p>Inline <code>x &gt; 0</code> check.</p>`);
        expect(markdown).to.include('```\nif (a < b) { return & }\n```');
        expect(markdown).to.include('`x > 0`');
    });

    it('converts lists to markdown bullets', () => {
        const markdown = htmlToMarkdown('<ul><li>first</li><li>second item</li></ul>');
        expect(markdown).to.include('- first');
        expect(markdown).to.include('- second item');
    });

    it('decodes entities everywhere', () => {
        expect(decodeEntities('a &amp; b &lt;c&gt; &#x4e2d;&#25991; &unknown;')).to.equal('a & b <c> 中文 &unknown;');
        expect(htmlToMarkdown('<p>&quot;quoted&quot; &mdash; dash</p>')).to.include('"quoted" — dash');
    });

    it('turns images into alt text and drops javascript links', () => {
        const markdown = htmlToMarkdown(`
            <p><img src="x.png" alt="architecture diagram"> and
            <a href="javascript:alert(1)">click</a></p>`);
        expect(markdown).to.include('（图片：architecture diagram）');
        expect(markdown).to.include('click');
        expect(markdown).to.not.include('javascript:');
    });

    it('collapses excessive blank lines', () => {
        const markdown = htmlToMarkdown('<p>a</p><br><br><br><br><p>b</p>');
        expect(markdown).to.match(/^a\n\nb$/);
    });
});
