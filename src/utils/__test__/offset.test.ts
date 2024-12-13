import { describe, it, expect, beforeEach } from 'vitest';
import { calculateAbsoluteOffsetFromDOM } from '../offset';
import { ROOT_NODE_NAME } from '@src/constants/node';

describe('calculateAbsoluteOffsetFromDOM 함수 테스트', () => {
  beforeEach(() => {
    /**
     *         
     * <div id="${ROOT_NODE_NAME}">
         <p>ABC</p>
         <p>DEF</p>
         <p>
           HIJ
           <b>KLM</b>
           NOP
         </p>
       </div>
     */
    /**
     * @description
     * 테스트 진행 전 미리 노드 세팅
     *                State Window
     * 첫번째 노드 offset 0~3 // 0~3
     * 두번째 노드 offset 4~7 // 0~3
     * 세번째 부모 노드 offset 8~17  // 0~9
     * 세번째 자식 노드
     */
    const root = document.createElement('div');
    root.setAttribute('id', ROOT_NODE_NAME);

    const firstParagraph = document.createElement('p');
    firstParagraph.textContent = 'ABC';

    const secondParagraph = document.createElement('p');
    secondParagraph.textContent = 'DEF';

    const thirdParagraph = document.createElement('p');
    const bold = document.createElement('b');
    bold.textContent = 'KLM';
    thirdParagraph.append('HIJ', bold, 'NOP');

    root.append(firstParagraph, secondParagraph, thirdParagraph);
    document.body.append(root);
  });

  it('단순 노드의 절대 오프셋을 계산할 수 있어야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const firstParagraph = root?.firstChild as Node;
    console.log({ firstParagraph: firstParagraph.textContent });
    const result = calculateAbsoluteOffsetFromDOM(firstParagraph, 3);
    const expectedOffset = 3;

    expect(result).toBe(expectedOffset);
  });

  it('두번째 노드 컨테이너와 windowOffset이 주어지는 경우, stateOffset으로 변환할 수 있어야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const secondParagraph = root?.childNodes[1] as Node;
    const result = calculateAbsoluteOffsetFromDOM(secondParagraph, 3);
    const expectedOffset = 7;

    expect(result).toBe(expectedOffset);
  });

  it('중첩된 노드인 경우, 절대 오프셋을 계산할 수 있어야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const boldNode = root?.childNodes[2].childNodes[1] as Node;

    // 각 노드의 textContent 길이를 정확히 계산

    const result = calculateAbsoluteOffsetFromDOM(boldNode, 2);

    const expectedOffset = 13;
    expect(result).toBe(expectedOffset);
  });

  it('루트 노드이고 오프셋이 0인 경우 0을 반환해야 한다', () => {
    document.body.innerHTML = `<div id="${ROOT_NODE_NAME}"></div>`;
    const root = document.getElementById(ROOT_NODE_NAME) as Node;

    const result = calculateAbsoluteOffsetFromDOM(root, 0);
    expect(result).toBe(0);
  });

  it('빈 노드를 추가해도 절대 오프셋이 변하지 않아야 한다', () => {
    const root = document.getElementById(ROOT_NODE_NAME);
    const initialOffset = calculateAbsoluteOffsetFromDOM(root as Node, 0);
    const emptyNode = document.createElement('div');

    root?.appendChild(emptyNode);

    const afterOffset = calculateAbsoluteOffsetFromDOM(root as Node, 0);

    expect(initialOffset).toBe(afterOffset);
  });
});
