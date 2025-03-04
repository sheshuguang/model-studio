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

import {
  type FlatDataInstanceSetImplementation,
  type RootFlatDataRecordType,
  type FlatDataInputData,
  type FlatDataPropertyMapping,
  type FlatDataConnection,
  observe_RootFlatDataRecordType,
  observe_OptionalEnumerationMappingReference,
  type OptionalEnumerationMappingExplicitReference,
} from '@finos/legend-graph';
import { action } from 'mobx';

export const flatData_setSourceRootRecordType = action(
  (
    fl: FlatDataInstanceSetImplementation,
    value: RootFlatDataRecordType,
  ): void => {
    observe_RootFlatDataRecordType(value);
    fl.sourceRootRecordType.value = value;
  },
);

export const flatData_setData = action(
  (input: FlatDataInputData, value: string): void => {
    input.data = value;
  },
);

export const flatDataPropertyMapping_setTransformer = action(
  (
    val: FlatDataPropertyMapping,
    value: OptionalEnumerationMappingExplicitReference,
  ): void => {
    val.transformer = observe_OptionalEnumerationMappingReference(value);
  },
);

export const flatDataConnection_setUrl = action(
  (fD: FlatDataConnection, url: string): void => {
    fD.url = url;
  },
);
