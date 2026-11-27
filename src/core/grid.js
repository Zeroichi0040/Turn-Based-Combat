/** @typedef {{x:number,y:number}} Point */
/** @param {number} x @param {number} y */
export function key(x,y) { return x + ',' + y; }
/** @param {string} value @returns {Point} */
export function point(value) { const [x,y]=value.split(',').map(Number); return {x,y}; }
export function cardinal(x,y) { return [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]; }
export function newTerrain(size=10) {
  if (!Number.isSafeInteger(size)||size<1) throw new RangeError('Invalid terrain size');
  const grass=new Set();
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) grass.add(key(x,y));
  return grass;
}
export function canAddGrass(grass,x,y) {
  return Number.isSafeInteger(x)&&Number.isSafeInteger(y)&&!grass.has(key(x,y))&&cardinal(x,y).some(([a,b])=>grass.has(key(a,b)));
}
export function canRemoveGrass(grass,x,y) {
  const removed=key(x,y);
  if(!grass.has(removed)||grass.size<=1) return false;
  // On a connected map, every surviving component contains a former neighbor.
  // Stop as soon as all of those neighbors can reach one another.
  const neighbors=cardinal(x,y).map(([a,b])=>key(a,b)).filter(k=>grass.has(k));
  if(neighbors.length<=1)return neighbors.length===1;
  const start=neighbors[0],pending=new Set(neighbors.slice(1)),seen=new Set([start]),queue=[start];
  for(let i=0;i<queue.length&&pending.size;i++){
    const p=point(queue[i]);
    for(const [a,b] of cardinal(p.x,p.y)){
      const k=key(a,b);
      if(k!==removed&&!seen.has(k)&&grass.has(k)){seen.add(k);queue.push(k);pending.delete(k);}
    }
  }
  return pending.size===0;
}

/** Inclusive tile bounds; derive again after terrain edits. */
export function terrainBounds(grass) {
  if (!grass.size) return null;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for (const k of grass) {
    const {x,y}=point(k);
    minX=Math.min(minX,x); minY=Math.min(minY,y);
    maxX=Math.max(maxX,x); maxY=Math.max(maxY,y);
  }
  return {minX,minY,maxX,maxY};
}
