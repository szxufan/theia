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

import { nls } from '@theia/core';
import { codicon } from '@theia/core/lib/browser';
import * as React from '@theia/core/shared/react';
import { formatTimeAgo } from '@theia/ai-chat-ui/lib/browser/chat-date-utils';
import { compareModelsByRecency, LanguageModel } from '@theia/ai-core/lib/common';
import { FavoriteModelsService } from '@theia/ai-core/lib/browser';
import { DiscoveredModel, ModelDiscoveryAction, ModelDiscoveryStatus } from '@theia/ai-core/lib/common/model-discovery-status';
import { AiConfigurationItemStatus } from '@theia/ai-core-ui/lib/browser/ai-configuration/ai-configuration-category';
import {
    AiConfigurationCallout, AiConfigurationEmptyState, AiConfigurationFilterInput, AiConfigurationFilterToggle, AiConfigurationIconButton, AiConfigurationSection,
    AiConfigurationStatusBadge
} from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-primitives';
import { AiConfigurationItemRow } from '@theia/ai-core-ui/lib/browser/ai-configuration/components/ai-configuration-item-row';

/**
 * Number of models from which the list gets a filter. Below it, scanning the list is faster than
 * typing; above it — OpenAI reports dozens — it is not.
 */
const FILTER_THRESHOLD = 8;

export interface ProviderModelDiscoverySectionProps {
    readonly status: ModelDiscoveryStatus;
    /** The provider's currently registered models. */
    readonly models: LanguageModel[];
    /** Decides which models the pickers offer, and takes the user's checks. */
    readonly favorites: FavoriteModelsService;
    readonly onRefresh: () => void;
    /** Runs what the provider offers to do about the current state, e.g. signing in to GitHub Copilot. */
    readonly onAction: (action: ModelDiscoveryAction) => void;
}

/**
 * Renders a provider's model-discovery state (fetching / ready / cached / error / no credentials /
 * awaiting consent / manual), a manual refresh, and the discovered models, below the provider's
 * settings in the Models category. This is the provider-level surface that per-model status cannot
 * give: fetching progress and failure of the list call itself.
 *
 * The list holds everything the provider offers, one entry per release included, which is more than
 * a model picker can carry. Which of them the pickers offer is shown and controlled here, by the
 * star on each row.
 */
