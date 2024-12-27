import TSENode from './TSENode';
import Transaction from './Transaction';
import Selection from './Selection';
import Schema from './Schema';
import { OFFSET_DELIMITER } from '@src/constants/delimiter';
import { getNodeContentWith } from '@src/utils/offset';

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

  /**
   * @description offset을 통해 node의 content와 해당 content의 Index를 반환 합니다.
   * @param stateStartOffset
   * @param stateEndOffset
   */
  getNodeContentFrom(stateStartOffset: number, stateEndOffset: number) {
    this.validateRange(stateStartOffset, stateEndOffset);
    const result = getNodeContentWith(
      stateStartOffset,
      stateEndOffset,
      this.doc
    );

    if (!result) {
      throw new Error(
        '해당 범위에 해당하는 content를 찾을 수 없습니다. 범위를 확인해주세요.'
      );
    }

    return result;
  }

  getWindowNodeFrom(
    stateStartOffset: number,
    stateEndOffset: number,
    rootElement: HTMLElement
  ): Node {
    const docNode = this.doc;

    const findNode = (
      tseNode: TSENode,
      windowNode: Node,
      start: number,
      end: number
    ): Node | null => {
      if (end < tseNode.startOffset || start > tseNode.endOffset) {
        return null;
      }

      let currOffset = tseNode.startOffset;
      const domChildren = Array.from(windowNode.childNodes);

      for (let i = 0; i < tseNode.content.length; i++) {
        const content = tseNode.content[i];
        const domChild = domChildren[i];

        if (typeof content === 'string') {
          const contentLength = content.length;
          const childStart = currOffset;
          const childEnd = currOffset + contentLength;

          // ✅ 정확히 해당 offset 범위에 속하는 경우, 텍스트 노드 반환
          if (childStart <= start && childEnd >= end) {
            return domChild;
          }

          currOffset += contentLength;
        } else if (content instanceof TSENode) {
          // ✅ 자식 `TSENode`에 진입하기 전에 `currOffset`을 정확히 재설정
          currOffset = content.startOffset;
          const result = findNode(content, domChild, start, end);
          if (result) return result;

          // ✅ `TSENode`를 순회한 후 `currOffset` 갱신
          currOffset = content.endOffset + 1;
        }
      }

      // ✅ 만약 `stateStartOffset`과 `stateEndOffset`이 노드의 경계라면 부모 노드를 반환
      if (
        tseNode.startOffset <= start &&
        tseNode.endOffset >= end &&
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

  /**
   * @description offset을 통해 동일 레벨의 content 배열을 반환합니다.
   * @param stateStartOffset
   * @param stateEndOffset
   */
  getSiblingContentFrom(stateStartOffset: number, stateEndOffset: number) {
    this.validateRange(stateStartOffset, stateEndOffset);

    const dfs = (
      node: TSENode
    ): {
      node: TSENode;
      contents: Array<string | TSENode>;
    } | null => {
      const isInsideNode =
        node.startOffset <= stateStartOffset &&
        node.endOffset >= stateEndOffset;

      if (!isInsideNode) return null;

      const contents = node.content;
      let currentOffset = node.startOffset;
      let contentLength: number;

      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];

        if (typeof content === 'string') {
          contentLength = content.length;
        } else {
          contentLength =
            content.endOffset - content.startOffset + OFFSET_DELIMITER;
        }

        const contentStart = currentOffset;
        const contentEnd = currentOffset + contentLength;

        const isInsideContent =
          contentStart <= stateStartOffset && contentEnd >= stateEndOffset;

        if (isInsideContent) {
          if (content instanceof TSENode) {
            const found = dfs(content);
            if (found) return found;
          } else {
            return { node, contents }; // Return the contents of the current node
          }
        }

        currentOffset += contentLength;
      }

      return null;
    };

    const result = dfs(this.doc);

    if (!result) {
      throw new Error(
        '해당 범위에 해당하는 content를 찾을 수 없습니다. 범위를 확인해주세요.'
      );
    }

    return result.contents; // Return only the contents array
  }

  /**
   * @description 현재 content가 포함된 paragraph Index를 반환한다.
   * @TLDR; Paragraph안에 Paragraph가 존재할 일은 없다는 가정하에 진행.
   * @param stateStartOffset
   * @param stateEndOffset
   */
  getParagraphIdxFrom(
    stateStartOffset: number,
    stateEndOffset: number
  ): number {
    this.validateRange(stateStartOffset, stateEndOffset);

    const traverse = (node: TSENode): number | null => {
      //base case
      const paragraphContents = node.content;
      for (let i = 0; i < paragraphContents.length; i++) {
        const currContent = paragraphContents[i] as TSENode;

        const isInsideNode =
          currContent.startOffset <= stateStartOffset &&
          currContent.endOffset >= stateEndOffset;

        if (isInsideNode) {
          return i;
        }
      }
      return null;
    };

    const result = traverse(this.doc);

    if (result === null)
      throw new Error(
        'Paragraph Index 찾기에 실패하였습니다. 범위를 확인해주세요'
      );
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
