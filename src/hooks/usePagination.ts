import { useState, useCallback } from "react";
import { type QueryDocumentSnapshot, type DocumentData } from "firebase/firestore";

export function usePagination() {
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const resetPagination = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    setPage(1);
  }, []);

  const nextPage = useCallback((newLastDoc: QueryDocumentSnapshot<DocumentData, DocumentData> | null, newHasMore: boolean) => {
    setLastDoc(newLastDoc);
    setHasMore(newHasMore);
    if (newHasMore) {
      setPage(p => p + 1);
    }
  }, []);

  return { lastDoc, hasMore, page, resetPagination, nextPage };
}
