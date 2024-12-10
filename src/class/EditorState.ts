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

        if (
          accumulatedOffset + textLength > stateStartOffset &&
          accumulatedOffset <= stateEndOffset
        ) {
          const localStart = Math.max(stateStartOffset - accumulatedOffset, 0);
          const localEnd = Math.min(
            stateEndOffset - accumulatedOffset,
            textLength
          );

          return windowNode;
        }

        accumulatedOffset += textLength;
      } else if (windowNode.nodeType === Node.ELEMENT_NODE && tseNode) {
        const tseChildren = tseNode.content;

        for (let i = 0; i < windowNode.childNodes.length; i++) {
          const windowChildNode = windowNode.childNodes[i];
          const tseChild = tseChildren[i];

          const result = traverse(
            windowChildNode,
            tseChild instanceof TSENode ? tseChild : undefined
          );

          if (result) return result;

          /**
           * @description TSE노드에서는 각 문단이 끝날 때마다 offSet을 하나씩 추가해줘야 한다.
           */
          if (tseChild instanceof TSENode)
            accumulatedOffset += OFFSET_DELIMITER;
        }
      }
      return null;
    };

    const result = traverse(rootElement, this.doc);
    if (!result)
      throw new Error('실제 DOM에서 찾을 수 없는 offset범위 입니다.');

    return result;
  }

  getWindowOffsetFrom(
    stateStartOffset: number,
    stateEndOffset: number
  ): { windowStartOffset: number; windowEndOffset: number } {
    console.log('getWindowOffsetFrom', { stateStartOffset, stateEndOffset });
    this.validateRange(stateStartOffset, stateEndOffset);

    let accumulatedOffset = 0;

    const dfs = (
      node: TSENode,
      offset: number
    ): { windowStartOffset: number; windowEndOffset: number } | null => {
      if (
        node.startOffset <= stateStartOffset &&
        node.endOffset >= stateEndOffset
      ) {
        let currOffset = offset; // 현재 노드에서의 누적 오프셋
        const contents = node.content;

        for (let i = 0; i < contents.length; i++) {
          const content = contents[i];

          if (typeof content === 'string') {
            const contentLength = content.length;

            if (
              currOffset + contentLength >= stateStartOffset &&
              currOffset <= stateEndOffset
            ) {
              return {
                windowStartOffset: stateStartOffset - currOffset,
                windowEndOffset: stateEndOffset - currOffset,
              };
            }
            currOffset += contentLength;
          } else if (content instanceof TSENode) {
            const found = dfs(content, currOffset);
            if (found) return found;

            currOffset += content.endOffset - content.startOffset;
          }
        }
      }
      return null;
    };

    const result = dfs(this.doc, accumulatedOffset);
    console.log({ result });

    if (!result) throw new Error('범위를 벗어난 offset입니다.');

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
