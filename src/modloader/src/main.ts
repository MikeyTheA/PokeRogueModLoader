import StaticManager from "./data";
import { showMainMenu } from "./mainMenu";
import { showModList, showScript } from "./modList";
import { windowHandler } from "./windows";
import { ExternalHandler } from "./external";
import { ModsHandler } from "./mod";
import BattleScene from "../../battle-scene";
import { showModBrowser } from "./modBrowser";
import { initServer, showServerBrowser } from "./serverBrowser";

export const LoaderData = new StaticManager();
LoaderData.loadPersistentData();
export const modsHandler = new ModsHandler();
export const externalHandler = new ExternalHandler(5828);
export const supportsTouch = 'ontouchstart' in window;

const startModLoader: () => Promise<boolean> = async () => {
  LoaderData.setData("Amount", LoaderData.getData("Amount", 0, false) + 1, false);

  if (LoaderData.getData("Amount", 0, false) > 1) {
    return false;
  }

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

  function _loop(time: number) {
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
          try {
            script.sandbox.sandboxWindow.update();
          } catch (e) {
            script.sandbox.sandboxWindow.error(e.message);
          }

        }
      });
    });


    if (!supportsTouch) {
      const rect = canvas.getBoundingClientRect();
      IO.MousePos.x = mousePos.x - rect.left; // For WantCaptureMouse to work
      IO.MousePos.y = mousePos.y - rect.top;
    }

    let hiddenInput: undefined | HTMLInputElement
    if (supportsTouch) {
      hiddenInput = document.createElement('input');
      hiddenInput.type = 'text';
      hiddenInput.id = 'hiddenInput';
      hiddenInput.style.position = 'absolute';  // Move it off-screen
      hiddenInput.style.top = '-100px';
      hiddenInput.style.width = '1px';          // Fix width
      hiddenInput.style.height = '1px';         // Fix height
      hiddenInput.style.opacity = '0';          // Make it invisible
      hiddenInput.style.overflow = 'hidden';    // Prevent overflow
      document.body.appendChild(hiddenInput);

      function handleKeyEvent(event) {
        if (event.type === 'keydown' || event.type === 'keyup') {
          const keyIndex = event.key.charCodeAt(0);
          IO.KeysDown[keyIndex] = event.type === 'keydown';

          // Handle modifier keys
          IO.KeyCtrl = event.ctrlKey;
          IO.KeyShift = event.shiftKey;
          IO.KeyAlt = event.altKey;
          IO.KeySuper = event.metaKey;
        }

        // Handle character input
        if (event.type === 'input') {
          const inputValue = hiddenInput.value;
          for (let i = 0; i < inputValue.length; i++) {
            IO.AddInputCharacter(inputValue.charCodeAt(i));
          }
          hiddenInput.value = '';
        }
      }

      hiddenInput.addEventListener('input', handleKeyEvent);
      hiddenInput.addEventListener('keydown', handleKeyEvent);
      hiddenInput.addEventListener('keyup', handleKeyEvent);
    }

    ImGui_Impl.NewFrame(time);
    ImGui.NewFrame();

    windowHandler.renderWindows();

    ImGui.End()

    ImGui.EndFrame();

    ImGui.Render();
    const gl = ImGui_Impl.gl;
    gl && gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl && gl.clear(gl.COLOR_BUFFER_BIT);

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData());

    if (!supportsTouch) {
      if (battleScene && battleScene.input) {
        if (IO.WantCaptureKeyboard) {
          battleScene.input.keyboard.enabled = false;
        } else {
          battleScene.input.keyboard.enabled = true;
        }
      }
    } else {
      if (IO.WantCaptureKeyboard && hiddenInput && !hiddenInput.matches(':focus')) {
        hiddenInput.focus({ preventScroll: true })
      }
    }


    if (!supportsTouch) {
      if (IO.WantCaptureMouse) {
        // allow interacting with ImGui and also PokeRogue
        canvas.style.pointerEvents = "auto";
      } else {
        canvas.style.pointerEvents = "none";
      }
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

  return true;
};

export default startModLoader;
