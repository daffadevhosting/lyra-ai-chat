import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
const db = getFirestore();

const intentCol = collection(db, 'intents');

export async function addIntent(trigger, response, mode) {
  return await addDoc(intentCol, { trigger, response, mode });
}

export async function fetchAllIntents() {
  const snap = await getDocs(intentCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteIntent(id) {
  return await deleteDoc(doc(db, 'intents', id));
}
