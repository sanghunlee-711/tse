import EditorView from '../EditorView';
import Transaction from '../Transaction';

interface EditorPlugin {
  eventType: keyof HTMLElementEventMap;
  on: (e: Event, view: EditorView) => void;
  onInit?: (view: EditorView) => void;
  onTransaction?: (transaction: Transaction, view: EditorView) => void;
  afterSyncDOM?: (transaction: Transaction, view: EditorView) => void;
}

export default EditorPlugin;
