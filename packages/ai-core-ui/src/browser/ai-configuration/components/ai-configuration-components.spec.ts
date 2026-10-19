// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
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

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
let disableJSDOM = enableJSDOM();

// @lumino/dragdrop (pulled in transitively via `codicon` from `@theia/core/lib/browser`) extends the
// DragEvent DOM global at module load, which JSDOM does not provide; stub it so the import succeeds.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(global as any).DragEvent) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).DragEvent = class DragEvent extends (global as any).Event { };
}

import { expect } from 'chai';
import * as React from '@theia/core/shared/react';
import { flushSync } from '@theia/core/shared/react-dom';
import { createRoot } from '@theia/core/shared/react-dom/client';
import { AiConfigurationItemRow } from './ai-configuration-item-row';
import { AiConfigurationCallout, AiConfigurationEmptyState, AiConfigurationItemDetailHeader, AiConfigurationSection } from './ai-configuration-primitives';
import { AiConfigurationOrigin, AiConfigurationOriginBadge, AiConfigurationOriginBadges } from './ai-configuration-origin-badge';
import { AiConfigurationSettingRow } from './ai-configuration-setting-row';
import { AiArrayInput, AiEnumSelect, AiNumberStepper } from './ai-configuration-controls';
import { AiObjectListInput } from './ai-object-list-input';
import { PreferenceDataProperty } from '@theia/core/lib/common/preferences/preference-schema';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { PromptCustomizationDialogs } from './prompt-customization-dialogs';
import { VariantSetCard } from './variant-set-card';
import { AiSettingsRowService } from './ai-settings-row-service';
import { PromptFragment, PromptService } from '@theia/ai-core/lib/common/prompt-service';

disableJSDOM();

/** Replaces the (single) input's text the way a keystroke does, and flushes the resulting render. */
function typeInto(container: HTMLElement, value: string): void {
    const input = container.querySelector<HTMLInputElement>('input')!;
    // JSDOM only accepts events built from its own window's constructor, not Node's global `Event`.
    const view = container.ownerDocument.defaultView as unknown as { Event: typeof Event; HTMLInputElement: typeof HTMLInputElement };
    // Assigning `value` directly goes through React's patched setter, which then treats the change as
    // already handled and never calls `onChange`; the prototype's setter is what a real keystroke uses.
    const nativeSetter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!;
    flushSync(() => {
        nativeSetter.call(input, value);
        input.dispatchEvent(new view.Event('input', { bubbles: true }));
    });
}

/** Renders one level of an element: the output of a function component, or the children of a host element. */
function contentOf(element: React.ReactElement): React.ReactNode {
    if (typeof element.type === 'function') {
        return (element.type as (props: unknown) => React.ReactNode)(element.props);
    }
    return (element.props as { children?: React.ReactNode } | undefined)?.children;
}

/** Recursively collects the class names present anywhere in a rendered element tree. */
function classNames(node: React.ReactNode, into: string[] = []): string[] {
    if (!node || typeof node !== 'object') {
        return into;
    }
    if (Array.isArray(node)) {
        node.forEach(child => classNames(child, into));
        return into;
    }
    const element = node as React.ReactElement<{ className?: string }>;
    if (element.props?.className) {
        into.push(...element.props.className.split(/\s+/).filter(Boolean));
    }
    classNames(contentOf(element), into);
    return into;
}

/** Recursively collects the string text present anywhere in a rendered element tree. */
function textOf(node: React.ReactNode, into: string[] = []): string[] {
    if (node === undefined || node === false) {
        return into;
    }
    if (typeof node === 'string' || typeof node === 'number') {
        into.push(String(node));
        return into;
    }
    if (Array.isArray(node)) {
        node.forEach(child => textOf(child, into));
        return into;
    }
    if (typeof node === 'object') {
        textOf(contentOf(node as React.ReactElement), into);
    }
    return into;
}

