import { useEffect, useRef, useState } from "react";
import type { JSX, PointerEvent } from "react";
import { i18n, resolveLanguage } from "../../../shared/i18n";
import { useSnapshot } from "../hooks";

type DockDragRef = {
  pointerId: number;
  startY: number;
  dragging: boolean;
};

/* 和宠物拖动保持一致：移动超过这个距离才算拖动，否则松手按点击处理。 */
const DOCK_DRAG_START_DISTANCE_PX = 6;

/* 内置小爪图标；用户导入自定义图标后由图片替换。 */
export function PawIcon(): JSX.Element {
  return (
    <svg className="dock-tab__paw" viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="21.5" rx="7.2" ry="6" />
      <ellipse cx="7.4" cy="13.4" rx="3" ry="3.8" transform="rotate(-18 7.4 13.4)" />
      <ellipse cx="12.6" cy="8.2" rx="3" ry="3.9" transform="rotate(-6 12.6 8.2)" />
      <ellipse cx="19.4" cy="8.2" rx="3" ry="3.9" transform="rotate(6 19.4 8.2)" />
      <ellipse cx="24.6" cy="13.4" rx="3" ry="3.8" transform="rotate(18 24.6 13.4)" />
    </svg>
  );
}

export function DockView(): JSX.Element {
  const snapshot = useSnapshot();
  const labels = i18n(resolveLanguage(snapshot.settings.language)).menu;
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const dragRef = useRef<DockDragRef | null>(null);

  useEffect(() => {
    const loadIcon = (): void => {
      void window.pawpause.getDockIcon().then(setIconUrl);
    };
    loadIcon();
    return window.pawpause.onDockIconUpdated(loadIcon);
  }, []);

  function finishPointer(clicked: boolean): void {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.dragging) {
      window.pawpause.dockDragStop();
      return;
    }
    if (clicked) window.pawpause.dockClicked();
  }

  useEffect(() => {
    // 鼠标在窗口外松开或窗口失焦时，结束拖动但不当成点击
    const cancelDrag = (): void => finishPointer(false);
    window.addEventListener("pointerup", cancelDrag);
    window.addEventListener("blur", cancelDrag);
    return () => {
      window.removeEventListener("pointerup", cancelDrag);
      window.removeEventListener("blur", cancelDrag);
    };
  }, []);

  function startPointer(event: PointerEvent<HTMLButtonElement>): void {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, dragging: false };
  }

  function movePointer(event: PointerEvent<HTMLButtonElement>): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved_distance = Math.abs(event.clientY - drag.startY);
    const should_start_drag = !drag.dragging && moved_distance > DOCK_DRAG_START_DISTANCE_PX;
    if (should_start_drag) {
      drag.dragging = true;
      window.pawpause.dockDragStart(drag.startY);
    }
  }

  function stopPointer(event: PointerEvent<HTMLButtonElement>): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const should_release_capture = event.currentTarget.hasPointerCapture(event.pointerId);
    finishPointer(true);
    if (should_release_capture) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <main className="dock-shell">
      <button
        type="button"
        className="dock-tab"
        title={labels.undockPet}
        aria-label={labels.undockPet}
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={stopPointer}
        onPointerCancel={() => finishPointer(false)}
        onContextMenu={(event) => {
          event.preventDefault();
          window.pawpause.dockContextMenu();
        }}
      >
        {iconUrl ? (
          <img className="dock-tab__image" src={iconUrl} alt="" draggable={false} />
        ) : (
          <PawIcon />
        )}
      </button>
    </main>
  );
}
