import EditorState from './EditorState';
import Transaction from './Transaction';
import NodeView from './NodeView';
import TSENode from './TSENode';
import Selection from './Selection';
import { updateContent } from '@src/utils/offset';

// * TODO: createEnterTransaction등을 Plugin으로 제공할 수 있도록 추상화 추후에 필요
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

  updateState(newState: EditorState, transaction: Transaction) {
    this.state = newState;

    // 상태가 업데이트된 이후 Selection도 업데이트
    this.selection.updateRootNode(this.state.doc);
    this.selection.updateSelection();
    this.state.selection = this.selection;
    this.syncDOM(transaction);
  }

  private updateDOM(from: number, to: number) {
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
        const nodeView = new NodeView(node);
        //*TODO: mergeParagraph를 한다면 .. existingChild를 그냥 대체하는게 아닌 추가 조건이 필요해보임.

        if (existingChild) {
          // 기존 DOM 노드가 있다면 교체
          this.rootElement.replaceChild(nodeView.dom, existingChild);
        } else {
          // 기존 DOM 노드가 없으면 새로 추가
          this.rootElement.appendChild(nodeView.dom);
        }
      }
    }
  }

  private removeUselessDOM() {
    while (this.rootElement.childNodes.length > this.state.doc.content.length) {
      this.rootElement.removeChild(
        this.rootElement.childNodes[this.state.doc.content.length]
      );
    }
  }

  private syncDOM(transaction: Transaction) {
    if (transaction.changedRange) {
      const { from, to } = transaction.changedRange;

      // 변경된 범위의 DOM 노드를 갱신
      this.updateDOM(from, to);

      // 변경된 범위 이후의 초과된 기존 DOM 노드 제거
      this.removeUselessDOM();
    }

    /**
     * @descriptions 해당 DOM Node가 rerender될 때 캐럿의 포인트를 적절하게 유지하기 위함.
     *
     **/

    this.updateCarrotPosition(
      transaction.startOffset || 0,
      transaction.endOffset || 0
    );
  }

  /**
   * @descriptions DOM Node가 rerender될 때 현재 캐럿 및 Selection의 위치를 적절하게 유지하기 위한 메서드.
   * [x] 새로운 글자를 타이핑 하는 경우, 캐럿 위치는 글자가 주입된 다음에 위치해야 한다.
   * [x] 기존의 글자를 지우는 경우, 캐럿 위치는 글자가 주입된 이전에 위치애햐 한다.
   * [ ] 노드의 마지막에서 엔터가 된 경우, 새로운  문단의 첫번째 위치에 캐럿이 위치 해야한다.
   * [ ] 노드의 중간 위치에서 엔터가 된 경우, 새로운 문단의 첫번째 위치에 캐럿이 위치 해야한다.
   * [ ] 노드의 첫번째 위치에서 backSpace가 된 경우 이전 노드의 마지막에 캐럿이 위치 해야한다.
   * @param startOffset
   * @param endOffset
   * @returns
   */
  updateCarrotPosition(startOffset: number, endOffset: number) {
    const selection = window.getSelection();

    if (!selection || !this.rootElement) {
      console.warn('Unable to update selection.');
      return;
    }
    const { windowStartOffset, windowEndOffset } =
      this.state.getWindowOffsetFrom(startOffset, endOffset);
    const windowNode = this.state.getWindowNodeFrom(
      startOffset,
      endOffset,
      this.rootElement
    );
    const range = document.createRange();

    range.setStart(windowNode, windowStartOffset + 1);
    range.setEnd(windowNode, windowEndOffset + 1);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * 트랜잭션을 처리하고 상태를 업데이트합니다.
   * @param {Transaction} transaction - 실행할 트랜잭션
   */
  dispatch(transaction: Transaction) {
    const newState = this.state.apply(transaction);
    this.updateState(newState, transaction);
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
    } else if (event.inputType === 'insertParagraph') {
      //enter처리
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
    const node = this.state.getNodeFrom(startOffset, endOffset);
    const localOffset = this.state.getWindowOffsetFrom(startOffset, endOffset);

    // const resolvedPos = this.state.resolvePosition(startOffset);

    console.log({ node, localOffset, startOffset, endOffset });
    const transaction = new Transaction(this.state);

    const updatedContent = updateContent(
      node.content,
      localOffset.windowStartOffset,
      text
    );
    transaction.updateNodeContents(
      this.state.doc.content.indexOf(node),
      updatedContent
    );

    return transaction;
  }

  /**
   *
   * @param transaction
   * @param prevNode
   * @param currentNode
   */
  private mergeParagraphs(
    transaction: Transaction,
    prevNode: TSENode,
    currentNode: TSENode
  ): Transaction {
    // 이전 문단의 내용과 현재 문단의 내용을 병합
    const mergedContent = [
      ...prevNode.content,
      ...(typeof currentNode.content === 'string'
        ? [currentNode.content]
        : currentNode.content),
    ];
    const currentIndex = this.state.doc.content.indexOf(currentNode);

    // 이전 문단 업데이트
    transaction.updateNodeContents(currentIndex, mergedContent);
    // transaction.updateNodeContents(currentIndex, []);
    return transaction;
  }

  /**
   * 텍스트 삭제 트랜잭션을 생성합니다.
   * @returns {Transaction} 생성된 트랜잭션
   */
  createDeleteTransaction(): Transaction {
    const { startOffset, endOffset } = this.selection;
    const node = this.state.getNodeFrom(startOffset, endOffset);
    const localOffset = this.state.getWindowOffsetFrom(startOffset, endOffset);
    const transaction = new Transaction(this.state);

    // Offset 수정
    transaction.modifyTransactionOffset(
      this.state.selection.startOffset - 2,
      this.state.selection.endOffset - 2
    );

    const nodeIndex = this.state.doc.content.indexOf(node);

    if (localOffset.windowStartOffset === 0 && nodeIndex > 0) {
      // 현재 노드의 첫 번째 인덱스이며, 이전 문단이 존재하는 경우 병합 처리
      const prevNode = this.state.doc.content[nodeIndex - 1];

      if (prevNode instanceof TSENode && node instanceof TSENode) {
        return this.mergeParagraphs(transaction, prevNode, node);
      }
    } else {
      // 일반 삭제 처리
      if (node.content.length > 0) {
        node.content.forEach((eachContent) => {
          if (typeof eachContent === 'string') {
            const updatedEachContent =
              (eachContent as string).slice(
                0,
                localOffset.windowStartOffset - 1
              ) + (eachContent as string).slice(localOffset.windowEndOffset);

            transaction.updateNodeContents(
              this.state.doc.content.indexOf(node),
              [updatedEachContent]
            );
          }
        });
      }
    }

    return transaction;
  }

  /**
   * 엔터키를 눌렀을 때 상태를 변경할 트랜잭션을 생성합니다.
   * @returns {Transaction} Enter키로 인해 생성된 트랜잭션
   */
  createEnterTransaction(): Transaction {
    const { startOffset, endOffset } = this.selection;
    //엔터키 클릭 시 해당 커서가 위치한 노드의 다음 부분 부터는 새로운 노드를 만들어 현재노드의 다음노드로 넣고
    //위치한 커서의 다음 내용부터는 다음 노드에 넣어줘야한다.
    const node = this.state.getNodeFrom(startOffset, endOffset);
    const localOffset = this.state.getWindowOffsetFrom(startOffset, endOffset);

    const transaction = new Transaction(this.state);
    if (node.content.length) {
      node.content.forEach((eachContent, idx) => {
        if (typeof eachContent === 'string') {
          const updatedCurrentContent = (eachContent as string).slice(
            0,
            localOffset.windowStartOffset
          );
          const nextNodeContent = (eachContent as string).slice(
            localOffset.windowStartOffset
          );

          const currNodeIdx = this.state.doc.content.indexOf(node);

          transaction.updateNodeContents(currNodeIdx, [updatedCurrentContent]);

          transaction.addNode(
            node.type,
            node.attrs,
            [nextNodeContent],
            currNodeIdx
          );
        }
      });
    }

    return transaction;
  }
}

export default EditorView;