export const ProviderModelDiscoverySection: React.FC<ProviderModelDiscoverySectionProps> = ({ status, models, favorites, onRefresh, onAction }) => {
    const [filter, setFilter] = React.useState('');
    const [favoritesOnly, setFavoritesOnly] = React.useState(false);
    // Re-render when a star is set anywhere, and when a discovery changes what is featured.
    const [favoritesRevision, setFavoritesRevision] = React.useState(0);
    React.useEffect(() => {
        const listener = favorites.onDidChange(() => setFavoritesRevision(revision => revision + 1));
        return () => listener.dispose();
    }, [favorites]);
    const fetching = status.state === 'fetching';
    const modelIdPrefix = status.modelIdPrefix ?? status.providerId;
    const overridden = favorites.hasOverrides(modelIdPrefix);
    // Without a credential there is nothing to ask the provider; refreshing would only report the same
    // state back. The setting or the sign-in above the list is what moves this on.
    const refreshable = status.state !== 'no-credentials' && status.state !== 'awaiting-consent';
    // Newest first: a provider's recent models are what a list this long is scrolled for. Models whose
    // provider reports no release date (Gemini reports none) fall back to alphabetical order.
    const rows = React.useMemo(() => models
        .slice()
        .sort(compareModelsByRecency)
        // `favoritesRevision` is not read here: it is what re-runs this when a star or the featured set changes.
        .map(model => describeModel(model, status.discovered, favorites))
        // The provider's current line-up first, newest first within each part. A list this long is read
        // from the top, and the models the picker starts with are what it is usually opened for. The sort
        // is stable, so it only lifts them past the older ones without disturbing the order.
        .sort((left, right) => Number(right.featured) - Number(left.featured)),
    [models, status.discovered, favorites, favoritesRevision]);
    const matches = React.useMemo(
        () => rows.filter(row => (!favoritesOnly || row.favorite) && matchesFilter(row, filter)),
        [rows, filter, favoritesOnly]
    );
    const favoritesOnlyLabel = favoritesOnly
        ? nls.localize('theia/ai/ide/modelsConfiguration/showAllModels', '显示所有已发现的模型')
        : nls.localize('theia/ai/ide/modelsConfiguration/showCheckedModels', '仅显示 AI 聊天输入框的模型选择器所显示的模型');
    const filterToggles: AiConfigurationFilterToggle[] = [{
        iconClass: codicon('pass'),
        title: favoritesOnlyLabel,
        active: favoritesOnly,
        onToggle: () => setFavoritesOnly(!favoritesOnly)
    }];
    return <AiConfigurationSection
        title={nls.localize('theia/ai/ide/modelsConfiguration/discovery', '模型发现')}
        count={rows.length > 0 ? rows.length : undefined}
        subtitle={sectionSubtitle(status, rows.length, rows.filter(row => row.favorite).length)}
        actions={<>
            <AiConfigurationStatusBadge status={discoveryStatusBadge(status)} />
            <AiConfigurationIconButton
                iconClass={codicon(fetching ? 'sync' : 'refresh')}
                title={refreshable
                    ? nls.localize('theia/ai/ide/modelsConfiguration/refresh', '刷新模型列表')
                    : status.message ?? nls.localize('theia/ai/ide/modelsConfiguration/refreshUnavailable', '在提供程序拥有凭据之前没有可刷新的内容')}
                busy={fetching}
                disabled={fetching || !refreshable}
                onClick={onRefresh}
            />
            <AiConfigurationIconButton
                iconClass={codicon('discard')}
                title={overridden
                    ? nls.localize('theia/ai/ide/modelsConfiguration/resetShown', '重置为默认值')
                    : nls.localize('theia/ai/ide/modelsConfiguration/resetShownUnavailable', '已是默认值')}
                disabled={!overridden}
                onClick={() => favorites.resetToDefaults(modelIdPrefix)}
            />
        </>}
    >
        <DiscoveryBody
            status={status}
            rows={rows}
            matches={matches}
            filter={filter}
            onFilterChange={setFilter}
            filterToggles={filterToggles}
            favorites={favorites}
            onRefresh={onRefresh}
            onAction={onAction}
        />
    </AiConfigurationSection>;
};

/**
 * The line under the section title. A manually configured list says so, since that is why no discovery
 * ran; otherwise it states once — rather than leaving it to the tooltip of each of forty rows — that
 * the checks are about the chat input alone. An agent's model and a model alias are picked from every
 * discovered model, on their own pages.
 */
function sectionSubtitle(status: ModelDiscoveryStatus, rowCount: number, shownCount: number): string | undefined {
    if (status.state === 'overridden') {
        return status.message;
    }
    // The ratio is the overview a list this long cannot give by itself, and it says what the checks mean.
    return rowCount > 0
        ? nls.localize('theia/ai/ide/modelsConfiguration/shownExplanation',
            'AI 聊天输入框的模型选择器中显示 {1} 个中的 {0} 个', shownCount, rowCount)
        : undefined;
}

/** A registered model paired with whatever the provider reported about it. */
interface ModelRow {
    readonly id: string;
    /** Fully qualified id, i.e. with the `<provider>/` prefix, as the favorites are keyed. */
    readonly qualifiedId: string;
    readonly label?: string;
    readonly description?: string;
    readonly released?: number;
    readonly ready: boolean;
    readonly statusMessage?: string;
    /** Whether the model pickers offer this model. */
    readonly favorite: boolean;
    /** Whether it is offered automatically, in which case the star cannot be removed. */
    readonly featured: boolean;
}

function describeModel(model: LanguageModel, discovered: readonly DiscoveredModel[] | undefined, favorites: FavoriteModelsService): ModelRow {
    // Registered ids carry the `<provider>/` prefix; what the provider reported does not.
    const id = model.id.substring(model.id.indexOf('/') + 1);
    const reported = discovered?.find(candidate => candidate.id === id);
    return {
        id,
        qualifiedId: model.id,
        label: reported?.label ?? model.name,
        description: reported?.description,
        released: model.released ?? reported?.released,
        ready: model.status.status === 'ready',
        statusMessage: model.status.message,
        favorite: favorites.isFavorite(model.id),
        featured: favorites.isFeatured(model.id)
    };
}

