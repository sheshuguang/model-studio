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

import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { isNonNullable, prettyCONSTName } from '@finos/legend-shared';
import { useDrop } from 'react-dnd';
import {
  CORE_DND_TYPE,
  type ElementDragSource,
  type UMLEditorElementDropTarget,
} from '../../../../stores/shared/DnDUtil.js';
import {
  clsx,
  CustomSelectorInput,
  createFilter,
  ResizablePanelGroup,
  ResizablePanel,
  ResizablePanelSplitter,
  ResizablePanelSplitterLine,
  BlankPanelContent,
  getControlledResizablePanelProps,
  InputWithInlineValidation,
  LockIcon,
  PlusIcon,
  TimesIcon,
  LongArrowRightIcon,
  ArrowCircleRightIcon,
  FireIcon,
  StickArrowCircleRightIcon,
} from '@finos/legend-art';
import { LEGEND_STUDIO_TEST_ID } from '../../../LegendStudioTestID.js';
import { PropertyEditor } from './PropertyEditor.js';
import { StereotypeSelector } from './StereotypeSelector.js';
import { TaggedValueEditor } from './TaggedValueEditor.js';
import { UML_EDITOR_TAB } from '../../../../stores/editor-state/element-editor-state/UMLEditorState.js';
import { ClassEditorState } from '../../../../stores/editor-state/element-editor-state/ClassEditorState.js';
import type { PackageableElementOption } from '../../../../stores/shared/PackageableElementOptionUtil.js';
import { flowResult } from 'mobx';
import { useEditorStore } from '../../EditorStoreProvider.js';
import {
  type StereotypeReference,
  type GenericTypeReference,
  type TaggedValue,
  type Constraint,
  type Property,
  type DerivedProperty,
  PRIMITIVE_TYPE,
  MULTIPLICITY_INFINITE,
  Class,
  GenericType,
  Profile,
  Multiplicity,
  Type,
  PrimitiveType,
  Unit,
  StereotypeExplicitReference,
  GenericTypeExplicitReference,
  Association,
  stub_TaggedValue,
  stub_Tag,
  stub_Profile,
  stub_Stereotype,
  stub_Constraint,
  stub_Property,
  stub_DerivedProperty,
  getAllClassProperties,
  getAllSuperclasses,
  getAllClassConstraints,
  getAllClassDerivedProperties,
} from '@finos/legend-graph';
import { StudioLambdaEditor } from '../../../shared/StudioLambdaEditor.js';
import {
  ApplicationNavigationContextData,
  getPackageableElementOptionalFormatter,
  useApplicationNavigationContext,
  useApplicationStore,
} from '@finos/legend-application';
import { getElementIcon } from '../../../shared/ElementIconUtils.js';
import type { ClassPreviewRenderer } from '../../../../stores/LegendStudioPlugin.js';
import {
  class_addProperty,
  class_deleteDerivedProperty,
  class_addDerivedProperty,
  class_addContraint,
  class_addSuperType,
  annotatedElement_addTaggedValue,
  annotatedElement_addStereotype,
  annotatedElement_deleteStereotype,
  annotatedElement_deleteTaggedValue,
  class_deleteConstraint,
  class_deleteSuperType,
  class_deleteProperty,
  class_deleteSubclass,
  class_addSubclass,
  constraint_setName,
  property_setName,
  property_setGenericType,
  property_setMultiplicity,
  setGenericTypeReferenceValue,
} from '../../../../stores/graphModifier/DomainGraphModifierHelper.js';
import {
  CLASS_PROPERTY_TYPE,
  getClassPropertyType,
} from '../../../../stores/shared/ModelUtil.js';
import { LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT } from '../../../../stores/LegendStudioApplicationNavigationContext.js';

