export const DB_NAME='turn-based-combat';
export function request(req){
  return new Promise((resolve,reject)=>{
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
export function openDatabase(factory,name=DB_NAME){
  return new Promise((resolve,reject)=>{
    const req=factory.open(name,1);
    req.onupgradeneeded=()=>{
      for(const name of ['maps','catalog','settings'])req.result.createObjectStore(name,{keyPath:'id'});
    };
    req.onerror=()=>reject(req.error);
    req.onblocked=()=>reject(new Error('Close other game tabs to open map storage.'));
    req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db);};
  });
}
/** All operations within body must be IndexedDB requests (no unrelated async work). */
export async function transaction(db,names,mode,body){
  const tx=db.transaction(names,mode);
  const done=new Promise((resolve,reject)=>{
    tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error??new Error('Map transaction aborted.'));
    tx.onerror=()=>{};
  });
  // Attach a handler immediately, including while body awaits a request.
  done.catch(()=>{});
  try{
    const result=await body(Object.fromEntries(names.map(n=>[n,tx.objectStore(n)])));
    await done;return result;
  }catch(err){try{tx.abort();}catch{}await done.catch(()=>{});throw err;}
}
