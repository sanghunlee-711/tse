import { TSENodeAttributes } from '@src/types';
import TSENode, { TSENodeContent } from './TSENode';

type TSENodesSpec = { [name: string]: NodeSpec };

interface NodeSpec {
  group?: string;
  attrs?: TSENodeAttributes;
  content?: string;
}

interface SchemaSpec {
  nodes: TSENodesSpec;
}

/**
 * @description
 * Schema 클래스는 에디터에서 허용하는 노드 타입과 구조를 정의합니다.
 * 기본적인 문서 노드 구조를 정의하고, 문서에서 사용할 수 있는 다양한 노드 타입을 설정할 수 있습니다.
 */
class Schema {
  spec: SchemaSpec;
  nodes: TSENodesSpec;

  constructor(spec: SchemaSpec) {
    this.spec = spec;
    this.nodes = this.compileNodes(spec.nodes);
  }

  // 정의된 노드 타입을 초기화하고, 노드 타입을 참조 가능한 객체로 변환
  private compileNodes(nodesSpec: TSENodesSpec): {
    [name: string]: NodeSpec;
  } {
    const nodes: TSENodesSpec = {};
    for (const [name, config] of Object.entries(nodesSpec)) {
      nodes[name] = config;
    }
    return nodes;
  }

  // 주어진 노드 타입과 속성으로 새로운 Node 인스턴스를 생성
  createNode(
    type: string,
    attrs: { [key: string]: any },
    content: TSENodeContent[] = []
  ): TSENode {
    if (!this.nodes[type]) {
      throw new Error(`Undefined node type: ${type}`);
    }
    return new TSENode(type, attrs, content);
  }

  // JSON 직렬화에서 노드 인스턴스를 복원하는 메서드
  nodeFromJSON(json: any): TSENode {
    const { type, attrs, content } = json;
    return new TSENode(
      type,
      attrs,
      Array.isArray(content) // content가 배열인지 확인
        ? content.map(
            (childJson: any) =>
              typeof childJson === 'object' && childJson !== null
                ? this.nodeFromJSON(childJson) // 객체인 경우 재귀 호출
                : childJson // 문자열인 경우 그대로 추가
          )
        : content // content가 배열이 아닌 경우 그대로 추가
    );
  }
}

export default Schema;
