/** Coalesce redraw requests; cancellation prevents a closed scene from painting. */
export function createRenderScheduler(draw,clock=window){
  let frame=null;
  return {
    request(){if(frame===null)frame=clock.requestAnimationFrame(()=>{frame=null;draw();});},
    cancel(){if(frame!==null){clock.cancelAnimationFrame(frame);frame=null;}},
  };
}
