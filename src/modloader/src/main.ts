import StaticManager from "./data";
import { showMainMenu } from "./mainMenu";
import { showModList, showScript } from "./modList";
import { windowHandler } from "./windows";
import { ExternalHandler } from "./external";
import { ModsHandler } from "./mod";
import BattleScene from "../../battle-scene";
import { showModBrowser } from "./modBrowser";
import { initServer, showServerBrowser } from "./server-browser";

export const LoaderData = new StaticManager();
LoaderData.loadPersistentData();
export const modsHandler = new ModsHandler();
export const externalHandler = new ExternalHandler(5828);

const startModLoader = async () => {
  initServer();
  await ImGui.default();
  const canvas: HTMLCanvasElement = document.getElementById("ImGuiCanvas") as HTMLCanvasElement;

  const resize = () => {
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.scrollWidth * devicePixelRatio;
    canvas.height = canvas.scrollHeight * devicePixelRatio;
  };
  resize();
  window.addEventListener("resize", resize);

  ImGui.CreateContext();
  ImGui_Impl.Init(canvas);

  ImGui.StyleColorsDark();
  const IO = ImGui.GetIO();

  const done = false;
  const mousePos = { x: 0, y: 0 };
  document.addEventListener("mousemove", (event) => {
    mousePos.x = event.clientX;
    mousePos.y = event.clientY;
  });

  windowHandler.addWindow(
    "Server browser",
    showServerBrowser,
    {
      open: true,
      persistentOpen: true,
      initialHeight: 200,
      initialWidth: 200
    },
    "serverbrowser"
  );

  windowHandler.addWindow(
    "PokeRogueModLoader",
    showMainMenu,
    {
      noClose: true,
      open: true,
      hidden: true,
    },
    "mainmenuwindow"
  );

  windowHandler.addWindow("Mod list", showModList, {}, "modlist");
  windowHandler.addWindow("Mod browser", showModBrowser, {}, "modbrowser");

  windowHandler.addWindow(
    "Script peeker",
    showScript,
    {
      hidden: true,
      persistentOpen: false,
    },
    "scriptpeeker"
  );

  modsHandler.load();
  externalHandler.connect();

  window.requestAnimationFrame(_loop);

  function _loop(time: Number) {
    const battleScene = getBattleScene();
    if (LoaderData.getData("phaseHooksDone", false, false) === false && battleScene && battleScene.pushPhase) {
      const originalPushPhase = battleScene.pushPhase;
      const originalUnshiftPhase = battleScene.unshiftPhase;
      const originalOverridePhase = battleScene.overridePhase;
      const originalTryReplacePhase = battleScene.tryReplacePhase;
      battleScene.pushPhase = function (phase: any, defer: boolean) {
        interceptPhase(phase);
        originalPushPhase.call(this, phase, defer);
      }.bind(battleScene);

      battleScene.unshiftPhase = function (phase: any) {
        interceptPhase(phase);
        originalUnshiftPhase.call(this, phase);
      }.bind(battleScene);

      battleScene.overridePhase = function (phase: any) {
        interceptPhase(phase);
        originalOverridePhase.call(this, phase);
      }.bind(battleScene);

      battleScene.tryReplacePhase = function (phase: any) {
        interceptPhase(phase);
        originalTryReplacePhase.call(this, phase);
      }.bind(battleScene);
      LoaderData.setData("phaseHooksDone", true, false);
    }

    modsHandler.mods.forEach((mod) => {
      mod.scripts.forEach((script) => {
        if (script.sandbox.sandboxWindow.update) {
          script.sandbox.sandboxWindow.update();
        }
      });
    });

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

    if (battleScene && battleScene.input) {
      if (IO.WantCaptureKeyboard) {
        battleScene.input.keyboard.enabled = false;
      } else {
        battleScene.input.keyboard.enabled = true;
      }
    }

    if (IO.WantCaptureMouse) {
      // allow interacting with ImGui and also PokeRogue
      canvas.style.pointerEvents = "auto";
    } else {
      canvas.style.pointerEvents = "none";
    }

    window.requestAnimationFrame(done ? _done : _loop);
  }

  function _done() {
    ImGui_Impl.Shutdown();
    ImGui.DestroyContext();
  }

  function interceptPhase(phase) {
    const name = phase.constructor.name;

    modsHandler.mods.forEach((mod) => {
      mod.scripts.forEach((script) => {
        if (typeof script.sandbox.sandboxWindow.onPhasePush === "function") {
          try {
            script.sandbox.sandboxWindow.onPhasePush(phase);
          } catch (e) {
            script.sandbox.sandboxWindow.error(`error on window.onPhasePush: ${e.message}`);
          }
        }
      });
    });

    modsHandler.mods.forEach((mod) => {
      mod.scripts.forEach((script) => {
        script.hooks.forEach((hook) => {
          if (hook.phase === name) {
            try {
              hook.func(phase);
            } catch (e) {
              const logs = LoaderData.getData(`LogsForMod${mod.id}`, [], false);
              logs.push(["error", e.message]);
              LoaderData.setData(`LogsForMod${mod.id}`, logs);
            }
          }
        });
      });
    });
  }

  const getBattleScene = () => {
    if (window.Phaser && Phaser.Display && Phaser.Display.Canvas && Phaser.Display.Canvas.CanvasPool && (Phaser.Display.Canvas.CanvasPool as any).pool[1] && (Phaser.Display.Canvas.CanvasPool as any).pool[1].parent && (Phaser.Display.Canvas.CanvasPool as any).pool[1].parent.scene) {
      return (Phaser.Display.Canvas.CanvasPool as any).pool[1].parent.scene as BattleScene;
    }
    return false;
  };

  window["getBattleScene"] = getBattleScene;
};

export default startModLoader;
