// Local-dev stub for the optional `mermaid` dependency (ai-ui-kit MermaidRenderer
// degrades gracefully when it is absent). Mirrors the minimal API the renderer uses.
const mermaid = {
  initialize() {},
  render(_id, _text) {
    return Promise.resolve({ svg: "", bindEvents() {} });
  },
  run() {},
};
export default mermaid;
