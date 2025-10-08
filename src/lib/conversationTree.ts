// src/lib/conversationTree.ts
import type { ChatMessage } from "./chatApi";

export type ConversationNode = {
  id: string;
  message: ChatMessage;
  parentId: string | null;
  children: string[]; // Child node IDs
  createdAt: number;
};

export type ConversationTree = {
  nodes: Map<string, ConversationNode>;
  currentPath: string[]; // Array of node IDs representing current conversation path
  rootId: string;
};

export type ConversationBranch = {
  nodeId: string;
  preview: string;
  timestamp: number;
};

/**
 * 会話ツリーを作成
 */
export function createConversationTree(): ConversationTree {
  const rootId = generateId();
  const rootNode: ConversationNode = {
    id: rootId,
    message: {
      role: "system",
      content: "Root",
      timestamp: Date.now(),
    },
    parentId: null,
    children: [],
    createdAt: Date.now(),
  };

  return {
    nodes: new Map([[rootId, rootNode]]),
    currentPath: [rootId],
    rootId,
  };
}

/**
 * メッセージを現在のパスに追加
 */
export function appendMessage(
  tree: ConversationTree,
  message: ChatMessage
): ConversationTree {
  const nodeId = generateId();
  const currentNodeId = tree.currentPath[tree.currentPath.length - 1];
  const currentNode = tree.nodes.get(currentNodeId);

  if (!currentNode) {
    throw new Error("Current node not found");
  }

  const newNode: ConversationNode = {
    id: nodeId,
    message: { ...message, timestamp: message.timestamp || Date.now() },
    parentId: currentNodeId,
    children: [],
    createdAt: Date.now(),
  };

  // 親ノードに子を追加
  currentNode.children.push(nodeId);

  // 新しいノードを追加
  tree.nodes.set(nodeId, newNode);

  // 現在のパスを更新
  return {
    ...tree,
    currentPath: [...tree.currentPath, nodeId],
  };
}

/**
 * 指定したノードから分岐を作成
 */
export function createBranch(
  tree: ConversationTree,
  fromNodeId: string,
  message: ChatMessage
): ConversationTree {
  const parentNode = tree.nodes.get(fromNodeId);
  if (!parentNode) {
    throw new Error("Parent node not found");
  }

  const nodeId = generateId();
  const newNode: ConversationNode = {
    id: nodeId,
    message: { ...message, timestamp: message.timestamp || Date.now() },
    parentId: fromNodeId,
    children: [],
    createdAt: Date.now(),
  };

  // 親ノードに子を追加
  parentNode.children.push(nodeId);

  // 新しいノードを追加
  tree.nodes.set(nodeId, newNode);

  // 新しい分岐に切り替え: fromNodeIdまでのパス + 新ノード
  const pathToParent = getPathToNode(tree, fromNodeId);
  return {
    ...tree,
    currentPath: [...pathToParent, nodeId],
  };
}

/**
 * 指定したパスに切り替え（ブランチの切り替え）
 */
export function switchToPath(
  tree: ConversationTree,
  targetNodeId: string
): ConversationTree {
  const path = getPathToNode(tree, targetNodeId);
  if (path.length === 0) {
    throw new Error("Target node not found in tree");
  }

  return {
    ...tree,
    currentPath: path,
  };
}

/**
 * 現在のパスのメッセージリストを取得（rootを除く）
 */
export function getCurrentMessages(tree: ConversationTree): ChatMessage[] {
  return tree.currentPath
    .slice(1) // rootを除く
    .map((id) => tree.nodes.get(id)?.message)
    .filter((msg): msg is ChatMessage => msg !== undefined);
}

/**
 * 指定したノードの兄弟分岐を取得
 */
export function getSiblingBranches(
  tree: ConversationTree,
  nodeId: string
): ConversationBranch[] {
  const node = tree.nodes.get(nodeId);
  if (!node || !node.parentId) return [];

  const parent = tree.nodes.get(node.parentId);
  if (!parent) return [];

  return parent.children
    .filter((childId) => childId !== nodeId)
    .map((childId) => {
      const childNode = tree.nodes.get(childId);
      if (!childNode) return null;

      // プレビューテキスト（最初の50文字）
      const preview = childNode.message.content.slice(0, 50);

      return {
        nodeId: childId,
        preview: preview.length < childNode.message.content.length ? preview + "..." : preview,
        timestamp: childNode.createdAt,
      };
    })
    .filter((branch): branch is ConversationBranch => branch !== null);
}

/**
 * ノードまでのパスを取得
 */
function getPathToNode(tree: ConversationTree, targetId: string): string[] {
  const path: string[] = [];
  let currentId: string | null = targetId;

  while (currentId !== null) {
    const node = tree.nodes.get(currentId);
    if (!node) break;

    path.unshift(currentId);
    currentId = node.parentId;
  }

  return path;
}

/**
 * ツリーをシリアライズ（LocalStorage保存用）
 */
export function serializeTree(tree: ConversationTree): string {
  const serializable = {
    nodes: Array.from(tree.nodes.entries()),
    currentPath: tree.currentPath,
    rootId: tree.rootId,
  };
  return JSON.stringify(serializable);
}

/**
 * ツリーをデシリアライズ（LocalStorage復元用）
 */
export function deserializeTree(json: string): ConversationTree {
  const data = JSON.parse(json);
  return {
    nodes: new Map(data.nodes),
    currentPath: data.currentPath,
    rootId: data.rootId,
  };
}

/**
 * メッセージを編集して新しい分岐を作成
 */
export function editMessageAndBranch(
  tree: ConversationTree,
  nodeId: string,
  newContent: string
): ConversationTree {
  const node = tree.nodes.get(nodeId);
  if (!node || !node.parentId) {
    throw new Error("Cannot edit root or non-existent node");
  }

  // 編集したメッセージで新しい分岐を作成
  const editedMessage: ChatMessage = {
    ...node.message,
    content: newContent,
  };

  return createBranch(tree, node.parentId, editedMessage);
}

/**
 * ノードを削除（子ノードも削除）
 */
export function deleteNode(
  tree: ConversationTree,
  nodeId: string
): ConversationTree {
  const node = tree.nodes.get(nodeId);
  if (!node || nodeId === tree.rootId) {
    throw new Error("Cannot delete root or non-existent node");
  }

  // 親ノードから削除
  if (node.parentId) {
    const parent = tree.nodes.get(node.parentId);
    if (parent) {
      parent.children = parent.children.filter((id) => id !== nodeId);
    }
  }

  // 子ノードを再帰的に削除
  const nodesToDelete = [nodeId];
  while (nodesToDelete.length > 0) {
    const currentId = nodesToDelete.pop()!;
    const currentNode = tree.nodes.get(currentId);
    if (currentNode) {
      nodesToDelete.push(...currentNode.children);
      tree.nodes.delete(currentId);
    }
  }

  // 現在のパスが削除されたノードを含む場合、親ノードまで戻る
  let newPath = tree.currentPath;
  if (tree.currentPath.includes(nodeId)) {
    newPath = getPathToNode(tree, node.parentId!);
  }

  return {
    ...tree,
    currentPath: newPath,
  };
}

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
