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

import { computed, makeObservable, observable } from 'mobx';
import { ServiceTest } from '../../../DSLService_Exports.js';
import { ServiceTestSuite } from '../../../models/metamodels/pure/packageableElements/service/ServiceTestSuite.js';
import { EqualTo } from '../../../models/metamodels/pure/test/assertion/EqualTo.js';
import { EqualToJson } from '../../../models/metamodels/pure/test/assertion/EqualToJson.js';
import { EqualToTDS } from '../../../models/metamodels/pure/test/assertion/EqualToTDS.js';
import type { TestAssertion } from '../../../models/metamodels/pure/test/assertion/TestAssertion.js';
import type {
  AtomicTest,
  TestSuite,
} from '../../../models/metamodels/pure/test/Test.js';
import { type ObserverContext, skipObserved } from './CoreObserverHelper.js';
import { observe_ExternalFormatData } from './DSLData_ObserverHelper.js';
import {
  observe_ServiceTest,
  observe_ServiceTestSuite,
} from './DSLService_ObserverHelper.js';

const observe_EqualTo = skipObserved((metamodel: EqualTo): EqualTo => {
  makeObservable(metamodel, {
    id: observable,
    expected: observable,
    hashCode: computed,
  });

  return metamodel;
});

const observe_EqualToTDS = skipObserved((metamodel: EqualToTDS): EqualToTDS => {
  makeObservable(metamodel, {
    id: observable,
    expected: observable,
    hashCode: computed,
  });
  observe_ExternalFormatData(metamodel.expected);
  return metamodel;
});

const observe_EqualToJson = skipObserved(
  (metamodel: EqualToJson): EqualToJson => {
    makeObservable(metamodel, {
      id: observable,
      expected: observable,
      hashCode: computed,
    });

    observe_ExternalFormatData(metamodel.expected);

    return metamodel;
  },
);

export function observe_AtomicTest(metamodel: AtomicTest): AtomicTest {
  if (metamodel instanceof ServiceTest) {
    return observe_ServiceTest(metamodel);
  }
  return metamodel;
}

export function observe_TestAssertion(metamodel: TestAssertion): TestAssertion {
  if (metamodel instanceof EqualTo) {
    return observe_EqualTo(metamodel);
  } else if (metamodel instanceof EqualToJson) {
    return observe_EqualToJson(metamodel);
  } else if (metamodel instanceof EqualToTDS) {
    return observe_EqualToTDS(metamodel);
  }
  return metamodel;
}

export function observe_TestSuite(
  metamodel: TestSuite,
  context: ObserverContext,
): TestSuite {
  if (metamodel instanceof ServiceTestSuite) {
    return observe_ServiceTestSuite(metamodel, context);
  }
  return metamodel;
}
