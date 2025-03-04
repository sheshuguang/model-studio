/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AbstractPlugin } from '@finos/legend-shared';
import type {
  LegendApplicationContextualDocumentationEntry,
  LegendApplicationDocumentationRegistryEntry,
  LegendApplicationKeyedDocumentationEntry,
} from './LegendApplicationDocumentationService.js';

export abstract class LegendApplicationPlugin extends AbstractPlugin {
  /**
   * Get the list of documentation registry entries from which the application can fetch
   * documentation config data and load the documentation registry
   */
  getExtraDocumentationRegistryEntries?(): LegendApplicationDocumentationRegistryEntry[];

  /**
   * Get the list of keyed documentation entries to be registered with documentation service.
   */
  getExtraKeyedDocumentationEntries?(): LegendApplicationKeyedDocumentationEntry[];

  /**
   * Get the list of documentation keys whose corresponding documentation entry is required
   * in the application. The documentation registry will be scanned for the presence of these,
   * if they are not available, warnings will be issued.
   */
  getExtraRequiredDocumentationKeys?(): string[];

  /**
   * Get the list of contextual documentation entries to be registered with documentation service.
   */
  getExtraContextualDocumentationEntries?(): LegendApplicationContextualDocumentationEntry[];
}
