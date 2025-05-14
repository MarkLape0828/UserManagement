
'use server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, where, getDoc, Timestamp } from 'firebase/firestore';
import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';

const DEPARTMENTS_COLLECTION = 'departments';

function ensureDbInitialized() {
  if (!db) {
    console.error("FATAL: Firestore DB is not initialized in departmentService. Throwing error.");
    throw new Error("Database service is not available. Firebase initialization may have failed. Check server logs.");
  }
}

function mapFirestoreDocToDepartment(docSnap: any): Department {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // Ensure timestamps are handled if your schema expects specific types (e.g., JS Date)
    // For now, assuming direct spread is okay or further transformation happens in actions/components
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
  } as Department;
}


export async function getAllDepartments(): Promise<Department[]> {
  ensureDbInitialized();
  try {
    const departmentsRef = collection(db!, DEPARTMENTS_COLLECTION);
    const querySnapshot = await getDocs(departmentsRef);
    const departmentsList: Department[] = [];
    querySnapshot.forEach((docSnap) => {
      departmentsList.push(mapFirestoreDocToDepartment(docSnap));
    });
    return departmentsList;
  } catch (error) {
    console.error("Error fetching all departments from Firestore:", error);
    throw error; // Re-throw to be caught by server action
  }
}

export async function createDepartment(data: AddDepartmentFormData): Promise<Department | null> {
  ensureDbInitialized();
  try {
    const departmentsRef = collection(db!, DEPARTMENTS_COLLECTION);
    const q = query(departmentsRef, where('nameLower', '==', data.name.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return null; 
    }

    const newDepartmentData = {
      ...data,
      nameLower: data.name.toLowerCase(),
      status: 'active', 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db!, DEPARTMENTS_COLLECTION), newDepartmentData);
    
    const newDocSnap = await getDoc(docRef);
    if (newDocSnap.exists()) {
        return mapFirestoreDocToDepartment(newDocSnap);
    }
    return null;

  } catch (error) {
    console.error("Error creating department in Firestore:", error);
    throw error; 
  }
}

export async function updateExistingDepartment(departmentId: string, data: EditDepartmentFormData): Promise<Department | null> {
  ensureDbInitialized();
  try {
    const departmentDocRef = doc(db!, DEPARTMENTS_COLLECTION, departmentId);
    
    if (data.name) {
        const currentDocSnap = await getDoc(departmentDocRef);
        if (currentDocSnap.exists() && currentDocSnap.data().name.toLowerCase() !== data.name.toLowerCase()) {
            const departmentsRef = collection(db!, DEPARTMENTS_COLLECTION);
            const q = query(departmentsRef, where('nameLower', '==', data.name.toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty && querySnapshot.docs.some(d => d.id !== departmentId)) {
                return null; 
            }
        }
    }

    const updateData: any = { ...data, updatedAt: serverTimestamp() };
    if(data.name) {
        updateData.nameLower = data.name.toLowerCase();
    }

    await updateDoc(departmentDocRef, updateData);
    
    const updatedDocSnap = await getDoc(departmentDocRef);
    if (updatedDocSnap.exists()) {
        return mapFirestoreDocToDepartment(updatedDocSnap);
    }
    return null;
  } catch (error) {
    console.error("Error updating department in Firestore:", error);
    throw error; 
  }
}

export async function getDepartmentById(departmentId: string): Promise<Department | null> {
  ensureDbInitialized();
  try {
    const deptDocRef = doc(db!, DEPARTMENTS_COLLECTION, departmentId);
    const docSnap = await getDoc(deptDocRef);
    if (docSnap.exists()) {
      return mapFirestoreDocToDepartment(docSnap);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching department by ID ${departmentId} from Firestore:`, error);
    throw error;
  }
}
