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

import { hashArray, type Hashable } from '@finos/legend-shared';
import { TEXT_HASH_STRUCTURE } from '../../../../../../DSLText_ModelUtils.js';
import {
  type V1_PackageableElementVisitor,
  V1_PackageableElement,
} from '@finos/legend-graph';

export class V1_Text extends V1_PackageableElement implements Hashable {
  type?: string | undefined;
  content!: string;

  override get hashCode(): string {
    return hashArray([
      TEXT_HASH_STRUCTURE.TEXT,
      this.path,
      this.type ?? '',
      this.content,
    ]);
  }

  accept_PackageableElementVisitor<T>(
    visitor: V1_PackageableElementVisitor<T>,
  ): T {
    return visitor.visit_PackageableElement(this);
  }
}
