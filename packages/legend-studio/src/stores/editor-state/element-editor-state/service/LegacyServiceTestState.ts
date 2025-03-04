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

import { observable, action, flow, computed, makeObservable } from 'mobx';
import type { ServiceEditorState } from './ServiceEditorState.js';
import { TEST_RESULT } from '../mapping/MappingTestState.js';
import { LEGEND_STUDIO_APP_EVENT } from '../../../LegendStudioAppEvent.js';
import {
  type GeneratorFn,
  assertErrorThrown,
  LogEvent,
  losslessStringify,
  uuid,
  guaranteeType,
  UnsupportedOperationError,
  tryToMinifyLosslessJSONString,
  tryToFormatLosslessJSONString,
  tryToFormatJSONString,
  createUrlStringFromData,
  ContentType,
  isNonNullable,
  guaranteeNonNullable,
} from '@finos/legend-shared';
import type { EditorStore } from '../../../EditorStore.js';
import {
  type DEPRECATED__ServiceTestResult,
  type DEPRECATED__KeyedSingleExecutionTest,
  type Runtime,
  type ExecutionResult,
  type Connection,
  type RawLambda,
  type ValueSpecification,
  VariableExpression,
  Enumeration,
  PrimitiveType,
  extractExecutionResultValues,
  DEPRECATED__TestContainer,
  DEPRECATED__SingleExecutionTest,
  PureSingleExecution,
  IdentifiedConnection,
  EngineRuntime,
  RuntimePointer,
  JsonModelConnection,
  XmlModelConnection,
  FlatDataConnection,
  RelationalDatabaseConnection,
  DatabaseType,
  StaticDatasourceSpecification,
  DefaultH2AuthenticationStrategy,
  ConnectionPointer,
  PackageableElementExplicitReference,
  generateIdentifiedConnectionId,
} from '@finos/legend-graph';
import { TAB_SIZE } from '@finos/legend-application';
import type { DSLService_LegendStudioPlugin_Extension } from '../../../DSLService_LegendStudioPlugin_Extension.js';
import { runtime_addIdentifiedConnection } from '../../../graphModifier/DSLMapping_GraphModifierHelper.js';
import {
  singleExecTest_addAssert,
  singleExecTest_deleteAssert,
  singleExecTest_setData,
} from '../../../graphModifier/DSLService_GraphModifierHelper.js';
import {
  createMockEnumerationProperty,
  createMockPrimitiveProperty,
} from '../../../shared/MockDataUtil.js';

interface ServiceTestExecutionResult {
  expected: string;
  actual: string;
}

export class TestContainerState {
  readonly uuid = uuid();
  editorStore: EditorStore;
  serviceEditorState: ServiceEditorState;
  testState: LegacySingleExecutionTestState;
  testContainer: DEPRECATED__TestContainer;
  assertionData?: string | undefined;
  testPassed?: boolean | undefined;
  textExecutionTextResult?: ServiceTestExecutionResult | undefined; // NOTE: this is lossless JSON strings
  isFetchingActualResultForComparison = false;
  isGeneratingTestAssertion = false;

  constructor(
    editorStore: EditorStore,
    testContainter: DEPRECATED__TestContainer,
    serviceEditorState: ServiceEditorState,
    testState: LegacySingleExecutionTestState,
  ) {
    makeObservable(this, {
      testContainer: observable,
      assertionData: observable,
      testPassed: observable,
      textExecutionTextResult: observable,
      isFetchingActualResultForComparison: observable,
      isGeneratingTestAssertion: observable,
      testResult: computed,
      setAssertionData: action,
      setTestPassed: action,
      setTestExecutionResultText: action,
      updateTestAssert: action,
      generateAssertion: flow,
      fetchActualResultForComparison: flow,
    });

    this.editorStore = editorStore;
    this.testContainer = testContainter;
    this.serviceEditorState = serviceEditorState;
    this.testState = testState;
    this.initializeAssertionData(testContainter);
  }

  get testResult(): DEPRECATED__ServiceTestResult | undefined {
    const idx = this.testState.test.asserts.findIndex(
      (assert) => assert === this.testContainer,
    );
    return idx !== -1 && this.testState.testResults.length
      ? this.testState.testResults[idx]
      : undefined;
  }

