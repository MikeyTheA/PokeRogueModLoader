const observer = new MutationObserver(async (mutations, observer) => {
    if (document.body) {
        observer.disconnect();

        let html = await (await fetch('https://pokerogue.net/index.html')).text();

        html = html.replace('</title>', '+</title>');
        html = html.replace('<body>', '<body><canvas id="output" tabindex="1" style="position:absolute;top:0px;right:0px;width:100%;height:100%;z-index:1;background:transparent;pointer-events:auto;"></canvas>');
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        document.replaceChild(doc.documentElement, document.documentElement);

        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        // Load scripts in sequence
        // gotta make it loop through libs and then src and then finally load main.js
        await loadScript(chrome.runtime.getURL('lib/imgui.umd.js'));
        await loadScript(chrome.runtime.getURL('lib/imgui_impl.umd.js'));
        await loadScript(chrome.runtime.getURL('lib/lz-string.min.js'));
        await loadScript(chrome.runtime.getURL('lib/uuid.min.js'));
        await loadScript(chrome.runtime.getURL('lib/prism.js'));

        await loadScript(chrome.runtime.getURL('src/data.js'));
        await loadScript(chrome.runtime.getURL('src/sandbox.js'));
        await loadScript(chrome.runtime.getURL('src/mod.js'));
        await loadScript(chrome.runtime.getURL('src/external.js'));
        await loadScript(chrome.runtime.getURL('src/mainMenu.js'));
        await loadScript(chrome.runtime.getURL('src/modList.js'));
        await loadScript(chrome.runtime.getURL('src/modBrowser.js'));
        await loadScript(chrome.runtime.getURL('src/main.js'));
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
