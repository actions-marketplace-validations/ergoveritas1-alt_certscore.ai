"use client";
import { useLayoutEffect, useRef, useState } from "react";

export function tableRowViewportHeight({
  contentOffset,
  headerHeight,
  rowHeights,
  limit,
  minimumRows = 0,
}: {
  contentOffset: number;
  headerHeight: number;
  rowHeights: number[];
  limit: number;
  minimumRows?: number;
}) {
  const visibleRowHeights = rowHeights.slice(0, limit);
  const representativeRowHeight = Math.max(0, ...visibleRowHeights);
  const reservedRowCount = Math.max(0, minimumRows - visibleRowHeights.length);
  return contentOffset + headerHeight
    + visibleRowHeights.reduce((sum, height) => sum + height, 0)
    + reservedRowCount * representativeRowHeight
    + 2;
}

/** Measure actual rows so wrapping, zoom and expanded details keep scrolling bounded. */
export function useTableRowLimit(limit: number, minimumRows = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number>();
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const measure = () => {
      const table = [...root.querySelectorAll("table")].find(table =>
        table.offsetHeight > 0 && [...table.querySelectorAll<HTMLTableRowElement>(":scope > tbody > tr")].some(row => row.offsetHeight > 0));
      // An empty header must not clip the empty state or following disclosures.
      if (!table) { setMaxHeight(undefined); return; }
      const rows = [...table.querySelectorAll<HTMLTableRowElement>(":scope > tbody > tr")].filter(row => row.offsetHeight > 0 && !row.hasAttribute("data-expanded-details"));
      const header = table.querySelector(":scope > thead")?.getBoundingClientRect().height ?? 0;
      setMaxHeight(tableRowViewportHeight({
        contentOffset: table.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop,
        headerHeight: header,
        rowHeights: rows.map(row => row.getBoundingClientRect().height),
        limit,
        minimumRows,
      }));
    };
    const resize = new ResizeObserver(measure);
    const observe = () => {
      resize.disconnect();
      resize.observe(root);
      root.querySelectorAll("table, tr").forEach(row => resize.observe(row));
      measure();
    };
    const mutations = new MutationObserver(observe);
    mutations.observe(root, {childList:true, subtree:true, attributes:true, attributeFilter:["hidden", "class"]});
    observe();
    return () => { resize.disconnect(); mutations.disconnect(); };
  });
  return { ref, style: { maxHeight } };
}