describe('AI Configuration primitives', () => {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    /** Renders a component into a detached container; the caller disposes it. */
    function mount(element: React.ReactElement): { container: HTMLElement; dispose: () => void } {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        flushSync(() => root.render(element));
        return { container, dispose: () => { flushSync(() => root.unmount()); container.remove(); } };
    }

    it('AiConfigurationCallout keeps a long message inside the box and repeats it on hover', () => {
        // A provider's failure ends up here verbatim, keys and URLs included, with nothing to wrap at.
        const message = '401 Incorrect API key provided: sk-proj-' + 'x'.repeat(120) + '. See https://platform.openai.com/account/api-keys.';
        const { container, dispose } = mount(React.createElement(AiConfigurationCallout, {
            message,
            action: React.createElement('button', {}, 'Retry')
        }));
        try {
            const text = container.querySelector<HTMLElement>('.ai-configuration-callout-text')!;
            expect(text.title).to.equal(message);
            // The action stays a sibling of the text rather than being pushed out of the row.
            expect(container.querySelector('.ai-configuration-callout button')?.textContent).to.equal('Retry');
        } finally {
            dispose();
        }
    });

    it('AiEnumSelect passes a separator on as one, not as a selectable option', () => {
        // A separator that loses its flag on the way to SelectComponent becomes a selectable entry with
        // no label, and picking it commits the empty value. The field skipping it is what says it did not.
        const { container, dispose } = mount(React.createElement(AiEnumSelect, {
            value: undefined,
            options: [{ value: '', label: '', separator: true }, { value: 'a', label: 'A' }],
            ariaLabel: 'Model',
            onCommit: () => { }
        }));
        try {
            expect(container.querySelector('.theia-select-component-label')?.textContent).to.equal('A');
        } finally {
            dispose();
        }
    });

    it('AiConfigurationSection renders its title and children', () => {
        const { container, dispose } = mount(React.createElement(AiConfigurationSection,
            { title: 'General', children: React.createElement('span', {}, 'row') }));
        try {
            expect(Boolean(container.querySelector('.ai-configuration-section'))).to.equal(true);
            expect(container.textContent).to.include('General').and.to.include('row');
            // Not foldable unless asked: no chevron, and the content is not gated behind one.
            expect(Boolean(container.querySelector('.ai-configuration-section-chevron'))).to.equal(false);
        } finally {
            dispose();
        }
    });

    it('AiConfigurationSection shows an entry count next to the title', () => {
        const { container, dispose } = mount(React.createElement(AiConfigurationSection,
            { title: 'Skills', count: 14, children: React.createElement('span', {}, 'row') }));
        try {
            expect(container.querySelector('.ai-configuration-section-count')?.textContent).to.equal('14');
        } finally {
            dispose();
        }
    });

    it('AiConfigurationSection folds its content away when collapsible, starting expanded', () => {
        const { container, dispose } = mount(React.createElement(AiConfigurationSection,
            { title: 'Skills', collapsible: true, children: React.createElement('span', {}, 'row') }));
        try {
            const header = container.querySelector<HTMLElement>('.ai-configuration-section-title.foldable');
            // Browsing pages open showing their content; folding is the user's choice.
            expect(header?.getAttribute('aria-expanded')).to.equal('true');
            expect(container.textContent).to.include('row');

            flushSync(() => header!.click());
            expect(header!.getAttribute('aria-expanded')).to.equal('false');
            expect(container.textContent).to.not.include('row');
        } finally {
            dispose();
        }
    });

    it('AiConfigurationSection keeps a folded section open while forced, so a filter match stays reachable', () => {
        const { container, dispose } = mount(React.createElement(AiConfigurationSection,
            { title: 'Skills', collapsible: true, forceExpanded: true, children: React.createElement('span', {}, 'row') }));
        try {
            const header = container.querySelector<HTMLElement>('.ai-configuration-section-title.foldable');
            flushSync(() => header!.click());
            expect(container.textContent).to.include('row');
        } finally {
            dispose();
        }
    });

    it('AiConfigurationItemRow exposes the label, status and an onSelect handler', () => {
        let selected = false;
        const tree = AiConfigurationItemRow({
            label: 'Universal',
            iconClass: 'codicon-copilot',
            status: { kind: 'on', label: 'Enabled' },
            onSelect: () => { selected = true; }
        }) as React.ReactElement<{ onClick: () => void }>;
        expect(textOf(tree)).to.include('Universal').and.to.include('Enabled');
        expect(classNames(tree)).to.include('ai-configuration-status-on');
        tree.props.onClick();
        expect(selected).to.equal(true);
    });

    it('AiConfigurationItemRow shows the modified bar and a gear that anchors its menu at the gear', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        const opened: HTMLElement[] = [];
        flushSync(() => root.render(React.createElement(AiConfigurationItemRow, {
            label: 'chat',
            modified: true,
            onOpenMenu: gearEl => { opened.push(gearEl); }
        })));
        const row = host.querySelector('.ai-configuration-item-row') as HTMLElement;
        expect(row.classList.contains('modified')).to.equal(true);
        // A non-navigable row (no onSelect) shows no chevron.
        expect(Boolean(host.querySelector('.ai-configuration-item-row-chevron'))).to.equal(false);
        const gear = host.querySelector('.ai-settings-row-gear') as HTMLButtonElement;
        expect(Boolean(gear)).to.equal(true);
        flushSync(() => gear.click());
        expect(opened.length).to.equal(1);
        expect(opened[0]).to.equal(gear);
        root.unmount();
        host.remove();
    });

    /**
     * JSDOM lays nothing out, so every element reports a zero height and a description would never measure as
     * clamped. Fakes the two heights the row compares, which is exactly the browser's "the text does not fit"
     * signal, and restores them afterwards.
     */
    function withClampedText(scrollHeight: number, run: () => void): void {
        // Both live on `Element.prototype`, which is where JSDOM defines them.
        const prototype = document.defaultView!.Element.prototype;
        const original = {
            scrollHeight: Object.getOwnPropertyDescriptor(prototype, 'scrollHeight')!,
            clientHeight: Object.getOwnPropertyDescriptor(prototype, 'clientHeight')!
        };
        Object.defineProperty(prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight });
        Object.defineProperty(prototype, 'clientHeight', { configurable: true, get: () => 40 });
        try {
            run();
        } finally {
            Object.defineProperty(prototype, 'scrollHeight', original.scrollHeight);
            Object.defineProperty(prototype, 'clientHeight', original.clientHeight);
        }
    }

    it('AiConfigurationItemRow expands a description that does not fit, and leaves a fitting one alone', () => {
        // A tool description running past the two-line clamp is otherwise unreadable in the list.
        withClampedText(120, () => {
            let rowOpened = 0;
            const { container, dispose } = mount(React.createElement(AiConfigurationItemRow, {
                label: 'writeFileReplacements',
                description: 'Replace text in a file. The old text must be unique in the file.',
                onSelect: () => { rowOpened++; }
            }));
            try {
                const description = container.querySelector('.ai-configuration-item-row-description') as HTMLElement;
                expect(description.classList.contains('expanded')).to.equal(false);
                const toggle = container.querySelector('.ai-configuration-item-row-description-toggle') as HTMLButtonElement;
                expect(Boolean(toggle)).to.equal(true);
                expect(toggle.getAttribute('aria-expanded')).to.equal('false');

                flushSync(() => toggle.click());
                expect(description.classList.contains('expanded')).to.equal(true);
                expect(container.querySelector('.ai-configuration-item-row-description-toggle')!.getAttribute('aria-expanded')).to.equal('true');
                // Reading the description must not also open the row's detail page.
                expect(rowOpened).to.equal(0);
            } finally {
                dispose();
            }
        });
        // Nothing hidden, so no toggle to offer.
        withClampedText(40, () => {
            const { container, dispose } = mount(React.createElement(AiConfigurationItemRow, { label: 'readFile', description: 'Read a file.' }));
            try {
                expect(Boolean(container.querySelector('.ai-configuration-item-row-description-toggle'))).to.equal(false);
            } finally {
                dispose();
            }
        });
    });

    it('AiConfigurationEmptyState renders the message and an optional action', async () => {
        const tree = await AiConfigurationEmptyState({ message: 'Nothing here', action: React.createElement('button', {}, 'Add') });
        expect(textOf(tree)).to.include('Nothing here').and.to.include('Add');
    });

    it('AiConfigurationItemDetailHeader renders title and subtitle', async () => {
        const tree = await AiConfigurationItemDetailHeader({ title: 'Coder', subtitle: 'agent-id-1' });
        expect(textOf(tree)).to.include('Coder').and.to.include('agent-id-1');
    });

    it('AiConfigurationOriginBadge is a button that activates its origin, and does not open the row it sits in', () => {
        let activated = 0;
        let rowOpened = 0;
        const { container, dispose } = mount(React.createElement('div', { onClick: () => { rowOpened++; } },
            React.createElement(AiConfigurationOriginBadge, {
                origin: { label: 'From registry', iconClass: 'codicon-link-external', tooltip: 'Open in AI registry: x', activate: () => { activated++; } }
            })));
        try {
            const badge = container.querySelector('button.ai-configuration-origin-badge') as HTMLButtonElement;
            expect(badge.getAttribute('title')).to.equal('Open in AI registry: x');
            expect(badge.textContent).to.include('From registry');

            flushSync(() => badge.click());
            expect(activated).to.equal(1);
            // The surrounding row and detail header are clickable themselves; following the badge must
            // not also open them.
            expect(rowOpened).to.equal(0);
        } finally {
            dispose();
        }
    });

    it('AiConfigurationOriginBadge is not focusable when the origin leads nowhere', () => {
        const { container, dispose } = mount(React.createElement(AiConfigurationOriginBadge, {
            origin: { label: 'via Acme', iconClass: 'codicon-package', tooltip: 'Acme' }
        }));
        try {
            expect(container.querySelector('button')).to.be.null;
            expect(container.querySelector('span.ai-configuration-origin-badge')?.textContent).to.include('via Acme');
        } finally {
            dispose();
        }
    });

    it('AiConfigurationOriginBadges renders one badge per origin, in order, and nothing without any', () => {
        const origin = (label: string) => ({ label, iconClass: 'codicon-link-external', tooltip: label, activate: () => { } });
        const { container, dispose } = mount(React.createElement(AiConfigurationOriginBadges,
            { origins: [origin('From registry'), origin('via Acme Devtools')] }));
        try {
            expect(Array.from(container.querySelectorAll('.ai-configuration-origin-badge')).map(badge => badge.textContent))
                .to.deep.equal(['From registry', 'via Acme Devtools']);
        } finally {
            dispose();
        }
        const empty = mount(React.createElement('div', {}, React.createElement(AiConfigurationOriginBadges, { origins: [] })));
        try {
            expect(empty.container.querySelector('.ai-configuration-origin-badges')).to.be.null;
        } finally {
            empty.dispose();
        }
    });

    it('AiConfigurationOrigin builds the same registry and Agent Plugin badges for every page to use', () => {
        const registry = AiConfigurationOrigin.registry('io.github.acme/validator', () => { });
        // 本 fork 仅保留简体中文：默认文案即为中文。
        expect(registry.label).to.equal('来自注册表');
        expect(registry.iconClass).to.contain('codicon-link-external');
        expect(registry.tooltip).to.contain('io.github.acme/validator');

        const plugin = AiConfigurationOrigin.agentPlugin({ pluginId: 'io.github.acme/devtools', name: 'Acme Devtools' }, () => { });
        expect(plugin.label).to.equal('来自 Acme Devtools');
        expect(plugin.iconClass).to.contain('codicon-package');
        expect(plugin.tooltip).to.contain('Acme Devtools');
    });

    it('AiConfigurationSettingRow renders title and control, marks modified rows, and hides the raw id', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        flushSync(() => root.render(React.createElement(AiConfigurationSettingRow, {
            preferenceId: 'ai-features.demo',
            title: 'Demo',
            renderMarkdown: () => document.createElement('div'),
            modified: true,
            control: React.createElement('span', {}, 'ctrl')
        })));
        const row = host.querySelector('.ai-settings-row') as HTMLElement;
        expect(row.classList.contains('modified')).to.equal(true);
        expect(row.textContent).to.include('Demo').and.to.include('ctrl');
        // The raw preference id is no longer shown inline; it is copied through the gear menu instead.
        expect(row.textContent).to.not.include('ai-features.demo');
        flushSync(() => root.render(React.createElement(AiConfigurationSettingRow, {
            preferenceId: 'ai-features.demo',
            title: 'Demo',
            renderMarkdown: () => document.createElement('div'),
            modified: false
        })));
        expect((host.querySelector('.ai-settings-row') as HTMLElement).classList.contains('modified')).to.equal(false);
        root.unmount();
        host.remove();
    });

    it('the setting-row gear delegates to the preference context menu, anchored at the gear', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        const opened: HTMLElement[] = [];
        flushSync(() => root.render(React.createElement(AiConfigurationSettingRow, {
            preferenceId: 'ai-features.demo',
            title: 'Demo',
            renderMarkdown: () => document.createElement('div'),
            modified: true,
            onOpenMenu: gearEl => { opened.push(gearEl); },
            control: React.createElement('span', {}, 'ctrl')
        })));

        // The gear defers to the owner's opener (which renders the Settings UI's own preference context
        // menu via ContextMenuRenderer), passing the gear element as the anchor. No inline popover.
        const gear = host.querySelector('.ai-settings-row-gear') as HTMLButtonElement;
        expect(Boolean(gear)).to.equal(true);
        flushSync(() => gear.click());
        expect(opened.length).to.equal(1);
        expect(opened[0]).to.equal(gear);

        root.unmount();
        host.remove();
    });

    it('AiConfigurationSettingRow hides the gear when no menu opener is provided', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        flushSync(() => root.render(React.createElement(AiConfigurationSettingRow, {
            preferenceId: 'ai-features.demo',
            title: 'Demo',
            renderMarkdown: () => document.createElement('div'),
            modified: true
        })));
        expect(Boolean(host.querySelector('.ai-settings-row-gear'))).to.equal(false);
        root.unmount();
        host.remove();
    });

    it('AiConfigurationSettingRow places a full-width control in the below slot', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = createRoot(host);
        flushSync(() => root.render(React.createElement(AiConfigurationSettingRow, {
            preferenceId: 'ai-features.demo',
            title: 'Demo',
            renderMarkdown: () => document.createElement('div'),
            modified: false,
            below: React.createElement('span', {}, 'wide')
        })));
        expect(Boolean(host.querySelector('.ai-settings-row-below'))).to.equal(true);
        expect(host.textContent).to.include('wide');
        root.unmount();
        host.remove();
    });
});