const PropertyBasicEditor = observer(
  (props: {
    _class: Class;
    editorState: ClassEditorState;
    property: Property;
    deleteProperty: () => void;
    isReadOnly: boolean;
  }) => {
    const { property, _class, editorState, deleteProperty, isReadOnly } = props;
    const editorStore = useEditorStore();
    const isInheritedProperty =
      property._OWNER instanceof Class && property._OWNER !== _class;
    const isPropertyFromAssociation = property._OWNER instanceof Association;
    const isIndirectProperty = isInheritedProperty || isPropertyFromAssociation;
    const isPropertyDuplicated = (val: Property): boolean =>
      _class.properties.filter((p) => p.name === val.name).length >= 2;
    const selectProperty = (): void =>
      editorState.setSelectedProperty(property);
    // Name
    const changeValue: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      property_setName(property, event.target.value);
    };
    // Generic Type
    const [isEditingType, setIsEditingType] = useState(false);
    const propertyTypeOptions = editorStore.classPropertyGenericTypeOptions;
    const propertyType = property.genericType.value.rawType;
    const propertyTypeName = getClassPropertyType(propertyType);
    const filterOption = createFilter({
      ignoreCase: true,
      ignoreAccents: false,
      stringify: (option: PackageableElementOption<Type>): string =>
        option.value.path,
    });
    const selectedPropertyType = {
      value: propertyType,
      label: propertyType.name,
    };
    const changePropertyType = (val: PackageableElementOption<Type>): void => {
      property_setGenericType(property, new GenericType(val.value));
      setIsEditingType(false);
    };
    // Multiplicity
    const [lowerBound, setLowerBound] = useState<string | number>(
      property.multiplicity.lowerBound,
    );
    const [upperBound, setUpperBound] = useState<string | number>(
      property.multiplicity.upperBound ?? MULTIPLICITY_INFINITE,
    );
    const updateMultiplicity = (
      lower: number | string,
      upper: number | string,
    ): void => {
      const lBound = typeof lower === 'number' ? lower : parseInt(lower, 10);
      const uBound =
        upper === MULTIPLICITY_INFINITE
          ? undefined
          : typeof upper === 'number'
          ? upper
          : parseInt(upper, 10);
      if (!isNaN(lBound) && (uBound === undefined || !isNaN(uBound))) {
        property_setMultiplicity(property, new Multiplicity(lBound, uBound));
      }
    };
    const changeLowerBound: React.ChangeEventHandler<HTMLInputElement> = (
      event,
    ) => {
      setLowerBound(event.target.value);
      updateMultiplicity(event.target.value, upperBound);
    };
    const changeUpperBound: React.ChangeEventHandler<HTMLInputElement> = (
      event,
    ) => {
      setUpperBound(event.target.value);
      updateMultiplicity(lowerBound, event.target.value);
    };
    // Other
    const openElement = (): void => {
      if (!(propertyType instanceof PrimitiveType)) {
        editorStore.openElement(
          propertyType instanceof Unit ? propertyType.measure : propertyType,
        );
      }
    };
    // NOTE: for now we do not allow directly modifying inherited and associated properties,
    // we would make the user go to the supertype or the association where the property comes from
    const visitOwner = (): void => editorStore.openElement(property._OWNER);

    return (
      <div className="property-basic-editor">
        {isIndirectProperty && (
          <div className="property-basic-editor__name--with-lock">
            <div className="property-basic-editor__name--with-lock__icon">
              <LockIcon />
            </div>
            <span className="property-basic-editor__name--with-lock__name">
              {property.name}
            </span>
          </div>
        )}
        {!isIndirectProperty && (
          <div className="input-group__input property-basic-editor__input">
            <InputWithInlineValidation
              className="property-basic-editor__input--with-validation input-group__input"
              disabled={isReadOnly}
              value={property.name}
              spellCheck={false}
              onChange={changeValue}
              placeholder={`Property name`}
              validationErrorMessage={
                isPropertyDuplicated(property)
                  ? 'Duplicated property'
                  : undefined
              }
            />
          </div>
        )}
        {!isIndirectProperty && !isReadOnly && isEditingType && (
          <CustomSelectorInput
            className="property-basic-editor__type"
            options={propertyTypeOptions}
            onChange={changePropertyType}
            value={selectedPropertyType}
            placeholder={'Choose a data type or enumeration'}
            filterOption={filterOption}
            formatOptionLabel={getPackageableElementOptionalFormatter()}
          />
        )}
        {!isIndirectProperty && !isReadOnly && !isEditingType && (
          <div
            className={clsx(
              'property-basic-editor__type',
              'property-basic-editor__type--show-click-hint',
              `background--${propertyTypeName.toLowerCase()}`,
              {
                'property-basic-editor__type--has-visit-btn':
                  propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE,
              },
            )}
          >
            {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
              <div className="property-basic-editor__type__abbr">
                {getElementIcon(editorStore, propertyType)}
              </div>
            )}
            <div className="property-basic-editor__type__label">
              {propertyType.name}
            </div>
            <div
              data-testid={
                LEGEND_STUDIO_TEST_ID.PROPERTY_BASIC_EDITOR__TYPE__LABEL_HOVER
              }
              className="property-basic-editor__type__label property-basic-editor__type__label--hover"
              onClick={(): void => setIsEditingType(true)}
            >
              Click to edit
            </div>
            {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
              <button
                data-testid={LEGEND_STUDIO_TEST_ID.TYPE_VISIT}
                className="property-basic-editor__type__visit-btn"
                onClick={openElement}
                tabIndex={-1}
                title={'Visit element'}
              >
                <ArrowCircleRightIcon />
              </button>
            )}
          </div>
        )}
        {(isIndirectProperty || isReadOnly) && (
          <div
            className={clsx(
              'property-basic-editor__type',
              `background--${propertyTypeName.toLowerCase()}`,
              {
                'property-basic-editor__type--has-visit-btn':
                  propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE,
              },
            )}
          >
            {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
              <div className="property-basic-editor__type__abbr">
                {getElementIcon(editorStore, propertyType)}
              </div>
            )}
            <div className="property-basic-editor__type__label">
              {propertyType.name}
            </div>
            {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
              <button
                data-testid={LEGEND_STUDIO_TEST_ID.TYPE_VISIT}
                className="property-basic-editor__type__visit-btn"
                onClick={openElement}
                tabIndex={-1}
                title={'Visit element'}
              >
                <ArrowCircleRightIcon />
              </button>
            )}
          </div>
        )}
        <div className="property-basic-editor__multiplicity">
          <input
            className="property-basic-editor__multiplicity-bound"
            disabled={isIndirectProperty || isReadOnly}
            spellCheck={false}
            value={lowerBound}
            onChange={changeLowerBound}
          />
          <div className="property-basic-editor__multiplicity__range">..</div>
          <input
            className="property-basic-editor__multiplicity-bound"
            disabled={isIndirectProperty || isReadOnly}
            spellCheck={false}
            value={upperBound}
            onChange={changeUpperBound}
          />
        </div>
        {!isIndirectProperty && (
          <button
            className="uml-element-editor__basic__detail-btn"
            onClick={selectProperty}
            tabIndex={-1}
            title={'See detail'}
          >
            <LongArrowRightIcon />
          </button>
        )}
        {isIndirectProperty && (
          <button
            className="uml-element-editor__visit-parent-element-btn"
            onClick={visitOwner}
            tabIndex={-1}
            title={`Visit ${
              isInheritedProperty ? 'super type class' : 'association'
            } '${property._OWNER.path}'`}
          >
            <ArrowCircleRightIcon />
          </button>
        )}
        {isIndirectProperty && (
          <div className="property-basic-editor__locked-property-end-block"></div>
        )}
        {!isIndirectProperty && !isReadOnly && (
          <button
            className={clsx('uml-element-editor__remove-btn', {
              'uml-element-editor__remove-btn--hidden': isIndirectProperty,
            })}
            onClick={deleteProperty}
            tabIndex={-1}
            title={'Remove'}
          >
            <TimesIcon />
          </button>
        )}
      </div>
    );
  },
);

