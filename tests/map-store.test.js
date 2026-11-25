import test from 'node:test';
import assert from 'node:assert/strict';
import {createMapStore,hydrateMap,serializeMap,STORAGE_KEY} from '../src/storage/map-store.js';
import {applyEdit} from '../src/editor/map.js';
function fixture(){
  const data=new Map();let i=0;
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  return {storage,store:createMapStore(storage,{makeId:()=>String(++i)})};
}
test('blank names use next unused number and maps are distinct',()=>{
  const {store}=fixture();const a=store.create(' '),b=store.create('');
  assert.equal(a.name,'New Map 1');assert.equal(b.name,'New Map 2');assert.notEqual(a.id,b.id);
  assert.equal(a.grass.length,100);assert.equal(a.occupants.length,0);
  store.remove(a.id);assert.equal(store.create('').name,'New Map 1');
});
test('renaming preserves map data and blank rename is rejected',()=>{
  const {store}=fixture(),a=store.create('Old');store.rename(a.id,' New ');
  assert.equal(store.get(a.id).name,'New');assert.deepEqual(store.get(a.id).grass,a.grass);
  assert.throws(()=>store.rename(a.id,' '));assert.equal(store.get(a.id).name,'New');
});
test('save and reload preserve negative coordinates and occupants',()=>{
  const {store,storage}=fixture(),a=store.create('Map'),m=hydrateMap(a);
  applyEdit(m,{mode:'place',category:'tiles',id:'grass'},-1,0);
  applyEdit(m,{mode:'place',category:'units',id:'swordsman'},-1,0);
  store.save(a.id,m);
  const reopened=hydrateMap(createMapStore(storage).get(a.id));
  assert.deepEqual(serializeMap(reopened),serializeMap(m));assert.equal(reopened.revision,0);
  assert.equal(reopened.bounds.minX,-1);
});
test('working copy never mutates saved or other working copies',()=>{
  const {store}=fixture(),a=store.create('Map'),m=hydrateMap(store.get(a.id));
  applyEdit(m,{mode:'erase'},0,0);
  assert.equal(m.grass.size,99);assert.equal(hydrateMap(store.get(a.id)).grass.size,100);
  assert.equal(a.grass.length,100);
});
test('malformed and unsupported saves fail closed',()=>{
  const {store,storage}=fixture();
  for(const raw of ['not json','{"version":99,"maps":[]}','{"version":1,"maps":[{}]}']){
    storage.setItem(STORAGE_KEY,raw);assert.throws(()=>store.create('new'));assert.equal(storage.getItem(STORAGE_KEY),raw);
  }
});
test('reject disconnected grass, duplicates, unsafe coordinates and invalid occupants',()=>{
  const {store}=fixture(),a=store.create('Map');
  for(const grass of [[],['0,0','2,0'],['0,0','0,0'],['01,0'],['9007199254740992,0']])assert.throws(()=>hydrateMap({...a,grass}));
  const unit={x:0,y:0,category:'units',id:'swordsman'};
  for(const occupants of [[unit,unit],[{...unit,x:-1}],[{...unit,id:'toString'}],[{...unit,category:'tiles',id:'grass'}]])assert.throws(()=>hydrateMap({...a,occupants}));
});
test('failed write leaves previous saved map intact',()=>{
  const {store,storage}=fixture(),a=store.create('Map'),m=hydrateMap(a);
  applyEdit(m,{mode:'erase'},0,0);
  storage.setItem=()=>{throw Error('Quota exceeded');};
  assert.throws(()=>store.save(a.id,m),/Quota/);
  assert.equal(store.get(a.id).grass.length,100);
});

test('stale editors cannot overwrite a newer saved map; rename and other maps are preserved',()=>{
  const {store,storage}=fixture(),a=store.create('Map'),other=store.create('Other');
  const stale=hydrateMap(a),newer=hydrateMap(a);
  applyEdit(stale,{mode:'place',category:'units',id:'swordsman'},0,0);
  applyEdit(newer,{mode:'place',category:'buildings',id:'townHall'},1,1);
  store.rename(a.id,'Renamed');
  const updated=store.save(a.id,newer,a);
  assert.equal(updated.name,'Renamed');assert.equal(store.get(other.id).name,'Other');
  const raw=storage.getItem(STORAGE_KEY);
  assert.throws(()=>store.save(a.id,stale,a),/changed in another tab/);
  assert.equal(storage.getItem(STORAGE_KEY),raw);
  assert.equal(stale.occupants.size,1);
  const current=hydrateMap(updated);
  applyEdit(current,{mode:'place',category:'units',id:'swordsman'},2,2);
  assert.equal(store.save(a.id,current,updated).occupants.length,2);
});
