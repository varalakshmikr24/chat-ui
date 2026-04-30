class StreamFilter {
  buffer = "";
  isTool = false;
  extractedCalls = [];

  process(chunk) {
    if (this.isTool) {
      this.buffer += chunk;
      return "";
    }
    
    this.buffer += chunk;
    const lastOpen = this.buffer.lastIndexOf("<");
    
    if (lastOpen !== -1) {
      const potentialTag = this.buffer.slice(lastOpen);
      if ("<function=".startsWith(potentialTag) || "<tool_call>".startsWith(potentialTag)) {
        return ""; // hold it
      }
      if (potentialTag.startsWith("<function=") || potentialTag.startsWith("<tool_call>")) {
        this.isTool = true;
        const safeText = this.buffer.slice(0, lastOpen);
        this.buffer = potentialTag;
        return safeText;
      }
    }
    
    const safeText = this.buffer;
    this.buffer = "";
    return safeText;
  }

  getToolCalls() {
    if (this.isTool) {
      const match = this.buffer.match(/<function=([^>]+)>(.*?)<\/function>/) || this.buffer.match(/<tool_call>\s*(.*?)\s*<\/tool_call>/);
      if (match) {
        const funcName = this.buffer.includes("<function=") ? match[1] : "tavily_search";
        const argsStr = match[2];
        this.extractedCalls.push({
          id: "call_" + Date.now(),
          type: 'function',
          function: { name: funcName, arguments: argsStr }
        });
      }
    }
    return this.extractedCalls;
  }
}

const f = new StreamFilter();
const chunks = ["<func", "tion=tavily_search>", "{\"query\":\"Weather\"}", "</function>"];
let out = "";
for (let c of chunks) {
  out += f.process(c);
}
console.log("OUT:", out);
console.log("CALLS:", f.getToolCalls());