  setAssertionData(value: string): void {
    this.assertionData = value;
  }
  setTestPassed(value: boolean | undefined): void {
    this.testPassed = value;
  }
  setTestExecutionResultText(
    value: ServiceTestExecutionResult | undefined,
  ): void {
    this.textExecutionTextResult = value;
  }

  updateTestAssert(): void {
    if (this.assertionData) {
      this.testContainer.assert =
        this.editorStore.graphManagerState.graphManager.HACKY__createServiceTestAssertLambda(
          // NOTE: due to discrepancies in the test runners for mapping and service, we have don't need
          // to do any (un)escaping here like what we do for mapping test assertion data. For better context:
          // See https://github.com/finos/legend-studio/issues/586
          // See https://github.com/finos/legend-engine/issues/429
          /**
           * @workaround https://github.com/finos/legend-studio/issues/68
           */
          tryToMinifyLosslessJSONString(this.assertionData),
        );
    }
  }

  private initializeAssertionData(
    testContainter: DEPRECATED__TestContainer,
  ): void {
    const expectedResultAssertionString =
      this.editorStore.graphManagerState.graphManager.HACKY__extractServiceTestAssertionData(
        testContainter.assert,
      );
    this.assertionData = expectedResultAssertionString
      ? // NOTE: due to discrepancies in the test runners for mapping and service, we have don't need
        // to do any (un)escaping here like what we do for mapping test assertion data. For better context:
        // See https://github.com/finos/legend-studio/issues/586
        // See https://github.com/finos/legend-engine/issues/429
        /**
         * @workaround https://github.com/finos/legend-studio/issues/68
         */
        tryToFormatLosslessJSONString(expectedResultAssertionString)
      : undefined;
  }

  private decorateRuntimeIdentifiedConnectionsWithTestData = (
    runtime: Runtime,
    testData: string,
  ): Runtime => {
    const newRuntime = new EngineRuntime();
    const runtimeValue =
      runtime instanceof RuntimePointer
        ? runtime.packageableRuntime.value.runtimeValue
        : guaranteeType(runtime, EngineRuntime);
    newRuntime.mappings = runtimeValue.mappings;
    runtimeValue.connections.forEach((storeConnections) => {
      storeConnections.storeConnections.forEach((identifiedConnection) => {
        const connection =
          identifiedConnection.connection instanceof ConnectionPointer
            ? identifiedConnection.connection.packageableConnection.value
                .connectionValue
            : identifiedConnection.connection;
        const engineConfig =
          this.editorStore.graphManagerState.graphManager.TEMPORARY__getEngineConfig();

        if (connection instanceof JsonModelConnection) {
          runtime_addIdentifiedConnection(
            newRuntime,
            new IdentifiedConnection(
              generateIdentifiedConnectionId(newRuntime),
              new JsonModelConnection(
                PackageableElementExplicitReference.create(
                  this.editorStore.graphManagerState.graph.modelStore,
                ),
                connection.class,
                createUrlStringFromData(
                  /**
                   * @workaround https://github.com/finos/legend-studio/issues/68
                   */
                  tryToMinifyLosslessJSONString(testData),
                  ContentType.APPLICATION_JSON,
                  engineConfig.useBase64ForAdhocConnectionDataUrls,
                ),
              ),
            ),
            this.editorStore.changeDetectionState.observerContext,
          );
        } else if (connection instanceof XmlModelConnection) {
          runtime_addIdentifiedConnection(
            newRuntime,
            new IdentifiedConnection(
              generateIdentifiedConnectionId(newRuntime),
              new XmlModelConnection(
                PackageableElementExplicitReference.create(
                  this.editorStore.graphManagerState.graph.modelStore,
                ),
                connection.class,
                createUrlStringFromData(
                  testData,
                  ContentType.APPLICATION_XML,
                  engineConfig.useBase64ForAdhocConnectionDataUrls,
                ),
              ),
            ),
            this.editorStore.changeDetectionState.observerContext,
          );
        } else if (connection instanceof FlatDataConnection) {
          runtime_addIdentifiedConnection(
            newRuntime,
            new IdentifiedConnection(
              generateIdentifiedConnectionId(newRuntime),
              new FlatDataConnection(
                PackageableElementExplicitReference.create(
                  connection.store.value,
                ),
                createUrlStringFromData(
                  testData,
                  ContentType.TEXT_PLAIN,
                  engineConfig.useBase64ForAdhocConnectionDataUrls,
                ),
              ),
            ),
            this.editorStore.changeDetectionState.observerContext,
          );
        } else if (connection instanceof RelationalDatabaseConnection) {
          runtime_addIdentifiedConnection(
            newRuntime,
            new IdentifiedConnection(
              generateIdentifiedConnectionId(newRuntime),
              new RelationalDatabaseConnection(
                PackageableElementExplicitReference.create(
                  connection.store.value,
                ),
                // TODO: hard-coded this combination for now, we might want to change to something that makes more sense?
                DatabaseType.H2,
                new StaticDatasourceSpecification('dummyHost', 80, 'myDb'),
                new DefaultH2AuthenticationStrategy(),
              ),
            ),
            this.editorStore.changeDetectionState.observerContext,
          );
        } else {
          let testConnection: Connection | undefined;
          const extraServiceTestRuntimeConnectionBuilders =
            this.editorStore.pluginManager
              .getStudioPlugins()
              .flatMap(
                (plugin) =>
                  (
                    plugin as DSLService_LegendStudioPlugin_Extension
                  ).getExtraServiceTestRuntimeConnectionBuilders?.() ?? [],
              );
          for (const builder of extraServiceTestRuntimeConnectionBuilders) {
            testConnection = builder(connection, newRuntime, testData);
            if (testConnection) {
              break;
            }
          }
          if (testConnection) {
            runtime_addIdentifiedConnection(
              newRuntime,
              new IdentifiedConnection(
                generateIdentifiedConnectionId(newRuntime),
                testConnection,
              ),
              this.editorStore.changeDetectionState.observerContext,
            );
          } else {
            throw new UnsupportedOperationError(
              `Can't build service test runtime connection: no compatible builder available from plugins`,
              connection,
            );
          }
        }
      });
    });
    return newRuntime;
  };

