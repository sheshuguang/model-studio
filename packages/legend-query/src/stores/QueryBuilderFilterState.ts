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
  action,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
} from 'mobx';
import type { TreeNodeData, TreeData } from '@finos/legend-art';
import {
  assertTrue,
  getNullableFirstElement,
  guaranteeNonNullable,
  guaranteeType,
  IllegalStateError,
  isNonNullable,
  uuid,
  addUniqueEntry,
  deleteEntry,
  assertErrorThrown,
  filterByType,
} from '@finos/legend-shared';
import type { QueryBuilderExplorerTreeDragSource } from './QueryBuilderExplorerState.js';
import { QueryBuilderPropertyExpressionState } from './QueryBuilderPropertyEditorState.js';
import type { QueryBuilderState } from './QueryBuilderState.js';
import {
  type AbstractPropertyExpression,
  type ValueSpecification,
  extractElementNameFromPath,
  SimpleFunctionExpression,
  TYPICAL_MULTIPLICITY_TYPE,
  observe_ValueSpecification,
} from '@finos/legend-graph';
import {
  DEFAULT_LAMBDA_VARIABLE_NAME,
  QUERY_BUILDER_SUPPORTED_FUNCTIONS,
} from '../QueryBuilder_Const.js';
import { buildGenericLambdaFunctionInstanceValue } from './QueryBuilderValueSpecificationBuilderHelper.js';
import {
  fromGroupOperation,
  QUERY_BUILDER_GROUP_OPERATION,
} from './QueryBuilderOperatorsHelper.js';

export abstract class QueryBuilderFilterOperator {
  readonly uuid = uuid();

  abstract getLabel(filterConditionState: FilterConditionState): string;

  abstract isCompatibleWithFilterConditionProperty(
    filterConditionState: FilterConditionState,
  ): boolean;

  abstract isCompatibleWithFilterConditionValue(
    filterConditionState: FilterConditionState,
  ): boolean;

  abstract getDefaultFilterConditionValue(
    filterConditionState: FilterConditionState,
  ): ValueSpecification | undefined;

  abstract buildFilterConditionExpression(
    filterConditionState: FilterConditionState,
  ): ValueSpecification;

  abstract buildFilterConditionState(
    filterState: QueryBuilderFilterState,
    expression: SimpleFunctionExpression,
  ): FilterConditionState | undefined;
}

export enum QUERY_BUILDER_FILTER_DND_TYPE {
  GROUP_CONDITION = 'GROUP_CONDITION',
  CONDITION = 'CONDITION',
  BLANK_CONDITION = 'BLANK_CONDITION',
}

export interface QueryBuilderFilterConditionDragSource {
  node: QueryBuilderFilterTreeNodeData;
}

export type QueryBuilderFilterDropTarget =
  | QueryBuilderExplorerTreeDragSource
  | QueryBuilderFilterConditionDragSource;
export type QueryBuilderFilterConditionRearrangeDropTarget =
  QueryBuilderFilterConditionDragSource;

export class FilterConditionState {
  filterState: QueryBuilderFilterState;
  propertyExpressionState: QueryBuilderPropertyExpressionState;
  operator!: QueryBuilderFilterOperator;
  value?: ValueSpecification | undefined;
  existsLambdaParamNames: string[] = [];

  constructor(
    filterState: QueryBuilderFilterState,
    propertyExpression: AbstractPropertyExpression,
  ) {
    makeAutoObservable(this, {
      filterState: false,
      operators: computed,
      changeProperty: action,
      changeOperator: action,
      setOperator: action,
      setValue: action,
      addExistsLambdaParamNames: action,
    });

    this.filterState = filterState;
    this.propertyExpressionState = new QueryBuilderPropertyExpressionState(
      filterState.queryBuilderState,
      propertyExpression,
    );

    // operator
    assertTrue(
      this.operators.length !== 0,
      `Can't find an operator for property '${this.propertyExpressionState.path}': no operators registered`,
    );
    this.operator = this.operators[0] as QueryBuilderFilterOperator;
    this.setValue(this.operator.getDefaultFilterConditionValue(this));
  }

