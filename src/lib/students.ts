import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student } from "@/types";

export async function getStudents(schoolId: string): Promise<Student[]> {
  const q = query(
    collection(db, "schools", schoolId, "students"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate?.() ?? new Date(),
    } as unknown as Student;
  });
}

export async function addStudent(
  schoolId: string,
  input: Omit<Student, "id" | "createdAt" | "schoolId">
) {
  await addDoc(collection(db, "schools", schoolId, "students"), {
    ...input,
    schoolId,
    createdAt: serverTimestamp(),
  });
}

export async function updateStudent(
  schoolId: string,
  studentId: string,
  input: Partial<Omit<Student, "id" | "createdAt" | "schoolId">>
) {
  await updateDoc(doc(db, "schools", schoolId, "students", studentId), input);
}

export async function deleteStudent(schoolId: string, studentId: string) {
  await deleteDoc(doc(db, "schools", schoolId, "students", studentId));
}