describe('PromptCustomizationDialogs', () => {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    function promptServiceWith(fragments: Record<string, Partial<PromptFragment>[]>): PromptService {
        const map = new Map<string, PromptFragment[]>(
            Object.entries(fragments).map(([id, list]) => [id, list.map(fragment => ({ id, template: '', ...fragment }) as PromptFragment)])
        );
        return {
            getAllPromptFragments: () => map,
            getRawPromptFragment: (id: string) => map.get(id)?.[0]
        } as unknown as PromptService;
    }

    it('reports a built-in behind a customized fragment, so the action can reset', () => {
        const promptService = promptServiceWith({
            'coder-system-agent-mode': [{ customizationId: 'user', priority: 1 }, {}]
        });

        expect(PromptCustomizationDialogs.hasBuiltIn(promptService, 'coder-system-agent-mode')).to.equal(true);
    });

    it('reports no built-in for a user-authored variant, whose reset would silently do nothing', () => {
        // A file named after the variant set becomes a custom variant of it; `PromptService.resetToBuiltIn`
        // is a no-op without a built-in, so the caller has to delete the customization instead.
        const promptService = promptServiceWith({
            'coder-system-agent-mode-nina': [{ customizationId: 'promptTemplateFolder', priority: 1 }]
        });

        expect(PromptCustomizationDialogs.hasBuiltIn(promptService, 'coder-system-agent-mode-nina')).to.equal(false);
    });

    it('does not prompt for a fragment that carries no customization to remove', async () => {
        let removed = false;
        const promptService = promptServiceWith({ 'coder-system': [{}] });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (promptService as any).removeCustomization = () => { removed = true; };

        const result = await PromptCustomizationDialogs.confirmAndRemove(promptService, 'coder-system', {
            title: 'Remove',
            message: () => 'Remove?'
        });

        expect(result).to.equal(false);
        expect(removed).to.equal(false);
    });

    it('removes the customization the effective fragment came from, after confirmation', async () => {
        const promptService = promptServiceWith({
            'coder-system-agent-mode-nina': [{ customizationId: 'promptTemplateFolder', priority: 1 }]
        });
        const removals: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.assign(promptService as any, {
            getCustomizationType: async () => 'Prompt Templates Folder',
            getCustomizationDescription: async () => 'file:///prompts/coder-system-agent-mode-nina.prompttemplate',
            removeCustomization: async (id: string, customizationId: string) => { removals.push(`${id}/${customizationId}`); }
        });
        let shownMessage: string | undefined;
        // Auto-confirm the dialog: it resolves through `ConfirmDialog.open`, which needs a real accept click.
        const originalOpen = ConfirmDialog.prototype.open;
        ConfirmDialog.prototype.open = async function (this: ConfirmDialog): Promise<boolean> {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shownMessage = (this as any).contentNode?.textContent;
            return true;
        };
        try {
            const result = await PromptCustomizationDialogs.confirmAndRemove(promptService, 'coder-system-agent-mode-nina', {
                title: 'Remove Prompt Template',
                message: ({ type, description }) => `${type} :: ${description}`
            });

            expect(result).to.equal(true);
            expect(removals).to.deep.equal(['coder-system-agent-mode-nina/promptTemplateFolder']);
            // The dialog names where the customization lives, so the user sees which file goes away.
            expect(shownMessage).to.include('Prompt Templates Folder');
            expect(shownMessage).to.include('coder-system-agent-mode-nina.prompttemplate');
        } finally {
            ConfirmDialog.prototype.open = originalOpen;
        }
    });
});

