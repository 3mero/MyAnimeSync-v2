// A simple key-value store using IndexedDB
// Based on the 'idb-keyval' library by Jake Archibald

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createStore(dbName: string, storeName: string): (txMode: IDBTransactionMode, callback: (store: IDBObjectStore) => void) => Promise<void> {
  const request = indexedDB.open(dbName, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(storeName);
  const dbp = promisifyRequest(request);

  return (txMode, callback) => dbp.then(db => {
    const tx = db.transaction(storeName, txMode);
    callback(tx.objectStore(storeName));
    return promisifyRequest(tx as any); // Type assertion to handle transaction completion
  });
}

let defaultGetStore: ReturnType<typeof createStore>;
function getStore() {
  if (!defaultGetStore) {
    defaultGetStore = createStore('animesync-db', 'keyval');
  }
  return defaultGetStore;
}

export function get<T>(key: IDBValidKey): Promise<T | undefined> {
  let req: IDBRequest;
  return getStore()('readonly', store => {
    req = store.get(key);
  }).then(() => req.result);
}

export function set(key: IDBValidKey, value: any): Promise<void> {
  return getStore()('readwrite', store => {
    store.put(value, key);
  });
}

export function del(key: IDBValidKey): Promise<void> {
  return getStore()('readwrite', store => {
    store.delete(key);
  });
}

export function clear(): Promise<void> {
  return getStore()('readwrite', store => {
    store.clear();
  });
}

export function keys(): Promise<IDBValidKey[]> {
  const keys: IDBValidKey[] = [];
  return getStore()('readonly', store => {
    // This would be more efficient with openKeyCursor, but this is fine for now
    (store.openCursor || store.openKeyCursor).call(store).onsuccess = function () {
      if (!this.result) return;
      keys.push(this.result.key);
      this.result.continue();
    };
  }).then(() => keys);
}
