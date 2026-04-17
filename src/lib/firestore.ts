import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Measurement } from "./types";

const measurementsRef = (userId: string) =>
  collection(db, "users", userId, "measurements");

export async function addMeasurement(
  userId: string,
  data: Omit<Measurement, "id">
): Promise<string> {
  const docRef = await addDoc(measurementsRef(userId), {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getMeasurements(userId: string): Promise<Measurement[]> {
  const q = query(measurementsRef(userId), orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Measurement, "id">) }));
}

export async function updateMeasurement(
  userId: string,
  measurementId: string,
  data: Partial<Measurement>
): Promise<void> {
  const ref = doc(db, "users", userId, "measurements", measurementId);
  await updateDoc(ref, data);
}

export async function deleteMeasurement(
  userId: string,
  measurementId: string
): Promise<void> {
  const ref = doc(db, "users", userId, "measurements", measurementId);
  await deleteDoc(ref);
}