  get operators(): QueryBuilderFilterOperator[] {
    return this.filterState.operators.filter((op) =>
      op.isCompatibleWithFilterConditionProperty(this),
    );
  }

  changeProperty(propertyExpression: AbstractPropertyExpression): void {
    try {
      // first, check if the new property is supported
      new FilterConditionState(this.filterState, propertyExpression);
    } catch (error) {
      assertErrorThrown(error);
      this.filterState.queryBuilderState.applicationStore.notifyError(error);
      return;
    }

    // observe the property expression
    observe_ValueSpecification(
      propertyExpression,
      this.filterState.queryBuilderState.observableContext,
    );

    this.propertyExpressionState = new QueryBuilderPropertyExpressionState(
      this.filterState.queryBuilderState,
      propertyExpression,
    );

    const newCompatibleOperators = this.operators;
    assertTrue(
      newCompatibleOperators.length !== 0,
      `Can't find an operator for property '${this.propertyExpressionState.path}': no operators registered`,
    );
    if (!newCompatibleOperators.includes(this.operator)) {
      this.changeOperator(
        newCompatibleOperators[0] as QueryBuilderFilterOperator,
      );
    } else if (!this.operator.isCompatibleWithFilterConditionValue(this)) {
      this.setValue(this.operator.getDefaultFilterConditionValue(this));
    }
  }

  changeOperator(val: QueryBuilderFilterOperator): void {
    this.setOperator(val);
    if (!this.operator.isCompatibleWithFilterConditionValue(this)) {
      this.setValue(this.operator.getDefaultFilterConditionValue(this));
    }
  }

  setOperator(val: QueryBuilderFilterOperator): void {
    this.operator = val;
  }

  setValue(val: ValueSpecification | undefined): void {
    this.value = val
      ? observe_ValueSpecification(
          val,
          this.filterState.queryBuilderState.observableContext,
        )
      : undefined;
  }

  addExistsLambdaParamNames(val: string): void {
    this.existsLambdaParamNames.push(val);
  }
}

export abstract class QueryBuilderFilterTreeNodeData implements TreeNodeData {
  readonly id = uuid();
  readonly label = '';
  // NOTE: we don't use the `isSelected` attribute is not used since we keep track of it from the tree data level
  isOpen?: boolean | undefined;
  parentId?: string | undefined;

  constructor(parentId: string | undefined) {
    this.parentId = parentId;

    makeObservable(this, {
      isOpen: observable,
      parentId: observable,
      setIsOpen: action,
      setParentId: action,
    });
  }

  abstract get dragLayerLabel(): string;
  setIsOpen(val: boolean): void {
    this.isOpen = val;
  }
  setParentId(val: string | undefined): void {
    this.parentId = val;
  }
}

export class QueryBuilderFilterTreeGroupNodeData extends QueryBuilderFilterTreeNodeData {
  groupOperation: QUERY_BUILDER_GROUP_OPERATION;
  childrenIds: string[] = [];

  constructor(
    parentId: string | undefined,
    groupOperation: QUERY_BUILDER_GROUP_OPERATION,
  ) {
    super(parentId);

    makeObservable(this, {
      groupOperation: observable,
      childrenIds: observable,
      setGroupOperation: action,
      addChildNode: action,
      removeChildNode: action,
      dragLayerLabel: computed,
    });

    this.groupOperation = groupOperation;
    this.isOpen = true;
  }

  get dragLayerLabel(): string {
    return `${this.groupOperation.toUpperCase()} group`;
  }

  setGroupOperation(val: QUERY_BUILDER_GROUP_OPERATION): void {
    this.groupOperation = val;
  }
  addChildNode(node: QueryBuilderFilterTreeNodeData): void {
    addUniqueEntry(this.childrenIds, node.id);
    node.setParentId(this.id);
  }
  removeChildNode(node: QueryBuilderFilterTreeNodeData): void {
    deleteEntry(this.childrenIds, node.id);
    node.setParentId(undefined);
  }
  addChildNodeAt(node: QueryBuilderFilterTreeNodeData, idx: number): void {
    if (!this.childrenIds.find((childId) => childId === node.id)) {
      idx = Math.max(0, Math.min(idx, this.childrenIds.length - 1));
      this.childrenIds.splice(idx, 0, node.id);
      node.setParentId(this.id);
    }
  }
}

