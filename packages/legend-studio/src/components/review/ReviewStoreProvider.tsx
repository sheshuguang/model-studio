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

import { createContext, useContext } from 'react';
import { useLocalObservable } from 'mobx-react-lite';
import { ReviewStore } from '../../stores/ReviewStore.js';
import { EDITOR_MODE } from '../../stores/EditorConfig.js';
import { guaranteeNonNullable } from '@finos/legend-shared';
import { useEditorStore } from '../editor/EditorStoreProvider.js';

const ReviewStoreContext = createContext<ReviewStore | undefined>(undefined);

export const ReviewStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const editorStore = useEditorStore();
  editorStore.setMode(EDITOR_MODE.REVIEW);
  const store = useLocalObservable(() => new ReviewStore(editorStore));
  return (
    <ReviewStoreContext.Provider value={store}>
      {children}
    </ReviewStoreContext.Provider>
  );
};

export const useReviewStore = (): ReviewStore =>
  guaranteeNonNullable(
    useContext(ReviewStoreContext),
    `Can't find review store in context`,
  );
