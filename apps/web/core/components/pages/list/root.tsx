/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
// types
import type { TPageNavigationTabs } from "@plane/types";
// components
import { ListLayout } from "@/components/core/list";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// local imports
import { PageListBlock } from "./block";

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

export const PagesListRoot = observer(function PagesListRoot(props: TPagesListRoot) {
  const { pageType, storeType } = props;
  // store hooks
  const { getCurrentProjectFilteredPageIdsByTab, getCurrentProjectFilteredPageTreeByTab, getPageById } =
    usePageStore(storeType);
  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIdsByTab(pageType);
  const filteredPageTree = getCurrentProjectFilteredPageTreeByTab(pageType);
  const [collapsedPageIds, setCollapsedPageIds] = useState<Record<string, boolean>>({});

  const { childrenByParent, visiblePageTree } = useMemo(() => {
    const orderedEntries = filteredPageTree ?? [];
    const pageIds = new Set(orderedEntries.map(({ pageId }) => pageId));
    const nextChildrenByParent = new Map<string | null, string[]>();

    for (const { pageId } of orderedEntries) {
      const page = getPageById(pageId);
      const parentId = page?.parent && pageIds.has(page.parent) ? page.parent : null;
      const siblings = nextChildrenByParent.get(parentId) ?? [];
      siblings.push(pageId);
      nextChildrenByParent.set(parentId, siblings);
    }

    const nextVisiblePageTree: Array<{ pageId: string; depth: number }> = [];
    const visit = (parentId: string | null, depth: number) => {
      for (const pageId of nextChildrenByParent.get(parentId) ?? []) {
        nextVisiblePageTree.push({ pageId, depth });
        if (!collapsedPageIds[pageId]) {
          visit(pageId, depth + 1);
        }
      }
    };

    visit(null, 0);

    return {
      childrenByParent: nextChildrenByParent,
      visiblePageTree: nextVisiblePageTree,
    };
  }, [collapsedPageIds, filteredPageTree, getPageById]);

  if (!filteredPageIds) return <></>;
  return (
    <ListLayout>
      {visiblePageTree.map(({ pageId, depth }) => (
        <PageListBlock
          key={pageId}
          depth={depth}
          hasChildren={(childrenByParent.get(pageId)?.length ?? 0) > 0}
          isCollapsed={!!collapsedPageIds[pageId]}
          onToggleCollapse={() =>
            setCollapsedPageIds((current) => ({
              ...current,
              [pageId]: !current[pageId],
            }))
          }
          pageId={pageId}
          storeType={storeType}
        />
      ))}
    </ListLayout>
  );
});