const DerivedPropertyBasicEditor = observer(
  (props: {
    _class: Class;
    editorState: ClassEditorState;
    derivedProperty: DerivedProperty;
    deleteDerivedProperty: () => void;
    isReadOnly: boolean;
  }) => {
    const {
      derivedProperty,
      _class,
      deleteDerivedProperty,
      editorState,
      isReadOnly,
    } = props;
    const editorStore = useEditorStore();
    const applicationStore = useApplicationStore();
    const hasParserError = editorState.classState.derivedPropertyStates.some(
      (state) => state.parserError,
    );
    const dpState =
      editorState.classState.getDerivedPropertyState(derivedProperty);
    const isInheritedProperty = derivedProperty._OWNER !== _class;
    const selectDerivedProperty = (): void =>
      editorState.setSelectedProperty(derivedProperty);
    // Name
    const changeValue: React.ChangeEventHandler<HTMLInputElement> = (event) =>
      property_setName(derivedProperty, event.target.value);
    // Generic Type
    const [isEditingType, setIsEditingType] = useState(false);
    const propertyTypeOptions = editorStore.classPropertyGenericTypeOptions;
    const propertyType = derivedProperty.genericType.value.rawType;
    const propertyTypeName = getClassPropertyType(propertyType);
    const filterOption = createFilter({
      ignoreCase: true,
      ignoreAccents: false,
      stringify: (option: PackageableElementOption<Type>): string =>
        option.value.path,
    });
    const selectedPropertyType = {
      value: propertyType,
      label: propertyType.name,
    };
    const changePropertyType = (val: PackageableElementOption<Type>): void => {
      property_setGenericType(derivedProperty, new GenericType(val.value));
      setIsEditingType(false);
    };
    // Multiplicity
    const [lowerBound, setLowerBound] = useState<string | number>(
      derivedProperty.multiplicity.lowerBound,
    );
    const [upperBound, setUpperBound] = useState<string | number>(
      derivedProperty.multiplicity.upperBound ?? MULTIPLICITY_INFINITE,
    );
    const updateMultiplicity = (
      lower: number | string,
      upper: number | string,
    ): void => {
      const lBound = typeof lower === 'number' ? lower : parseInt(lower, 10);
      const uBound =
        upper === MULTIPLICITY_INFINITE
          ? undefined
          : typeof upper === 'number'
          ? upper
          : parseInt(upper, 10);
      if (!isNaN(lBound) && (uBound === undefined || !isNaN(uBound))) {
        property_setMultiplicity(
          derivedProperty,
          new Multiplicity(lBound, uBound),
        );
      }
    };
    const changeLowerBound: React.ChangeEventHandler<HTMLInputElement> = (
      event,
    ) => {
      setLowerBound(event.target.value);
      updateMultiplicity(event.target.value, upperBound);
    };
    const changeUpperBound: React.ChangeEventHandler<HTMLInputElement> = (
      event,
    ) => {
      setUpperBound(event.target.value);
      updateMultiplicity(lowerBound, event.target.value);
    };
    // Action
    const onLambdaEditorFocus = (): void =>
      applicationStore.navigationContextService.push(
        ApplicationNavigationContextData.createTransient(
          LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT.CLASS_DERIVED_PROPERTY_LAMBDA_EDITOR,
        ),
      );
    const openElement = (): void => {
      if (!(propertyType instanceof PrimitiveType)) {
        editorStore.openElement(
          propertyType instanceof Unit ? propertyType.measure : propertyType,
        );
      }
    };
    const visitOwner = (): void =>
      editorStore.openElement(derivedProperty._OWNER);
    const remove = applicationStore.guardUnhandledError(async () => {
      await flowResult(dpState.convertLambdaObjectToGrammarString(false));
      deleteDerivedProperty();
    });

    return (
      <div
        className={clsx('derived-property-editor', {
          backdrop__element:
            dpState.parserError && !isInheritedProperty && !isReadOnly,
        })}
      >
        <div className="property-basic-editor">
          {isInheritedProperty && (
            <div className="property-basic-editor__name--with-lock">
              <div className="property-basic-editor__name--with-lock__icon">
                <LockIcon />
              </div>
              <span className="property-basic-editor__name--with-lock__name">
                {derivedProperty.name}
              </span>
            </div>
          )}
          {!isInheritedProperty && (
            <input
              disabled={isReadOnly}
              spellCheck={false}
              className="property-basic-editor__name property-basic-editor__qualififed-property__name"
              value={derivedProperty.name}
              placeholder="Property name"
              onChange={changeValue}
            />
          )}
          {!isInheritedProperty && !isReadOnly && isEditingType && (
            <CustomSelectorInput
              className="property-basic-editor__type property-basic-editor__qualififed-property__type"
              options={propertyTypeOptions}
              onChange={changePropertyType}
              value={selectedPropertyType}
              placeholder="Choose a data type or enumeration"
              filterOption={filterOption}
              formatOptionLabel={getPackageableElementOptionalFormatter()}
            />
          )}
          {!isInheritedProperty && !isReadOnly && !isEditingType && (
            <div
              className={clsx(
                'property-basic-editor__type',
                'property-basic-editor__type--show-click-hint',
                `background--${propertyTypeName.toLowerCase()}`,
                {
                  'property-basic-editor__type--has-visit-btn':
                    propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE,
                },
              )}
            >
              {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
                <div className="property-basic-editor__type__abbr">
                  {getElementIcon(editorStore, propertyType)}
                </div>
              )}
              <div className="property-basic-editor__type__label">
                {propertyType.name}
              </div>
              <div
                data-testid={
                  LEGEND_STUDIO_TEST_ID.PROPERTY_BASIC_EDITOR__TYPE__LABEL_HOVER
                }
                className="property-basic-editor__type__label property-basic-editor__type__label--hover"
                onClick={(): void => setIsEditingType(true)}
              >
                Click to edit
              </div>
              {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
                <button
                  data-testid={LEGEND_STUDIO_TEST_ID.TYPE_VISIT}
                  className="property-basic-editor__type__visit-btn"
                  onClick={openElement}
                  tabIndex={-1}
                  title="Visit element"
                >
                  <ArrowCircleRightIcon />
                </button>
              )}
            </div>
          )}
          {(isInheritedProperty || isReadOnly) && (
            <div
              className={clsx(
                'property-basic-editor__type',
                `background--${propertyTypeName.toLowerCase()}`,
                {
                  'property-basic-editor__type--has-visit-btn':
                    propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE,
                },
              )}
            >
              {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
                <div className="property-basic-editor__type__abbr">
                  {getElementIcon(editorStore, propertyType)}
                </div>
              )}
              <div className="property-basic-editor__type__label">
                {propertyType.name}
              </div>
              {propertyTypeName !== CLASS_PROPERTY_TYPE.PRIMITIVE && (
                <button
                  data-testid={LEGEND_STUDIO_TEST_ID.TYPE_VISIT}
                  className="property-basic-editor__type__visit-btn"
                  onClick={openElement}
                  tabIndex={-1}
                  title="Visit element"
                >
                  <ArrowCircleRightIcon />
                </button>
              )}
            </div>
          )}
          <div className="property-basic-editor__multiplicity">
            <input
              className="property-basic-editor__multiplicity-bound"
              spellCheck={false}
              disabled={isInheritedProperty || isReadOnly}
              value={lowerBound}
              onChange={changeLowerBound}
            />
            <div className="property-basic-editor__multiplicity__range">..</div>
            <input
              className="property-basic-editor__multiplicity-bound"
              spellCheck={false}
              disabled={isInheritedProperty || isReadOnly}
              value={upperBound}
              onChange={changeUpperBound}
            />
          </div>
          {!isInheritedProperty && (
            <button
              className="uml-element-editor__basic__detail-btn"
              onClick={selectDerivedProperty}
              tabIndex={-1}
              title="See detail"
            >
              <LongArrowRightIcon />
            </button>
          )}
          {isInheritedProperty && (
            <button
              className="uml-element-editor__visit-parent-element-btn"
              onClick={visitOwner}
              tabIndex={-1}
              title={`Visit super type class ${derivedProperty._OWNER.path}`}
            >
              <ArrowCircleRightIcon />
            </button>
          )}
          {!isInheritedProperty && !isReadOnly && (
            <button
              className={clsx('uml-element-editor__remove-btn', {
                'uml-element-editor__remove-btn--hidden': isInheritedProperty,
              })}
              onClick={remove}
              tabIndex={-1}
              title="Remove"
            >
              <TimesIcon />
            </button>
          )}
        </div>
        <div onFocus={onLambdaEditorFocus}>
          <StudioLambdaEditor
            disabled={
              editorState.classState.isConvertingDerivedPropertyLambdaObjects ||
              isInheritedProperty ||
              isReadOnly
            }
            lambdaEditorState={dpState}
            forceBackdrop={hasParserError}
            expectedType={propertyType}
          />
        </div>
      </div>
    );
  },
);

