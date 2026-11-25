import {buildings,units} from '../content/definitions.js';
import {sprite} from '../rendering/sprites.js';
import {selectStoredUnit} from '../game/garrison.js';
import {productionState,cancelProduction} from '../game/production.js';
import {createProductionDialog} from './production-dialog.js';

export function createGarrisonDialog({getSession,onDeploy,onClose}){
  const dialog=document.querySelector('#garrison-dialog');
  const heading=document.querySelector('#garrison-title'),slots=document.querySelector('#garrison-slots');
  const status=document.querySelector('#garrison-status'),count=document.querySelector('#garrison-count');
  const productionPanel=document.querySelector('#production-panel');
  const productionSlot=document.querySelector('#production-slot');
  const cancelButton=document.querySelector('#cancel-production');
  const productionStatus=document.querySelector('#production-state');
  let buildingId=null,selectedId=null,productionSelected=false;
  const picker=createProductionDialog({getSession,onAssigned(){
    productionSelected=false;render();status.textContent='Training assigned.';productionSlot.focus();
  }});
  function renderProduction(building){
    const state=productionState(building),order=building.production;
    productionPanel.hidden=state==='unavailable';
    productionSlot.replaceChildren();
    productionSlot.classList.toggle('paused',state==='paused');
    productionSlot.setAttribute('aria-pressed',String(productionSelected));
    cancelButton.disabled=!order;
    if(state==='unavailable')return;
    if(order){
      const type=units[order.unitType],image=document.createElement('img');
      image.src=sprite(type.sprite).toDataURL();image.alt='';image.width=48;image.height=48;
      const label=document.createElement('span');label.textContent=type.name;
      productionSlot.append(image,label);
      productionSlot.setAttribute('aria-label',type.name+' production slot');
      productionStatus.textContent=state==='paused'?'Paused — garrison full':'Training · '+order.remaining+' turn'+(order.remaining===1?'':'s');
    }else{
      productionSlot.textContent='Empty';productionSlot.setAttribute('aria-label','Empty production slot');
      productionStatus.textContent='No training order';
    }
  }
  productionSlot.addEventListener('click',()=>{
    const building=getSession()?.buildings.get(buildingId);if(!building)return;
    if(productionSelected&&!building.production){picker.open(buildingId);return;}
    productionSelected=true;selectedId=null;
    for(const slot of slots.querySelectorAll('button[aria-pressed]'))slot.setAttribute('aria-pressed','false');
    productionSlot.setAttribute('aria-pressed','true');
    status.textContent=building.production?'Training selected.':'Production selected.';
  });
  cancelButton.addEventListener('click',()=>{
    if(cancelProduction(getSession(),buildingId)){productionSelected=false;render();status.textContent='Training cancelled.';productionSlot.focus();}
  });
  function render(){
    const session=getSession(),building=session?.buildings.get(buildingId);
    if(!building)return;
    const definition=buildings[building.type];
    heading.textContent=definition.name;
    count.textContent=building.garrison.length+' / '+definition.garrisonCapacity+' garrisoned';
    slots.replaceChildren();
    renderProduction(building);
    for(let i=0;i<definition.garrisonCapacity;i++){
      const id=building.garrison[i],unit=session.units.get(id);
      const button=document.createElement('button');button.type='button';button.className='garrison-slot';
      button.dataset.slot=String(i+1);
      if(!unit){
        button.disabled=true;button.setAttribute('aria-label','Empty slot '+(i+1));button.textContent='Empty';
      }else{
        const type=units[unit.type],image=document.createElement('img');
        image.src=sprite(type.sprite).toDataURL();image.alt='';image.width=48;image.height=48;
        if(unit.spent)button.classList.add('spent');
        button.setAttribute('aria-label',type.name+' slot '+(i+1)+(unit.spent?' (spent)':' (ready)'));
        button.setAttribute('aria-pressed',String(selectedId===id));
        const label=document.createElement('span');label.textContent=unit.spent?'Spent':'Ready';
        button.append(image,label);
        button.addEventListener('click',()=>{
          const result=selectStoredUnit(session,buildingId,selectedId,id);
          selectedId=result.selectedId;productionSelected=false;productionSlot.setAttribute('aria-pressed','false');
          if(result.deploy){dialog.close();onDeploy(id);return;}
          status.textContent=unit.spent?type.name+' has already moved this turn.':type.name+' selected.';
          // Keep the same DOM buttons and keyboard focus during inspection.
          for(const slot of slots.querySelectorAll('button[aria-pressed]'))slot.setAttribute('aria-pressed',String(slot===button));
        });
      }
      slots.append(button);
    }
  }
  document.querySelector('#close-garrison').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{if(!dialog.open){buildingId=null;selectedId=null;productionSelected=false;onClose();}});
  return {
    open(id){
      if(!getSession()?.buildings.has(id))return;
      buildingId=id;selectedId=null;productionSelected=false;status.textContent='';render();
      dialog.showModal();
    },
    close(){picker.close();if(dialog.open)dialog.close();},
  };
}
