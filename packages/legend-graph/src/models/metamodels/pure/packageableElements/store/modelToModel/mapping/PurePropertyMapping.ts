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

import { CORE_HASH_STRUCTURE } from '../../../../../../../MetaModelConst.js';
import { hashArray, type Hashable } from '@finos/legend-shared';
import {
  type PropertyMappingVisitor,
  PropertyMapping,
} from '../../../mapping/PropertyMapping.js';
import type { PropertyReference } from '../../../domain/PropertyReference.js';
import type { SetImplementation } from '../../../mapping/SetImplementation.js';
import type { PropertyMappingsImplementation } from '../../../mapping/PropertyMappingsImplementation.js';
import type { RawLambda } from '../../../../rawValueSpecification/RawLambda.js';
import { OptionalEnumerationMappingExplicitReference } from '../../../mapping/EnumerationMappingReference.js';

export class PurePropertyMapping extends PropertyMapping implements Hashable {
  transformer = OptionalEnumerationMappingExplicitReference.create(undefined);
  /**
   * Studio does not process value specification, they are left in raw JSON form
   *
   * @discrepancy model
   */
  transform: RawLambda;
  explodeProperty?: boolean | undefined;

  constructor(
    owner: PropertyMappingsImplementation,
    property: PropertyReference,
    transform: RawLambda,
    source: SetImplementation,
    target?: SetImplementation,
    explodeProperty?: boolean,
  ) {
    super(owner, property, source, target);
    this.transform = transform;
    this.explodeProperty = explodeProperty;
  }

  override get hashCode(): string {
    return hashArray([
      CORE_HASH_STRUCTURE.PURE_PROPERTY_MAPPING,
      super.hashCode,
      this.transformer.valueForSerialization ?? '',
      this.transform,
      Boolean(this.explodeProperty).toString(),
    ]);
  }

  accept_PropertyMappingVisitor<T>(visitor: PropertyMappingVisitor<T>): T {
    return visitor.visit_PurePropertyMapping(this);
  }
}
