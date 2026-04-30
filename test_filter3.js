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
console.log(f.process("<function=tavily_search>{\"query\":\"Bengaluru temperatures today, April 29, 2024 current forecasts\"}\n</function>"));
