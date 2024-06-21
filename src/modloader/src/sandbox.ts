export class Sandbox {
  public iframe: HTMLIFrameElement;
  public sandboxWindow: any;
  public env: any;

  constructor(env: any = {}) {
    this.iframe = document.createElement("iframe");
    this.iframe.style.display = "none";
    this.iframe.src = "about:blank";
    this.env = env;
    document.body.appendChild(this.iframe);

    this.sandboxWindow = this.iframe.contentWindow;

    this.clearEnv();
    this.refreshEnv(env);
  }

  clearEnv() {
    const whitelisted = [0, "location", "eval", "Object", "String", "Number", "Bigint", "Boolean", "Undefined", "Null", "Symbol", "Math", "NaN", "Iterator", "isFinite", "isNaN", "JSON", "Map", "Infinity", "Date", "BigInt", "Array", "Function", "parseFloat", "parseInt", "Promise", "Set", "undefined"];
    Object.getOwnPropertyNames(this.sandboxWindow).forEach((key) => {
      if (!whitelisted.includes(key)) {
        try {
          this.sandboxWindow[key] = undefined;
        } catch {}
        try {
          delete this.sandboxWindow[key];
        } catch {}
      }
    });
  }

  refreshEnv(env: any = this.env) {
    for (const [key, value] of Object.entries(env)) {
      this.sandboxWindow[key] = value;
    }
  }

  eval(code: String) {
    try {
      const script = this.sandboxWindow.document.createElement("script");
      script.innerHTML = `
                try{
                    ${code}
                }catch(e){
                    error(e.message)
                }
            `;
      this.sandboxWindow.document.body.appendChild(script);
    } catch (e) {
      const errorScript = this.sandboxWindow.document.createElement("script");
      errorScript.innerHTML = "error(e.message)";
      this.sandboxWindow.document.body.appendChild(errorScript);
    }
  }

  destroy() {
    document.body.removeChild(this.iframe);
  }
}
