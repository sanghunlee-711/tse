import TSENode from './TSENode';
import Transaction from './Transaction';
import Selection from './Selection';
import Schema from './Schema';
import { OFFSET_DELIMITER } from '@src/constants/delimiter';

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
    let accumulatedOffset = 0;

    const traverse = (
      windowNode: ChildNode,
      tseNode?: TSENode
    ): Node | null => {
      if (windowNode.nodeType === Node.TEXT_NODE) {
        const textLength = windowNode.textContent?.length || 0;

        // 상태의 시작과 끝 오프셋이 현재 노드 범위에 속하는 경우 반환
        if (
          accumulatedOffset + textLength > stateStartOffset &&
          accumulatedOffset <= stateEndOffset
        ) {
          return windowNode;
        }

        accumulatedOffset += textLength;
      } else if (windowNode.nodeType === Node.ELEMENT_NODE && tseNode) {
        const tseChildren = tseNode.content;
        let windowChildIndex = 0; // DOM 노드의 인덱스 추적

        for (const tseChild of tseChildren) {
          const windowChildNode = windowNode.childNodes[windowChildIndex];

          if (typeof tseChild === 'string') {
            // 텍스트 콘텐츠를 처리
            const textLength = tseChild.length;

            if (
              accumulatedOffset + textLength > stateStartOffset &&
              accumulatedOffset <= stateEndOffset
            ) {
              return windowChildNode?.nodeType === Node.TEXT_NODE
                ? windowChildNode
                : null;
            }

            accumulatedOffset += textLength;
            windowChildIndex++;
          } else if (tseChild instanceof TSENode) {
            // 중첩된 TSENode를 처리
            const result = traverse(
              windowNode.childNodes[windowChildIndex],
              tseChild
            );

            if (result) return result;

            // 중첩된 노드의 길이를 오프셋에 추가
            accumulatedOffset += tseChild.endOffset - tseChild.startOffset;

            // DOM 인덱스 증가
            windowChildIndex++;
          }
        }

        // 문단 노드의 경우 OFFSET_DELIMITER 추가
        if (tseNode.type === 'paragraph') {
          accumulatedOffset += OFFSET_DELIMITER;
        }
      }
      return null;
    };

    const result = traverse(rootElement, this.doc);

    if (!result)
      throw new Error('실제 DOM에서 찾을 수 없는 offset 범위입니다.');

    return result;
  }

  getWindowOffsetFrom(
    stateStartOffset: number,
    stateEndOffset: number,
    rootElement: HTMLElement
  ): { windowStartOffset: number; windowEndOffset: number } | null {
    this.validateRange(stateStartOffset, stateEndOffset);

    const dfs = (
      tseNode: TSENode,
      domNode: Node,
      baseOffset: number
    ): { windowStartOffset: number; windowEndOffset: number } | null => {
      if (
        tseNode.startOffset <= stateStartOffset &&
        tseNode.endOffset >= stateEndOffset
      ) {
        let currOffset = baseOffset;
        const domChildren = Array.from(domNode.childNodes);

        for (let i = 0; i < tseNode.content.length; i++) {
          const content = tseNode.content[i];
          const domChild = domChildren[i];

          if (typeof content === 'string') {
            const length = content.length;

            if (
              currOffset + length > stateStartOffset &&
              currOffset <= stateEndOffset
            ) {
              const windowStartOffset = stateStartOffset - currOffset;
              const windowEndOffset = Math.min(
                stateEndOffset - currOffset,
                length
              );
              return { windowStartOffset, windowEndOffset };
            }

            currOffset += length;
          } else if (content instanceof TSENode) {
            const result = dfs(content, domChild, currOffset);
            if (result) return result;

            // 자식 노드 처리 후 오프셋 갱신
            currOffset += content.endOffset - content.startOffset;
          }
        }

        // 만약 정확히 노드 끝 경계에 맞추어진 경우를 처리
        if (currOffset === stateStartOffset) {
          return { windowStartOffset: 0, windowEndOffset: 0 };
        }
      }

      return null;
    };

    const result = dfs(this.doc, rootElement, 0);
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
