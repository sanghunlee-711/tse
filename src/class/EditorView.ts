import EditorState from './EditorState';
import Transaction from './Transaction';
import NodeView from './NodeView';
import TSENode, { TSENodeContent } from './TSENode';
import { ResolvedPos, resolveFromPosition } from './Resolvedpos';

function findNodeByCarrotPosition(
  domNode: Node,
  offsetInDOM: number,
  rootNode: TSENode
): { node: TSENode; localOffset: number; absoluteOffset: number } | null {
  function traverse(
    node: TSENode,
    accumulatedOffset: number
  ): { node: TSENode; localOffset: number; absoluteOffset: number } | null {
    if (node.domRef === domNode) {
      // 현재 노드가 Carrot 위치에 대응되면 반환
      return {
        node,
        localOffset: offsetInDOM,
        absoluteOffset: accumulatedOffset + offsetInDOM,
      };
    }

    for (const child of node.content) {
      if (typeof child === 'string') {
        if (
          domNode.nodeType === Node.TEXT_NODE &&
          child.includes(domNode.textContent || '')
        ) {
          const localOffset = offsetInDOM; // 로컬 오프셋 계산
          return {
            node,
            localOffset,
            absoluteOffset: accumulatedOffset + localOffset,
          };
        }
        accumulatedOffset += child.length; // 문자열 길이 누적
      } else if (child instanceof TSENode) {
        const result = traverse(child, accumulatedOffset); // 재귀적으로 탐색
        if (result) return result;
        accumulatedOffset += child.weight; // 자식 노드의 가중치 누적
      }
    }

    return null; // 탐색 실패
  }

  return traverse(rootNode, 0);
}

interface Plugin {
  apply(view: EditorView, transaction: Transaction): void;
}

class EditorView {
  state: EditorState;
  rootElement: HTMLElement;
  nodeViews: Map<TSENode, NodeView>;
  plugins: Plugin[];
  transactionQueue: Transaction[]; // 트랜잭션 큐
  isProcessingQueue: boolean; // 현재 트랜잭션 큐가 처리 중인지 여부

  constructor(
    rootElement: HTMLElement,
    initialState: EditorState,
    plugins: Plugin[] = []
  ) {
    this.rootElement = rootElement;
    this.rootElement.setAttribute('contenteditable', 'true'); // contenteditable 추가
    this.state = initialState;
    this.nodeViews = new Map();
    this.plugins = plugins;
    this.transactionQueue = []; // 큐 초기화
    this.isProcessingQueue = false;

    // 초기 DOM 렌더링
    this.render();
    this.addEventListeners();
  }

  // // *TODO: 상태 변경 잘 반영되는 것 확인하고 고도화
  // updateState(newState: EditorState) {
  //   // 기존 상태와 새로운 상태를 비교하여 변경된 NodeView만 업데이트
  //   this.state = newState;

  //   const changes = this.state.doc.diff(newState.doc); // 변경된 부분 찾기 (예시로 diff 사용)
  //   changes.forEach((change) => {
  //     const node = change.node;
  //     const existingNodeView = this.nodeViews.get(node);

  //     if (existingNodeView) {
  //       // 기존 NodeView가 있다면 업데이트
  //       existingNodeView.update(node);
  //     } else {
  //       // 새로운 NodeView 생성
  //       const nodeView = this.renderNode(node);
  //       if (nodeView) {
  //         this.nodeViews.set(node, nodeView);
  //         this.rootElement.appendChild(nodeView.dom);
  //       }
  //     }
  //   });
  // }

  // 트랜잭션을 처리하고 EditorState를 업데이트
  dispatch(transaction: Transaction) {
    // 트랜잭션을 큐에 추가하고, 큐 처리 요청
    this.transactionQueue.push(transaction);
    this.processTransactionQueue(); // 트랜잭션 큐 처리 요청
  }

  updateState(newState: EditorState) {
    this.state = newState;
    this.render(); // 상태 변경 후 전체 문서를 다시 렌더링
  }

  // 트랜잭션 큐를 requestAnimationFrame을 사용해 처리
  private processTransactionQueue() {
    if (this.isProcessingQueue) return; // 이미 큐가 처리 중이면 중복 요청 방지

    this.isProcessingQueue = true;
    requestAnimationFrame(() => {
      // requestAnimationFrame이 호출될 때 트랜잭션 큐 처리 시작
      while (this.transactionQueue.length > 0) {
        const transaction = this.transactionQueue.shift();
        if (transaction) {
          const newState = this.state.apply(transaction);

          // 플러그인 적용
          this.plugins.forEach((plugin) => plugin.apply(this, transaction));

          // 상태 동기화 처리
          this.updateState(newState);
        }
      }
      this.isProcessingQueue = false; // 처리 완료 후 플래그 초기화
    });
  }

