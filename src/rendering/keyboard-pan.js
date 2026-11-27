// Camera offsets move opposite to the direction the viewer travels.
const directions = new Map([
  ['w', [0, 1]], ['arrowup', [0, 1]],
  ['s', [0, -1]], ['arrowdown', [0, -1]],
  ['a', [1, 0]], ['arrowleft', [1, 0]],
  ['d', [-1, 0]], ['arrowright', [-1, 0]],
]);
export const PAN_SPEED = 640; // CSS pixels per second, independent of zoom.
export const isPanKey = key => directions.has(key.toLowerCase());

/** Track physical key presses in chronological order, independently per axis. */
export function createPanKeys() {
  const held = new Set();
  return {
    press(key) {
      key = key.toLowerCase();
      if (!isPanKey(key) || held.has(key)) return false;
      held.add(key);
      return true;
    },
    release(key) { return held.delete(key.toLowerCase()); },
    has(key) { return held.has(key.toLowerCase()); },
    clear() { held.clear(); },
    get active() { return held.size > 0; },
    vector() {
      let x = 0, y = 0;
      for (const key of held) {
        const [dx, dy] = directions.get(key);
        if (dx) x = dx;
        if (dy) y = dy;
      }
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length };
    },
  };
}

function blocksCamera(target) {
  return Boolean(target?.closest?.('input,textarea,select,button,[contenteditable]:not([contenteditable="false"])') || target?.isContentEditable);
}

/** Bind keyboard panning to the display clock rather than OS key repeat. */
export function bindCameraKeyboard({ move, reset, enabled=()=>true, win = window, doc = document }) {
  const keys = createPanKeys();
  let frame = null, last = 0;
  function advance(now) {
    // Cap time after a stalled frame to avoid a large camera jump.
    const seconds = Math.max(0, Math.min(now - last, 50)) / 1000;
    last = now;
    const { x, y } = keys.vector();
    if (seconds && (x || y)) move(x * PAN_SPEED * seconds, y * PAN_SPEED * seconds);
  }
  function tick(now) {
    frame = null;
    if (!enabled()){stop();return;}
    if (!keys.active) return;
    advance(now);
    frame = win.requestAnimationFrame(tick);
  }
  function stop() {
    keys.clear();
    if (frame !== null) win.cancelAnimationFrame(frame);
    frame = null;
  }
  function down(event) {
    if (!enabled()){stop();return;}
    if (event.ctrlKey || event.metaKey || event.altKey || blocksCamera(event.target)) {
      stop();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      if (!event.repeat) reset();
      return;
    }
    if (!isPanKey(event.key)) return;
    event.preventDefault();
    if (event.repeat || keys.has(event.key)) return;
    const now = win.performance.now();
    if (keys.active) advance(now);
    else last = now;
    keys.press(event.key);
    if (frame === null) frame = win.requestAnimationFrame(tick);
  }
  function up(event) {
    if (!enabled()){stop();return;}
    if (!keys.has(event.key)) return;
    advance(win.performance.now());
    keys.release(event.key);
    if (!keys.active) stop();
  }
  function focus(event) {
    if (blocksCamera(event.target)) stop();
  }
  function visibility() {
    if (doc.hidden) stop();
  }
  win.addEventListener('keydown', down);
  win.addEventListener('keyup', up);
  win.addEventListener('blur', stop);
  doc.addEventListener('focusin', focus);
  doc.addEventListener('visibilitychange', visibility);
  return () => {
    stop();
    win.removeEventListener('keydown', down);
    win.removeEventListener('keyup', up);
    win.removeEventListener('blur', stop);
    doc.removeEventListener('focusin', focus);
    doc.removeEventListener('visibilitychange', visibility);
  };
}