const ConstraintEditor = observer(
  (props: {
    editorState: ClassEditorState;
    _class: Class;
    constraint: Constraint;
    deleteConstraint: () => void;
    isReadOnly: boolean;
  }) => {
    const { constraint, _class, deleteConstraint, editorState, isReadOnly } =
      props;
    const editorStore = useEditorStore();
    const applicationStore = useApplicationStore();
    const hasParserError = editorState.classState.constraintStates.some(
      (state) => state.parserError,
    );
    const isInheritedConstraint = constraint._OWNER !== _class;
    const constraintState =
      editorState.classState.getConstraintState(constraint);
    // Name
    const changeName: React.ChangeEventHandler<HTMLInputElement> = (event) =>
      constraint_setName(constraint, event.target.value);
    // Actions
    const onLambdaEditorFocus = (): void =>
      applicationStore.navigationContextService.push(
        ApplicationNavigationContextData.createTransient(
          LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT.CLASS_CONTRAINT_LAMBDA_EDITOR,
        ),
      );
    const remove = applicationStore.guardUnhandledError(async () => {
      await flowResult(
        constraintState.convertLambdaObjectToGrammarString(false),
      );
      deleteConstraint();
    });
    const visitOwner = (): void => editorStore.openElement(constraint._OWNER);

    return (
      <div
        className={clsx('constraint-editor', {
          backdrop__element: constraintState.parserError,
        })}
      >
        <div className="constraint-editor__content">
          {isInheritedConstraint && (
            <div className="constraint-editor__content__name--with-lock">
              <div className="constraint-editor__content__name--with-lock__icon">
                <LockIcon />
              </div>
              <span className="constraint-editor__content__name--with-lock__name">
                {constraint.name}
              </span>
            </div>
          )}
          {!isInheritedConstraint && (
            <input
              className="constraint-editor__content__name"
              spellCheck={false}
              disabled={isReadOnly || isInheritedConstraint}
              value={constraint.name}
              onChange={changeName}
              placeholder="Constraint name"
            />
          )}
          {isInheritedConstraint && (
            <button
              className="uml-element-editor__visit-parent-element-btn"
              onClick={visitOwner}
              tabIndex={-1}
              title={`Visit super type class ${constraint._OWNER.path}`}
            >
              <ArrowCircleRightIcon />
            </button>
          )}
          {!isInheritedConstraint && !isReadOnly && (
            <button
              className="uml-element-editor__remove-btn"
              disabled={isInheritedConstraint}
              onClick={remove}
              tabIndex={-1}
              title="Remove"
            >
              <TimesIcon />
            </button>
          )}
        </div>
        <div onFocus={onLambdaEditorFocus}>
          <StudioLambdaEditor
            disabled={
              editorState.classState.isConvertingConstraintLambdaObjects ||
              isReadOnly ||
              isInheritedConstraint
            }
            lambdaEditorState={constraintState}
            forceBackdrop={hasParserError}
            expectedType={editorStore.graphManagerState.graph.getPrimitiveType(
              PRIMITIVE_TYPE.BOOLEAN,
            )}
          />
        </div>
      </div>
    );
  },
);