describe('VariantSetCard', () => {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    /** A set with a built-in default plus a user-authored variant, which is the one currently selected. */
    function setup(): { promptService: PromptService; selections: Array<[string, string]>; removals: string[] } {
        const fragments = new Map<string, PromptFragment[]>([
            ['coder-system-agent-mode', [{ id: 'coder-system-agent-mode', template: '' }]],
            ['coder-system-agent-mode-nina', [{ id: 'coder-system-agent-mode-nina', template: '', customizationId: 'folder', priority: 1 } as PromptFragment]]
        ]);
        const selections: Array<[string, string]> = [];
        const removals: string[] = [];
        let selected: string | undefined = 'coder-system-agent-mode-nina';
        const promptService = {
            getVariantIds: () => ['coder-system-agent-mode', 'coder-system-agent-mode-nina'],
            getDefaultVariantId: () => 'coder-system-agent-mode',
            getSelectedVariantId: () => selected,
            onSelectedVariantChange: () => ({ dispose: () => { } }),
            getAllPromptFragments: () => fragments,
            getRawPromptFragment: (id: string) => fragments.get(id)?.[0],
            getCustomizationType: async () => 'Prompt Templates Folder',
            getCustomizationDescription: async () => 'file:///prompts/coder-system-agent-mode-nina.prompttemplate',
            removeCustomization: async (id: string) => { removals.push(id); fragments.delete(id); },
            updateSelectedVariantId: async (agentId: string, _setId: string, variantId: string) => {
                selections.push([agentId, variantId]);
                selected = variantId;
            }
        } as unknown as PromptService;
        return { promptService, selections, removals };
    }

    function render(promptService: PromptService): { container: HTMLElement; dispose: () => void } {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        flushSync(() => root.render(React.createElement(VariantSetCard, {
            agentId: 'coder',
            promptVariantSetId: 'coder-system-agent-mode',
            promptService,
            settingsRowService: { openResetMenu: () => { } } as unknown as AiSettingsRowService
        })));
        return { container, dispose: () => { flushSync(() => root.unmount()); container.remove(); } };
    }

    it('offers deletion, not a dead reset, for a selected variant that only exists as a user file', () => {
        const { promptService } = setup();
        const { container, dispose } = render(promptService);
        try {
            // `PromptService.resetToBuiltIn` is a no-op without a built-in, so the action must be a delete.
            expect(Boolean(container.querySelector('.codicon-trash'))).to.equal(true);
            expect(Boolean(container.querySelector('.codicon-discard'))).to.equal(false);
        } finally {
            dispose();
        }
    });

    it('falls back to the default variant after deleting the selected one, instead of leaving it unavailable', async () => {
        const { promptService, selections, removals } = setup();
        const { container, dispose } = render(promptService);
        const originalOpen = ConfirmDialog.prototype.open;
        ConfirmDialog.prototype.open = async () => true;
        try {
            const remove = container.querySelector<HTMLButtonElement>('.ai-configuration-icon-button:last-of-type');
            remove!.click();
            // Let the confirmation and both service calls settle.
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(removals).to.deep.equal(['coder-system-agent-mode-nina']);
            expect(selections).to.deep.equal([['coder', 'coder-system-agent-mode']]);
        } finally {
            ConfirmDialog.prototype.open = originalOpen;
            dispose();
        }
    });
});

