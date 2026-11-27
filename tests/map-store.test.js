import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {openDatabase,transaction,request} from '../src/storage/database.js';
import {createMapStore,hydrateMap,serializeMap,STORAGE_KEY,MapConflict} from '../src/storage/map-store.js';
import {applyEdit} from '../src/editor/map.js';
function fixture(raw=null){
 const factory=new IDBFactory();let id=0;
 const storage={getItem:k=>k===STORAGE_KEY?raw:null};
 const open=()=>createMapStore(storage,{factory,makeId:()=>String(++id)});
 return {store:open(),open,storage,factory};
}
const unit={mode:'place',category:'units',id:'swordsman'};
test('default names, independent maps and persistent rename/delete',async()=>{
 const {store,open}=fixture(),a=await store.create(' '),b=await store.create('');
 assert.equal(a.name,'New Map 1');assert.equal(b.name,'New Map 2');
 assert.equal(a.grass.length,100);assert.equal(a.occupants.length,0);
 const renamed=await store.rename(a.id,' New ',a.revision);
 assert.equal(renamed.name,'New');assert.deepEqual(renamed.grass,a.grass);
 await store.remove(b.id,b.revision);assert.equal((await open().list()).length,1);
 assert.equal((await store.create('')).name,'New Map 1');
});
test('negative terrain, occupants and independent working copies persist',async()=>{
 const {store,open}=fixture(),a=await store.create('Map'),m=hydrateMap(a);
 applyEdit(m,{mode:'place',category:'tiles',id:'grass'},-1,0);applyEdit(m,unit,-1,0);
 assert.equal((await store.get(a.id)).grass.length,100);
 const saved=await store.save(a.id,m,a.revision);
 const loaded=hydrateMap(await open().get(a.id));
 assert.deepEqual(serializeMap(loaded),serializeMap(m));assert.equal(loaded.bounds.minX,-1);assert.equal(saved.revision,2);
});
test('parallel saves of different maps do not overwrite each other',async()=>{
 const {store,open}=fixture(),other=open(),a=await store.create('A'),b=await store.create('B');
 const ma=hydrateMap(a),mb=hydrateMap(b);applyEdit(ma,unit,0,0);applyEdit(mb,unit,1,1);
 await Promise.all([store.save(a.id,ma,a.revision),other.save(b.id,mb,b.revision)]);
 assert.equal((await store.get(a.id)).occupants.length,1);assert.equal((await store.get(b.id)).occupants.length,1);
});
test('parallel writes to same record reject stale revision; copy preserves loser',async()=>{
 const {store,open}=fixture(),other=open(),a=await store.create('A');
 const ma=hydrateMap(a),mb=hydrateMap(a);applyEdit(ma,unit,0,0);applyEdit(mb,unit,1,1);
 const results=await Promise.allSettled([store.save(a.id,ma,a.revision),other.save(a.id,mb,a.revision)]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 assert.ok(results.find(x=>x.status==='rejected').reason instanceof MapConflict);
 const lost=results[0].status==='rejected'?ma:mb;
 const copy=await store.copy('A copy',lost);assert.deepEqual(copy.occupants,serializeMap(lost).occupants);
 assert.equal((await store.list()).length,2);
});
test('deleted or renamed original cannot be overwritten by stale editor',async()=>{
 const {store}=fixture(),a=await store.create('A'),m=hydrateMap(a);
 const renamed=await store.rename(a.id,'B',a.revision);
 await assert.rejects(store.save(a.id,m,a.revision),MapConflict);
 await store.remove(a.id,renamed.revision);
 await assert.rejects(store.save(a.id,m,renamed.revision),MapConflict);
 assert.equal((await store.copy('Recovered',m)).grass.length,100);
});
test('legacy migration isolates corrupt records, retains backup and imports once across tabs',async()=>{
 const good={id:'good',name:'Good',grass:['0,0'],occupants:[]};
 const raw=JSON.stringify({version:1,maps:[good,{id:'bad',name:'Bad',grass:['0,0','2,0'],occupants:[]},good]});
 const {store,open,storage}=fixture(raw);
 const [a,b]=await Promise.all([store.list(),open().list()]);
 assert.equal(a.length,3);assert.deepEqual(a,b);assert.equal(a.filter(x=>x.corrupt).length,2);
 assert.equal((await store.get('good')).name,'Good');assert.equal(storage.getItem(STORAGE_KEY),raw);
 const corrupt=a.find(x=>x.corrupt);assert.ok((await store.exportRecord(corrupt.id)).raw);
 await store.remove(corrupt.id);assert.equal((await open().list()).length,2);
});
test('malformed legacy data fails closed and remains exportable',async()=>{
 for(const raw of ['not json','{"version":99,"maps":[]}']){
  const {store}=fixture(raw);await assert.rejects(store.list());assert.equal(store.legacyBackup(),raw);
 }
});
test('invalid terrain, coordinates and occupants remain rejected',async()=>{
 const {store}=fixture(),a=await store.create('A');
 for(const grass of [[],['0,0','2,0'],['0,0','0,0'],['01,0'],['9007199254740992,0']])assert.throws(()=>hydrateMap({...a,grass}));
 const u={x:0,y:0,category:'units',id:'swordsman'};
 for(const occupants of [[u,u],[{...u,x:-1}],[{...u,id:'toString'}],[{...u,category:'tiles',id:'grass'}]])assert.throws(()=>hydrateMap({...a,occupants}));
});

test('transaction abort rolls back both map and metadata changes',async()=>{
 const {store,factory}=fixture(),a=await store.create('A'),db=await openDatabase(factory);
 await assert.rejects(transaction(db,['maps','catalog'],'readwrite',async({maps,catalog})=>{
  await request(maps.put({...a,name:'Uncommitted'}));
  await request(catalog.put({id:a.id,name:'Uncommitted'}));
  throw Error('Simulated failure before commit');
 }),/Simulated failure/);
 assert.equal((await store.get(a.id)).name,'A');assert.equal((await store.list())[0].name,'A');db.close();
});
test('a damaged stored record is isolated on load and can still be exported',async()=>{
 const {store,factory}=fixture(),a=await store.create('A'),b=await store.create('B'),db=await openDatabase(factory);
 await transaction(db,['maps'],'readwrite',async({maps})=>request(maps.put({...b,grass:['0,0','2,0']})));
 await assert.rejects(store.load(b.id),/disconnected/);
 assert.equal((await store.list()).find(row=>row.id===b.id).corrupt,true);
 assert.equal((await store.get(a.id)).name,'A');
 assert.deepEqual((await store.exportRecord(b.id)).grass,['0,0','2,0']);db.close();
});
test('creation order survives migration and later inserts',async()=>{
 const raw=JSON.stringify({version:1,maps:[{id:'z',name:'First',grass:['0,0'],occupants:[]},{id:'a',name:'Second',grass:['0,0'],occupants:[]}]});
 const {store}=fixture(raw);await store.create('Third');
 assert.deepEqual((await store.list()).map(row=>row.name),['First','Second','Third']);
});