  // DOM에 전체 문서를 렌더링
  render() {
    this.rootElement.innerHTML = '';
    this.nodeViews.clear();

    // 문서의 각 노드를 NodeView로 렌더링
    this.state.doc.content.forEach((node) => {
      // 타입 검사: node가 TSENode인지 확인
      if (node instanceof TSENode) {
        const nodeView = this.renderNode(node);
        if (nodeView) {
          this.nodeViews.set(node, nodeView);
          this.rootElement.appendChild(nodeView.dom);
        }
      } else if (typeof node === 'string') {
        // node가 문자열일 경우 텍스트 노드로 렌더링
        const textNode = document.createTextNode(node);
        this.rootElement.appendChild(textNode);
      }
    });
  }

  // 개별 노드를 NodeView로 생성하고 렌더링
  renderNode(node: TSENode): NodeView | null {
    const nodeView = new NodeView(node);
    return nodeView;
  }

  // 전역 이벤트 리스너 등록
  addEventListeners() {
    this.rootElement.addEventListener('keydown', this.handleKeydown.bind(this));
    this.rootElement.addEventListener('click', this.handleClick.bind(this));
    this.rootElement.addEventListener('input', this.handleInput.bind(this)); // input 이벤트 추가
    this.rootElement.addEventListener(
      'mouseup',
      this.updateSelection.bind(this)
    ); // 선택 갱신
  }

  // 텍스트 입력을 처리하는 메서드
  handleInput(e: Event) {
    const event = e as InputEvent; // InputEvent로 캐스팅
    this.updateSelection();

    const selection = this.state.selection;

    // 텍스트 삽입 처리
    if (event.inputType === 'insertText') {
      const insertedText = event.data || '';

      if (insertedText) {
        this.insertText(insertedText);
      }
    }

    // 텍스트 삭제 처리
    if (event.inputType === 'deleteContentBackward') {
      this.deleteText(selection.from);
    }
  }

  resolvePosition(offset: number): { node: TSENode; localOffset: number } {
    let accumulatedOffset = 0;

    function traverse(
      node: TSENode
    ): { node: TSENode; localOffset: number } | null {
      for (const child of node.content) {
        if (typeof child === 'string') {
          const length = child.length;
          if (accumulatedOffset + length >= offset) {
            return { node, localOffset: offset - accumulatedOffset };
          }
          accumulatedOffset += length;
        } else if (child instanceof TSENode) {
          if (accumulatedOffset + child.weight >= offset) {
            return traverse(child);
          }
          accumulatedOffset += child.weight;
        }
      }
      return null;
    }

    const result = traverse(this.state.doc);
    if (!result) {
      throw new Error('Position out of bounds');
    }
    return result;
  }

  // 텍스트 삽입 트랜잭션 생성
  insertText(text: string) {
    // 현재 Selection의 시작 위치를 가져옴
    const { from } = this.state.selection;
    console.log({ from });
    // 커서 위치를 기반으로 노드와 로컬 오프셋 계산
    const { node, localOffset } = this.resolvePosition(from);

    if (!node || typeof node.content === 'string') {
      console.error('텍스트 삽입이 불가능한 위치입니다.');
      return;
    }

    // 텍스트 삽입 처리
    const updatedContent = [...node.content];
    if (typeof updatedContent[localOffset] === 'string') {
      // 현재 위치가 문자열이라면, 기존 텍스트에 추가
      updatedContent[localOffset] += text;
    } else {
      // 현재 위치가 노드라면, 새로운 문자열 추가
      updatedContent.splice(localOffset, 0, text);
    }

    // 트랜잭션을 생성하여 상태 업데이트
    const transaction = new Transaction(this.state.schema);
    transaction.updateNodeAttrs(this.state.doc.content.indexOf(node), {
      content: updatedContent,
    });

    this.dispatch(transaction);
  }

  // 텍스트 삭제 트랜잭션 생성
  deleteText(position: number) {
    const transaction = new Transaction(this.state.schema);
    transaction.updateNodeAttrs(position, { content: [] }); // 해당 위치의 콘텐츠를 삭제
    this.dispatch(transaction);
  }

  // 커서 위치를 기반으로 Selection 업데이트
  updateSelection() {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) {
      console.error('선택 영역이 없습니다.');
      return;
    }

    const range = selection.getRangeAt(0);
    const startNode = range.startContainer;
    const offsetInDOM = range.startOffset;