const SuperTypeEditor = observer(
  (props: {
    _class: Class;
    superType: GenericTypeReference;
    deleteSuperType: () => void;
    isReadOnly: boolean;
  }) => {
    const { superType, _class, deleteSuperType, isReadOnly } = props;
    const editorStore = useEditorStore();
    // Type
    const superTypeOptions = editorStore.classOptions.filter(
      (classOption) =>
        classOption.value instanceof Class &&
        // Exclude current class
        classOption.value !== _class &&
        // Exclude super types of the class
        !getAllSuperclasses(_class).includes(classOption.value) &&
        // Ensure there is no loop (might be expensive)
        !getAllSuperclasses(classOption.value).includes(_class),
    );
    const rawType = superType.value.rawType;
    const filterOption = createFilter({
      ignoreCase: true,
      ignoreAccents: false,
      stringify: (option: PackageableElementOption<Class>): string =>
        option.value.path,
    });
    const selectedType = { value: rawType, label: rawType.name };
    const changeType = (val: PackageableElementOption<Class>): void =>
      setGenericTypeReferenceValue(superType, new GenericType(val.value));
    const visitDerivationSource = (): void => editorStore.openElement(rawType);

    return (
      <div className="super-type-editor">
        <CustomSelectorInput
          className="super-type-editor__class"
          disabled={isReadOnly}
          options={superTypeOptions}
          onChange={changeType}
          value={selectedType}
          placeholder={'Choose a class'}
          filterOption={filterOption}
          formatOptionLabel={getPackageableElementOptionalFormatter()}
        />
        <button
          className="uml-element-editor__basic__detail-btn"
          onClick={visitDerivationSource}
          tabIndex={-1}
          title={'Visit super type'}
        >
          <LongArrowRightIcon />
        </button>
        {!isReadOnly && (
          <button
            className="uml-element-editor__remove-btn"
            disabled={isReadOnly}
            onClick={deleteSuperType}
            tabIndex={-1}
            title={'Remove'}
          >
            <TimesIcon />
          </button>
        )}
      </div>
    );
  },
);

