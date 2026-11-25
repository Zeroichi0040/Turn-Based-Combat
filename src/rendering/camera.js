import {TILE_SIZE} from '../content/definitions.js';
export const MIN_ZOOM=.5, MAX_ZOOM=4;
export function createCamera(){return {x:0,y:0,zoom:2};}
export function worldToScreen(camera,x,y){return {x:x*camera.zoom+camera.x,y:y*camera.zoom+camera.y};}
export function screenToWorld(camera,x,y){return {x:(x-camera.x)/camera.zoom,y:(y-camera.y)/camera.zoom};}
export function screenToTile(camera,x,y){const p=screenToWorld(camera,x,y);return {x:Math.floor(p.x/TILE_SIZE),y:Math.floor(p.y/TILE_SIZE)};}
export function zoomAt(camera,x,y,factor){
  const world=screenToWorld(camera,x,y);
  const zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,camera.zoom*factor));
  return {zoom,x:x-world.x*zoom,y:y-world.y*zoom};
}
export function centerCamera(width,height,tiles=10){
  const zoom=Math.max(MIN_ZOOM,Math.min(2,Math.floor(Math.min(width,height)*.8/(tiles*TILE_SIZE)*4)/4));
  return {zoom,x:(width-tiles*TILE_SIZE*zoom)/2,y:(height-tiles*TILE_SIZE*zoom)/2};
}

/** Keep the view within the terrain envelope while allowing edge expansion.
 * On a small map the entire envelope may fit; then center that axis.
 * Padding is in world tiles, not screen pixels.
 */
export const CAMERA_PADDING_TILES = 3;
export function clampCamera(camera,width,height,bounds,paddingTiles=CAMERA_PADDING_TILES) {
  if (!bounds) return camera;
  const scale=TILE_SIZE*camera.zoom;
  function axis(offset,viewport,min,max) {
    const start=(min-paddingTiles)*scale;
    const end=(max+1+paddingTiles)*scale;
    if (end-start<=viewport) return (viewport-start-end)/2;
    return Math.max(viewport-end,Math.min(-start,offset));
  }
  return {...camera,x:axis(camera.x,width,bounds.minX,bounds.maxX),
    y:axis(camera.y,height,bounds.minY,bounds.maxY)};
}

/** Center a map of any rectangular bounds, including negative coordinates. */
export function centerCameraOnBounds(width,height,bounds) {
  if (!bounds) return centerCamera(width,height);
  const cols=bounds.maxX-bounds.minX+1,rows=bounds.maxY-bounds.minY+1;
  const zoom=Math.max(MIN_ZOOM,Math.min(2,Math.floor(Math.min(width/(cols*TILE_SIZE),height/(rows*TILE_SIZE))*.8*4)/4));
  return {zoom,x:width/2-(bounds.minX+cols/2)*TILE_SIZE*zoom,
    y:height/2-(bounds.minY+rows/2)*TILE_SIZE*zoom};
}
