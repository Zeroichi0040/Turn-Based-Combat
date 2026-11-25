import {key,point} from '../core/grid.js';
import {TILE_SIZE} from '../content/definitions.js';

/** Iterate the cheaper of sparse terrain or viewport cells.
 * Never allocate the world bounds; only yield tiles intersecting the viewport.
 */
export function* visibleTerrain(grass,camera,width,height){
  if(!grass.size||width<=0||height<=0||!Number.isFinite(camera.zoom)||camera.zoom<=0)return;
  const size=TILE_SIZE*camera.zoom;
  const minX=Math.floor(-camera.x/size),minY=Math.floor(-camera.y/size);
  const maxX=Math.ceil((width-camera.x)/size)-1,maxY=Math.ceil((height-camera.y)/size)-1;
  const cols=maxX-minX+1,rows=maxY-minY+1;
  if([minX,minY,maxX,maxY].every(Number.isSafeInteger)&&cols>0&&rows>0&&cols*rows<grass.size){
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)
      if(grass.has(key(x,y)))yield {x,y};
    return;
  }
  for(const k of grass){
    const {x,y}=point(k);
    if(x>=minX&&x<=maxX&&y>=minY&&y<=maxY)yield {x,y};
  }
}