export class QueryBuilderFilterTreeConditionNodeData extends QueryBuilderFilterTreeNodeData {
  condition: FilterConditionState;

  constructor(parentId: string | undefined, condition: FilterConditionState) {
    super(parentId);

    makeObservable(this, {
      condition: observable,
      dragLayerLabel: computed,
    });

    this.condition = condition;
  }

  get dragLayerLabel(): string {
    return this.condition.propertyExpressionState.title;
  }
}

export class QueryBuilderFilterTreeBlankConditionNodeData extends QueryBuilderFilterTreeNodeData {
  constructor(parentId: string | undefined) {
    super(parentId);

    makeObservable(this, {
      dragLayerLabel: computed,
    });
  }

  get dragLayerLabel(): string {
    return '<blank>';
  }
}

const buildFilterConditionExpression = (
  filterState: QueryBuilderFilterState,
  node: QueryBuilderFilterTreeNodeData,
): ValueSpecification | undefined => {
  if (node instanceof QueryBuilderFilterTreeConditionNodeData) {
    return node.condition.operator.buildFilterConditionExpression(
      node.condition,
    );
  } else if (node instanceof QueryBuilderFilterTreeGroupNodeData) {
    const multiplicityOne =
      filterState.queryBuilderState.graphManagerState.graph.getTypicalMultiplicity(
        TYPICAL_MULTIPLICITY_TYPE.ONE,
      );
    const func = new SimpleFunctionExpression(
      extractElementNameFromPath(fromGroupOperation(node.groupOperation)),
      multiplicityOne,
    );
    const clauses = node.childrenIds
      .map((e) => filterState.nodes.get(e))
      .filter(isNonNullable)
      .map((e) => buildFilterConditionExpression(filterState, e))
      .filter(isNonNullable);
    /**
     * NOTE: Due to a limitation (or perhaps design decision) in the engine, group operations
     * like and/or do not take more than 2 parameters, as such, if we have more than 2, we need
     * to create a chain of this operation to accomondate.
     *
     * This means that in the read direction, we might need to flatten the chains down to group with
     * multiple clauses. This means user's intended grouping will not be kept.
     */
    if (clauses.length > 2) {
      const firstClause = clauses[0] as ValueSpecification;
      let currentClause: ValueSpecification = clauses[
        clauses.length - 1
      ] as ValueSpecification;
      for (let i = clauses.length - 2; i > 0; --i) {
        const clause1 = clauses[i] as ValueSpecification;
        const clause2 = currentClause;
        const groupClause = new SimpleFunctionExpression(
          extractElementNameFromPath(fromGroupOperation(node.groupOperation)),
          multiplicityOne,
        );
        groupClause.parametersValues = [clause1, clause2];
        currentClause = groupClause;
      }
      func.parametersValues = [firstClause, currentClause];
    } else {
      func.parametersValues = clauses;
    }
    return func.parametersValues.length ? func : undefined;
  }
  return undefined;
};

export const buildFilterExpression = (
  filterState: QueryBuilderFilterState,
  getAllFunc: SimpleFunctionExpression,
): SimpleFunctionExpression | undefined => {
  const filterConditionExpressions = filterState.rootIds
    .map((e) => guaranteeNonNullable(filterState.nodes.get(e)))
    .map((e) => buildFilterConditionExpression(filterState, e))
    .filter(isNonNullable);

  if (!filterConditionExpressions.length) {
    return undefined;
  }
  const multiplicityOne =
    filterState.queryBuilderState.graphManagerState.graph.getTypicalMultiplicity(
      TYPICAL_MULTIPLICITY_TYPE.ONE,
    );
  // main filter expression
  const filterExpression = new SimpleFunctionExpression(
    extractElementNameFromPath(QUERY_BUILDER_SUPPORTED_FUNCTIONS.FILTER),
    multiplicityOne,
  );
  // param [0]
  filterExpression.parametersValues.push(getAllFunc);
  // param [1]
  filterExpression.parametersValues.push(
    buildGenericLambdaFunctionInstanceValue(
      filterState.lambdaParameterName,
      filterConditionExpressions,
      filterState.queryBuilderState.graphManagerState.graph,
    ),
  );
  return filterExpression;
};

