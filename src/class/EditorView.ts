import EditorState from './EditorState';
import Transaction from './Transaction';
import NodeView from './NodeView';
import TSENode from './TSENode';
import Selection from './Selection';

class EditorView {
  state: EditorState;
  rootElement: HTMLElement;
  selection: Selection;

  constructor(rootElement: HTMLElement, initialState: EditorState) {
    this.rootElement = rootElement;
    this.state = initialState;

    // Selection 인스턴스 초기화
    this.selection = new Selection(this.state.doc);

    this.render();
    this.addEventListeners();
  }

  /**
   * 트랜잭션을 처리하고 상태를 업데이트합니다.
   * @param {Transaction} transaction - 실행할 트랜잭션
   */
  dispatch(transaction: Transaction) {
    const newState = this.state.apply(transaction);
    this.state = newState;

    // 상태가 업데이트된 이후 Selection도 업데이트
    this.selection.rootNode = this.state.doc;
    this.selection.updateSelection();

    // DOM 렌더링
    this.render();
  }

  /**
   * DOM을 렌더링합니다.
   */
  render() {
    this.rootElement.innerHTML = '';
    this.rootElement.setAttribute('contentEditable', 'true');

    this.state.doc.content.forEach((node) => {
      if (node instanceof TSENode) {
        const nodeView = new NodeView(node);
        this.rootElement.appendChild(nodeView.dom);
      } else if (typeof node === 'string') {
        const textNode = document.createTextNode(node);
        this.rootElement.appendChild(textNode);
      }
    });
  }

  /**
   * 이벤트 리스너를 추가합니다.
   */
  addEventListeners() {
    // input 이벤트 처리
    this.rootElement.addEventListener('input', (e) => {
      this.handleInput(e as InputEvent);
    });

    // 커서 또는 선택 범위 업데이트 처리
    this.rootElement.addEventListener('mouseup', () =>
      this.selection.updateSelection()
    );
    this.rootElement.addEventListener('keyup', () =>
      this.selection.updateSelection()
    );
  }

  /**
   * input 이벤트를 처리합니다.
   * @param {InputEvent} event - input 이벤트 객체
   */
  handleInput(event: InputEvent) {
    if (event.inputType === 'insertText') {
      const insertedText = event.data || '';
      const transaction = this.createInsertTransaction(insertedText);
      this.dispatch(transaction);
    } else if (event.inputType === 'deleteContentBackward') {
      const transaction = this.createDeleteTransaction();
      this.dispatch(transaction);
    } else if (event.inputType === 'Enter') {
      const transaction = this.createEnterTransaction();
      this.dispatch(transaction);
    }
  }

  /**
   * 텍스트 삽입 트랜잭션을 생성합니다.
   * @param {string} text - 삽입할 텍스트
   * @returns {Transaction} 생성된 트랜잭션
   */
  createInsertTransaction(text: string): Transaction {
    const { startOffset } = this.selection;

    const resolvedPos = this.state.resolvePosition(startOffset);

    if (!resolvedPos) {
      throw new Error('Failed to resolve position for insertText.');
    }

    const { node, localOffset } = resolvedPos;

    const transaction = new Transaction(this.state.schema);
    if (node.content.length > 0) {
      node.content.forEach((eachContent) => {
        if (typeof eachContent === 'string') {
          const updatedEachContent =
            (eachContent as string).slice(0, localOffset) +
            text +
            (eachContent as string).slice(localOffset);

          transaction.updateNodeContents(this.state.doc.content.indexOf(node), [
            updatedEachContent,
          ]);
        } else if (typeof eachContent === 'object') {
          //텍스트가 아닌 다른 노드 타입인 경우 여기서 처리 필요.
        }
      });
    }

    return transaction;
  }

  /**
   * 텍스트 삭제 트랜잭션을 생성합니다.
   * @returns {Transaction} 생성된 트랜잭션
   */
  createDeleteTransaction(): Transaction {
    const { startOffset } = this.selection;
    const resolvedPos = this.state.resolvePosition(startOffset);

    if (!resolvedPos) {
      throw new Error('Failed to resolve position for deleteContentBackward.');
    }

    const { node, localOffset } = resolvedPos;
    const transaction = new Transaction(this.state.schema);

    if (typeof node.content === 'string') {
      const updatedContent =
        (node.content as string).slice(0, localOffset - 1) +
        (node.content as string).slice(localOffset);
      const currNodeIndex = this.state.doc.content.indexOf(node);

      transaction.updateNodeContents(currNodeIndex, [updatedContent]);
    }

    return transaction;
  }

  /**
   * 엔터키를 눌렀을 때 상태를 변경할 트랜잭션을 생성합니다.
   * @returns {Transaction} Enter키로 인해 생성된 트랜잭션
   */
  createEnterTransaction(): Transaction {
    const transaction = new Transaction(this.state.schema);

    return transaction;
  }
}

export default EditorView;
