import EditorState from './EditorState';
import Transaction from './Transaction';
import NodeView from './NodeView';
import TSENode from './TSENode';
import Selection from './Selection';
import EditorPlugin from './plugins/EditorPlugin';

class EditorView {
  state: EditorState;
  rootElement: HTMLElement;
  selection: Selection;
  plugins: EditorPlugin[];

  constructor(
    rootElement: HTMLElement,
    initialState: EditorState,
    plugins: EditorPlugin[]
  ) {
    this.rootElement = rootElement;
    this.state = initialState;

    this.selection = new Selection(this.state.doc);
    this.plugins = plugins;

    this.initialRender();
    this.addEventListeners();
    this.initializePlugins();
  }

  initializePlugins() {
    this.plugins.forEach((plugin) => plugin.onInit?.(this));
  }

  /**
   * 트랜잭션을 처리하고 상태를 업데이트합니다.
   * @param {Transaction} transaction - 실행할 트랜잭션
   */
  dispatch(transaction: Transaction, triggerPlugin?: EditorPlugin) {
    this.state = this.state.apply(transaction);
    this.state.selection = this.selection;
    this.state.selection.updateRootNode(this.state.doc);
    this.state.selection.updateSelection();
    this.syncDOM(transaction);

    if (triggerPlugin && triggerPlugin.afterSyncDOM) {
      triggerPlugin.afterSyncDOM(transaction, this);
    }
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
  }

  /**
   * @descriptions 초기에 DOM에 상태를 렌더합니다.
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
   * @descriptions 이벤트 리스너를 추가합니다.
   */
  addEventListeners() {
    this.plugins.forEach((plugin) => {
      this.rootElement.addEventListener(plugin.eventType, (e) => {
        e.preventDefault();
        plugin.on(e as Event, this);
      });
    });
  }
}

export default EditorView;
