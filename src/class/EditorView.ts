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

    this.initialRender();
    this.addEventListeners();
  }

  udpateState(newState: EditorState, transaction: Transaction) {
    // const prevState = this.state;
    this.state = newState;
    // 상태가 업데이트된 이후 Selection도 업데이트

    this.selection.updateRootNode(this.state.doc);
    this.selection.updateSelection();
    this.state.selection = this.selection;
    this.syncDOM(transaction);
  }

  syncDOM(transaction: Transaction) {
    if (transaction.changedRange) {
      const { from, to } = transaction.changedRange;

      // 변경된 범위의 DOM 노드를 갱신
      for (let i = from; i < to; i++) {
        const node = this.state.doc.content[i];
        const existingChild = this.rootElement.childNodes[i]; // 기존 DOM 노드

        if (typeof node === 'string') {
          // 문자열일 경우 텍스트 노드로 처리
          const textNode = document.createTextNode(node);

          if (existingChild) {
            // 기존 DOM 노드가 있다면 교체
            if (existingChild.nodeType === Node.TEXT_NODE) {
              // 기존 노드가 텍스트 노드라면 내용만 변경
              existingChild.textContent = node;
            } else {
              // 다른 노드라면 교체
              this.rootElement.replaceChild(textNode, existingChild);
            }
          } else {
            // 기존 DOM 노드가 없으면 새로 추가
            this.rootElement.appendChild(textNode);
          }
        } else if (node instanceof TSENode) {
          // TSENode일 경우 NodeView 생성 및 추가
          const nodeView = new NodeView(node);

          if (existingChild) {
            // 기존 DOM 노드가 있다면 교체
            this.rootElement.replaceChild(nodeView.dom, existingChild);
          } else {
            // 기존 DOM 노드가 없으면 새로 추가
            this.rootElement.appendChild(nodeView.dom);
          }
        }
      }

      // 변경된 범위 이후의 초과된 기존 DOM 노드 제거
      while (
        this.rootElement.childNodes.length > this.state.doc.content.length
      ) {
        this.rootElement.removeChild(
          this.rootElement.childNodes[this.state.doc.content.length]
        );
      }
    }

    this.updateCarrotPosition(
      transaction.startOffset || 0,
      transaction.endOffset || 0
    );
  }

  updateCarrotPosition(startOffset: number, endOffset: number) {
    const selection = window.getSelection();
    console.log('updateCarrotPos!', startOffset, endOffset);
    if (!selection || !this.rootElement) {
      console.warn('Unable to update selection.');
      return;
    }

    const range = document.createRange();
    let accumulatedOffset = 0;

    const traverse = (node: ChildNode): boolean => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;
        if (accumulatedOffset + textLength >= startOffset) {
          const localOffset = startOffset - accumulatedOffset;
          range.setStart(node, localOffset);
          range.setEnd(node, localOffset + (endOffset - startOffset));
          return true;
        }
        accumulatedOffset += textLength;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (const child of node.childNodes) {
          if (traverse(child)) return true;
        }
      }
      return false;
    };

    traverse(this.rootElement);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * 트랜잭션을 처리하고 상태를 업데이트합니다.
   * @param {Transaction} transaction - 실행할 트랜잭션
   */
  dispatch(transaction: Transaction) {
    const newState = this.state.apply(transaction);

    this.udpateState(newState, transaction);
  }

  /**
   * DOM을 렌더링합니다.
   */
  initialRender() {
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
    const { startOffset, endOffset } = this.selection;

    const resolvedPos = this.state.resolvePosition(startOffset);

    if (!resolvedPos) {
      throw new Error('Failed to resolve position for insertText.');
    }

    const { node, localOffset } = resolvedPos;

    const transaction = new Transaction(this.state);
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
    const { startOffset, endOffset } = this.selection;

    const resolvedPos = this.state.resolvePosition(startOffset);

    if (!resolvedPos) {
      throw new Error('Failed to resolve position for deleteContentBackward.');
    }

    const { node, localOffset } = resolvedPos;

    const transaction = new Transaction(this.state);

    if (node.content.length > 0) {
      node.content.forEach((eachContent) => {
        if (typeof eachContent === 'string') {
          const updatedEachContent =
            (eachContent as string).slice(0, localOffset - 1) +
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
   * 엔터키를 눌렀을 때 상태를 변경할 트랜잭션을 생성합니다.
   * @returns {Transaction} Enter키로 인해 생성된 트랜잭션
   */
  createEnterTransaction(): Transaction {
    const transaction = new Transaction(this.state);

    return transaction;
  }
}

export default EditorView;
