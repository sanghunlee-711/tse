import EditorView from '../EditorView';
import EditorPlugin from './EditorPlugin';

export class MouseUpPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'mouseup';
  on(event: Event, view: EditorView) {
    const e = event as MouseEvent;
    view.selection.updateSelection();
  }
}
