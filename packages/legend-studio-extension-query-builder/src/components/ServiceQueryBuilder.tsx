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
  type ServicePureExecutionState,
  useEditorStore,
} from '@finos/legend-studio';
import { flowResult } from 'mobx';
import { observer } from 'mobx-react-lite';
import { QueryBuilder_EditorExtensionState } from '../stores/QueryBuilder_EditorExtensionState.js';
import { useApplicationStore } from '@finos/legend-application';
import { StandardQueryBuilderMode } from '@finos/legend-query';
import { assertErrorThrown } from '@finos/legend-shared';
import { PencilIcon } from '@finos/legend-art';
import {
  isStubbed_RawLambda,
  isStubbed_PackageableElement,
} from '@finos/legend-graph';

export const ServiceQueryBuilder = observer(
  (props: {
    executionState: ServicePureExecutionState;
    isReadOnly: boolean;
  }) => {
    const { executionState, isReadOnly } = props;
    const applicationStore = useApplicationStore();
    const editorStore = useEditorStore();
    const queryBuilderExtension = editorStore.getEditorExtensionState(
      QueryBuilder_EditorExtensionState,
    );
    const editWithQueryBuilder = applicationStore.guardUnhandledError(
      async () => {
        executionState.setOpeningQueryEditor(true);
        if (executionState.selectedExecutionContext) {
          const mapping = executionState.selectedExecutionContext.mapping.value;
          const runtime = executionState.selectedExecutionContext.runtime;
          if (!isStubbed_PackageableElement(mapping)) {
            queryBuilderExtension.reset();
            queryBuilderExtension.queryBuilderState.querySetupState.setMapping(
              mapping,
            );
            queryBuilderExtension.queryBuilderState.querySetupState.setRuntime(
              runtime,
            );
            queryBuilderExtension.queryBuilderState.querySetupState.setMappingIsReadOnly(
              true,
            );
            queryBuilderExtension.queryBuilderState.querySetupState.setRuntimeIsReadOnly(
              true,
            );
            queryBuilderExtension.queryBuilderState.initialize(
              executionState.execution.func,
            );
            await flowResult(
              queryBuilderExtension.setEmbeddedQueryBuilderMode({
                actionConfigs: [
                  {
                    key: 'save-query-btn',
                    renderer: (): React.ReactNode => {
                      const save = applicationStore.guardUnhandledError(
                        async () => {
                          try {
                            const rawLambda =
                              queryBuilderExtension.queryBuilderState.getQuery();
                            await flowResult(
                              executionState.queryState.updateLamba(rawLambda),
                            );
                            applicationStore.notifySuccess(
                              `Service execution query is updated`,
                            );
                            queryBuilderExtension.setEmbeddedQueryBuilderMode(
                              undefined,
                            );
                          } catch (error) {
                            assertErrorThrown(error);
                            applicationStore.notifyError(
                              `Can't save query: ${error.message}`,
                            );
                          }
                        },
                      );

                      return (
                        <button
                          className="query-builder__dialog__header__custom-action"
                          tabIndex={-1}
                          disabled={isReadOnly}
                          onClick={save}
                        >
                          Save Query
                        </button>
                      );
                    },
                  },
                ],
                disableCompile: isStubbed_RawLambda(
                  executionState.queryState.query,
                ),
                queryBuilderMode: new StandardQueryBuilderMode(),
              }),
            );
            executionState.setOpeningQueryEditor(false);
            return;
          }
        }
        applicationStore.notifyWarning(
          'Please specify a mapping and a runtime for the execution to edit with query builder',
        );
        executionState.setOpeningQueryEditor(false);
      },
    );

    return (
      <button
        className="panel__header__action"
        tabIndex={-1}
        onClick={editWithQueryBuilder}
        title="Edit query..."
      >
        <PencilIcon />
      </button>
    );
  },
);
