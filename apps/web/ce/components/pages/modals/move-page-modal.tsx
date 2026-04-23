/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CheckIcon, SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getPageName } from "@plane/utils";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import type { TPageInstance } from "@/store/pages/base-page";

export type TMovePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
};

const TOP_LEVEL_PARENT_ID = "__top_level__";

export const MovePageModal = observer(function MovePageModal(props: TMovePageModalProps) {
  const { isOpen, onClose, page } = props;
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const { data, fetchPagesList, getPageById } = usePageStore(EPageStoreType.PROJECT);
  const [query, setQuery] = useState("");
  const [selectedParentId, setSelectedParentId] = useState<string>(page.parent ?? TOP_LEVEL_PARENT_ID);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;
    fetchPagesList(workspaceSlug.toString(), projectId.toString()).catch(() => undefined);
  }, [fetchPagesList, isOpen, projectId, workspaceSlug]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setSelectedParentId(page.parent ?? TOP_LEVEL_PARENT_ID);
  }, [isOpen, page.id, page.parent]);

  const projectPages = useMemo(() => {
    if (!projectId) return [];
    return Object.values(data).filter(
      (candidate) => candidate.project_ids?.includes(projectId.toString()) && !candidate.archived_at
    );
  }, [data, projectId]);

  const descendantIds = useMemo(() => {
    if (!page.id) return new Set<string>();

    const descendants = new Set<string>();
    const visit = (parentId: string) => {
      for (const candidate of projectPages) {
        if (!candidate.id || candidate.parent !== parentId || descendants.has(candidate.id)) continue;
        descendants.add(candidate.id);
        visit(candidate.id);
      }
    };

    visit(page.id);
    return descendants;
  }, [page.id, projectPages]);

  const moveCandidates = useMemo(() => {
    const filteredQuery = query.trim().toLowerCase();
    const candidates = projectPages
      .filter((candidate) => candidate.id && candidate.id !== page.id && !descendantIds.has(candidate.id))
      .sort((left, right) => getPageName(left.name).localeCompare(getPageName(right.name)));

    return [
      {
        id: TOP_LEVEL_PARENT_ID,
        label: "Top level",
        helper: "Move this page back to the main pages list.",
      },
      ...candidates.map((candidate) => {
        const parentName = candidate.parent ? getPageName(getPageById(candidate.parent)?.name) : undefined;
        return {
          id: candidate.id as string,
          label: getPageName(candidate.name),
          helper: parentName ? `Current parent: ${parentName}` : "Top-level page",
        };
      }),
    ].filter((candidate) => {
      if (!filteredQuery) return true;
      return (
        candidate.label.toLowerCase().includes(filteredQuery) ||
        candidate.helper.toLowerCase().includes(filteredQuery)
      );
    });
  }, [descendantIds, getPageById, page.id, projectPages, query]);

  const currentParentName = page.parent ? getPageName(getPageById(page.parent)?.name) : "Top level";

  const handleClose = () => {
    setIsSubmitting(false);
    setQuery("");
    setSelectedParentId(page.parent ?? TOP_LEVEL_PARENT_ID);
    onClose();
  };

  const handleMove = async () => {
    const nextParentId = selectedParentId === TOP_LEVEL_PARENT_ID ? null : selectedParentId;
    if (nextParentId === (page.parent ?? null)) {
      handleClose();
      return;
    }

    setIsSubmitting(true);
    await page
      .update({ parent: nextParentId })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message:
            nextParentId === null
              ? "Page moved to the top level."
              : `Page moved under ${getPageName(getPageById(nextParentId)?.name)}.`,
        });
        handleClose();
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be moved. Please try again.",
        });
        setIsSubmitting(false);
      });
  };

  if (!page.id) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-primary">Move page</h3>
          <p className="text-13 text-secondary">
            Choose a new parent for <span className="font-medium text-primary">{getPageName(page.name)}</span>.
          </p>
          <p className="text-12 text-tertiary">Current location: {currentParentName}</p>
        </div>

        <Combobox value={selectedParentId} onChange={setSelectedParentId}>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-primary text-opacity-40"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 w-full rounded-md border border-subtle bg-transparent pr-4 pl-11 text-primary outline-none focus:ring-0 sm:text-13"
              placeholder="Search pages..."
            />
          </div>
          <Combobox.Options static className="max-h-80 overflow-y-auto rounded-md border border-subtle">
            {moveCandidates.length > 0 ? (
              <ul className="divide-y divide-subtle">
                {moveCandidates.map((candidate) => (
                  <Combobox.Option key={candidate.id} value={candidate.id} as="li">
                    {({ active, selected }) => (
                      <button
                        type="button"
                        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${
                          active ? "bg-layer-transparent-hover" : "bg-transparent"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-13 font-medium text-primary">{candidate.label}</div>
                          <div className="text-12 text-secondary">{candidate.helper}</div>
                        </div>
                        {selected && <CheckIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />}
                      </button>
                    )}
                  </Combobox.Option>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center text-13 text-secondary">
                {t("common_empty_state.search.description")}
              </div>
            )}
          </Combobox.Options>
        </Combobox>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={handleMove} loading={isSubmitting}>
            {isSubmitting ? "Moving..." : "Move page"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
