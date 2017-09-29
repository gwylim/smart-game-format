// @flow

export type SGF = {props: { [string]: Array<string> }, children: Array<SGF>};

export function parse(str: string): Array<SGF> {
  const collection = [];
  const stack = [collection];
  let node = null;
  let index = 0;
  while (index < str.length) {
    const c = str[index];
    if (c === '(') {
      stack.push(null);
      index++;
    } else if (c === ')') {
      stack.pop();
      index++;
    } else if (c === ';') {
      node = {props: {}, children: []};
      const parent = stack.pop() || stack[stack.length - 1];
      if (parent == null) throw new Error();
      parent.push(node);
      stack.push(node.children);
      index++;
    } else if (/[A-Z]/.test(c)) {
      if (node == null) throw new Error();
      let propIdentEnd = index + 1;
      while (/[A-Z]/.test(str[propIdentEnd])) {
        propIdentEnd++;
      }
      const propIdent = str.substring(index, propIdentEnd);
      index = propIdentEnd;
      const values = [];
      while (!/[A-Z;)(]/.test(str[index])) {
        if (str[index] === '[') {
          index++;
          // TODO: escaping
          let valueEnd = index + 1;
          while (str[valueEnd] !== ']') {
            valueEnd++;
          }
          values.push(str.substring(index, valueEnd));
          index = valueEnd;
        } else {
          index++;
        }
      }
      node.props[propIdent] = values;
    } else {
      index++;
    }
  }
  return collection;
}

export function generate(sgf: Array<SGF>): string {
  const parts = [];
  for (let node of sgf) {
    parts.push('(');
    const stack = [')', node];
    while (stack.length) {
      const next = stack.pop();
      if (typeof next === 'string') {
        parts.push(next);
      } else {
        parts.push(';');
        for (let prop in next.props) {
          if (next.props.hasOwnProperty(prop)) {
            parts.push(prop);
            for (let value of next.props[prop]) {
              parts.push('[');
              // TODO: escaping
              parts.push(value);
              parts.push(']');
            }
          }
        }
        if (next.children.length === 1) {
          stack.push(next.children[0]);
        } else {
          for (let i = next.children.length - 1; i >= 0; i--) {
            stack.push(')');
            stack.push(next.children[i]);
            stack.push('(');
          }
        }
      }
    }
  }
  return parts.join('');
}
