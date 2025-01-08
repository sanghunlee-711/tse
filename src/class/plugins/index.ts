import { BackSpacePlugin } from './BackSpacePlugin';
import { EnterKeyPlugin } from './EnterKeyPlugin';
import { InsertTextPlugin } from './InsertTextPlugin';
import { KeyUpPlugin } from './KeyUpPlugin';
import { MouseUpPlugin } from './MouseUpPlugin';

export const CorePlugins = [
  new InsertTextPlugin(),
  new BackSpacePlugin(),
  new MouseUpPlugin(),
  new KeyUpPlugin(),
  new EnterKeyPlugin(),
];