function matchesFilter(row: ModelRow, filter: string): boolean {
    const query = filter.trim().toLowerCase();
    return query.length === 0
        || row.id.toLowerCase().includes(query)
        || (row.label?.toLowerCase().includes(query) ?? false);
}

interface DiscoveryBodyProps {
    readonly status: ModelDiscoveryStatus;
    readonly rows: ModelRow[];
    readonly matches: ModelRow[];
    readonly filter: string;
    readonly onFilterChange: (value: string) => void;
    /** Narrowings offered inside the filter box, on top of the typed text. */
    readonly filterToggles: AiConfigurationFilterToggle[];
    readonly favorites: FavoriteModelsService;
    readonly onRefresh: () => void;
    readonly onAction: (action: ModelDiscoveryAction) => void;
}

const DiscoveryBody: React.FC<DiscoveryBodyProps> = ({ status, rows, matches, filter, onFilterChange, filterToggles, favorites, onRefresh, onAction }) => {
    // The provider's API-key and consent settings sit on the same page, right above this section — but
    // a provider whose credential is a sign-in rather than a setting names the command that gets one.
    if (status.state === 'no-credentials' || status.state === 'awaiting-consent') {
        return <AiConfigurationEmptyState
            message={status.message ?? ''}
            iconClass={codicon('key')}
            action={status.action && <button className='theia-button main' onClick={() => onAction(status.action!)}>{status.action.label}</button>}
        />;
    }
    const retry = <button className='theia-button main' onClick={onRefresh}>{nls.localizeByDefault('重试')}</button>;
    const refresh = <button className='theia-button main' onClick={onRefresh}>{nls.localizeByDefault('刷新')}</button>;
    return <>
        {/* A failed refresh does not unregister what an earlier one found, so the models stay listed
            below the failure rather than being replaced by it. */}
        {status.state === 'error' && <AiConfigurationCallout message={status.message ?? ''} action={retry} />}
        {status.state === 'ready' && status.fromCache && status.message && <AiConfigurationCallout message={status.message} action={refresh} />}
        {rows.length === 0
            ? <AiConfigurationEmptyState
                message={nls.localize('theia/ai/ide/modelsConfiguration/noModels', '尚未发现任何模型。')}
                iconClass={codicon('cloud')}
            />
            : <>
                {rows.length > FILTER_THRESHOLD && <AiConfigurationFilterInput
                    value={filter}
                    onChange={onFilterChange}
                    placeholder={nls.localize('theia/ai/ide/modelsConfiguration/filterModels', '筛选模型')}
                    toggles={filterToggles}
                />}
                {matches.length === 0
                    ? <AiConfigurationEmptyState message={nls.localizeByDefault('未找到结果')} />
                    : <ModelRows rows={matches} favorites={favorites} />}
            </>}
    </>;
};

const ModelRows: React.FC<{ rows: ModelRow[]; favorites: FavoriteModelsService }> = ({ rows, favorites }) => <>
    {rows.map(row => <AiConfigurationItemRow
        key={row.id}
        // The id is the heading on every row, whatever the provider reports: it is what agents, aliases
        // and settings reference, and OpenAI reports nothing else, so heading it with the name where
        // there is one would give each provider a differently shaped list.
        label={row.id}
        // Kept on the row whether the model is checked or not: it says that this is one of the
        // provider's current models, which is why the picker starts with it and stays true after
        // someone unchecks it.
        tags={row.featured
            ? [{
                label: nls.localizeByDefault('默认'),
                title: nls.localize('theia/ai/ide/modelsConfiguration/defaultModel',
                    '此提供程序最新的模型之一，除非在此处隐藏，否则 AI 聊天输入框的模型选择器会显示它')
            }]
            : undefined}
        description={modelRowDescription(row)}
        // Every model in this list is ready as long as the provider has a key, which it has whenever the
        // list is shown at all. Only the exception is worth a badge.
        status={row.ready ? undefined : notReadyBadge(row)}
        trailing={<>
            {/* Names the order the list is in, which is otherwise a claim the user cannot check. */}
            {row.released !== undefined && <span className='ai-configuration-item-row-detail'>
                {nls.localize('theia/ai/ide/modelsConfiguration/released', '发布于 {0}',
                    formatTimeAgo(row.released))}
            </span>}
            <ShowInChatButton row={row} favorites={favorites} />
        </>}
    />)}
