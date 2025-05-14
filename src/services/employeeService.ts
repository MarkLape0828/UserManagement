
'use server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, getDoc, query, where, Timestamp } from 'firebase/firestore';
import type { Employee, AuditLogEntry, AddEmployeeFormData, EditEmployeeFormData } from '@/lib/schemas';

const EMPLOYEES_COLLECTION = 'employees';
const AUDIT_LOG_COLLECTION = 'auditLog'; // Could be a subcollection under employees

function mapFirestoreDocToEmployee(docSnap: any): Employee {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    // Convert Firestore Timestamp to JavaScript Date for hireDate
    hireDate: data.hireDate instanceof Timestamp ? data.hireDate.toDate() : new Date(data.hireDate),
    // Ensure other fields conform to Employee schema if necessary
  } as Employee;
}

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const employeesRef = collection(db, EMPLOYEES_COLLECTION);
    const querySnapshot = await getDocs(employeesRef);
    const employeesList: Employee[] = [];
    querySnapshot.forEach((docSnap) => {
      employeesList.push(mapFirestoreDocToEmployee(docSnap));
    });
    return employeesList;
  } catch (error) {
    console.error("Error fetching all employees:", error);
    return [];
  }
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  try {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const docSnap = await getDoc(employeeDocRef);
    if (docSnap.exists()) {
      return mapFirestoreDocToEmployee(docSnap);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching employee by ID ${employeeId}:`, error);
    return null;
  }
}

export async function createEmployee(data: AddEmployeeFormData, employeeId: string): Promise<Employee | null> {
  try {
    // Check if a user ID is already associated with an employee
    const employeesRef = collection(db, EMPLOYEES_COLLECTION);
    const q = query(employeesRef, where('userId', '==', data.userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return null; // User is already an employee
    }

    const newEmployeeData = {
      ...data,
      id: employeeId, // Using the pre-generated ID
      hireDate: Timestamp.fromDate(new Date(data.hireDate)), // Convert JS Date to Firestore Timestamp
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // Since we are providing our own ID, we use setDoc
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    await setDoc(employeeDocRef, newEmployeeData);
    
    const newDocSnap = await getDoc(employeeDocRef);
     if (newDocSnap.exists()) {
        return mapFirestoreDocToEmployee(newDocSnap);
    }
    return null; // Should not happen if setDoc was successful

  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
}

export async function updateExistingEmployee(employeeId: string, data: EditEmployeeFormData): Promise<Employee | null> {
  try {
    const employeeDocRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const updateData = {
      ...data,
      hireDate: Timestamp.fromDate(new Date(data.hireDate)), // Convert JS Date to Firestore Timestamp
      updatedAt: serverTimestamp(),
    };
    await updateDoc(employeeDocRef, updateData);
    
    const updatedDocSnap = await getDoc(employeeDocRef);
     if (updatedDocSnap.exists()) {
        return mapFirestoreDocToEmployee(updatedDocSnap);
    }
    return null;

  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
}

// --- Audit Log Service Functions (Basic Implementation) ---
export async function createAuditLogEntry(
  employeeId: string, 
  action: string, 
  details: string, 
  changedByUserId: string
): Promise<AuditLogEntry | null> {
  try {
    const logData = {
      employeeId,
      action,
      details,
      changedByUserId,
      timestamp: serverTimestamp(), // Firestore server timestamp
    };
    const docRef = await addDoc(collection(db, AUDIT_LOG_COLLECTION), logData);
    
    // Fetch the created log to include ID and timestamp
    const newLogSnap = await getDoc(docRef);
    if (newLogSnap.exists()) {
        const createdLog = newLogSnap.data();
        return { 
            id: newLogSnap.id, 
            ...createdLog,
            timestamp: createdLog.timestamp instanceof Timestamp ? createdLog.timestamp.toDate().toISOString() : new Date(createdLog.timestamp).toISOString()
        } as AuditLogEntry;
    }
    return null;
  } catch (error) {
    console.error("Error creating audit log entry:", error);
    return null; // Or throw error
  }
}

export async function getAuditLogsForEmployee(employeeId: string): Promise<AuditLogEntry[]> {
    try {
        const logsRef = collection(db, AUDIT_LOG_COLLECTION);
        const q = query(logsRef, where('employeeId', '==', employeeId)); // Add orderBy('timestamp', 'desc') if needed
        const querySnapshot = await getDocs(q);
        const logs: AuditLogEntry[] = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            logs.push({
                id: docSnap.id,
                ...data,
                timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString(),
            } as AuditLogEntry);
        });
        return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort client-side if not by query
    } catch (error) {
        console.error(`Error fetching audit logs for employee ${employeeId}:`, error);
        return [];
    }
}
