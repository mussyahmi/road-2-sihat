import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  setDoc,
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

export async function getGoal(userId: string): Promise<string> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data()?.goal ?? "") : "";
}

export async function saveGoal(userId: string, goal: string): Promise<void> {
  const ref = doc(db, "users", userId);
  await setDoc(ref, { goal }, { merge: true });
}

export interface InsightCache {
  latestId: string;
  goal: string;
  insight: string;
}

export async function getInsightCache(userId: string): Promise<InsightCache | null> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const cache = snap.data()?.insightCache;
  return cache ?? null;
}

export async function saveInsightCache(userId: string, cache: InsightCache): Promise<void> {
  const ref = doc(db, "users", userId);
  await setDoc(ref, { insightCache: cache }, { merge: true });
}
