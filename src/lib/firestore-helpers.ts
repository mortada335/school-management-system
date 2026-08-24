import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getCountFromServer,
  writeBatch,
  startAfter,
  limit,
  onSnapshot,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

export type { QueryConstraint };

import { db } from "@/lib/firebase";

// ─── Scoped collection reference ────────────────────────────────────────────
/** Returns a CollectionReference scoped to the school's subcollection. */
export const schoolCol = (schoolId: string, colName: string) =>
  collection(db, "schools", schoolId, colName);

/** Returns a DocumentReference inside a school's subcollection. */
export const schoolDoc = (schoolId: string, colName: string, docId: string) =>
  doc(db, "schools", schoolId, colName, docId);

// ─── Generic CRUD ────────────────────────────────────────────────────────────

/** Fetch all documents from a school subcollection with optional constraints. */
export async function fetchCollection<T>(
  schoolId: string,
  colName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(schoolCol(schoolId, colName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

/** Fetch documents with cursor-based pagination. */
export async function fetchCollectionPaginated<T>(
  schoolId: string,
  colName: string,
  constraints: QueryConstraint[] = [],
  pageSize: number = 20,
  lastDoc: QueryDocumentSnapshot<DocumentData, DocumentData> | null = null
): Promise<{ data: T[]; lastDoc: QueryDocumentSnapshot<DocumentData, DocumentData> | null; hasMore: boolean }> {
  const queryConstraints = [...constraints, limit(pageSize)];
  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc));
  }
  const q = query(schoolCol(schoolId, colName), ...queryConstraints);
  const snap = await getDocs(q);
  
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  const hasMore = snap.docs.length === pageSize;

  return { data, lastDoc: newLastDoc, hasMore };
}

/** Subscribe to a collection in real-time. */
export function subscribeCollection<T>(
  schoolId: string,
  colName: string,
  constraints: QueryConstraint[] = [],
  onData: (data: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(schoolCol(schoolId, colName), ...constraints);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))),
    (error) => {
      console.error(`Error subscribing to ${colName}:`, error);
      if (onError) onError(error);
    }
  );
}

/** Subscribe to a single document in real-time. */
export function subscribeDocument<T>(
  schoolId: string,
  colName: string,
  docId: string,
  onData: (data: T | null) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    schoolDoc(schoolId, colName, docId),
    (snap) => {
      if (!snap.exists()) onData(null);
      else onData({ id: snap.id, ...snap.data() } as T);
    },
    (error) => {
      console.error(`Error subscribing to ${colName}/${docId}:`, error);
      if (onError) onError(error);
    }
  );
}

/** Fetch a single document by ID from a school subcollection. */
export async function getDocument<T>(
  schoolId: string,
  colName: string,
  docId: string
): Promise<T | null> {
  const snap = await getDoc(schoolDoc(schoolId, colName, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as T;
}

/** Add a document to a school subcollection (auto-generates ID). */
export async function addDocument(
  schoolId: string,
  colName: string,
  data: Record<string, unknown>
): Promise<string> {
  const ref = await addDoc(schoolCol(schoolId, colName), {
    ...data,
    schoolId,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Set a document at a known ID (upsert). */
export async function setDocument(
  schoolId: string,
  colName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  await setDoc(schoolDoc(schoolId, colName, docId), {
    ...data,
    schoolId,
    createdAt: serverTimestamp(),
  });
}

/** Update specific fields on an existing document. */
export async function updateDocument(
  schoolId: string,
  colName: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  await updateDoc(schoolDoc(schoolId, colName, docId), data);
}

/** Delete a document from a school subcollection. */
export async function deleteDocument(
  schoolId: string,
  colName: string,
  docId: string
): Promise<void> {
  await deleteDoc(schoolDoc(schoolId, colName, docId));
}

/** Count documents in a school subcollection. */
export async function countDocuments(
  schoolId: string,
  colName: string,
  constraints: QueryConstraint[] = []
): Promise<number> {
  const q = query(schoolCol(schoolId, colName), ...constraints);
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

// ─── Batch helpers ───────────────────────────────────────────────────────────

/** Write multiple attendance records in a single Firestore batch. */
export async function batchSetDocuments(
  schoolId: string,
  colName: string,
  records: Array<{ id: string; data: Record<string, unknown> }>
): Promise<void> {
  const batch = writeBatch(db);
  for (const { id, data } of records) {
    const ref = schoolDoc(schoolId, colName, id);
    batch.set(ref, { ...data, schoolId }, { merge: true });
  }
  await batch.commit();
}

// ─── Convenience query builders ──────────────────────────────────────────────

export { where, orderBy, limit, startAfter, serverTimestamp, query };

// ─── IQD Formatter ───────────────────────────────────────────────────────────

/** Format an IQD amount as a localized string: 1250000 → "1,250,000 د.ع" */
export function formatIQD(amount: number): string {
  return `${amount.toLocaleString("ar-IQ")} د.ع`;
}
