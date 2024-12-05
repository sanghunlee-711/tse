import TSENode from './TSENode';

class NodeView {
  node: TSENode;
  dom: HTMLElement;
  selected: boolean;

  constructor(node: TSENode) {
    this.node = node;
    this.dom = this.createDOM();
    this.selected = false;
    this.addEventListeners();
  }

  // 노드의 DOM 요소를 생성하는 메서드
  createDOM(): HTMLElement {
    let element: HTMLElement;

    if (this.node.type === 'paragraph') {
      element = document.createElement('p');
    } else if (this.node.type === 'heading') {
      element = document.createElement(`h${this.node.attrs.level || 1}`);
    } else {
      element = document.createElement('div');
    }

    // 속성과 콘텐츠 추가
    this.updateAttributes(element);
    this.updateContent(element);

    return element;
  }

  // DOM의 속성을 업데이트하는 메서드
  private updateAttributes(element: HTMLElement) {
    if (this.node.attrs) {
      Object.entries(this.node.attrs).forEach(([key, value]) => {
        if (value) {
          element.setAttribute(key, value as string);
        } else {
          element.removeAttribute(key);
        }
      });
    }
  }

  // DOM의 콘텐츠를 업데이트하는 메서드
  private updateContent(element: HTMLElement) {
    this.node.content.forEach((eachContent) => {
      if (typeof eachContent === 'string') {
        element.innerHTML += eachContent;
      } else {
        //여긴 추후 이미지 할 때 고려..
      }
    });
  }

  // 노드가 업데이트될 때 DOM을 갱신하는 메서드
  update(newNode: TSENode): boolean {
    if (newNode.type !== this.node.type) {
      return false;
    }

    this.node = newNode;

    // 속성 업데이트
    this.updateAttributes(this.dom);

    // 콘텐츠가 변경된 경우에만 텍스트 업데이트
    const newTextContent = newNode.content.join('');
    if (this.dom.textContent !== newTextContent) {
      this.updateContent(this.dom);
    }

    return true;
  }

  // 선택 상태를 관리하는 메서드
  selectNode() {
    this.selected = true;
    this.dom.classList.add('selected-node');
    this.dom.style.outline = '1px solid gray';

    setTimeout(() => {
      this.deselectNode();
    }, 500);
  }

  deselectNode() {
    this.selected = false;
    this.dom.classList.remove('selected-node');
    this.dom.style.outline = '';
  }

  // 클릭 이벤트 핸들러
  onClick(event: MouseEvent) {
    if (!this.selected) {
      this.selectNode();
    } else {
      this.deselectNode();
    }
  }

  // NodeView에 필요한 이벤트 리스너 추가
  private addEventListeners() {
    this.dom.addEventListener('click', this.onClick.bind(this));
  }

  // 이벤트 리스너 제거
  private removeEventListeners() {
    this.dom.removeEventListener('click', this.onClick.bind(this));
  }

  // 노드가 제거될 때 DOM 리소스를 정리하는 메서드
  destroy() {
    this.removeEventListeners();
    this.dom.remove();
  }

  // 특정 DOM 변경이 무시되도록 설정하는 메서드
  ignoreMutation(mutation: MutationRecord): boolean {
    return mutation.type !== 'characterData'; // 텍스트 변경 외의 변경을 무시
  }

  // 커스텀 클래스 추가 메서드
  addClass(className: string) {
    this.dom.classList.add(className);
  }

  // 커스텀 클래스 제거 메서드
  removeClass(className: string) {
    this.dom.classList.remove(className);
  }
}

export default NodeView;