describe('AiArrayInput', () => {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    /** Renders the editor with a validator that refuses anything containing `*`, and reports the adds. */
    function mountList(values: string[]): { container: HTMLElement; added: string[][]; dispose: () => void } {
        const added: string[][] = [];
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        flushSync(() => root.render(React.createElement(AiArrayInput, {
            values,
            ariaLabel: 'Patterns',
            addPlaceholder: 'Add pattern…',
            validate: (value: string) => value.includes('*') ? `"${value}" is not allowed` : undefined,
            onChange: (next: string[]) => { added.push(next); }
        })));
        return { container, added, dispose: () => { flushSync(() => root.unmount()); container.remove(); } };
    }

    it('adds an accepted entry', () => {
        const { container, added, dispose } = mountList(['git log ']);
        try {
            typeInto(container, 'npm test');
            flushSync(() => container.querySelector<HTMLElement>('.codicon-add')!.click());

            expect(added).to.deep.equal([['git log ', 'npm test']]);
        } finally {
            dispose();
        }
    });

    it('refuses a rejected entry, reporting why and keeping the text for correction', () => {
        const { container, added, dispose } = mountList([]);
        try {
            typeInto(container, 'git log*');
            flushSync(() => container.querySelector<HTMLElement>('.codicon-add')!.click());

            // Nothing written, the reason is shown, and the input still holds what was typed.
            expect(added).to.be.empty;
            expect(container.textContent).to.include('"git log*" is not allowed');
            expect(container.querySelector<HTMLInputElement>('input')!.value).to.equal('git log*');
        } finally {
            dispose();
        }
    });

    it('clears the reported problem once the text changes', () => {
        const { container, dispose } = mountList([]);
        try {
            typeInto(container, '*');
            flushSync(() => container.querySelector<HTMLElement>('.codicon-add')!.click());
            expect(container.textContent).to.include('not allowed');

            typeInto(container, 'npm test');
            expect(container.textContent).to.not.include('not allowed');
        } finally {
            dispose();
        }
    });
});

