import EditorView from '../EditorView';
import EditorPlugin from './EditorPlugin';

export class KeyUpPlugin implements EditorPlugin {
  eventType: keyof HTMLElementEventMap = 'keyup';
  on(event: Event, view: EditorView) {
    const e = event as KeyboardEvent;
    view.selection.updateSelection();
  }
}
