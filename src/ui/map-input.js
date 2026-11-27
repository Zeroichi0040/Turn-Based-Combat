/** Pointer lifecycle and button ownership; callbacks own the scene's domain state. */
export function bindMapInput(canvas,{enabled,playing,makeStroke,tileAt,paint,select,hover,pan,zoom,redraw}){
  let gesture=null;
  function end(event){
    if(!gesture||(event?.pointerId!=null&&event.pointerId!==gesture.id))return;
    const id=gesture.id;gesture=null;canvas.classList.remove('dragging');
    if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    redraw();
  }
  function sample(event){
    const rect=canvas.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>=rect.right||event.clientY<rect.top||event.clientY>=rect.bottom||
      document.elementFromPoint(event.clientX,event.clientY)?.closest('#drawer')){
      gesture.stroke.breakPath();return;
    }
    paint(gesture.stroke,tileAt(event.clientX,event.clientY));
  }
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{
    if(!enabled()||gesture||e.pointerType==='touch'||![0,1,2].includes(e.button))return;
    e.preventDefault();canvas.focus({preventScroll:true});hover(e);
    if(playing()&&e.button===0){select(tileAt(e.clientX,e.clientY));redraw();return;}
    canvas.setPointerCapture(e.pointerId);
    if(e.button===0){gesture={kind:'paint',id:e.pointerId,button:1,stroke:makeStroke()};sample(e);}
    else{gesture={kind:'pan',id:e.pointerId,button:e.button===1?4:2,x:e.clientX,y:e.clientY};canvas.classList.add('dragging');}
    redraw();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!enabled()||(gesture&&gesture.id!==e.pointerId))return;
    if(gesture&&!(e.buttons&gesture.button)){end(e);return;}
    hover(e);
    if(!gesture)return;
    if(gesture.kind==='paint')sample(e);
    else{pan(e.clientX-gesture.x,e.clientY-gesture.y);gesture.x=e.clientX;gesture.y=e.clientY;}
    redraw();
  });
  canvas.addEventListener('pointerleave',()=>hover(null));
  canvas.addEventListener('pointerup',e=>{
    if(gesture?.kind==='paint'&&gesture.id===e.pointerId)sample(e);
    end(e);
  });
  for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
  window.addEventListener('blur',()=>{end();hover(null);});
  canvas.addEventListener('wheel',e=>{
    if(!enabled()||gesture)return;
    e.preventDefault();hover(e);zoom(e);redraw();
  },{passive:false});
  return {end,get active(){return gesture!==null;},get painting(){return gesture?.kind==='paint';}};
}