  *generateAssertion(): GeneratorFn<void> {
    try {
      this.isGeneratingTestAssertion = true;
      const execution = this.serviceEditorState.service.execution;
      const test = this.serviceEditorState.service.test;
      if (
        execution instanceof PureSingleExecution &&
        test instanceof DEPRECATED__SingleExecutionTest
      ) {
        const decoratedRuntime =
          this.decorateRuntimeIdentifiedConnectionsWithTestData(
            execution.runtime,
            test.data,
          );
        const result =
          (yield this.editorStore.graphManagerState.graphManager.executeMapping(
            this.serviceEditorState.editorStore.graphManagerState.graph,
            execution.mapping.value,
            execution.func,
            decoratedRuntime,
            {
              useLosslessParse: true,
            },
          )) as ExecutionResult;
        this.setAssertionData(
          /**
           * @workaround https://github.com/finos/legend-studio/issues/68
           */
          tryToFormatLosslessJSONString(
            losslessStringify(
              extractExecutionResultValues(result),
              undefined,
              TAB_SIZE,
            ),
          ),
        );
        this.updateTestAssert();
      } else {
        throw new UnsupportedOperationError();
      }
    } catch (error) {
      assertErrorThrown(error);
      this.setAssertionData(tryToFormatJSONString('{}'));
      this.editorStore.applicationStore.log.error(
        LogEvent.create(LEGEND_STUDIO_APP_EVENT.SERVICE_TEST_RUNNER_FAILURE),
        error,
      );
      this.editorStore.applicationStore.notifyError(error);
    } finally {
      this.isGeneratingTestAssertion = false;
    }
  }

