
'use server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, query, where, getDoc } from 'firebase/firestore';
import type { Department, AddDepartmentFormData, EditDepartmentFormData } from '@/lib/schemas';

const DEPARTMENTS_COLLECTION = 'departments';

export async function getAllDepartments(): Promise<Department[]> {
  try {
    const departmentsRef = collection(db, DEPARTMENTS_COLLECTION);
    const querySnapshot = await getDocs(departmentsRef);
    const departmentsList: Department[] = [];
    querySnapshot.forEach((doc) => {
      departmentsList.push({ id: doc.id, ...doc.data() } as Department);
    });
    return departmentsList;
  } catch (error) {
    console.error("Error fetching all departments:", error);
    return [];
  }
}

export async function createDepartment(data: AddDepartmentFormData): Promise<Department | null> {
  try {
    // Check for existing department with the same name (case-insensitive)
    const departmentsRef = collection(db, DEPARTMENTS_COLLECTION);
    const q = query(departmentsRef, where('nameLower', '==', data.name.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Department with this name already exists
      return null; 
    }

    const newDepartmentData = {
      ...data,
      nameLower: data.name.toLowerCase(), // For case-insensitive checks
      status: 'active', // Default status
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, DEPARTMENTS_COLLECTION), newDepartmentData);
    
    // Fetch the created document to include the ID and server-generated timestamps
    const newDocSnap = await getDoc(docRef);
    if (newDocSnap.exists()) {
        const createdDept = newDocSnap.data();
        // Convert Firestore Timestamps to serializable format (e.g., ISO string or JS Date) if needed by schema
        // For now, assuming schema can handle it or client will format.
        // If schema expects JS Date, you'd do:
        // hireDate: createdDept.hireDate.toDate()
        return { id: newDocSnap.id, ...createdDept } as Department;
    }
    return null;

  } catch (error) {
    console.error("Error creating department:", error);
    throw error; // Re-throw to be caught by server action
  }
}

export async function updateExistingDepartment(departmentId: string, data: EditDepartmentFormData): Promise<Department | null> {
  try {
    const departmentDocRef = doc(db, DEPARTMENTS_COLLECTION, departmentId);
    
    // If name is being changed, check for uniqueness
    if (data.name) {
        const currentDocSnap = await getDoc(departmentDocRef);
        if (currentDocSnap.exists() && currentDocSnap.data().name.toLowerCase() !== data.name.toLowerCase()) {
            const departmentsRef = collection(db, DEPARTMENTS_COLLECTION);
            const q = query(departmentsRef, where('nameLower', '==', data.name.toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty && querySnapshot.docs.some(d => d.id !== departmentId)) {
                // Another department with this new name already exists
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
        return { id: updatedDocSnap.id, ...updatedDocSnap.data() } as Department;
    }
    return null;
  } catch (error) {
    console.error("Error updating department:", error);
    throw error; // Re-throw
  }
}

export async function getDepartmentById(departmentId: string): Promise<Department | null> {
  try {
    const deptDocRef = doc(db, DEPARTMENTS_COLLECTION, departmentId);
    const docSnap = await getDoc(deptDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Department;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching department by ID ${departmentId}:`, error);
    return null;
  }
}
