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

import { nls } from '../nls';
import { isOSX, isWindows } from '../os';

/**
 * Hint appended to API key preference descriptions on Linux, where environment variables
 * set in `~/.bashrc` are not available to desktop-launched applications.
 */
export const LINUX_ENV_HINT = !isWindows && !isOSX
    ? ' ' + nls.localize('theia/ai-core/preferences/linuxEnvHint',
        '在 Linux 上，如果你通过桌面快捷方式启动应用程序，请确保该变量定义在 `~/.profile` 中（而不仅是 `~/.bashrc`）。' +
        '详情见[文档](https://theia-ide.org/docs/user_ai/#setting-api-keys)。')
    : '';
