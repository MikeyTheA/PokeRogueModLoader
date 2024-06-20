import StaticManager from './data';
import { showMainMenu } from './mainMenu';
import { showModList, showScript } from './modList';
import { windowHandler } from './windows';
import { ExternalHandler } from './external';
import { ModsHandler } from './mod';

export const LoaderData = new StaticManager();
LoaderData.loadPersistentData();
export const modsHandler = new ModsHandler();
export const externalHandler = new ExternalHandler(5828);

const startModLoader = async () => {
    await ImGui.default();
    const canvas: HTMLCanvasElement = document.getElementById('ImGuiCanvas') as HTMLCanvasElement;

    const resize = () => {
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = canvas.scrollWidth * devicePixelRatio;
        canvas.height = canvas.scrollHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('visibilitychange', resize);

    ImGui.CreateContext();
    ImGui_Impl.Init(canvas);

    ImGui.StyleColorsDark();
    const IO = ImGui.GetIO();

    let done = false;
    let mousePos = { x: 0, y: 0 };
    document.addEventListener('mousemove', (event) => {
        mousePos.x = event.clientX;
        mousePos.y = event.clientY;
    });

    windowHandler.addWindow(
        'PokeRogueModLoader',
        showMainMenu,
        {
            noClose: true,
            open: true,
            hidden: true,
        },
        'mainmenuwindow'
    );

    windowHandler.addWindow('Mod list', showModList, {}, 'modlist');

    windowHandler.addWindow(
        'Script peeker',
        showScript,
        {
            hidden: true,
            persistentOpen: false,
        },
        'scriptpeeker'
    );

    window.requestAnimationFrame(_loop);

    function _loop(time: Number) {
        const rect = canvas.getBoundingClientRect();
        IO.MousePos.x = mousePos.x - rect.left; // For WantCaptureMouse to work
        IO.MousePos.y = mousePos.y - rect.top;
        ImGui_Impl.NewFrame(time);
        ImGui.NewFrame();

        windowHandler.renderWindows();

        ImGui.EndFrame();

        ImGui.Render();
        const gl = ImGui_Impl.gl;
        gl && gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl && gl.clear(gl.COLOR_BUFFER_BIT);

        ImGui_Impl.RenderDrawData(ImGui.GetDrawData());

        if (IO.WantCaptureMouse) {
            // allow interacting with ImGui and also PokeRogue
            canvas.style.pointerEvents = 'auto';
        } else {
            canvas.style.pointerEvents = 'none';
        }

        window.requestAnimationFrame(done ? _done : _loop);
    }

    function _done() {
        ImGui_Impl.Shutdown();
        ImGui.DestroyContext();
    }
};

export default startModLoader;
