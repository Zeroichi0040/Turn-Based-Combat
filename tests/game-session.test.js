import test from 'node:test';
import assert from 'node:assert/strict';
import {createEditorMap,applyEdit} from '../src/editor/map.js';
import {createSession,reachableCells,moveUnit,endTurn,entityAt,renderSession} from '../src/game/session.js';
import {selectTile,selectionOverlay} from '../src/game/selection.js';
const unit={mode:'place',category:'units',id:'swordsman'},building={mode:'place',category:'buildings',id:'barracks'};
function setup(x=4,y=4){const map=createEditorMap();applyEdit(map,unit,x,y);const session=createSession(map);return {map,session,id:entityAt(session,x,y).entity.id};}
test('swordsman can move two cardinal steps including one diagonal offset',()=>{
 const {session,id}=setup(),r=reachableCells(session,id);
 assert.equal(r.size,12);assert.ok(r.has('6,4'));assert.ok(r.has('5,5'));assert.ok(!r.has('6,6'));assert.ok(!r.has('4,4'));
});
test('empty terrain cannot be crossed even to reach grass within geometric range',()=>{
 const {map}=setup();applyEdit(map,{mode:'erase'},5,4);const s=createSession(map),id=entityAt(s,4,4).entity.id;
 assert.ok(!reachableCells(s,id).has('6,4'));assert.ok(reachableCells(s,id).has('5,5'));
 assert.equal(moveUnit(s,id,5,4),false);assert.equal(s.units.get(id).spent,false);
});
test('occupied units block destinations but buildings with space allow entry',()=>{
 const {map}=setup();applyEdit(map,unit,5,4);applyEdit(map,building,4,5);
 const s=createSession(map),id=entityAt(s,4,4).entity.id,r=reachableCells(s,id);
 assert.ok(!r.has('5,4'));assert.ok(r.has('4,5'));assert.ok(r.has('6,4'));assert.ok(r.has('4,6'));
});
test('movement commits once per turn, marks unit spent and resets next turn',()=>{
 const {session,id}=setup();assert.ok(moveUnit(session,id,5,4));assert.equal(entityAt(session,4,4),null);
 assert.equal(session.units.get(id).spent,true);assert.equal(reachableCells(session,id).size,0);assert.equal(moveUnit(session,id,6,4),false);
 assert.equal([...renderSession(session)][0].spent,true);endTurn(session);assert.equal(session.turn,2);assert.ok(moveUnit(session,id,6,4));
});
test('gameplay does not mutate editor maps and fresh sessions reset turns',()=>{
 const {map,session,id}=setup();moveUnit(session,id,5,4);endTurn(session);
 assert.ok(map.occupants.has('4,4'));assert.ok(!map.occupants.has('5,4'));
 const fresh=createSession(map);assert.equal(fresh.turn,1);assert.equal(entityAt(fresh,4,4).entity.spent,false);
 session.grass.delete('0,0');assert.ok(map.grass.has('0,0'));
});
test('selection highlights reachable cells, commits legal moves and rejects invalid ones',()=>{
 const {session,id}=setup();const first=selectTile(session,null,4,4);
 assert.deepEqual(first.selection,{kind:'unit',id});assert.equal(selectionOverlay(session,first.selection).reachable.size,12);
 const rejected=selectTile(session,first.selection,7,4);
 assert.equal(rejected.selection,null);assert.equal(selectionOverlay(session,rejected.selection),null);
 assert.equal(session.units.get(id).spent,false);assert.deepEqual(session.units.get(id).position,{x:4,y:4});
 assert.equal(selectTile(session,first.selection,-1,4).selection,null);
 const preview=selectTile(session,first.selection,5,5);assert.equal(preview.selection.destination,'5,5');
 assert.equal(session.units.get(id).spent,false);assert.equal(selectionOverlay(session,preview.selection).path.length,3);
 assert.equal(selectTile(session,preview.selection,5,5).selection,null);assert.equal(session.units.get(id).spent,true);
 const spent=selectTile(session,null,5,5);assert.equal(selectionOverlay(session,spent.selection).reachable.size,0);
});
test('building selection remains inspectable and unit IDs are distinct',()=>{
 const {map}=setup();applyEdit(map,building,3,4);const s=createSession(map);
 const first=selectTile(s,null,3,4);assert.equal(first.selection.kind,'building');
 assert.equal(selectTile(s,first.selection,3,4).openBuildingId,first.selection.id);
 assert.notEqual(entityAt(s,3,4).entity.id,entityAt(s,4,4).entity.id);
});

test('destination can change or cancel without movement; preview follows valid terrain',()=>{
 const {map}=setup();applyEdit(map,{mode:'erase'},5,4);
 const s=createSession(map),id=entityAt(s,4,4).entity.id;
 let selected=selectTile(s,null,4,4).selection;
 selected=selectTile(s,selected,4,3).selection;
 selected=selectTile(s,selected,5,5).selection;
 assert.deepEqual(selectionOverlay(s,selected).path,[{x:4,y:4},{x:4,y:5},{x:5,y:5}]);
 assert.equal(s.units.get(id).spent,false);
 assert.equal(selectTile(s,selected,9,9).selection,null);
 assert.equal(s.units.get(id).spent,false);
});
