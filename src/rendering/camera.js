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
