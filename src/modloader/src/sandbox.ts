export class Sandbox {
	public iframe: HTMLIFrameElement;
	public sandboxWindow: any;
	public env: any;

	constructor(env: any = {}) {
		this.iframe = document.createElement('iframe');
		//this.iframe.style.display = "none";
		this.iframe.style.width = '100%';
		this.iframe.style.height = '100%';
		this.iframe.style.position = 'fixed';
		this.iframe.style.left = '0px';
		this.iframe.style.top = '0px';
		this.iframe.style.border = 'none';
		this.iframe.style.backgroundColor = 'transparent';
		this.iframe.style.background = 'transparent';
		this.iframe.style.pointerEvents = 'none';
		this.iframe.style.zIndex = '1';
		this.env = env;
		document.body.appendChild(this.iframe);

		this.sandboxWindow = this.iframe.contentWindow;

		this.clearEnv();
		this.refreshEnv(env);
	}

	clearEnv() {
		this.sandboxWindow.document.documentElement.innerHTML = `
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body></body>
      </html>
    `;

		const whitelisted = [
			0, // [Things needed for basic functionality]
			'location', //
			'Object', //
			'String', //
			'Number', //
			'Bigint', //
			'boolean', //
			'Undefined', //
			'Null', //
			'Symbol', //
			'Math', //
			'NaN', //
			'Iterator', //
			'isFinite', //
			'isNaN', //
			'JSON', //
			'Map', //
			'Infinity', //
			'Date', //
			'BigInt', //
			'Array', //
			'Function', //
			'parseFloat', //
			'parseInt', //
			'Promise', //
			'Set', //
			'undefined', //
			'document', // [Things needed for html functionality]
			'Element', //
			'HTMLElement', //
			'Error', // [Getting the stack trace]
			'WebSocket', // [WebSocket access for things like OBS overlays and such]
			'fetch', // [Web access, for accessing things like wikis, bulbapedia etc]
			'eval', // [Modception!!]
			'crypto', // [UUID generation]
		];
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

	eval(code: string) {
		try {
			const script = this.sandboxWindow.document.createElement('script');
			script.textContent = `
                try{
                    ${code}
                }catch(e){
                    error(e.message)
                }
            `;
			this.sandboxWindow.document.body.appendChild(script);
		} catch (e) {
			const errorScript = this.sandboxWindow.document.createElement('script');
			errorScript.textContent = 'error(e.message)';
			this.sandboxWindow.document.body.appendChild(errorScript);
		}
	}

	destroy() {
		document.body.removeChild(this.iframe);
	}
}
