import type { CalculatorProject } from './projectSchema'

const DATABASE_NAME = 'wuwa-damage-calculator'
const DATABASE_VERSION = 1
const STORE_NAME = 'projects'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function listProjects(): Promise<CalculatorProject[]> {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readonly')
  const projects = await requestResult(transaction.objectStore(STORE_NAME).getAll())
  database.close()
  return (projects as CalculatorProject[]).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
}

export async function readProject(id: string): Promise<CalculatorProject | undefined> {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readonly')
  const project = await requestResult(transaction.objectStore(STORE_NAME).get(id))
  database.close()
  return project as CalculatorProject | undefined
}

export async function writeProject(project: CalculatorProject): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  await requestResult(transaction.objectStore(STORE_NAME).put(project))
  database.close()
}

export async function deleteProject(id: string): Promise<void> {
  const database = await openDatabase()
  const transaction = database.transaction(STORE_NAME, 'readwrite')
  await requestResult(transaction.objectStore(STORE_NAME).delete(id))
  database.close()
}
