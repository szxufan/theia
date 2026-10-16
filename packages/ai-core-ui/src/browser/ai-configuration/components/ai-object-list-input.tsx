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

/**
 * A schema-driven editor for `array` preferences whose entries are objects with a declared
 * `properties` map — above all a provider's custom endpoints (`ai-features.openAiCustom.customOpenAiModels`,
 * `ai-features.anthropicCustom.customAnthropicModels`), which would otherwise be editable only as raw
 * JSON in `settings.json`. Each entry renders as a card with one field per declared property; entries
 * can be added and removed. Clearing a field removes the property from the entry, so optional settings
 * fall back to their defaults. Properties the schema does not declare are preserved untouched.
 *
 * Presentational and DI-free like the other `ai-config-*` controls; styled in
 * `ai-configuration-components.css`.
 */

import { nls } from '@theia/core';
import { codicon } from '@theia/core/lib/browser';
import { PreferenceDataProperty } from '@theia/core/lib/common/preferences/preference-schema';
import * as React from '@theia/core/shared/react';
import { AiEnumOption, AiEnumSelect, AiTextInput } from './ai-configuration-controls';

/** The outcome of parsing a field's committed text into a storable property value. */
type ParsedFieldValue =
    | { readonly kind: 'value'; readonly value: unknown }
    /** The field was cleared: remove the property so the entry falls back to the default. */
    | { readonly kind: 'unset' }
    | { readonly kind: 'error'; readonly message: string };

export const AiObjectListInput: React.FC<{
    values: Record<string, unknown>[];
    /** The schema of a single entry, carrying the `properties` map (and optionally `required`). */
    itemSchema: PreferenceDataProperty;
    ariaLabel: string;
    disabled?: boolean;
    onChange: (values: Record<string, unknown>[]) => void;
}> = ({ values, itemSchema, ariaLabel, disabled, onChange }) => {
    const properties = itemSchema.properties ?? {};
    const required = new Set(itemSchema.required ?? []);

    const updateProperty = (index: number, key: string, parsed: ParsedFieldValue): void => {
        if (parsed.kind === 'error') {
            return;
        }
        onChange(values.map((item, itemIndex) => {
            if (itemIndex !== index) {
                return item;
            }
            const next = { ...item };
            if (parsed.kind === 'unset') {
                delete next[key];
            } else {
                next[key] = parsed.value;
            }
            return next;
        }));
    };
    const removeAt = (index: number): void => onChange(values.filter((_, itemIndex) => itemIndex !== index));

    return <div className='ai-config-object-list' role='group' aria-label={ariaLabel}>
        {values.map((item, index) => (
            <div className='ai-config-object-card' key={index}>
                <div className='ai-config-object-card-header'>
                    <span className='ai-config-object-card-title'>{itemTitle(item, index)}</span>
                    <span
                        className='preference-array-element-btn ai-config-object-card-remove'
                        role='button'
                        tabIndex={0}
                        title={nls.localizeByDefault('移除')}
                        onClick={() => { if (!disabled) { removeAt(index); } }}
                    >
                        <i className={codicon('close')}></i>
                    </span>
                </div>
                {Object.entries(properties).map(([key, property]) => (
                    <AiObjectField
                        key={key}
                        fieldKey={key}
                        property={property}
                        required={required.has(key)}
                        value={item[key]}
                        disabled={disabled}
                        onCommit={parsed => updateProperty(index, key, parsed)}
                    />
                ))}
            </div>
        ))}
        <button
            type='button'
            className='theia-button secondary ai-config-object-add'
            disabled={disabled}
            onClick={() => onChange([...values, {}])}
        >
            <span className={codicon('add')}></span>
            {nls.localize('theia/ai/core/aiConfiguration/objectList/add', '添加')}
        </button>
    </div>;
};

/**
 * The card's display name: the entry's `id`, falling back to its `model`/`name`, then to a positional
 * label while the entry is still empty (a just-added card has no identifying property yet).
 */
function itemTitle(item: Record<string, unknown>, index: number): string {
    for (const key of ['id', 'model', 'name']) {
        const value = item[key];
        if (typeof value === 'string' && value) {
            return value;
        }
    }
    return nls.localize('theia/ai/core/aiConfiguration/objectList/entry', '条目 {0}', index + 1);
}

/** Whether a property holds a secret (an API key, token or password) that should be masked. */
function isSecretKey(key: string): boolean {
    const lowered = key.toLowerCase();
    return lowered.endsWith('apikey') || lowered.endsWith('token') || lowered.endsWith('secret') || lowered.endsWith('password');
}

/** A human-readable label for a property: its schema `title`, falling back to the humanized key. */
function fieldLabel(key: string, property: PreferenceDataProperty): string {
    if (property.title) {
        return property.title;
    }
    let formatted = key[0] ? key[0].toLocaleUpperCase() : key;
    for (let i = 1; i < key.length; i++) {
        const char = key[i];
        const previous = key[i - 1];
        if (char === char.toLocaleUpperCase() && char !== char.toLocaleLowerCase()
            && !/\s/.test(previous) && previous !== previous.toLocaleUpperCase()) {
            formatted += ' ';
        }
        formatted += char;
    }
    return formatted.trim();
}

/**
 * One property of an entry: renders the control matching the property's schema type — a select for
 * enums, a tri-state select for booleans (`undefined` keeps the default), a text input for strings
 * (masked for secrets), and a JSON text input for nested objects/arrays such as `headers`.
 */