export class QueryBuilderFilterState
  implements TreeData<QueryBuilderFilterTreeNodeData>
{
  queryBuilderState: QueryBuilderState;
  lambdaParameterName = DEFAULT_LAMBDA_VARIABLE_NAME;
  rootIds: string[] = [];
  nodes = new Map<string, QueryBuilderFilterTreeNodeData>();
  selectedNode?: QueryBuilderFilterTreeNodeData | undefined;
  isRearrangingConditions = false;
  operators: QueryBuilderFilterOperator[] = [];
  private _suppressClickawayEventListener = false;

  constructor(
    queryBuilderState: QueryBuilderState,
    operators: QueryBuilderFilterOperator[],
  ) {
    makeAutoObservable(this, {
      queryBuilderState: false,
      isValidMove: false,
      setLambdaParameterName: action,
      setRearrangingConditions: action,
      suppressClickawayEventListener: action,
      handleClickaway: action,
      setSelectedNode: action,
      addNodeFromNode: action,
      replaceBlankNodeWithNode: action,
      addGroupConditionNodeFromNode: action,
      newGroupWithConditionFromNode: action,
      removeNodeAndPruneBranch: action,
      pruneTree: action,
      simplifyTree: action,
      collapseTree: action,
      expandTree: action,
    });

    this.queryBuilderState = queryBuilderState;
    this.operators = operators;
  }

  get isEmpty(): boolean {
    return !this.nodes.size && !this.rootIds.length;
  }

  setLambdaParameterName(val: string): void {
    this.lambdaParameterName = val;
  }

  setRearrangingConditions(val: boolean): void {
    this.isRearrangingConditions = val;
  }
  suppressClickawayEventListener(): void {
    this._suppressClickawayEventListener = true;
  }
  handleClickaway(): void {
    if (this._suppressClickawayEventListener) {
      this._suppressClickawayEventListener = false;
      return;
    }
    this.setSelectedNode(undefined);
  }
  setSelectedNode(val: QueryBuilderFilterTreeNodeData | undefined): void {
    this.selectedNode = val;
  }

  getNode(id: string): QueryBuilderFilterTreeNodeData {
    return guaranteeNonNullable(
      this.nodes.get(id),
      `Can't find query builder filter tree node with ID '${id}'`,
    );
  }
  getRootNode(): QueryBuilderFilterTreeNodeData | undefined {
    assertTrue(
      this.rootIds.length < 2,
      'Query builder filter tree cannot have more than 1 root',
    );
    const rootId = getNullableFirstElement(this.rootIds);
    return rootId ? this.getNode(rootId) : undefined;
  }

  private getParentNode(
    node: QueryBuilderFilterTreeNodeData,
  ): QueryBuilderFilterTreeGroupNodeData | undefined {
    return node.parentId
      ? guaranteeType(
          this.nodes.get(node.parentId),
          QueryBuilderFilterTreeGroupNodeData,
        )
      : undefined;
  }

  private addRootNode(node: QueryBuilderFilterTreeNodeData): void {
    const rootNode = this.getRootNode();
    this.nodes.set(node.id, node);
    if (rootNode instanceof QueryBuilderFilterTreeGroupNodeData) {
      rootNode.addChildNode(node);
    } else if (
      rootNode instanceof QueryBuilderFilterTreeConditionNodeData ||
      rootNode instanceof QueryBuilderFilterTreeBlankConditionNodeData
    ) {
      // if the root node is condition node, form a group between the root node and the new node and nominate the group node as the new root
      const groupNode = new QueryBuilderFilterTreeGroupNodeData(
        undefined,
        QUERY_BUILDER_GROUP_OPERATION.AND,
      );
      groupNode.addChildNode(rootNode);
      groupNode.addChildNode(node);
      this.rootIds = [groupNode.id];
      this.nodes.set(groupNode.id, groupNode);
    } else if (!rootNode) {
      // if there is no root node, set this node as the root
      this.rootIds = [node.id];
    }
  }

  addNodeFromNode(
    node: QueryBuilderFilterTreeNodeData,
    fromNode: QueryBuilderFilterTreeNodeData | undefined,
  ): void {
    if (fromNode instanceof QueryBuilderFilterTreeGroupNodeData) {
      this.nodes.set(node.id, node);
      fromNode.addChildNode(node);
    } else if (
      fromNode instanceof QueryBuilderFilterTreeConditionNodeData ||
      fromNode instanceof QueryBuilderFilterTreeBlankConditionNodeData
    ) {
      this.nodes.set(node.id, node);
      const fromNodeParent = this.getParentNode(fromNode);
      if (fromNodeParent) {
        fromNodeParent.addChildNode(node);
      } else {
        this.addRootNode(node);
      }
    } else if (!this.selectedNode) {
      // if no current node is selected, the node will be added to root
      this.addRootNode(node);
    }
  }

  replaceBlankNodeWithNode(
    node: QueryBuilderFilterTreeNodeData,
    blankNode: QueryBuilderFilterTreeBlankConditionNodeData,
  ): void {
    this.nodes.set(node.id, node);
    const blankNodeParent = this.getParentNode(blankNode);
    if (blankNodeParent) {
      const blankNodeIdx = blankNodeParent.childrenIds.findIndex(
        (childId) => childId === blankNode.id,
      );
      blankNodeParent.addChildNodeAt(node, blankNodeIdx);
      blankNodeParent.removeChildNode(blankNode);
    } else {
      this.addRootNode(node);
    }
    this.removeNode(blankNode);
  }

  addGroupConditionNodeFromNode(
    fromNode: QueryBuilderFilterTreeNodeData | undefined,
  ): void {
    const newGroupNode = new QueryBuilderFilterTreeGroupNodeData(
      undefined,
      QUERY_BUILDER_GROUP_OPERATION.AND,
    );
    const newBlankConditionNode1 =
      new QueryBuilderFilterTreeBlankConditionNodeData(undefined);
    const newBlankConditionNode2 =
      new QueryBuilderFilterTreeBlankConditionNodeData(undefined);
    this.nodes.set(newBlankConditionNode1.id, newBlankConditionNode1);
    this.nodes.set(newBlankConditionNode2.id, newBlankConditionNode2);
    newGroupNode.addChildNode(newBlankConditionNode1);
    newGroupNode.addChildNode(newBlankConditionNode2);
    this.addNodeFromNode(newGroupNode, fromNode);
  }

  newGroupWithConditionFromNode(
    node: QueryBuilderFilterTreeNodeData | undefined,
    fromNode: QueryBuilderFilterTreeNodeData | undefined,
  ): void {
    const newNode =
      node ?? new QueryBuilderFilterTreeBlankConditionNodeData(undefined);
    if (fromNode instanceof QueryBuilderFilterTreeConditionNodeData) {
      const fromNodeParent = this.getParentNode(fromNode);
      if (fromNodeParent) {
        const fromNodeIdx = fromNodeParent.childrenIds.findIndex(
          (childId) => childId === fromNode.id,
        );
        fromNodeParent.removeChildNode(fromNode);
        const newGroupNode = new QueryBuilderFilterTreeGroupNodeData(
          undefined,
          QUERY_BUILDER_GROUP_OPERATION.AND,
        );
        this.nodes.set(newNode.id, newNode);
        this.nodes.set(newGroupNode.id, newGroupNode);
        newGroupNode.addChildNode(fromNode);
        newGroupNode.addChildNode(newNode);
        fromNodeParent.addChildNodeAt(newGroupNode, fromNodeIdx);
      } else {
        this.addRootNode(newNode);
      }
    }
  }

  private removeNode(node: QueryBuilderFilterTreeNodeData): void {
    this.nodes.delete(node.id);
    // remove relationship with children nodes
    if (node instanceof QueryBuilderFilterTreeGroupNodeData) {
      // NOTE: we are deleting child node, i.e. modifying `childrenIds` as we iterate
      [...node.childrenIds].forEach((childId) =>
        node.removeChildNode(this.getNode(childId)),
      );
    }
    // remove relationship with parent node
    const parentNode = this.getParentNode(node);
    if (parentNode) {
      parentNode.removeChildNode(node);
    } else {
      deleteEntry(this.rootIds, node.id);
    }
  }

  private pruneChildlessGroupNodes(): void {
    const getChildlessGroupNodes = (): QueryBuilderFilterTreeGroupNodeData[] =>
      Array.from(this.nodes.values())
        .filter(filterByType(QueryBuilderFilterTreeGroupNodeData))
        .filter((node) => !node.childrenIds.length);
    let nodesToProcess = getChildlessGroupNodes();
    while (nodesToProcess.length) {
      nodesToProcess.forEach((node) => this.removeNode(node));
      nodesToProcess = getChildlessGroupNodes();
    }
  }

  private pruneOrphanNodes(): void {
    const getOrphanNodes = (): QueryBuilderFilterTreeNodeData[] =>
      Array.from(this.nodes.values()).filter(
        (node) => !node.parentId && !this.rootIds.includes(node.id),
      ); // nodes without parent, except for root nodes
    let nodesToProcess = getOrphanNodes();
    while (nodesToProcess.length) {
      nodesToProcess.forEach((node) => this.removeNode(node));
      nodesToProcess = getOrphanNodes();
    }
  }

  /**
   * If group node has fewer than 2 children, flatten it
   */
  private squashGroupNode(node: QueryBuilderFilterTreeGroupNodeData): void {
    if (node.childrenIds.length < 2) {
      const parentNode = this.getParentNode(node);
      // NOTE: we are deleting child node, i.e. modifying `childrenIds` as we iterate
      [...node.childrenIds].forEach((childId) => {
        const childNode = this.getNode(childId);
        node.removeChildNode(childNode);
        if (parentNode) {
          parentNode.addChildNode(childNode);
        } else {
          addUniqueEntry(this.rootIds, childId);
        }
      });
      // remove the group node
      this.nodes.delete(node.id);
      if (parentNode) {
        parentNode.removeChildNode(node);
      } else {
        deleteEntry(this.rootIds, node.id);
      }
    }
  }

  removeNodeAndPruneBranch(node: QueryBuilderFilterTreeNodeData): void {
    const parentNode = this.getParentNode(node);
    this.removeNode(node);
    // squash parent node after the current node is deleted
    if (parentNode) {
      parentNode.removeChildNode(node);
      let currentParentNode: QueryBuilderFilterTreeGroupNodeData | undefined =
        parentNode;
      while (currentParentNode) {
        if (currentParentNode.childrenIds.length >= 2) {
          break;
        }
        this.squashGroupNode(currentParentNode);
        currentParentNode = this.getParentNode(currentParentNode);
      }
    } else {
      deleteEntry(this.rootIds, node.id);
    }
    this.pruneOrphanNodes();
    // check if selected node is still around, if not, unset the selected node
    if (this.selectedNode && !this.nodes.get(this.selectedNode.id)) {
      this.setSelectedNode(undefined);
    }
  }

  pruneTree(): void {
    this.setSelectedNode(undefined);
    // remove all blank nodes
    Array.from(this.nodes.values())
      .filter(
        (node) => node instanceof QueryBuilderFilterTreeBlankConditionNodeData,
      )
      .forEach((node) => this.removeNode(node));
    // prune
    this.pruneOrphanNodes();
    this.pruneChildlessGroupNodes();
    // squash group nodes
    // NOTE: since we have pruned all blank nodes and childless group nodes, at this point, if there are group nodes to be squashed
    // it will be group node with exactly 1 non-blank condition
    const getSquashableGroupNodes = (): QueryBuilderFilterTreeGroupNodeData[] =>
      Array.from(this.nodes.values())
        .filter(filterByType(QueryBuilderFilterTreeGroupNodeData))
        .filter((node) => node.childrenIds.length < 2)
        .filter((node) => {
          if (!node.childrenIds.length) {
            throw new IllegalStateError(
              'Query builder filter tree found unexpected childless group nodes',
            );
          }
          const firstChildNodeId = node.childrenIds[0] as string;
          const childNode = this.getNode(firstChildNodeId);
          if (
            childNode instanceof QueryBuilderFilterTreeBlankConditionNodeData
          ) {
            throw new IllegalStateError(
              'Query builder filter tree found unexpected blank nodes',
            );
          }
          return (
            this.getNode(firstChildNodeId) instanceof
            QueryBuilderFilterTreeConditionNodeData
          );
        });
    let nodesToProcess = getSquashableGroupNodes();
    while (nodesToProcess.length) {
      nodesToProcess.forEach((node) => this.squashGroupNode(node));
      nodesToProcess = getSquashableGroupNodes();
    }
    // check if selected node is still around, if not, unset the selected node
    if (this.selectedNode && !this.nodes.get(this.selectedNode.id)) {
      this.setSelectedNode(undefined);
    }
  }

  /**
   * Cleanup unecessary group nodes (i.e. group node whose group operation is the same as its parent's)
   */
  simplifyTree(): void {
    this.setSelectedNode(undefined);
    const getUnnecessaryNodes = (): QueryBuilderFilterTreeGroupNodeData[] =>
      Array.from(this.nodes.values())
        .filter(filterByType(QueryBuilderFilterTreeGroupNodeData))
        .filter((node) => {
          if (!node.parentId || !this.nodes.has(node.parentId)) {
            return false;
          }
          const parentGroupNode = guaranteeType(
            this.nodes.get(node.parentId),
            QueryBuilderFilterTreeGroupNodeData,
          );
          return parentGroupNode.groupOperation === node.groupOperation;
        });
    // Squash these unnecessary group nodes
    let nodesToProcess = getUnnecessaryNodes();
    while (nodesToProcess.length) {
      nodesToProcess.forEach((node) => {
        const parentNode = guaranteeType(
          this.nodes.get(guaranteeNonNullable(node.parentId)),
          QueryBuilderFilterTreeGroupNodeData,
        );
        // send all children of the current group node to their grandparent node
        [...node.childrenIds].forEach((childId) => {
          const childNode = this.getNode(childId);
          parentNode.addChildNode(childNode);
        });
        // remove the current group node
        parentNode.removeChildNode(node);
        // remove the node
        this.nodes.delete(node.id);
      });
      nodesToProcess = getUnnecessaryNodes();
    }
  }

  isValidMove(
    node: QueryBuilderFilterTreeNodeData,
    toNode: QueryBuilderFilterTreeNodeData,
  ): boolean {
    const isMovingToItself = node === toNode;
    // disallow moving a node to its descendants
    let isMovingToChildNode = false;
    let currentParentNode = this.getParentNode(toNode);
    while (currentParentNode) {
      if (currentParentNode === node) {
        isMovingToChildNode = true;
        break;
      }
      currentParentNode = this.getParentNode(currentParentNode);
    }
    return !isMovingToItself && !isMovingToChildNode;
  }

  moveNode(
    node: QueryBuilderFilterTreeNodeData,
    toNode: QueryBuilderFilterTreeNodeData,
  ): void {
    // do something;
  }

  collapseTree(): void {
    Array.from(this.nodes.values()).forEach((node) => node.setIsOpen(false));
  }

  expandTree(): void {
    Array.from(this.nodes.values()).forEach((node) => node.setIsOpen(true));
  }
}
