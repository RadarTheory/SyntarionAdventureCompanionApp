// IndexedDB can store embedded GLB assets without localStorage's small string quota.
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('astragal-dice-workshop', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('finishes');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadFinishes() {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('finishes', 'readonly').objectStore('finishes').get('published');
      request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
export async function saveFinishes(finishes) {
  const db = await database();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('finishes', 'readwrite');
      transaction.objectStore('finishes').put(finishes, 'published');
      transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
