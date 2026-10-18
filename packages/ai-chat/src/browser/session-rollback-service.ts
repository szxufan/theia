// *****************************************************************************
// Copyright (C) 2026 EclipseSource and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-v2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { inject, injectable } from '@theia/core/shared/inversify';
import { URI } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { ChatService } from '../common/chat-service';
import { ChangeSetElement } from '../common/change-set';
import { MutableChatModel } from '../common/chat-model';
import { ChangeSetFileService } from './change-set-file-service';

/** 回滚计划中的单个文件条目。 */
export interface RollbackPlanEntry {
    readonly uri: URI;
    /** `add` 表示该文件在该轮请求之前不存在，回滚时应删除。 */
    readonly type: 'add' | 'modify' | 'delete';
    /** 要恢复的修改前内容；`type === 'add'` 时为 `undefined`。 */
    readonly restoreContent?: string;
}

/** 无法恢复的文件及原因。 */
export interface RollbackSkippedEntry {
    readonly uri: URI;
    readonly reason: string;
}

export interface RollbackPlan {
    readonly sessionId: string;
    readonly requestId: string;
    readonly entries: RollbackPlanEntry[];
    readonly skipped: RollbackSkippedEntry[];
}

export interface RollbackResult {
    /** 恢复了内容的文件数。 */
    readonly restored: number;
    /** 删除的新建文件数。 */
    readonly deleted: number;
    readonly failed: RollbackSkippedEntry[];
}

export const SessionRollbackService = Symbol('SessionRollbackService');

export interface SessionRollbackService {
    /** 汇总从指定请求（含）到最新请求的所有 AI 文件变更，生成回滚计划；找不到会话或请求时返回 `undefined`。 */
    createPlan(sessionId: string, requestId: string): Promise<RollbackPlan | undefined>;
    /** 按计划把文件恢复到该轮请求之前，并从相关变更集中移除对应元素。 */
    executePlan(plan: RollbackPlan): Promise<RollbackResult>;
}

@injectable()
export class SessionRollbackServiceImpl implements SessionRollbackService {

    @inject(ChatService)
    protected readonly chatService: ChatService;

    @inject(ChangeSetFileService)
    protected readonly changeSetFileService: ChangeSetFileService;

    @inject(FileService)
    protected readonly fileService: FileService;

    async createPlan(sessionId: string, requestId: string): Promise<RollbackPlan | undefined> {
        const scope = this.getRequestsFrom(sessionId, requestId);
        if (!scope) {
            return undefined;
        }
        const { requests, from } = scope;

        // 同一文件可能被多轮请求反复修改，恢复目标是最早一轮修改之前的内容
        const entries = new Map<string, RollbackPlanEntry>();
        const skipped: RollbackSkippedEntry[] = [];
        const seen = new Set<string>();
        for (let i = from; i < requests.length; i++) {
            for (const element of requests[i].changeSet?.getElements() ?? []) {
                const key = element.uri.toString();
                if (seen.has(key)) {
                    continue;
                }
                seen.add(key);
                const entry = await this.toPlanEntry(element);
                if (entry) {
                    entries.set(key, entry);
                } else {
                    skipped.push({
                        uri: element.uri,
                        reason: '无法确定该文件在修改前的内容'
                    });
                }
            }
        }
        return { sessionId, requestId, entries: [...entries.values()], skipped };
    }

    async executePlan(plan: RollbackPlan): Promise<RollbackResult> {
        let restored = 0;
        let deleted = 0;
        const failed: RollbackSkippedEntry[] = [];
        for (const entry of plan.entries) {
            try {
                if (entry.type === 'add') {
                    if (await this.fileService.exists(entry.uri)) {
                        await this.changeSetFileService.delete(entry.uri);
                    }
                    deleted++;
                } else if (entry.restoreContent !== undefined) {
                    await this.changeSetFileService.write(entry.uri, entry.restoreContent);
                    restored++;
                }
            } catch (error) {
                failed.push({
                    uri: entry.uri,
                    reason: error instanceof Error ? error.message : String(error)
                });
            }
        }
        this.removeFromChangeSets(plan);
        return { restored, deleted, failed };
    }

    protected async toPlanEntry(element: ChangeSetElement): Promise<RollbackPlanEntry | undefined> {
        const type = element.type ?? 'modify';
        if (type === 'add') {
            return { uri: element.uri, type };
        }
        const restoreContent = await this.readOriginalContent(element);
        if (restoreContent === undefined) {
            return undefined;
        }
        return { uri: element.uri, type, restoreContent };
    }

    /**
     * 读取元素记录的修改前内容。只有 `ChangeSetFileElement` 提供该能力，这里用鸭子类型探测，
     * 避免对具体元素类型产生硬依赖，也便于测试用轻量替身。
     */
    protected async readOriginalContent(element: ChangeSetElement): Promise<string | undefined> {
        const getter = (element as { getOriginalContent?: () => Promise<string | undefined> }).getOriginalContent;
        if (typeof getter === 'function') {
            return getter.call(element);
        }
        return undefined;
    }

    protected getRequestsFrom(sessionId: string, requestId: string): { requests: ReturnType<MutableChatModel['getRequests']>, from: number } | undefined {
        const model = this.chatService.getSession(sessionId)?.model as MutableChatModel | undefined;
        if (!model) {
            return undefined;
        }
        const requests = model.getRequests();
        const index = requests.findIndex(request => request.id === requestId);
        if (index < 0) {
            return undefined;
        }
        return { requests, from: index };
    }

    /** 回滚后，目标请求及其后各请求变更集中对应文件的建议已不再反映磁盘状态，直接移除。 */
    protected removeFromChangeSets(plan: RollbackPlan): void {
        const scope = this.getRequestsFrom(plan.sessionId, plan.requestId);
        if (!scope) {
            return;
        }
        const uris = [...plan.entries, ...plan.skipped].map(entry => entry.uri);
        for (let i = scope.from; i < scope.requests.length; i++) {
            scope.requests[i].changeSet?.removeElements(...uris);
        }
    }
}