describe('AiObjectListInput', () => {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    /** Mirrors a provider's custom-endpoints schema (OpenAI/Anthropic): required `model`/`url` plus optional fields. */
    const itemSchema = {
        type: 'object',
        required: ['model', 'url'],
        properties: {
            model: { type: 'string', title: 'Model ID' },
            url: { type: 'string', title: 'Endpoint URL' },
            maxRetries: { type: 'number', title: 'Max Retries' },
            headers: { type: 'object', title: 'Headers' }
        }
    } as PreferenceDataProperty;

    function mountList(values: Record<string, unknown>[]): { container: HTMLElement; changes: Record<string, unknown>[][]; dispose: () => void } {
        const changes: Record<string, unknown>[][] = [];
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        flushSync(() => root.render(React.createElement(AiObjectListInput, {
            values,
            itemSchema,
            ariaLabel: 'Custom models',
            onChange: (next: Record<string, unknown>[]) => { changes.push(next); }
        })));
        return { container, changes, dispose: () => { flushSync(() => root.unmount()); container.remove(); } };
    }

    /** Types into the `field`-th input of the `card`-th card, as a keystroke would. */
    function typeIntoField(container: HTMLElement, card: number, field: number, value: string): HTMLInputElement {
        const input = container.querySelectorAll('.ai-config-object-card')[card].querySelectorAll<HTMLInputElement>('input')[field];
        const view = container.ownerDocument.defaultView as unknown as { Event: typeof Event; HTMLInputElement: typeof HTMLInputElement };
        const nativeSetter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!;
        flushSync(() => {
            nativeSetter.call(input, value);
            input.dispatchEvent(new view.Event('input', { bubbles: true }));
        });
        return input;
    }

    /** React listens for `focusout`, not `blur`, so that is what a real focus loss delivers to it. */
    function commitByBlur(container: HTMLElement, input: HTMLInputElement): void {
        const view = container.ownerDocument.defaultView as unknown as { FocusEvent: typeof FocusEvent };
        flushSync(() => input.dispatchEvent(new view.FocusEvent('focusout', { bubbles: true })));
    }

    it('renders one card per entry, titled by the entry and marking required fields', () => {
        const { container, dispose } = mountList([{ model: 'my-model', url: 'http://localhost:8000' }]);
        try {
            const cards = container.querySelectorAll('.ai-config-object-card');
            expect(cards.length).to.equal(1);
            expect(cards[0].querySelector('.ai-config-object-card-title')?.textContent).to.equal('my-model');
            // `model` and `url` are required, the optional `maxRetries`/`headers` are not.
            expect(cards[0].querySelectorAll('.ai-config-object-field-required').length).to.equal(2);
            expect(cards[0].textContent).to.include('Model ID').and.to.include('Endpoint URL')
                .and.to.include('Max Retries').and.to.include('Headers');
        } finally {
            dispose();
        }
    });

    it('commits an edited field as a new array, leaving the other entries untouched', () => {
        const { container, changes, dispose } = mountList([{ model: 'a', url: 'http://a' }, { model: 'b', url: 'http://b' }]);
        try {
            const input = typeIntoField(container, 1, 0, 'c');
            commitByBlur(container, input);
            expect(changes).to.deep.equal([[{ model: 'a', url: 'http://a' }, { model: 'c', url: 'http://b' }]]);
        } finally {
            dispose();
        }
    });

    it('removes the property when a field is cleared, so the default applies again', () => {
        const { container, changes, dispose } = mountList([{ model: 'a', url: 'http://a', maxRetries: 5 }]);
        try {
            const input = typeIntoField(container, 0, 2, '');
            commitByBlur(container, input);
            expect(changes).to.deep.equal([[{ model: 'a', url: 'http://a' }]]);
        } finally {
            dispose();
        }
    });

    it('keeps properties the schema does not declare when editing another field', () => {
        const { container, changes, dispose } = mountList([{ model: 'a', url: 'http://a', futureFlag: true }]);
        try {
            const input = typeIntoField(container, 0, 1, 'http://b');
            commitByBlur(container, input);
            expect(changes).to.deep.equal([[{ model: 'a', url: 'http://b', futureFlag: true }]]);
        } finally {
            dispose();
        }
    });

    it('rejects invalid JSON for a nested object field, keeping the text for correction', () => {
        const { container, changes, dispose } = mountList([{ model: 'a', url: 'http://a' }]);
        try {
            const input = typeIntoField(container, 0, 3, '{not json');
            commitByBlur(container, input);
            expect(changes).to.be.empty;
            expect(container.textContent).to.include('不是有效的 JSON');
            expect(input.value).to.equal('{not json');
        } finally {
            dispose();
        }
    });

    it('appends an empty entry on add and drops an entry on remove', () => {
        const { container, changes, dispose } = mountList([{ model: 'a', url: 'http://a' }]);
        try {
            flushSync(() => container.querySelector<HTMLElement>('.ai-config-object-add')!.click());
            expect(changes[0]).to.deep.equal([{ model: 'a', url: 'http://a' }, {}]);

            flushSync(() => container.querySelector<HTMLElement>('.ai-config-object-card-remove')!.click());
            expect(changes[1]).to.deep.equal([]);
        } finally {
            dispose();
        }
    });

    it('titles an entry by its url when it has no id/model (an endpoint card)', () => {
        const { container, dispose } = mountList([{ url: 'https://gw.example.com/v1', models: [] }]);
        try {
            expect(container.querySelector('.ai-config-object-card-title')?.textContent).to.equal('https://gw.example.com/v1');
        } finally {
            dispose();
        }
    });

    it('edits a nested object-array field (an endpoint\'s `models` list) as sub-cards', () => {
        const endpointSchema = {
            type: 'object',
            required: ['url', 'models'],
            properties: {
                url: { type: 'string', title: 'Base URL' },
                apiKey: { type: 'string', title: 'API 密钥' },
                models: {
                    type: 'array',
                    title: '模型列表',
                    items: {
                        type: 'object',
                        required: ['model'],
                        properties: {
                            model: { type: 'string', title: '模型 ID' },
                            contextWindow: { type: 'integer', title: '上下文窗口' }
                        }
                    }
                }
            }
        } as PreferenceDataProperty;

        const changes: Record<string, unknown>[][] = [];
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        // Controlled rendering: keep the latest value in a variable and re-render on change, the way
        // the preference-backed row feeds the editor. Otherwise the nested list would reset to the
        // stale initial props on the next interaction.
        let current: Record<string, unknown>[] = [{ url: 'https://gw/v1', models: [{ model: 'qwen' }] }];
        const renderList = (): void => flushSync(() => root.render(React.createElement(AiObjectListInput, {
            values: current,
            itemSchema: endpointSchema,
            ariaLabel: 'Endpoints',
            onChange: (next: Record<string, unknown>[]) => { changes.push(next); current = next; renderList(); }
        })));
        renderList();

        try {
            // The nested list renders its own sub-cards inside the endpoint card.
            const endpointCard = container.querySelector('.ai-config-object-card') as HTMLElement;
            expect(endpointCard.querySelectorAll('.ai-config-object-card').length).to.equal(1);
            expect(endpointCard.textContent).to.include('模型列表').and.to.include('qwen');

            // Editing a nested model field commits the whole nested array up through the endpoint entry.
            // The nested card's model input carries its field label as the aria-label.
            const nestedInput = container.querySelector('input[aria-label="模型 ID"]') as HTMLInputElement;
            const view = container.ownerDocument.defaultView as unknown as { Event: typeof Event; HTMLInputElement: typeof HTMLInputElement; FocusEvent: typeof FocusEvent };
            const nativeSetter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!;
            flushSync(() => {
                nativeSetter.call(nestedInput, 'qwen3-max');
                nestedInput.dispatchEvent(new view.Event('input', { bubbles: true }));
            });
            flushSync(() => nestedInput.dispatchEvent(new view.FocusEvent('focusout', { bubbles: true })));
            expect(changes).to.deep.equal([[{ url: 'https://gw/v1', models: [{ model: 'qwen3-max' }] }]]);

            // Adding a nested model appends an empty sub-entry; removing the last one unsets `models`.
            const addButton = container.querySelector<HTMLElement>('.ai-config-object-field .ai-config-object-add')!;
            flushSync(() => addButton.click());
            expect((changes[1][0] as Record<string, unknown>).models).to.deep.equal([{ model: 'qwen3-max' }, {}]);

            // Remove buttons in document order: the endpoint card's own, then one per nested model card.
            // Removing the second (empty) nested model leaves the edited one.
            const nestedRemove = container.querySelectorAll<HTMLElement>('.ai-config-object-card-remove')[2];
            flushSync(() => nestedRemove.click());
            expect(changes[2][0]).to.deep.equal({ url: 'https://gw/v1', models: [{ model: 'qwen3-max' }] });
        } finally {
            flushSync(() => root.unmount());
            container.remove();
        }
    });

    /** Renders entries for an ad-hoc schema with controlled re-rendering, recording each commit. */
    function mountSchema(values: Record<string, unknown>[], schema: PreferenceDataProperty): {
        container: HTMLElement; changes: Record<string, unknown>[][]; dispose: () => void;
    } {
        const changes: Record<string, unknown>[][] = [];
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        let current = values;
        const render = (): void => flushSync(() => root.render(React.createElement(AiObjectListInput, {
            values: current,
            itemSchema: schema,
            ariaLabel: 'Entry',
            onChange: (next: Record<string, unknown>[]) => { changes.push(next); current = next; render(); }
        })));
        render();
        return { container, changes, dispose: () => { flushSync(() => root.unmount()); container.remove(); } };
    }

    it('renders booleans as plain on/off switches, showing the schema default while unset', () => {
        const schema = {
            type: 'object',
            properties: {
                streaming: { type: 'boolean', default: true, title: '流式传输' },
                caching: { type: 'boolean', default: false, title: '提示词缓存' }
            }
        } as PreferenceDataProperty;
        const { container, changes, dispose } = mountSchema([{}], schema);
        try {
            const switches = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
            expect(switches.length).to.equal(2);
            // An unset property shows the value the backend would apply — no "默认" third state.
            expect(switches[0].checked).to.equal(true);
            expect(switches[1].checked).to.equal(false);
            expect(container.textContent).to.not.include('默认');

            flushSync(() => switches[0].click());
            expect(changes).to.deep.equal([[{ streaming: false }]]);
        } finally {
            dispose();
        }
    });

    it('renders enums as a select over the declared values, defaulting to the schema default', () => {
        const schema = {
            type: 'object',
            properties: {
                strength: { type: 'string', enum: ['low', 'high'], default: 'high', title: '推理力度' }
            }
        } as PreferenceDataProperty;
        const { container, changes, dispose } = mountSchema([{}], schema);
        try {
            expect(container.textContent).to.not.include('默认');
            // The select shows the effective value (the schema default while unset).
            expect(container.querySelector('.theia-select-component-label')?.textContent).to.equal('high');
            expect(changes).to.be.empty;
        } finally {
            dispose();
        }
    });

    it('renders an object with declared properties as sub-fields instead of a JSON box', () => {
        const schema = {
            type: 'object',
            properties: {
                reasoning: {
                    type: 'object',
                    title: '推理能力',
                    properties: {
                        level: { type: 'string', enum: ['low', 'high'], default: 'low', title: '默认推理等级' },
                        note: { type: 'string', title: '备注' }
                    }
                }
            }
        } as PreferenceDataProperty;
        const { container, changes, dispose } = mountSchema([{}], schema);
        try {
            // Sub-fields render as their own controls; no JSON text box is used.
            expect(container.querySelectorAll('.ai-config-input-mono').length).to.equal(0);
            expect(container.textContent).to.include('默认推理等级').and.to.include('备注');
            expect(container.querySelector('.theia-select-component-label')?.textContent).to.equal('low');

            const note = container.querySelector('input[aria-label="备注"]') as HTMLInputElement;
            const view = container.ownerDocument.defaultView as unknown as { Event: typeof Event; HTMLInputElement: typeof HTMLInputElement; FocusEvent: typeof FocusEvent };
            const nativeSetter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value')!.set!;
            flushSync(() => {
                nativeSetter.call(note, 'hello');
                note.dispatchEvent(new view.Event('input', { bubbles: true }));
            });
            flushSync(() => note.dispatchEvent(new view.FocusEvent('focusout', { bubbles: true })));
            // A sub-field edit commits the whole object.
            expect(changes).to.deep.equal([[{ reasoning: { note: 'hello' } }]]);
        } finally {
            dispose();
        }
    });

    it('renders a list of declared choices as checkbox chips instead of a JSON box', () => {
        const schema = {
            type: 'object',
            properties: {
                levels: {
                    type: 'array',
                    title: '支持的推理等级',
                    items: { type: 'string', enum: ['low', 'high', 'max'] }
                }
            }
        } as PreferenceDataProperty;
        const { container, changes, dispose } = mountSchema([{}], schema);
        try {
            expect(container.querySelectorAll('.ai-config-input-mono').length).to.equal(0);
            const chips = container.querySelectorAll<HTMLInputElement>('.ai-config-object-chip input');
            expect(chips.length).to.equal(3);
            expect(Array.from(chips).every(chip => !chip.checked)).to.equal(true);

            flushSync(() => chips[1].click());
            expect(changes).to.deep.equal([[{ levels: ['high'] }]]);

            // Clearing the last choice removes the property rather than storing an empty list.
            flushSync(() => container.querySelectorAll<HTMLInputElement>('.ai-config-object-chip input')[1].click());
            expect(changes[1]).to.deep.equal([{}]);
        } finally {
            dispose();
        }
    });
});

