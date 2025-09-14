export interface ExtractedPost {
  platform: string; // e.g. 'twitter'
  id: string;
  url?: string;
  author: {
    handle?: string;
    name?: string;
  };
  text: string;
  createdAt?: string; // ISO string
  collectedAt: string; // ISO string
  raw?: Record<string, any>;
}

export interface PlatformExtractor {
  platform: string;
  /** 判断某个 DOM 节点是否是该平台的一条帖子容器 */
  matchElement(el: HTMLElement): boolean;
  /** 从元素中提取结构化数据 */
  extract(el: HTMLElement): ExtractedPost | null;
  /** 注入单条帖子上的按钮（可选，若平台需要自定义位置） */
  injectButton?(el: HTMLElement, onClick: (post: ExtractedPost) => void): void;
}

export interface MessageBase<T extends string = string> { type: T; }
export interface MessageExtractResult extends MessageBase<'EXTRACT_RESULT'> { post: ExtractedPost; }
export interface MessageRequestSave extends MessageBase<'REQUEST_SAVE'> { post: ExtractedPost; }
export interface MessageGetAll extends MessageBase<'GET_ALL'> {}
export interface MessageAllPosts extends MessageBase<'ALL_POSTS'> { posts: ExtractedPost[]; }
export interface MessagePing extends MessageBase<'PING'> {}
export interface MessageRequestDelete extends MessageBase<'REQUEST_DELETE'> { platform: string; id: string; }
export interface MessageRequestClear extends MessageBase<'REQUEST_CLEAR'> {}
export interface MessageRequestCopy extends MessageBase<'REQUEST_COPY'> { text: string; platform: string; }
export interface MessageRequestCopy extends MessageBase<'REQUEST_COPY'> { text: string; platform: string; }

export type ExtMessage =
  | MessageExtractResult
  | MessageRequestSave
  | MessageGetAll
  | MessageAllPosts
  | MessagePing
  | MessageRequestDelete
  | MessageRequestClear
  | MessageRequestCopy;
