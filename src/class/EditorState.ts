import TSENode from './TSENode';
import Transaction from './Transaction';
import Selection from './Selection';
import Schema from './Schema';

export interface EditorStateConfig {
  schema: Schema; // schema 속성 추가
  doc?: TSENode; // 문서의 초기 상태 (옵션)
}

class EditorState {
  schema: Schema; // schema 속성 추가
  doc: TSENode;
  selection: Selection;

  constructor(config: EditorStateConfig, selection: Selection) {
    this.schema = config.schema;
    this.doc = config.doc || this.schema.createNode('doc', {}, []);
    this.selection = selection;
  }

  apply(transaction: Transaction): EditorState {
    let updatedDoc = this.doc;

    transaction.steps.forEach((step) => {
      updatedDoc = step(updatedDoc);
    });

    updatedDoc.recalculateOffsets();
    this.doc;
    return new EditorState(
      { schema: this.schema, doc: updatedDoc },
      this.selection
    );
  }

  private validateRange(stateStartOffset: number, stateEndOffset: number) {
    if (
      stateStartOffset < this.doc.startOffset ||
      stateEndOffset > this.doc.endOffset
    ) {
      throw new Error(
        `범위에 맞지 않은 노드 탐색입니다, ${this.doc.type}, ${stateStartOffset} ${stateEndOffset}`
      );
    }
  }

  getNodeFrom(stateStartOffset: number, stateEndOffset: number) {
    this.validateRange(stateStartOffset, stateEndOffset);

    const dfs = (node: TSENode): TSENode | null => {
      //base case
      if (
        node.startOffset <= stateStartOffset &&
        node.endOffset >= stateEndOffset
      ) {
        const contents = node.content;

        for (let i = 0; i < contents.length; i++) {
          const content = contents[i];

          //현재 컨텐츠가 TSENode인 경우 계속 탐색을 이어간다.
          if (content instanceof TSENode) {
            const foundNodeAndOffset = dfs(content);
            if (foundNodeAndOffset) return foundNodeAndOffset;
          }
        }

        //TSENode에 해당하지 않는 경우 현재 컨텐츠를 가진 노드를 반환한다.
        return node;
      }

      return null;
    };
    const result = dfs(this.doc);
    if (!result)
      throw new Error('TSENode찾기에 실패하였습니다. 범위를 확인해주세요');
    return result;
  }

  getWindowNodeFrom(
    stateStartOffset: number,
    stateEndOffset: number,
    rootElement: HTMLElement
  ): Node {
    const docNode = this.doc;

    // TSENode와 DOM Node를 동기적으로 순회하는 헬퍼 함수
    const findNode = (
      tseNode: TSENode,
      windowNode: Node,
      start: number,
      end: number
    ): Node | null => {
      // 현재 tseNode 범위 내에 offset이 있는지 확인
      if (end < tseNode.startOffset || start > tseNode.endOffset) {
        // 범위 밖이라면 null 반환
        return null;
      }

      // tseNode가 문자열만 가지고 있는 경우(leaf)거나,
      // 또는 단일 자식 문자열을 처리하는 경우를 대비한 로직
      // tseNode.content는 string | TSENode 의 배열
      // windowNode.childNodes 또는 windowNode 자체의 textContent와 매칭을 시도

      // childNodes를 순회하기 위한 인덱스
      let windowChildIndex = 0;
      for (let i = 0; i < tseNode.content.length; i++) {
        const child = tseNode.content[i];

        if (typeof child === 'string') {
          // 문자열 컨텐츠 처리
          const textContent = child;
          const textLength = textContent.length;
          const childStart =
            tseNode.startOffset +
            (child === tseNode.content[0]
              ? 0
              : textContent === child
                ? textContent.length
                : 0);
          // 위 계산은 각 child 별 startOffset 구하기 위해서인데,
          // 이미 tseNode가 전체 범위(startOffset, endOffset)를 갖고 있고,
          // content를 순서대로 순회하면서 누적하며 계산해야 한다.
          // 더 명확히 하기 위해 누적 오프셋을 추적하자.

          // 대신 tseNode가 각 child마다 오프셋을 가지지 않으므로
          // 아래와 같이 순회하면서 누적 오프셋을 계산
        }
      }

      // --- 오프셋 누적을 위한 별도 로직 ---
      // 각 child를 순회하며 현재 tseNode 내에서의 상대적 offset를 계산한다.
      let accumulatedOffsetInNode = tseNode.startOffset;
      for (let i = 0; i < tseNode.content.length; i++) {
        const child = tseNode.content[i];
        const domChild = windowNode.childNodes[windowChildIndex];

        if (typeof child === 'string') {
          const textLength = child.length;
          const childStartOffset = accumulatedOffsetInNode;
          const childEndOffset = accumulatedOffsetInNode + textLength - 1;

          if (childStartOffset <= end && childEndOffset >= start) {
            // 오프셋이 이 문자열 범위 안에 들어있음
            // 이 경우 해당 문자열을 가진 노드를 반환해야 함
            // domChild는 텍스트 노드일 것이며, tseNode에 따라 상위 엘리먼트를 반환
            // 하지만 테스트 요구사항 상 해당 오프셋이 속한 tseNode의 대표 DOM 요소를 반환
            return windowNode.nodeType === Node.ELEMENT_NODE
              ? windowNode
              : domChild;
          }

          accumulatedOffsetInNode += textLength;
          windowChildIndex++;
        } else if (child instanceof TSENode) {
          // 자식 노드 범위
          const childStartOffset = child.startOffset;
          const childEndOffset = child.endOffset;

          if (childEndOffset >= start && childStartOffset <= end) {
            // 오프셋 범위가 자식 노드 범위 내에 있음
            const result = findNode(child, domChild, start, end);
            if (result) return result;
          }

          accumulatedOffsetInNode = childEndOffset + 1;
          windowChildIndex++;
        }
      }

      // 현재 tseNode 범위 내에 있으나 자식 순회에서도 못 찾은 경우,
      // 혹은 정확히 자식 노드를 경계로 오프셋이 맞는 경우
      // 이 경우도 현재 tseNode를 대표하는 DOM 노드를 반환
      // 예: 문단 끝 오프셋일 때 문단 노드(p)를 반환해야 하는 경우.
      if (
        tseNode.startOffset <= end &&
        tseNode.endOffset >= start &&
        windowNode.nodeType === Node.ELEMENT_NODE
      ) {
        return windowNode;
      }

      return null;
    };

    const result = findNode(
      docNode,
      rootElement,
      stateStartOffset,
      stateEndOffset
    );
    if (!result) {
      throw new Error('실제 DOM에서 찾을 수 없는 offset 범위입니다.');
    }

    return result;
  }