describe('AiNumberStepper', () => {

    before(() => disableJSDOM = enableJSDOM());
    after(() => disableJSDOM());

    function mountStepper(value: number, integer?: boolean): { container: HTMLElement; committed: number[]; dispose: () => void } {
        const committed: number[] = [];
        const container = document.createElement('div');
        document.body.appendChild(container);
        const root = createRoot(container);
        flushSync(() => root.render(React.createElement(AiNumberStepper, {
            value,
            ariaLabel: 'Retry delay',
            integer,
            min: 0,
            onCommit: (next: number) => { committed.push(next); }
        })));
        return { container, committed, dispose: () => { flushSync(() => root.unmount()); container.remove(); } };
    }

    /** React listens for `focusout`, not `blur`, so that is what a real focus loss delivers to it. */
    function commitByBlur(container: HTMLElement): void {
        const input = container.querySelector<HTMLInputElement>('input')!;
        const view = container.ownerDocument.defaultView as unknown as { FocusEvent: typeof FocusEvent };
        flushSync(() => input.dispatchEvent(new view.FocusEvent('focusout', { bubbles: true })));
    }

    it('keeps a fractional value for a `number` preference', () => {
        const { container, committed, dispose } = mountStepper(60);
        try {
            typeInto(container, '1.5');
            commitByBlur(container);

            expect(committed).to.deep.equal([1.5]);
            // Also displayed as typed: rounding it away would hide what was just stored.
            expect(container.querySelector<HTMLInputElement>('input')!.value).to.equal('1.5');
        } finally {
            dispose();
        }
    });

    it('rounds a fractional value for an `integer` preference', () => {
        const { container, committed, dispose } = mountStepper(60, true);
        try {
            typeInto(container, '1.5');
            commitByBlur(container);

            expect(committed).to.deep.equal([2]);
        } finally {
            dispose();
        }
    });

    it('keeps the current value when the text is not a number', () => {
        const { container, committed, dispose } = mountStepper(60);
        try {
            typeInto(container, 'soon');
            commitByBlur(container);

            expect(committed).to.be.empty;
            expect(container.querySelector<HTMLInputElement>('input')!.value).to.equal('60');
        } finally {
            dispose();
        }
    });
});