    const result = findNodeByCarrotPosition(
      startNode,
      offsetInDOM,
      this.state.doc
    );
    if (result) {
      this.state = this.state.setSelection({
        from: result.absoluteOffset,
        to: result.absoluteOffset,
      });
      console.log(
        `Selection updated: 
          node=${result.node.type},
          absoluteOffset=${result.absoluteOffset}
          
        `
      );
    }
  }

  // 키다운 이벤트 처리 (예: 단축키 처리)
  // handleKeydown(event: KeyboardEvent) {
  //   if (event.key === 'Enter') {
  //     event.preventDefault(); // 기본 Enter 키 동작 방지

  //     const selection = this.state.selection;
  //     const currentParagraphIndex = this.state.doc.content.findIndex(
  //       (node, index) =>
  //         index === selection.from &&
  //         node instanceof TSENode &&
  //         node.type === 'paragraph'
  //     );
  //     //TODO :커서가 집힌 위치에서 paragraph를 분리해야하는데 해당 노드의 인덱스를 찾아야함.
  //     console.log(currentParagraphIndex);

  //     if (currentParagraphIndex === -1) return;

  //     const currentParagraphNode = this.state.doc.content[
  //       currentParagraphIndex
  //     ] as TSENode;

  //     // 현재 커서 위치를 기준으로 텍스트를 나누기
  //     const beforeText = currentParagraphNode.content.slice(0, selection.from);
  //     const afterText = currentParagraphNode.content.slice(selection.from);

  //     // 기존 단락을 분할하여 새로운 단락을 추가하는 트랜잭션 생성
  //     const transaction = new Transaction(this.state.schema);

  //     // 기존 단락 업데이트
  //     transaction.updateNodeAttrs(currentParagraphIndex, {
  //       content: beforeText,
  //     });

  //     // 새로운 단락 추가
  //     const newParagraphNode = new TSENode('paragraph', {}, afterText);
  //     transaction.addNode(
  //       newParagraphNode.type,
  //       newParagraphNode.attrs,
  //       newParagraphNode.content
  //     );

  //     // 트랜잭션 처리
  //     this.dispatch(transaction);
  //   }
  // }

  handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault(); // 기본 Enter 키 동작 방지

      // 현재 Selection을 업데이트 (커서 위치를 기준으로)
      this.updateSelection();

      // 현재 상태에서 커서 위치 가져오기
      const selection = this.state.selection;
      const resolvedPos = this.resolvePosition(selection.from);
      console.log('@?', { resolvedPos });
      // 현재 커서가 위치한 노드 및 해당 노드에서의 오프셋을 구함
      const currentNode = resolvedPos.node;
      const localOffset = resolvedPos.localOffset;

      // 노드를 나누기 위한 작업
      if (currentNode instanceof TSENode) {
        const beforeText = currentNode.content.slice(0, localOffset);
        const afterText = currentNode.content.slice(localOffset);
        console.log({ beforeText, afterText });
        // 기존 단락을 분할하여 새로운 단락을 추가하는 트랜잭션 생성
        const transaction = new Transaction(this.state.schema);

        // 기존 단락 업데이트
        const currentNodeIndex = this.state.doc.content.indexOf(currentNode);
        if (currentNodeIndex !== -1) {
          transaction.updateNodeAttrs(currentNodeIndex, {
            content: beforeText,
          });

          // 새로운 단락 추가
          const newParagraphNode = new TSENode('paragraph', {}, afterText);
          transaction.addNode(
            newParagraphNode.type,
            newParagraphNode.attrs,
            newParagraphNode.content
          );

          // 트랜잭션 처리
          this.dispatch(transaction);
        }
      }
    }
  }

  // 클릭 이벤트 처리 (예: 노드 선택)
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const nodeView = Array.from(this.nodeViews.values()).find(
      (view) => view.dom === target
    );

    if (nodeView) {
      nodeView.selectNode();
      setTimeout(() => nodeView.deselectNode(), 2000); // 2초 후 선택 해제
    }
  }

  // 이벤트 리스너 제거 및 정리
  destroy() {
    this.rootElement.removeEventListener(
      'keydown',
      this.handleKeydown.bind(this)
    );
    this.rootElement.removeEventListener('click', this.handleClick.bind(this));

    // 모든 NodeView를 정리
    this.nodeViews.forEach((view) => view.destroy());
    this.nodeViews.clear();
    this.rootElement.innerHTML = ''; // DOM 초기화
  }

  // 플러그인 추가 기능
  addPlugin(plugin: Plugin) {
    this.plugins.push(plugin);
  }
}

export { EditorView, Plugin };