  getWindowOffsetFrom(
    stateStartOffset: number,
    stateEndOffset: number,
    rootElement: HTMLElement
  ): { windowStartOffset: number; windowEndOffset: number } | null {
    this.validateRange(stateStartOffset, stateEndOffset);

    const findOffsets = (
      tseNode: TSENode,
      domNode: Node,
      startOffset: number,
      endOffset: number
    ): { windowStartOffset: number; windowEndOffset: number } | null => {
      // tseNode 범위 밖이라면 처리 불필요
      if (endOffset < tseNode.startOffset || startOffset > tseNode.endOffset) {
        return null;
      }

      // tseNode 범위 내부일 경우 상대 오프셋 계산
      const relativeStart = Math.max(startOffset - tseNode.startOffset, 0);
      const relativeEnd = Math.min(
        endOffset - tseNode.startOffset,
        tseNode.endOffset - tseNode.startOffset
      );
      // doc 내 절대 오프셋을 tseNode 내 상대 오프셋으로 변환
      // relativeStart, relativeEnd는 tseNode 내부에서의 오프셋 위치를 나타냄

      let currOffset = 0; // tseNode 내부에서 content를 순회하며 offset 위치 추적
      const domChildren = Array.from(domNode.childNodes);

      for (let i = 0; i < tseNode.content.length; i++) {
        const content = tseNode.content[i];
        const domChild = domChildren[i];

        if (typeof content === 'string') {
          const length = content.length;
          const childStart = currOffset;
          const childEnd = currOffset + length; // childEnd는 해당 문자열의 끝 직후 위치

          // 문자열 범위 내에 relativeStart~relativeEnd가 포함되는지 확인
          if (childStart <= relativeEnd && childEnd >= relativeStart) {
            // 이 문자열 안에 offset 범위가 걸쳐있음
            // 문자열 내 상대 위치 계산
            const windowStartOffset = Math.max(relativeStart - childStart, 0);
            const windowEndOffset = Math.min(relativeEnd - childStart, length);

            return { windowStartOffset, windowEndOffset };
          }

          currOffset += length;
        } else if (content instanceof TSENode) {
          const result = findOffsets(content, domChild, startOffset, endOffset);
          if (result) return result;

          currOffset += content.endOffset - content.startOffset;
        }
      }

      // 정확히 content들 사이의 경계나 노드의 끝 위치 등에 걸치는 경우 처리
      // 예: 문단 끝이나 시작 부분에 정확히 매칭될 경우를 처리하기 위해
      // relativeStart == relativeEnd일 때, 해당 지점에서 0,0 반환 가능
      if (relativeStart === relativeEnd) {
        return {
          windowStartOffset: relativeStart,
          windowEndOffset: relativeEnd,
        };
      }

      return null;
    };

    const result = findOffsets(
      this.doc,
      rootElement,
      stateStartOffset,
      stateEndOffset
    );
    if (!result) {
      throw new Error(
        `범위를 벗어난 offset입니다. startOffset:${stateStartOffset}, endOffset:${stateEndOffset}`
      );
    }
    return result;
  }

  toJSON(): any {
    return {
      schema: this.schema.spec, // 스키마 스펙만 직렬화
      doc: this.doc.toJSON(), // 문서 내용을 JSON 형식으로 직렬화
      selection: this.selection,
    };
  }
}

export default EditorState;