const PropertiesEditor = observer(
  (props: { _class: Class; editorState: ClassEditorState }) => {
    const { _class, editorState } = props;
    const isReadOnly = editorState.isReadOnly;

    const deleteProperty =
      (property: Property): (() => void) =>
      (): void => {
        class_deleteProperty(_class, property);
        if (property === editorState.selectedProperty) {
          editorState.setSelectedProperty(undefined);
        }
      };
    const indirectProperties = getAllClassProperties(_class)
      .filter((property) => !_class.properties.includes(property))
      .sort((p1, p2) => p1.name.localeCompare(p2.name))
      .sort(
        (p1, p2) =>
          (p1._OWNER === _class ? 1 : 0) - (p2._OWNER === _class ? 1 : 0),
      );

    const handleDropProperty = useCallback(
      (item: UMLEditorElementDropTarget): void => {
        if (!isReadOnly && item.data.packageableElement instanceof Type) {
          class_addProperty(
            _class,
            stub_Property(item.data.packageableElement, _class),
          );
        }
      },
      [_class, isReadOnly],
    );
    const [{ isPropertyDragOver }, dropPropertyRef] = useDrop(
      () => ({
        accept: [
          CORE_DND_TYPE.PROJECT_EXPLORER_CLASS,
          CORE_DND_TYPE.PROJECT_EXPLORER_ENUMERATION,
        ],
        drop: (item: ElementDragSource): void => handleDropProperty(item),
        collect: (monitor): { isPropertyDragOver: boolean } => ({
          isPropertyDragOver: monitor.isOver({ shallow: true }),
        }),
      }),
      [handleDropProperty],
    );

    useApplicationNavigationContext(
      LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT.CLASS_EDITOR_PROPERTIES,
    );

    return (
      <div
        ref={dropPropertyRef}
        className={clsx('panel__content__lists', {
          'panel__content__lists--dnd-over': isPropertyDragOver && !isReadOnly,
        })}
      >
        {_class.properties.concat(indirectProperties).map((property) => (
          <PropertyBasicEditor
            key={property._UUID}
            property={property}
            _class={_class}
            editorState={editorState}
            deleteProperty={deleteProperty(property)}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    );
  },
);

const DerviedPropertiesEditor = observer(
  (props: { _class: Class; editorState: ClassEditorState }) => {
    const { _class, editorState } = props;
    const isReadOnly = editorState.isReadOnly;
    const classState = editorState.classState;

    const indirectDerivedProperties = getAllClassDerivedProperties(_class)
      .filter((property) => !_class.derivedProperties.includes(property))
      .sort((p1, p2) => p1.name.localeCompare(p2.name))
      .sort(
        (p1, p2) =>
          (p1._OWNER === _class ? 1 : 0) - (p2._OWNER === _class ? 1 : 0),
      );
    const deleteDerivedProperty =
      (dp: DerivedProperty): (() => void) =>
      (): void => {
        class_deleteDerivedProperty(_class, dp);
        classState.deleteDerivedPropertyState(dp);
        if (dp === editorState.selectedProperty) {
          editorState.setSelectedProperty(undefined);
        }
      };

    const handleDropDerivedProperty = useCallback(
      (item: UMLEditorElementDropTarget): void => {
        if (!isReadOnly && item.data.packageableElement instanceof Type) {
          const dp = stub_DerivedProperty(item.data.packageableElement, _class);
          class_addDerivedProperty(_class, dp);
          classState.addDerivedPropertyState(dp);
        }
      },
      [_class, classState, isReadOnly],
    );
    const [{ isDerivedPropertyDragOver }, dropDerivedPropertyRef] = useDrop(
      () => ({
        accept: [
          CORE_DND_TYPE.PROJECT_EXPLORER_CLASS,
          CORE_DND_TYPE.PROJECT_EXPLORER_ENUMERATION,
        ],
        drop: (item: ElementDragSource): void =>
          handleDropDerivedProperty(item),
        collect: (monitor): { isDerivedPropertyDragOver: boolean } => ({
          isDerivedPropertyDragOver: monitor.isOver({ shallow: true }),
        }),
      }),
      [handleDropDerivedProperty],
    );

    useApplicationNavigationContext(
      LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT.CLASS_EDITOR_DERIVED_PROPERTIES,
    );

    return (
      <div
        ref={dropDerivedPropertyRef}
        className={clsx('panel__content__lists', {
          'panel__content__lists--dnd-over':
            isDerivedPropertyDragOver && !isReadOnly,
        })}
      >
        {_class.derivedProperties
          .concat(indirectDerivedProperties)
          .filter((dp): dp is DerivedProperty =>
            Boolean(classState.getNullableDerivedPropertyState(dp)),
          )
          .map((dp) => (
            <DerivedPropertyBasicEditor
              key={dp._UUID}
              derivedProperty={dp}
              _class={_class}
              editorState={editorState}
              deleteDerivedProperty={deleteDerivedProperty(dp)}
              isReadOnly={isReadOnly}
            />
          ))}
      </div>
    );
  },
);

const ConstraintsEditor = observer(
  (props: { _class: Class; editorState: ClassEditorState }) => {
    const { _class, editorState } = props;
    const isReadOnly = editorState.isReadOnly;
    const classState = editorState.classState;

    const deleteConstraint =
      (constraint: Constraint): (() => void) =>
      (): void => {
        class_deleteConstraint(_class, constraint);
        classState.deleteConstraintState(constraint);
      };
    const inheritedConstraints = getAllClassConstraints(_class).filter(
      (constraint) => !_class.constraints.includes(constraint),
    );

    useApplicationNavigationContext(
      LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT.CLASS_EDITOR_CONSTRAINTS,
    );

    return (
      <div className="panel__content__lists">
        {_class.constraints
          .concat(inheritedConstraints)
          .filter((constraint): constraint is Constraint =>
            Boolean(classState.getNullableConstraintState(constraint)),
          )
          .map((constraint) => (
            <ConstraintEditor
              key={constraint._UUID}
              constraint={constraint}
              _class={_class}
              editorState={editorState}
              deleteConstraint={deleteConstraint(constraint)}
              isReadOnly={isReadOnly}
            />
          ))}
      </div>
    );
  },
);

const SupertypesEditor = observer(
  (props: { _class: Class; editorState: ClassEditorState }) => {
    const { _class, editorState } = props;
    const isReadOnly = editorState.isReadOnly;

    const deleteSuperType =
      (superType: GenericTypeReference): (() => void) =>
      (): void => {
        class_deleteSuperType(_class, superType);
        if (superType.value.rawType instanceof Class) {
          class_deleteSubclass(superType.value.rawType, _class);
        }
      };

    const handleDropSuperType = useCallback(
      (item: UMLEditorElementDropTarget): void => {
        const element = item.data.packageableElement;
        if (
          !isReadOnly &&
          // Have to be a class
          element instanceof Class &&
          // Must not be the same class
          element !== _class &&
          // Must not be a supertype of the current class
          !getAllSuperclasses(_class).includes(element) &&
          // Must not have the current class as a super type
          !getAllSuperclasses(element).includes(_class)
        ) {
          class_addSuperType(
            _class,
            GenericTypeExplicitReference.create(new GenericType(element)),
          );
          class_addSubclass(element, _class);
        }
      },
      [_class, isReadOnly],
    );
    const [{ isSuperTypeDragOver }, dropSuperTypeRef] = useDrop(
      () => ({
        accept: [
          CORE_DND_TYPE.PROJECT_EXPLORER_CLASS,
          CORE_DND_TYPE.PROJECT_EXPLORER_ENUMERATION,
        ],
        drop: (item: ElementDragSource): void => handleDropSuperType(item),
        collect: (monitor): { isSuperTypeDragOver: boolean } => ({
          isSuperTypeDragOver: monitor.isOver({ shallow: true }),
        }),
      }),
      [handleDropSuperType],
    );

    useApplicationNavigationContext(
      LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT.CLASS_EDITOR_SUPERTYPES,
    );

    return (
      <div
        ref={dropSuperTypeRef}
        className={clsx('panel__content__lists', {
          'panel__content__lists--dnd-over': isSuperTypeDragOver && !isReadOnly,
        })}
      >
        {_class.generalizations.map((superType) => (
          <SuperTypeEditor
            key={superType.value._UUID}
            superType={superType}
            _class={_class}
            deleteSuperType={deleteSuperType(superType)}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    );
  },
);

const TaggedValuesEditor = observer(
  (props: { _class: Class; editorState: ClassEditorState }) => {
    const { _class, editorState } = props;
    const isReadOnly = editorState.isReadOnly;

    const deleteTaggedValue =
      (val: TaggedValue): (() => void) =>
      (): void =>
        annotatedElement_deleteTaggedValue(_class, val);

    const handleDropTaggedValue = useCallback(
      (item: UMLEditorElementDropTarget): void => {
        if (!isReadOnly && item.data.packageableElement instanceof Profile) {
          annotatedElement_addTaggedValue(
            _class,
            stub_TaggedValue(stub_Tag(item.data.packageableElement)),
          );
        }
      },
      [_class, isReadOnly],
    );
    const [{ isTaggedValueDragOver }, dropTaggedValueRef] = useDrop(
      () => ({
        accept: [CORE_DND_TYPE.PROJECT_EXPLORER_PROFILE],
        drop: (item: ElementDragSource): void => handleDropTaggedValue(item),
        collect: (monitor): { isTaggedValueDragOver: boolean } => ({
          isTaggedValueDragOver: monitor.isOver({ shallow: true }),
        }),
      }),
      [handleDropTaggedValue],
    );

    return (
      <div
        ref={dropTaggedValueRef}
        className={clsx('panel__content__lists', {
          'panel__content__lists--dnd-over':
            isTaggedValueDragOver && !isReadOnly,
        })}
      >
        {_class.taggedValues.map((taggedValue) => (
          <TaggedValueEditor
            key={taggedValue._UUID}
            taggedValue={taggedValue}
            deleteValue={deleteTaggedValue(taggedValue)}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    );
  },
);

const StereotypesEditor = observer(
  (props: { _class: Class; editorState: ClassEditorState }) => {
    const { _class, editorState } = props;
    const isReadOnly = editorState.isReadOnly;

    const deleteStereotype =
      (val: StereotypeReference): (() => void) =>
      (): void =>
        annotatedElement_deleteStereotype(_class, val);

    const handleDropStereotype = useCallback(
      (item: UMLEditorElementDropTarget): void => {
        if (!isReadOnly && item.data.packageableElement instanceof Profile) {
          annotatedElement_addStereotype(
            _class,
            StereotypeExplicitReference.create(
              stub_Stereotype(item.data.packageableElement),
            ),
          );
        }
      },
      [_class, isReadOnly],
    );
    const [{ isStereotypeDragOver }, dropStereotypeRef] = useDrop(
      () => ({
        accept: [CORE_DND_TYPE.PROJECT_EXPLORER_PROFILE],
        drop: (item: ElementDragSource): void => handleDropStereotype(item),
        collect: (monitor): { isStereotypeDragOver: boolean } => ({
          isStereotypeDragOver: monitor.isOver({ shallow: true }),
        }),
      }),
      [handleDropStereotype],
    );

    return (
      <div
        ref={dropStereotypeRef}
        className={clsx('panel__content__lists', {
          'panel__content__lists--dnd-over':
            isStereotypeDragOver && !isReadOnly,
        })}
      >
        {_class.stereotypes.map((stereotype) => (
          <StereotypeSelector
            key={stereotype.value._UUID}
            stereotype={stereotype}
            deleteStereotype={deleteStereotype(stereotype)}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>
    );
  },
);

export const ClassFormEditor = observer(
  (props: {
    _class: Class;
    editorState: ClassEditorState;
    onHashChange?: () => void;
  }) => {
    const { _class, editorState, onHashChange } = props;
    const editorStore = useEditorStore();
    const applicationStore = useApplicationStore();
    const classHash = editorStore.graphManagerState.isElementReadOnly(_class)
      ? undefined
      : applicationStore.notifyAndReturnAlternativeOnError(
          () => _class.hashCode,
          undefined,
        ); // attempting to read the hashCode of immutable element will throw an error
    const classState = editorState.classState;
    const isReadOnly = editorState.isReadOnly;
    const defaultType = editorStore.graphManagerState.graph.getPrimitiveType(
      PRIMITIVE_TYPE.STRING,
    );

    // Tab
    const selectedTab = editorState.selectedTab;
    const tabs = [
      UML_EDITOR_TAB.PROPERTIES,
      UML_EDITOR_TAB.DERIVED_PROPERTIES,
      UML_EDITOR_TAB.CONSTRAINTS,
      UML_EDITOR_TAB.SUPER_TYPES,
      UML_EDITOR_TAB.TAGGED_VALUES,
      UML_EDITOR_TAB.STEREOTYPES,
    ];
    const changeTab =
      (tab: UML_EDITOR_TAB): (() => void) =>
      (): void => {
        editorState.setSelectedTab(tab);
        editorState.setSelectedProperty(undefined);
      };

    const deselectProperty = (): void =>
      editorState.setSelectedProperty(undefined);

    const possibleSupertypes =
      editorStore.graphManagerState.graph.ownClasses.filter(
        (superType) =>
          // Exclude current class
          superType !== _class &&
          // Exclude super types of the class
          !getAllSuperclasses(_class).includes(superType) &&
          // Ensure there is no loop (might be expensive)
          !getAllSuperclasses(superType).includes(_class),
      );
    // Add button
    let addButtonTitle = '';
    switch (selectedTab) {
      case UML_EDITOR_TAB.PROPERTIES:
        addButtonTitle = 'Add property';
        break;
      case UML_EDITOR_TAB.DERIVED_PROPERTIES:
        addButtonTitle = 'Add derived property';
        break;
      case UML_EDITOR_TAB.CONSTRAINTS:
        addButtonTitle = 'Add constraint';
        break;
      case UML_EDITOR_TAB.SUPER_TYPES:
        addButtonTitle = 'Add super type';
        break;
      case UML_EDITOR_TAB.TAGGED_VALUES:
        addButtonTitle = 'Add tagged value';
        break;
      case UML_EDITOR_TAB.STEREOTYPES:
        addButtonTitle = 'Add stereotype';
        break;
      default:
        break;
    }
    const isAddButtonDisabled =
      isReadOnly ||
      (selectedTab === UML_EDITOR_TAB.SUPER_TYPES &&
        !possibleSupertypes.length);
    const add = (): void => {
      if (!isReadOnly) {
        if (selectedTab === UML_EDITOR_TAB.PROPERTIES) {
          class_addProperty(_class, stub_Property(defaultType, _class));
        } else if (selectedTab === UML_EDITOR_TAB.DERIVED_PROPERTIES) {
          const dp = stub_DerivedProperty(defaultType, _class);
          class_addDerivedProperty(_class, dp);
          classState.addDerivedPropertyState(dp);
        } else if (selectedTab === UML_EDITOR_TAB.CONSTRAINTS) {
          const constraint = stub_Constraint(_class);
          class_addContraint(_class, constraint);
          classState.addConstraintState(constraint);
        } else if (
          selectedTab === UML_EDITOR_TAB.SUPER_TYPES &&
          possibleSupertypes.length
        ) {
          const possibleSupertype = possibleSupertypes[0] as Class;
          class_addSuperType(
            _class,
            GenericTypeExplicitReference.create(
              new GenericType(possibleSupertype),
            ),
          );
          class_addSubclass(possibleSupertype, _class);
        } else if (selectedTab === UML_EDITOR_TAB.TAGGED_VALUES) {
          annotatedElement_addTaggedValue(
            _class,
            stub_TaggedValue(stub_Tag(stub_Profile())),
          );
        } else if (selectedTab === UML_EDITOR_TAB.STEREOTYPES) {
          annotatedElement_addStereotype(
            _class,
            StereotypeExplicitReference.create(stub_Stereotype(stub_Profile())),
          );
        }
      }
    };

    // Generation
    const generationParentElementPath =
      editorStore.graphState.graphGenerationState.findGenerationParentPath(
        _class.path,
      );
    const generationParentElement = generationParentElementPath
      ? editorStore.graphManagerState.graph.getNullableElement(
          generationParentElementPath,
        )
      : undefined;
    const visitGenerationParentElement = (): void => {
      if (generationParentElement) {
        editorStore.openElement(generationParentElement);
      }
    };

    // On change handler (this is used for other editors which embeds editor)
    useEffect(() => {
      onHashChange?.();
    }, [_class, classHash, onHashChange]);

    // Decorate (add/remove states for derived properties/constraints) and convert lambda objects
    useEffect(() => {
      classState.decorate();
      flowResult(classState.convertConstraintLambdaObjects()).catch(
        applicationStore.alertUnhandledError,
      );
      flowResult(classState.convertDerivedPropertyLambdaObjects()).catch(
        applicationStore.alertUnhandledError,
      );
    }, [applicationStore, classState]);

    return (
      <div
        data-testid={LEGEND_STUDIO_TEST_ID.CLASS_FORM_EDITOR}
        className="uml-element-editor class-form-editor"
      >
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel minSize={56}>
            <div className="panel">
              <div className="panel__header">
                <div className="panel__header__title">
                  {isReadOnly && (
                    <div className="uml-element-editor__header__lock">
                      <LockIcon />
                    </div>
                  )}
                  <div className="panel__header__title__label">class</div>
                  <div className="panel__header__title__content">
                    {_class.name}
                  </div>
                </div>
                <div className="panel__header__actions">
                  {generationParentElement && (
                    <button
                      className="uml-element-editor__header__generation-origin"
                      onClick={visitGenerationParentElement}
                      tabIndex={-1}
                      title={`Visit generation parent '${generationParentElement.path}'`}
                    >
                      <div className="uml-element-editor__header__generation-origin__label">
                        <FireIcon />
                      </div>
                      <div className="uml-element-editor__header__generation-origin__parent-name">
                        {generationParentElement.name}
                      </div>
                      <div className="uml-element-editor__header__generation-origin__visit-btn">
                        <StickArrowCircleRightIcon />
                      </div>
                    </button>
                  )}
                </div>
              </div>
              <div
                data-testid={
                  LEGEND_STUDIO_TEST_ID.UML_ELEMENT_EDITOR__TABS_HEADER
                }
                className="panel__header uml-element-editor__tabs__header"
              >
                <div className="uml-element-editor__tabs">
                  {tabs.map((tab) => (
                    <div
                      key={tab}
                      onClick={changeTab(tab)}
                      className={clsx('uml-element-editor__tab', {
                        'uml-element-editor__tab--active': tab === selectedTab,
                      })}
                    >
                      {prettyCONSTName(tab)}
                    </div>
                  ))}
                </div>
                <div className="panel__header__actions">
                  <button
                    className="panel__header__action"
                    disabled={isAddButtonDisabled}
                    onClick={add}
                    tabIndex={-1}
                    title={addButtonTitle}
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>
              <div
                className={clsx('panel__content', {
                  'panel__content--with-backdrop-element':
                    selectedTab === UML_EDITOR_TAB.DERIVED_PROPERTIES ||
                    selectedTab === UML_EDITOR_TAB.CONSTRAINTS,
                })}
              >
                {selectedTab === UML_EDITOR_TAB.PROPERTIES && (
                  <PropertiesEditor _class={_class} editorState={editorState} />
                )}
                {selectedTab === UML_EDITOR_TAB.DERIVED_PROPERTIES && (
                  <DerviedPropertiesEditor
                    _class={_class}
                    editorState={editorState}
                  />
                )}
                {selectedTab === UML_EDITOR_TAB.CONSTRAINTS && (
                  <ConstraintsEditor
                    _class={_class}
                    editorState={editorState}
                  />
                )}
                {selectedTab === UML_EDITOR_TAB.SUPER_TYPES && (
                  <SupertypesEditor _class={_class} editorState={editorState} />
                )}
                {selectedTab === UML_EDITOR_TAB.TAGGED_VALUES && (
                  <TaggedValuesEditor
                    _class={_class}
                    editorState={editorState}
                  />
                )}
                {selectedTab === UML_EDITOR_TAB.STEREOTYPES && (
                  <StereotypesEditor
                    _class={_class}
                    editorState={editorState}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
          <ResizablePanelSplitter>
            <ResizablePanelSplitterLine color="var(--color-light-grey-200)" />
          </ResizablePanelSplitter>
          <ResizablePanel
            {...getControlledResizablePanelProps(!editorState.selectedProperty)}
            flex={0}
            direction={-1}
            size={editorState.selectedProperty ? 250 : 0}
          >
            {editorState.selectedProperty ? (
              <PropertyEditor
                property={editorState.selectedProperty}
                deselectProperty={deselectProperty}
                isReadOnly={isReadOnly}
              />
            ) : (
              <div className="uml-element-editor__sub-editor">
                <BlankPanelContent>No property selected</BlankPanelContent>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  },
);

export const ClassEditor = observer((props: { _class: Class }) => {
  const { _class } = props;
  const editorStore = useEditorStore();
  const editorState = editorStore.getCurrentEditorState(ClassEditorState);

  const classPreviewRenderers = editorStore.pluginManager
    .getStudioPlugins()
    .flatMap((plugin) => plugin.getExtraClassPreviewRenderers?.() ?? [])
    .filter(isNonNullable);

  useApplicationNavigationContext(
    LEGEND_STUDIO_APPLICATION_NAVIGATION_CONTEXT.CLASS_EDITOR,
  );

  return (
    <ResizablePanelGroup orientation="vertical" className="class-editor">
      <ResizablePanel size={500} minSize={450}>
        {classPreviewRenderers.length !== 0 &&
          (classPreviewRenderers[0] as ClassPreviewRenderer)(_class)}
        {classPreviewRenderers.length === 0 && (
          <BlankPanelContent>No preview</BlankPanelContent>
        )}
      </ResizablePanel>
      <ResizablePanelSplitter />
      <ResizablePanel minSize={450}>
        <ClassFormEditor _class={_class} editorState={editorState} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
});
