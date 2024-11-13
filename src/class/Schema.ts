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
      content.map((childJson: any) => this.nodeFromJSON(childJson))
    );
  }
}

export default Schema;
