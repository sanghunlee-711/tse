import EditorState from './EditorState';
import Transaction from './Transaction';
type Options = any;

class EditorView {
  element: Element | null;
  state: EditorState = new EditorState();

  constructor(element: Element | null, options: Options) {
    this.element = element;
  }

  dispatch(transaction: Transaction) {}

  updateState(newState: EditorState) {}
}

export default EditorView;