const AiObjectField: React.FC<{
    fieldKey: string;
    property: PreferenceDataProperty;
    required: boolean;
    value: unknown;
    disabled?: boolean;
    onCommit: (parsed: ParsedFieldValue) => void;
}> = ({ fieldKey, property, required, value, disabled, onCommit }) => {
    const label = fieldLabel(fieldKey, property);
    const tooltip = property.markdownDescription ?? property.description;
    const labelNode = <span className='ai-config-object-field-label' title={tooltip}>
        {label}{required && <span className='ai-config-object-field-required' aria-hidden='true'> *</span>}
    </span>;

    if (property.enum) {
        const options: AiEnumOption[] = [
            { value: '', label: nls.localize('theia/ai/core/aiConfiguration/objectList/default', '默认') },
            ...property.enum.map(option => ({ value: String(option), label: String(option) }))
        ];
        return <div className='ai-config-object-field'>
            {labelNode}
            <AiEnumSelect
                value={value === undefined ? '' : String(value)}
                options={options}
                ariaLabel={label}
                disabled={disabled}
                onCommit={selected => onCommit(selected === '' ? { kind: 'unset' } : { kind: 'value', value: selected })}
            />
        </div>;
    }

    const type = property.type;
    if (type === 'boolean') {
        const options: AiEnumOption[] = [
            { value: '', label: nls.localize('theia/ai/core/aiConfiguration/objectList/default', '默认') },
            { value: 'true', label: nls.localize('theia/ai/core/aiConfiguration/objectList/true', '是') },
            { value: 'false', label: nls.localize('theia/ai/core/aiConfiguration/objectList/false', '否') }
        ];
        return <div className='ai-config-object-field'>
            {labelNode}
            <AiEnumSelect
                value={value === true ? 'true' : value === false ? 'false' : ''}
                options={options}
                ariaLabel={label}
                disabled={disabled}
                onCommit={selected => onCommit(
                    selected === '' ? { kind: 'unset' } : { kind: 'value', value: selected === 'true' })}
            />
        </div>;
    }

    if (type === 'number' || type === 'integer') {
        return <div className='ai-config-object-field'>
            {labelNode}
            <ParsedTextInput
                value={value}
                ariaLabel={label}
                disabled={disabled}
                format={current => typeof current === 'number' ? String(current) : ''}
                parse={text => {
                    const parsed = Number(text);
                    if (Number.isNaN(parsed)) {
                        return { kind: 'error', message: nls.localize('theia/ai/core/aiConfiguration/objectList/invalidNumber', '请输入数字。') };
                    }
                    if (type === 'integer' && !Number.isInteger(parsed)) {
                        return { kind: 'error', message: nls.localize('theia/ai/core/aiConfiguration/objectList/invalidInteger', '请输入整数。') };
                    }
                    return { kind: 'value', value: parsed };
                }}
                onCommit={onCommit}
            />
        </div>;
    }

    if (type === 'object' || type === 'array') {
        return <div className='ai-config-object-field'>
            {labelNode}
            <ParsedTextInput
                value={value}
                ariaLabel={label}
                monospace={true}
                disabled={disabled}
                format={current => current === undefined ? '' : JSON.stringify(current)}
                parse={text => {
                    try {
                        return { kind: 'value', value: JSON.parse(text) };
                    } catch {
                        return { kind: 'error', message: nls.localize('theia/ai/core/aiConfiguration/objectList/invalidJson', '不是有效的 JSON。') };
                    }
                }}
                onCommit={onCommit}
            />
        </div>;
    }

    // A `['string', 'boolean']` union (e.g. `apiKey`, `apiVersion`): free text, where the literal
    // `true`/`false` selects the boolean form (e.g. "use the global API key") instead of a string.
    const stringBooleanUnion = Array.isArray(type) && type.includes('string') && type.includes('boolean');
    return <div className='ai-config-object-field'>
        {labelNode}
        <ParsedTextInput
            value={value}
            ariaLabel={label}
            password={isSecretKey(fieldKey)}
            disabled={disabled}
            format={current => typeof current === 'boolean' ? String(current) : typeof current === 'string' ? current : ''}
            parse={text => {
                if (stringBooleanUnion && (text === 'true' || text === 'false')) {
                    return { kind: 'value', value: text === 'true' };
                }
                return { kind: 'value', value: text };
            }}
            onCommit={onCommit}
        />
    </div>;
};

/**
 * A text field that converts its committed text into a storable property value through {@link parse},
 * reporting a conversion failure under the input instead of writing it. An emptied field commits as
 * `unset`, which removes the property from the entry. Commits on blur/Enter via {@link AiTextInput}.
 */
const ParsedTextInput: React.FC<{
    value: unknown;
    ariaLabel: string;
    placeholder?: string;
    password?: boolean;
    monospace?: boolean;
    disabled?: boolean;
    /** Renders the stored value back to text; defaults to the string value (or empty when unset). */
    format?: (value: unknown) => string;
    parse: (text: string) => ParsedFieldValue;
    onCommit: (parsed: ParsedFieldValue) => void;
}> = ({ value, ariaLabel, placeholder, password, monospace, disabled, format, parse, onCommit }) => {
    const [error, setError] = React.useState<string | undefined>(undefined);
    const text = format ? format(value) : typeof value === 'string' ? value : '';
    const commit = (draft: string): void => {
        const parsed = draft.trim() === '' ? { kind: 'unset' } as const : parse(draft);
        if (parsed.kind === 'error') {
            // The text stays in the input (the stored value did not change), so the user can correct it.
            setError(parsed.message);
            return;
        }
        setError(undefined);
        onCommit(parsed);
    };
    return <AiTextInput
        value={text}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        password={password}
        monospace={monospace}
        invalid={!!error}
        errorMessage={error}
        disabled={disabled}
        onCommit={commit}
    />;
};
