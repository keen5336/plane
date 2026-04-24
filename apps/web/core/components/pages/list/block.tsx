/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight, CornerDownRight } from "lucide-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
// plane imports
import { getPageName } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { BlockItemAction } from "@/components/pages/list/block-item-action";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePage } from "@/plane-web/hooks/store";

type TPageListBlock = {
  depth: number;
  hasChildren: boolean;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  pageId: string;
  storeType: EPageStoreType;
};

export const PageListBlock = observer(function PageListBlock(props: TPageListBlock) {
  const { depth, hasChildren, isCollapsed, onToggleCollapse, pageId, storeType } = props;
  // refs
  const parentRef = useRef(null);
  // hooks
  const page = usePage({
    pageId,
    storeType,
  });
  const { isMobile } = usePlatformOS();
  // handle page check
  if (!page) return null;
  // derived values
  const { name, logo_props, getRedirectionLink } = page;
  const isSubpage = depth > 0;

  return (
    <ListItem
      prependTitleElement={
        <div className="flex items-center" style={{ marginLeft: `${depth * 20}px` }}>
          {hasChildren ? (
            <button
              type="button"
              className="mr-1 flex h-4 w-4 items-center justify-center rounded-sm text-tertiary hover:bg-layer-transparent-hover"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleCollapse?.();
              }}
              aria-label={isCollapsed ? "Expand subpages" : "Collapse subpages"}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="mr-1 h-4 w-4" />
          )}
          {isSubpage && <CornerDownRight className="mr-2 h-3.5 w-3.5 text-tertiary" />}
          {logo_props?.in_use ? (
            <Logo logo={logo_props} size={16} type="lucide" />
          ) : (
            <PageIcon className="h-4 w-4 text-tertiary" />
          )}
        </div>
      }
      appendTitleElement={
        isSubpage ? (
          <span className="rounded-sm bg-layer-transparent-selected px-1.5 py-0.5 text-11 text-secondary">
            Subpage
          </span>
        ) : undefined
      }
      title={getPageName(name)}
      itemLink={getRedirectionLink()}
      actionableItems={<BlockItemAction page={page} parentRef={parentRef} storeType={storeType} />}
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
