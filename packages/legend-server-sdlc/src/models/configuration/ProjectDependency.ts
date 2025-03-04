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

import { createModelSchema, primitive } from 'serializr';
import {
  type Hashable,
  hashArray,
  uuid,
  SerializationFactory,
} from '@finos/legend-shared';
import { observable, action, computed, makeObservable } from 'mobx';

const PROJECT_DEPENDENCY_HASH_STRUCTURE = 'PROJECT_DEPENDENCY';

export class ProjectDependency implements Hashable {
  readonly _UUID = uuid();
  projectId: string;
  versionId: string;

  constructor(projectId: string, versionId?: string) {
    makeObservable(this, {
      projectId: observable,
      versionId: observable,
      setProjectId: action,
      setVersionId: action,
      hashCode: computed,
    });

    this.projectId = projectId;
    this.versionId = versionId ?? '0.0.0';
  }

  static readonly serialization = new SerializationFactory(
    createModelSchema(ProjectDependency, {
      projectId: primitive(),
      versionId: primitive(),
    }),
  );

  setProjectId(projectId: string): void {
    this.projectId = projectId;
  }

  setVersionId(id: string): void {
    this.versionId = id;
  }

  get isLegacyDependency(): boolean {
    return !this.projectId.includes(':');
  }

  get groupId(): string | undefined {
    if (this.isLegacyDependency) {
      return undefined;
    }
    return this.projectId.split(':')[0];
  }

  get artifactId(): string | undefined {
    if (this.isLegacyDependency) {
      return undefined;
    }
    return this.projectId.split(':')[1];
  }

  get hashCode(): string {
    return hashArray([
      PROJECT_DEPENDENCY_HASH_STRUCTURE,
      this.projectId,
      this.versionId,
    ]);
  }
}