  *fetchActualResultForComparison(): GeneratorFn<void> {
    try {
      this.isFetchingActualResultForComparison = true;
      const execution = this.serviceEditorState.service.execution;
      const test = this.serviceEditorState.service.test;
      if (
        execution instanceof PureSingleExecution &&
        test instanceof DEPRECATED__SingleExecutionTest
      ) {
        const decoratedRuntime =
          this.decorateRuntimeIdentifiedConnectionsWithTestData(
            execution.runtime,
            test.data,
          );
        const result =
          (yield this.editorStore.graphManagerState.graphManager.executeMapping(
            this.serviceEditorState.editorStore.graphManagerState.graph,
            execution.mapping.value,
            execution.func,
            decoratedRuntime,
            {
              useLosslessParse: true,
            },
          )) as ExecutionResult;
        this.setTestExecutionResultText({
          expected: this.assertionData ?? '',
          /**
           * @workaround https://github.com/finos/legend-studio/issues/68
           */
          actual: tryToFormatLosslessJSONString(
            losslessStringify(extractExecutionResultValues(result)),
          ),
        });
      } else {
        throw new UnsupportedOperationError();
      }
    } catch (error) {
      assertErrorThrown(error);
      this.setTestExecutionResultText(undefined);
      this.editorStore.applicationStore.log.error(
        LogEvent.create(LEGEND_STUDIO_APP_EVENT.SERVICE_TEST_RUNNER_FAILURE),
        error,
      );
      this.editorStore.applicationStore.notifyError(error);
    } finally {
      this.isFetchingActualResultForComparison = false;
    }
  }
}

const buildTestDataParameters = (
  rawLambda: RawLambda,
  editorStore: EditorStore,
): (string | number | boolean)[] => {
  const parameters = ((rawLambda.parameters ?? []) as object[]).map((param) =>
    editorStore.graphManagerState.graphManager.buildValueSpecification(
      param as Record<PropertyKey, unknown>,
      editorStore.graphManagerState.graph,
    ),
  );
  return parameters
    .filter(
      (parameter: ValueSpecification): parameter is VariableExpression =>
        parameter instanceof VariableExpression,
    )
    .map((varExpression) => {
      if (varExpression.multiplicity.lowerBound !== 0) {
        const type = varExpression.genericType?.value.rawType;
        if (type instanceof PrimitiveType) {
          return createMockPrimitiveProperty(type, varExpression.name);
        } else if (type instanceof Enumeration) {
          return createMockEnumerationProperty(type);
        }
      }
      return undefined;
    })
    .filter(isNonNullable);
};
export class LegacySingleExecutionTestState {
  editorStore: EditorStore;
  serviceEditorState: ServiceEditorState;
  test: DEPRECATED__SingleExecutionTest;
  selectedTestContainerState?: TestContainerState | undefined;
  isRunningAllTests = false;
  isGeneratingTestData = false;
  anonymizeGeneratedData = true;
  testSuiteRunError?: Error | undefined;
  testResults: DEPRECATED__ServiceTestResult[] = [];
  allTestRunTime = 0;

  constructor(
    editorStore: EditorStore,
    serviceEditorState: ServiceEditorState,
    test: DEPRECATED__SingleExecutionTest,
  ) {
    makeObservable(this, {
      test: observable,
      selectedTestContainerState: observable,
      isRunningAllTests: observable,
      isGeneratingTestData: observable,
      testSuiteRunError: observable,
      testResults: observable,
      allTestRunTime: observable,
      anonymizeGeneratedData: observable,
      testSuiteResult: computed,
      setSelectedTestContainerState: action,
      setAnonymizeGeneratedData: action,
      setTestResults: action,
      addNewTestContainer: action,
      deleteTestContainerState: action,
      openTestContainer: action,
      generateTestData: flow,
      runTestSuite: flow,
    });

    this.editorStore = editorStore;
    this.serviceEditorState = serviceEditorState;
    this.test = test;
    this.selectedTestContainerState = this.test.asserts.length
      ? new TestContainerState(
          editorStore,
          this.test.asserts[0] as DEPRECATED__TestContainer,
          serviceEditorState,
          this,
        )
      : undefined;
  }

  setSelectedTestContainerState(testContainerState?: TestContainerState): void {
    this.selectedTestContainerState = testContainerState;
  }
  setTestResults(assertResults: DEPRECATED__ServiceTestResult[]): void {
    this.testResults = assertResults;
  }
  setAnonymizeGeneratedData(val: boolean): void {
    this.anonymizeGeneratedData = val;
  }

