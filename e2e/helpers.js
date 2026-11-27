/** Independent reset-camera geometry from the approved 80%-fit rule. */
export function resetGeometry(width,height,{minX,minY,maxX,maxY}){
 const tilesWide=maxX-minX+1,tilesHigh=maxY-minY+1;
 const scale=Math.min(width/tilesWide,height/tilesHigh)*.8/32;
 const zoom=Math.max(.5,Math.min(2,Math.floor(scale*4)/4));
 return {x:(width-(minX+maxX+1)*32*zoom)/2,y:(height-(minY+maxY+1)*32*zoom)/2,zoom};
}
export async function settleFrame(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
export function readSavedMaps(page){
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const req=indexedDB.open('turn-based-combat',1);
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{const db=req.result,tx=db.transaction('maps','readonly'),get=tx.objectStore('maps').getAll();
    get.onerror=()=>reject(get.error);get.onsuccess=()=>resolve(get.result);tx.oncomplete=()=>db.close();};
 }));
}
