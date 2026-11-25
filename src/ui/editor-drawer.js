import {categories} from '../editor/map.js';
import {sprite} from '../rendering/sprites.js';

const tabs=[
  {id:'tiles',label:'Tiles',icon:'grass'},
  {id:'buildings',label:'Buildings',icon:'townHall'},
  {id:'units',label:'Units',icon:'swordsman'},
];
function makeButton(text,action) {
  const button=document.createElement('button');
  button.type='button';button.textContent=text;
  button.addEventListener('click',event=>{action();if(event.detail)button.blur();});
  return button;
}
function iconFor(id) {
  const image=document.createElement('img');
  image.src=sprite(id).toDataURL();image.alt='';image.width=32;image.height=32;
  return image;
}
/** All controls render from one selection state. Erase applies across categories. */
export function mountDrawer(root,onChange) {
  let open=true, category='tiles', mode='place';
  const selected={tiles:'grass',buildings:'townHall',units:'swordsman'};
  const panel=document.createElement('section');panel.className='drawer-panel';
  panel.id='drawer-panel';panel.setAttribute('aria-label','Editor tools');
  const rail=document.createElement('nav');rail.className='drawer-rail';rail.setAttribute('aria-label','Editor categories');
  root.replaceChildren(panel,rail);
  const close=makeButton('‹',()=>{open=false;render();});
  close.className='drawer-close';close.setAttribute('aria-label','Close drawer');close.setAttribute('aria-controls',panel.id);
  rail.append(close);
  const tabButtons=new Map();
  for (const tab of tabs) {
    const button=makeButton('',()=>{category=tab.id;open=true;render();});
    button.className='category-button';button.setAttribute('aria-label',tab.label);
    button.setAttribute('aria-controls',panel.id);button.title=tab.label;button.append(iconFor(tab.icon));
    rail.append(button);tabButtons.set(tab.id,button);
  }
  const getTool=()=>({mode,category,id:selected[category]});
  function render() {
    panel.hidden=!open;close.hidden=!open;
    for (const [id,button] of tabButtons) {
      button.setAttribute('aria-pressed',String(open&&id===category));
      button.setAttribute('aria-expanded',String(open&&id===category));
    }
    const heading=document.createElement('h2');heading.textContent=tabs.find(t=>t.id===category).label;
    const modes=document.createElement('div');modes.className='tool-modes';
    for (const [id,label] of [['place','Place'],['erase','Erase']]) {
      const button=makeButton(label,()=>{mode=id;render();});
      button.setAttribute('aria-pressed',String(mode===id));modes.append(button);
    }
    const assets=document.createElement('div');assets.className='asset-grid';
    for (const item of Object.values(categories[category])) {
      const button=makeButton('',()=>{selected[category]=item.id;mode='place';render();});
      button.className='asset-button';button.setAttribute('aria-label',item.name);
      button.setAttribute('aria-pressed',String(mode==='place'&&selected[category]===item.id));
      const label=document.createElement('span');label.textContent=item.name;
      button.append(iconFor(item.sprite),label);assets.append(button);
    }
    const note=document.createElement('p');note.className='drawer-note';
    note.textContent=mode==='erase'?'Universal eraser: remove one layer per pass. Leave and re-enter a tile to erase the next layer.':'Click or drag to place the selected asset.';
    const count=document.createElement('div');count.id='map-stats';count.className='map-stats';
    panel.replaceChildren(heading,modes,assets,note,count);
    onChange(getTool());
  }
  render();
  return {getTool};
}