  addNewTestContainer(): void {
    const testContainer = new DEPRECATED__TestContainer(
      this.editorStore.graphManagerState.graphManager.HACKY__createServiceTestAssertLambda(
        '{}',
      ),
      this.test,
    );
    singleExecTest_addAssert(this.test, testContainer);
    this.openTestContainer(testContainer);
    this.allTestRunTime = 0;
  }

  deleteTestContainerState(val: DEPRECATED__TestContainer): void {
    const idx = this.test.asserts.findIndex((assert) => assert === val);
    if (idx !== -1) {
      singleExecTest_deleteAssert(this.test, val);
      this.testResults.splice(idx, 1);
      this.allTestRunTime = 0;
    }
    if (this.selectedTestContainerState?.testContainer === val) {
      this.setSelectedTestContainerState(undefined);
    }
  }

  openTestContainer(testContainter: DEPRECATED__TestContainer): void {
    this.selectedTestContainerState = new TestContainerState(
      this.editorStore,
      testContainter,
      this.serviceEditorState,
      this,
    );
  }

  get testSuiteResult(): TEST_RESULT {
    const results = this.testResults.every(
      (assertResult) => assertResult.result === true,
    );
    return !this.testResults.length
      ? TEST_RESULT.NONE
      : results
      ? TEST_RESULT.PASSED
      : TEST_RESULT.FAILED;
  }

  *generateTestData(): GeneratorFn<void> {
    try {
      this.isGeneratingTestData = true;
      // NOTE: here, we attempt to use engine to generate test data.
      // Once all types of generate data are supported we will move to just using engine
      const executionInput = guaranteeNonNullable(
        this.serviceEditorState.executionState.serviceExecutionParameters,
        'Service execution context (query, mapping, runtime) is needed to generate test data',
      );
      const generatedTestData =
        (yield this.editorStore.graphManagerState.graphManager.generateExecuteTestData(
          this.editorStore.graphManagerState.graph,
          executionInput.mapping,
          executionInput.query,
          executionInput.runtime,
          buildTestDataParameters(executionInput.query, this.editorStore),
          {
            anonymizeGeneratedData: this.anonymizeGeneratedData,
          },
        )) as string;
      singleExecTest_setData(this.test, generatedTestData);
    } catch (error) {
      assertErrorThrown(error);
      singleExecTest_setData(this.test, '');
      this.editorStore.applicationStore.notifyError(error);
    } finally {
      this.isGeneratingTestData = false;
    }
  }

  *runTestSuite(): GeneratorFn<void> {
    const startTime = Date.now();
    try {
      this.testSuiteRunError = undefined;
      this.allTestRunTime = 0;
      this.isRunningAllTests = true;
      this.setTestResults([]);
      const results =
        (yield this.editorStore.graphManagerState.graphManager.runLegacyServiceTests(
          this.serviceEditorState.service,
          this.serviceEditorState.editorStore.graphManagerState.graph,
        )) as DEPRECATED__ServiceTestResult[];
      this.setTestResults(results);
    } catch (error) {
      assertErrorThrown(error);
      this.testSuiteRunError = error;
      this.setTestResults(
        this.test.asserts.map((assert, idx) => ({
          name: `test_${idx + 1}`,
          result: false,
        })),
      );
      this.editorStore.applicationStore.log.error(
        LogEvent.create(LEGEND_STUDIO_APP_EVENT.SERVICE_TEST_RUNNER_FAILURE),
        error,
      );
    } finally {
      this.allTestRunTime = Date.now() - startTime;
      this.isRunningAllTests = false;
    }
  }

  get execution(): PureSingleExecution {
    return guaranteeType(
      this.serviceEditorState.service.execution,
      PureSingleExecution,
      'Service with single execution test must have single execution',
    );
  }
}

export class KeyedSingleExecutionState extends LegacySingleExecutionTestState {
  readonly uuid = uuid();
  declare test: DEPRECATED__KeyedSingleExecutionTest;

  constructor(
    editorStore: EditorStore,
    keyedSingleExecution: DEPRECATED__KeyedSingleExecutionTest,
    serviceEditorState: ServiceEditorState,
  ) {
    super(
      editorStore,
      serviceEditorState,
      guaranteeType(
        serviceEditorState.service.test,
        DEPRECATED__SingleExecutionTest,
      ),
    );
    this.test = keyedSingleExecution;
  }
}
