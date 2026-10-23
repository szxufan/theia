// *****************************************************************************
// Copyright (C) 2025 TypeFox and others.
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

import { injectable } from 'inversify';
import { ColorContribution } from './color-application-contribution';
import { ColorRegistry } from './color-registry';

@injectable()
export class SymbolIconColorContribution implements ColorContribution {
    registerColors(colors: ColorRegistry): void {
        colors.register(
            {
                id: 'symbolIcon.arrayForeground',
                defaults: 'editor.foreground',
                description: '数组符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.booleanForeground',
                defaults: 'editor.foreground',
                description: '布尔符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.classForeground',
                defaults: {
                    dark: '#EE9D28',
                    light: '#D67E00',
                    hcDark: '#EE9D28',
                    hcLight: '#D67E00'
                },
                description: '类符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.colorForeground',
                defaults: 'editor.foreground',
                description: '颜色符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.constantForeground',
                defaults: 'editor.foreground',
                description: '常量符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.constructorForeground',
                defaults: {
                    dark: '#B180D7',
                    light: '#652D90',
                    hcDark: '#B180D7',
                    hcLight: '#652D90'
                },
                description: '构造函数符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.enumeratorForeground',
                defaults: {
                    dark: '#EE9D28',
                    light: '#D67E00',
                    hcDark: '#EE9D28',
                    hcLight: '#D67E00'
                },
                description: '枚举符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.enumeratorMemberForeground',
                defaults: {
                    dark: '#75BEFF',
                    light: '#007ACC',
                    hcDark: '#75BEFF',
                    hcLight: '#007ACC'
                },
                description: '枚举成员符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.eventForeground',
                defaults: {
                    dark: '#EE9D28',
                    light: '#D67E00',
                    hcDark: '#EE9D28',
                    hcLight: '#D67E00'
                },
                description: '事件符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.fieldForeground',
                defaults: {
                    dark: '#75BEFF',
                    light: '#007ACC',
                    hcDark: '#75BEFF',
                    hcLight: '#007ACC'
                },
                description: '字段符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.fileForeground',
                defaults: 'editor.foreground',
                description: '文件符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.folderForeground',
                defaults: 'editor.foreground',
                description: '文件夹符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.functionForeground',
                defaults: {
                    dark: '#B180D7',
                    light: '#652D90',
                    hcDark: '#B180D7',
                    hcLight: '#652D90'
                },
                description: '函数符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.interfaceForeground',
                defaults: {
                    dark: '#75BEFF',
                    light: '#007ACC',
                    hcDark: '#75BEFF',
                    hcLight: '#007ACC'
                },
                description: '接口符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.keyForeground',
                defaults: 'editor.foreground',
                description: '键符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.keywordForeground',
                defaults: 'editor.foreground',
                description: '关键字符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.methodForeground',
                defaults: {
                    dark: '#B180D7',
                    light: '#652D90',
                    hcDark: '#B180D7',
                    hcLight: '#652D90'
                },
                description: '方法符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.moduleForeground',
                defaults: 'editor.foreground',
                description: '模块符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.namespaceForeground',
                defaults: 'editor.foreground',
                description: '命名空间符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.nullForeground',
                defaults: 'editor.foreground',
                description: '空值（null）符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.numberForeground',
                defaults: 'editor.foreground',
                description: '数字符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.objectForeground',
                defaults: 'editor.foreground',
                description: '对象符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.operatorForeground',
                defaults: 'editor.foreground',
                description: '运算符符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.packageForeground',
                defaults: 'editor.foreground',
                description: '包符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.propertyForeground',
                defaults: 'editor.foreground',
                description: '属性符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.referenceForeground',
                defaults: 'editor.foreground',
                description: '引用符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.snippetForeground',
                defaults: 'editor.foreground',
                description: '代码片段符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.stringForeground',
                defaults: 'editor.foreground',
                description: '字符串符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.structForeground',
                defaults: 'editor.foreground',
                description: '结构符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.textForeground',
                defaults: 'editor.foreground',
                description: '文本符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.typeParameterForeground',
                defaults: 'editor.foreground',
                description: '类型参数符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.unitForeground',
                defaults: 'editor.foreground',
                description: '单位符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            },
            {
                id: 'symbolIcon.variableForeground',
                defaults: {
                    dark: '#75BEFF',
                    light: '#007ACC',
                    hcDark: '#75BEFF',
                    hcLight: '#007ACC'
                },
                description: '变量符号的前景色。这些符号出现在大纲、面包屑和建议小部件中。'
            }
        );
    }
}
