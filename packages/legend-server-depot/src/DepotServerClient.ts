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

import type { Entity } from '@finos/legend-model-storage';
import { type PlainObject, AbstractServerClient } from '@finos/legend-shared';
import type { DepotScope } from './models/DepotScope.js';
import type { ProjectData } from './models/ProjectData.js';
import type {
  ProjectDependencyCoordinates,
  ProjectVersionEntities,
} from './models/ProjectVersionEntities.js';
import type { StoredEntity } from './models/StoredEntity.js';

export interface DepotServerClientConfig {
  serverUrl: string;
  TEMPORARY__useLegacyDepotServerAPIRoutes?: boolean | undefined;
}

export class DepotServerClient extends AbstractServerClient {
  private TEMPORARY__useLegacyDepotServerAPIRoutes = false;

  constructor(config: DepotServerClientConfig) {
    super({
      baseUrl: config.serverUrl,
    });
    this.TEMPORARY__useLegacyDepotServerAPIRoutes = Boolean(
      config.TEMPORARY__useLegacyDepotServerAPIRoutes,
    );
  }

  // ------------------------------------------- Projects -------------------------------------------

  private _projects = (): string => `${this.baseUrl}/projects`;
  private _project = (groupId: string, artifactId: string): string =>
    `${this._projects()}/${encodeURIComponent(groupId)}/${encodeURIComponent(
      artifactId,
    )}`;
  private _projectById = (projectId: string): string =>
    `${this._projects()}/${encodeURIComponent(projectId)}`;

  getProjects = (): Promise<PlainObject<ProjectData>[]> =>
    this.get(this._projects());
  getProject = (
    groupId: string,
    artifactId: string,
  ): Promise<PlainObject<ProjectData>> =>
    this.get(this._project(groupId, artifactId));
  getProjectById = (projectId: string): Promise<PlainObject<ProjectData>[]> =>
    this.get(this._projectById(projectId));

  // ------------------------------------------- Entities -------------------------------------------

  private _versions = (groupId: string, artifactId: string): string =>
    `${this._project(groupId, artifactId)}/versions`;
  private _revisions = (groupId: string, artifactId: string): string =>
    `${this._project(groupId, artifactId)}/revisions`;
  private _version = (
    groupId: string,
    artifactId: string,
    versionId: string,
  ): string =>
    `${this._versions(groupId, artifactId)}/${encodeURIComponent(versionId)}`;

  getVersionEntities = (
    groupId: string,
    artifactId: string,
    versionId: string,
  ): Promise<PlainObject<Entity>[]> =>
    this.get(this._version(groupId, artifactId, versionId));

  getVersionEntity = (
    groupId: string,
    artifactId: string,
    versionId: string,
    entityPath: string,
  ): Promise<PlainObject<Entity>[]> =>
    this.get(
      `${this._version(
        groupId,
        artifactId,
        versionId,
      )}/entities/${encodeURIComponent(entityPath)}`,
    );

  getLatestRevisionEntities = (
    groupId: string,
    artifactId: string,
  ): Promise<PlainObject<Entity>[]> =>
    this.get(`${this._revisions(groupId, artifactId)}/latest`);

  getLatestRevisionEntity = (
    groupId: string,
    artifactId: string,
    entityPath: string,
  ): Promise<PlainObject<Entity>> =>
    this.get(
      `${this._revisions(
        groupId,
        artifactId,
      )}/latest/entities/${encodeURIComponent(entityPath)}`,
    );

  // NOTE: this is experimental API to get elements by classifier path
  getEntitiesByClassifierPath = (
    classifierPath: string,
    options?: {
      search?: string | undefined;
      scope?: DepotScope | undefined;
      limit?: number | undefined;
    },
  ): Promise<PlainObject<StoredEntity>[]> =>
    this.TEMPORARY__useLegacyDepotServerAPIRoutes
      ? this.get(
          `${this.baseUrl}/classifiers/${encodeURIComponent(classifierPath)}`,
          undefined,
          undefined,
          {
            scope: options?.scope,
          },
        )
      : this.get(
          `${this.baseUrl}/entitiesByClassifierPath/${encodeURIComponent(
            classifierPath,
          )}`,
          undefined,
          undefined,
          {
            search: options?.search,
            scope: options?.scope,
            limit: options?.limit,
          },
        );

  // ------------------------------------------- Dependencies -------------------------------------------

  getDependencyEntities = (
    groupId: string,
    artifactId: string,
    versionId: string,
    /**
     * Flag indicating if transitive dependencies should be returned.
     */
    transitive: boolean,
    /**
     * Flag indicating whether to return the root of the dependency tree.
     */
    includeOrigin: boolean,
  ): Promise<PlainObject<ProjectVersionEntities>[]> =>
    this.get(
      `${this._version(groupId, artifactId, versionId)}/dependencies`,
      undefined,
      undefined,
      {
        transitive,
        includeOrigin,
        versioned: false, // we don't need to add version prefix to entity path
      },
    );

  getLatestDependencyEntities = (
    groupId: string,
    artifactId: string,
    /**
     * Flag indicating if transitive dependencies should be returned.
     */
    transitive: boolean,
    /**
     * Flag indicating whether to return the root of the dependency tree.
     */
    includeOrigin: boolean,
  ): Promise<PlainObject<ProjectVersionEntities>[]> =>
    this.get(
      `${this._revisions(groupId, artifactId)}/latest/dependants`,
      undefined,
      undefined,
      {
        transitive,
        includeOrigin,
        versioned: false, // we don't need to add version prefix to entity path
      },
    );

  getProjectVersionsDependencyEntities = (
    /**
     * List of (direct) dependencies.
     */
    dependencies: PlainObject<ProjectDependencyCoordinates>[],
    /**
     * Flag indicating if transitive dependencies should be returned.
     */
    transitive: boolean,
    /**
     * Flag indicating whether to return the root of the dependency tree.
     */
    includeOrigin: boolean,
  ): Promise<PlainObject<ProjectVersionEntities>[]> =>
    this.post(
      `${this._projects()}/dependencies`,
      dependencies,
      undefined,
      undefined,
      {
        transitive,
        includeOrigin,
        versioned: false, // we don't need to add version prefix to entity path
      },
    );
}
