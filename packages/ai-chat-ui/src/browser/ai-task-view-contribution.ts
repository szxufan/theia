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

import { injectable } from '@theia/core/shared/inversify';
import { AIViewContribution } from '@theia/ai-core/lib/browser';
import { AiTaskView } from './ai-task-view';

export const AI_TASK_VIEW_TOGGLE_COMMAND_ID = 'aiTaskView:toggle';

@injectable()
export class AiTaskViewContribution extends AIViewContribution<AiTaskView> {

    constructor() {
        super({
            widgetId: AiTaskView.ID,
            widgetName: AiTaskView.LABEL,
            defaultWidgetOptions: {
                area: 'bottom',
                rank: 90
            },
            toggleCommandId: AI_TASK_VIEW_TOGGLE_COMMAND_ID,
        });
    }
}
