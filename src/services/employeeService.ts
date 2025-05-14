
'use server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp, getDoc, query, where, Timestamp, setDoc } from 'firebase/firestore';
import type { Employee, AuditLogEntry, AddEmployeeFormData, EditEmployeeFormData } from '@/lib/schemas';

const EMPLOYEES_COLLECTION = 'employees';
const AUDIT_LOG_COLLECTION = 'auditLog';

function ensureDbInitialized() {
  if (!db) {
    console.error("FATAL: Firestore DB is not initialized in employeeService. Throwing error.");
    throw new Error("Database service is not available. Firebase initialization may have failed. Check server logs.");
  }
}

function mapFirestoreDocToEmployee(docSnap: any): Employee {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    hireDate: data.hireDate instanceof Timestamp ? data.hireDate.toDate() : new Date(data.hireDate),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
  } as Employee;
}

export async function getAllEmployees(): Promise<Employee[]> {
  ensureDbInitialized();
  try {
    const employeesRef = collection(db!, EMPLOYEES_COLLECTION);
    const querySnapshot = await getDocs(employeesRef);
    const employeesList: Employee[] = [];
    querySnapshot.forEach((docSnap) => {
      employeesList.push(mapFirestoreDocToEmployee(docSnap));
    });
    return employeesList;
  } catch (error) {
    console.error("Error fetching all employees from Firestore:", error);
    throw error;
  }
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  ensureDbInitialized();
  try {
    const employeeDocRef = doc(db!, EMPLOYEES_COLLECTION, employeeId);
    const docSnap = await getDoc(employeeDocRef);
    if (docSnap.exists()) {
      return mapFirestoreDocToEmployee(docSnap);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching employee by ID ${employeeId} from Firestore:`, error);
    throw error;
  }
}

export async function createEmployee(data: AddEmployeeFormData): Promise<Employee | null> {
  ensureDbInitialized();
  try {
    const employeesRef = collection(db!, EMPLOYEES_COLLECTION);
    const q = query(employeesRef, where('userId', '==', data.userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      console.log(`Attempt to create employee for already linked userId: ${data.userId}`);
      return null; 
    }

    // Firestore will auto-generate an ID if we use addDoc
    const newEmployeeData = {
      ...data,
      hireDate: Timestamp.fromDate(new Date(data.hireDate)), 
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db!, EMPLOYEES_COLLECTION), newEmployeeData);
    
    const newDocSnap = await getDoc(docRef);
     if (newDocSnap.exists()) {
        return mapFirestoreDocToEmployee(newDocSnap);
    }
    return null; 

  } catch (error) {
    console.error("Error creating employee in Firestore:", error);
    throw error;
  }
}

export async function updateExistingEmployee(employeeId: string, data: EditEmployeeFormData): Promise<Employee | null> {
  ensureDbInitialized();
  try {
    const employeeDocRef = doc(db!, EMPLOYEES_COLLECTION, employeeId);
    const updateData = {
      ...data,
      hireDate: Timestamp.fromDate(new Date(data.hireDate)), 
      updatedAt: serverTimestamp(),
    };
    await updateDoc(employeeDocRef, updateData);
    
    const updatedDocSnap = await getDoc(employeeDocRef);
     if (updatedDocSnap.exists()) {
        return mapFirestoreDocToEmployee(updatedDocSnap);
    }
    return null;

  } catch (error) {
    console.error("Error updating employee in Firestore:", error);
    throw error;
  }
}

export async function createAuditLogEntry(
  employeeId: string, 
  action: string, 
  details: string, 
  changedByUserId: string
): Promise<AuditLogEntry | null> {
  ensureDbInitialized();
  try {
    const logData = {
      employeeId,
      action,
      details,
      changedByUserId,
      timestamp: serverTimestamp(), 
    };
    const docRef = await addDoc(collection(db!, AUDIT_LOG_COLLECTION), logData);
    
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
    console.error("Error creating audit log entry in Firestore:", error);
    throw error; 
  }
}

export async function getAuditLogsForEmployee(employeeId: string): Promise<AuditLogEntry[]> {
    ensureDbInitialized();
    try {
        const logsRef = collection(db!, AUDIT_LOG_COLLECTION);
        const q = query(logsRef, where('employeeId', '==', employeeId)); 
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
        return logs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
    } catch (error) {
        console.error(`Error fetching audit logs for employee ${employeeId} from Firestore:`, error);
        throw error;
    }
}
