import React, { ReactNode, useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { SettingsItem } from "@/components/settings/SettingsItem";
import { useOrgs } from "@/services/orgs.service";
import { orgRankingAtom } from "@/store/org";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Props as DndContextProps } from "@dnd-kit/core/dist/components/DndContext/DndContext.d.ts";
import { ScrollArea } from "@/shadcn/ui/scroll-area";

// const clamp = (number: number, boundOne: number, boundTwo?: number): number => {
//   if (!boundTwo) {
//     return Math.max(number, boundOne) === boundOne ? number : boundOne;
//   } else if (Math.min(number, boundOne) === number) {
//     return boundOne;
//   } else if (Math.max(number, boundTwo) === number) {
//     return boundTwo;
//   }
//   return number;
// };

// function swap<T>(array: T[], moveIndex: number, toIndex: number): T[] {
//   /* #move - Moves an array item from one position in an array to another.

//      Note: This is a pure function so a new array will be returned, instead
//      of altering the array argument.

//     Arguments:
//     1. array     (Array<T>) : Array in which to move an item.         (required)
//     2. moveIndex (number) : The index of the item to move.          (required)
//     3. toIndex   (number) : The index to move item at moveIndex to. (required)
//   */
//   const item = array[moveIndex];
//   const length = array.length;
//   const diff = moveIndex - toIndex;

//   if (diff > 0) {
//     // move left
//     return [
//       ...array.slice(0, toIndex),
//       item,
//       ...array.slice(toIndex, moveIndex),
//       ...array.slice(moveIndex + 1, length),
//     ];
//   } else if (diff < 0) {
//     // move right
//     const targetIndex = toIndex + 1;
//     return [
//       ...array.slice(0, moveIndex),
//       ...array.slice(moveIndex + 1, targetIndex),
//       item,
//       ...array.slice(targetIndex, length),
//     ];
//   }
//   return array;
// }
export function SettingsOrgs() {
  const { t } = useTranslation();
  const [rankedOrgs, setRankedOrgs] = useAtom(orgRankingAtom);

  return (
    <div className="flex flex-col">
      <SettingsItem label={"Starred Organizations"} fullWidth>
        <OrgReranker rankedOrgs={rankedOrgs} setRankedOrgs={setRankedOrgs} />
        <button
          className="mt-4 rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
          onClick={() => {
            setRankedOrgs([]);
          }}
        >
          Reset organization ranking
        </button>
      </SettingsItem>
    </div>
  );
}

export const OrgReranker = ({
  rankedOrgs,
  setRankedOrgs,
}: {
  rankedOrgs: Org[];
  setRankedOrgs: (orgs: Org[]) => void;
}) => {
  const { data: allOrgs } = useOrgs();
  const [starredOrgs, setStarredOrgs] = useState<Org[]>([]);
  const [unstarredOrgs, setUnstarredOrgs] = useState<Org[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (allOrgs) {
      const starred = rankedOrgs.filter((org) =>
        allOrgs.some((allOrg) => allOrg.name === org.name),
      );
      const unstarred = allOrgs.filter(
        (org) => !rankedOrgs.some((rankedOrg) => rankedOrg.name === org.name),
      );
      setStarredOrgs(starred);
      setUnstarredOrgs(unstarred);
    }
  }, [allOrgs, rankedOrgs]);

  const handleDragEnd: DndContextProps["onDragEnd"] = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setStarredOrgs((items) => {
        const oldIndex = items.findIndex((item) => item.name === active.id);
        const newIndex = items.findIndex((item) => item.name === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        setRankedOrgs([...newItems]);
        return newItems;
      });
    }
  };

  const toggleStar = (org: Org, remove?: boolean) => {
    if (remove) {
      setRankedOrgs(
        starredOrgs.filter((starredOrg) => starredOrg.name !== org.name),
      );
    } else {
      setRankedOrgs([...starredOrgs, org]);
    }
  };

  const filteredUnstarredOrgs = unstarredOrgs.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-w-72 space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={starredOrgs.map((org) => org.name)}
          strategy={verticalListSortingStrategy}
        >
          {starredOrgs.map((org) => (
            <SortableItem key={"draggable" + org.name} id={org.name}>
              <div className="my-1 flex h-10 cursor-grab items-center justify-between rounded bg-primaryA-4 p-2">
                <div className="i-mdi:drag mr-1"></div>
                <span className="grow">{org.name}</span>
                <button
                  onClick={() => toggleStar(org, true)}
                  className="text-yellow-500 hover:text-yellow-600"
                >
                  <div className="i-lucide:star-off text-lg" />
                </button>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        <h3 className="mb-2 text-center text-lg font-semibold text-base-11">
          Other Organizations
        </h3>
        <div className="flex h-9 w-full rounded-md rounded-b-none border border-base bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-primaryA-8">
          <input
            type="text"
            placeholder="Filter organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-0 border-none border-transparent bg-transparent outline-none placeholder:text-base-8"
          />
        </div>
        <ScrollArea className="h-[300px] rounded-md rounded-b rounded-t-none border border-base-5 px-1 md:h-[60vh]">
          {filteredUnstarredOrgs.map((org) => (
            <div
              key={"unstarred-" + org.name}
              className="my-1 flex items-center justify-between rounded bg-base-4 p-2"
            >
              <span>{org.name}</span>
              <button
                onClick={() => toggleStar(org)}
                className="text-gray-500 hover:text-gray-600"
              >
                <div className="i-lucide:star text-lg" />
              </button>
            </div>
          ))}{" "}
        </ScrollArea>
      </div>
    </div>
  );
};

export function SortableItem({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: id,
      strategy: verticalListSortingStrategy,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
