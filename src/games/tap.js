export function backdropProps(onClose) {
  return {
    ref: (el) => { if (el && !el.dataset.born) el.dataset.born = String(performance.now()); },
    onPointerDown: (e) => { e.currentTarget.dataset.bd = e.target === e.currentTarget ? '1' : ''; },
    onClickCapture: (e) => { const b = Number(e.currentTarget.dataset.born || 0); if (performance.now() - b < 450) { e.stopPropagation(); if (e.cancelable) e.preventDefault(); } },
    onClick: (e) => { const ok = e.target === e.currentTarget && e.currentTarget.dataset.bd === '1'; e.currentTarget.dataset.bd = ''; if (ok && onClose) onClose(e); },
  };
}
