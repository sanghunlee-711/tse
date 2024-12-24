import EditorView from '@src/class/EditorView';
import EditorState from '@src/class/EditorState';
import Schema from '@src/class/Schema';
import Transaction from '@src/class/Transaction';
import Selection from '@src/class/Selection';
import TSENode from './class/TSENode';
import { CorePlugins } from './class/plugins';

// 1. Schema 설정
const schemaSpec = {
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block' },
    heading: { group: 'block', attrs: { level: 1 } },
  },
};

const schema = new Schema(schemaSpec);
const $rootElement = document.getElementById('tse');

if ($rootElement) {
  // 2. 초기 Document 생성
  const doc = new TSENode(
    'doc',
    {
      id: 'test',
    },
    [
      new TSENode('paragraph', {}, ['Hello, World!']),
      new TSENode('paragraph', {}, ['ProseMirror-inspired editor']),
      new TSENode('paragraph', {}, [
        'Some Text is Start and ',
        new TSENode('bold', {}, ['Bold Text']),
        ' and more text',
      ]),
      new TSENode('paragraph', {}, [
        new TSENode('ul', {}, [
          new TSENode('li', {}, ['list1']),
          new TSENode('li', {}, ['list2']),
          new TSENode('li', {}, ['list3']),
        ]),
      ]),
    ]
  );
  const selection = new Selection(doc);
  // 3. EditorState 생성
  const state = new EditorState({ schema, doc }, selection);

  const plugins = [...CorePlugins];
  // 4. EditorView 생성 및 DOM에 렌더링
  const editorView = new EditorView($rootElement, state, plugins);

  //트랜잭션은 한번의 액션에 하나가 발생하게 된다!
  // 테스트 트랜잭션: 새로운 paragraph 노드 추가
  const transactionFoo = new Transaction(state);

  transactionFoo.addNode('paragraph', {}, [
    'This is a new paragraph added with Transaction.',
  ]);

  const transactionBar = new Transaction(state);
  transactionBar.addNode('paragraph', {}, [
    'Anything is Start and ',
    new TSENode('italic', {}, ['Italic Text']),
    ' and more text',
  ]);

  const transactionZoo = new Transaction(state);
  transactionZoo.addNode('paragraph', {}, ['']);
  editorView.dispatch(transactionFoo);
  editorView.dispatch(transactionZoo);
  editorView.dispatch(transactionBar);
}
