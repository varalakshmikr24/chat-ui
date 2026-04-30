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
}

const f = new StreamFilter();
console.log("Chunk 1:", f.process("Here is some text. "));
console.log("Chunk 2:", f.process("<func"));
console.log("Chunk 3:", f.process("tion=tavily_search"));
console.log("Chunk 4:", f.process(">{\"query\": \"test\"}</function>"));