</>;

/**
 * Whether the AI chat input's model picker shows this model: a checked circle when it does, an empty
 * one when it does not. Nothing else is affected — an agent's model and a model alias are picked from
 * every discovered model, on their own pages.
 *
 * What a model released tomorrow is shown by is the `Default` badge on its row, not a check made
 * here; unchecking one of those is what says otherwise, and that is all that is stored.
 */
const ShowInChatButton: React.FC<{ row: ModelRow; favorites: FavoriteModelsService }> = ({ row, favorites }) => {
    const title = row.favorite
        ? nls.localize('theia/ai/ide/modelsConfiguration/hideModel', '在 AI 聊天输入框的模型选择器中隐藏此模型')
        : nls.localize('theia/ai/ide/modelsConfiguration/showModel', '在 AI 聊天输入框的模型选择器中显示此模型');
    return <AiConfigurationIconButton
        iconClass={codicon(row.favorite ? 'pass' : 'circle-large')}
        title={title}
        onClick={() => favorites.toggleFavorite(row.qualifiedId)}
    />;
};

/** What the provider reports about the model, if anything: its name, its description, or both. */
function modelRowDescription(row: ModelRow): string | undefined {
    const parts = [row.label, row.description].filter(part => part !== undefined);
    return parts.length > 0 ? parts.join(' · ') : undefined;
}

function notReadyBadge(row: ModelRow): AiConfigurationItemStatus {
    return {
        kind: 'warn',
        label: nls.localize('theia/ai/ide/modelsConfiguration/modelNotReady', '未就绪'),
        tooltip: row.statusMessage
    };
}

/** Maps the discovery state onto the shared status badge, so it reads like every other badge in the view. */
function discoveryStatusBadge(status: ModelDiscoveryStatus): AiConfigurationItemStatus {
    const badge = genericStatusBadge(status);
    // A provider whose credential is not an API key says so itself; the state alone cannot know.
    return status.stateLabel ? { ...badge, label: status.stateLabel } : badge;
}

function genericStatusBadge(status: ModelDiscoveryStatus): AiConfigurationItemStatus {
    switch (status.state) {
        case 'no-credentials':
            return { kind: 'warn', label: nls.localize('theia/ai/ide/modelsConfiguration/noKey', '无 API 密钥'), tooltip: status.message };
        case 'awaiting-consent':
            return { kind: 'warn', label: nls.localize('theia/ai/ide/modelsConfiguration/awaitingConsent', '等待授权'), tooltip: status.message };
        case 'fetching':
            return { kind: 'off', label: nls.localize('theia/ai/ide/modelsConfiguration/fetching', '正在获取…'), tooltip: status.message };
        case 'error':
            return { kind: 'error', label: nls.localizeByDefault('错误'), tooltip: status.message };
        case 'overridden':
            return { kind: 'off', label: nls.localizeByDefault('手动'), tooltip: status.message };
        case 'ready':
            if (status.fromCache) {
                return { kind: 'warn', label: nls.localizeByDefault('已缓存'), tooltip: status.message };
            }
            return {
                kind: 'on',
                label: status.lastFetch
                    ? nls.localize('theia/ai/ide/modelsConfiguration/updated', '已于 {0} 更新', formatTimeAgo(status.lastFetch))
                    : nls.localize('theia/ai/ide/modelsConfiguration/ready', '就绪'),
                tooltip: status.message
            };
        default:
            return { kind: 'off', label: nls.localizeByDefault('空闲'), tooltip: status.message };
    }
}
