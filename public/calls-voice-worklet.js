class ZclPitch extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'ratio', defaultValue: 1, minValue: 0.5, maxValue: 2, automationRate: 'k-rate' }];
  }
  constructor() {
    super();
    this.size = 8192;
    this.buf = new Float32Array(this.size);
    this.w = 0;
    this.win = Math.max(256, Math.min(4096, Math.round(sampleRate * 0.046)));
    this.d = 0;
  }
  read(pos) {
    const n = this.size;
    let p = pos % n;
    if (p < 0) p += n;
    const i = Math.floor(p);
    const f = p - i;
    const a = this.buf[i];
    const b = this.buf[(i + 1) % n];
    return a + (b - a) * f;
  }
  process(inputs, outputs, params) {
    const out = outputs[0] && outputs[0][0];
    if (!out) return true;
    const inp = inputs[0] && inputs[0][0];
    const ratio = params.ratio[0];
    const W = this.win;
    const half = W / 2;
    for (let i = 0; i < out.length; i++) {
      this.buf[this.w] = inp ? inp[i] : 0;
      this.d += 1 - ratio;
      if (this.d >= W) this.d -= W;
      else if (this.d < 0) this.d += W;
      const d1 = this.d;
      const d2 = (d1 + half) % W;
      const g1 = Math.sin(Math.PI * d1 / W);
      const g2 = Math.sin(Math.PI * d2 / W);
      out[i] = this.read(this.w - d1 - 2) * g1 * g1 + this.read(this.w - d2 - 2) * g2 * g2;
      this.w = (this.w + 1) % this.size;
    }
    for (let c = 1; c < outputs[0].length; c++) outputs[0][c].set(out);
    return true;
  }
}
registerProcessor('zcl-pitch', ZclPitch);
