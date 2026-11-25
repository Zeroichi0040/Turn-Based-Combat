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
  const start=cardinal(x,y).map(([a,b])=>key(a,b)).find(k=>grass.has(k));
  if(!start) return false;
  const seen=new Set([start]), queue=[start];
  for(let i=0;i<queue.length;i++){
    const p=point(queue[i]);
    for(const [a,b] of cardinal(p.x,p.y)){
      const k=key(a,b);
      if(k!==removed&&grass.has(k)&&!seen.has(k)){seen.add(k);queue.push(k);}
    }
  }
  return seen.size===grass.size-1;
}
