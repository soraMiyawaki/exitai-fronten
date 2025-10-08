// src/lib/presets.ts
export type Preset = {
  id: string;
  name: string;
  category: string;
  prompt: string;
};

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: "infra-troubleshoot",
    name: "障害対応",
    category: "インフラ/サーバ",
    prompt: "あなたは障害対応のエキスパートです。緊急度→影響範囲→切り分け手順→暫定対処→恒久対策の順で、簡潔かつ迅速に答えてください。",
  },
  {
    id: "infra-design",
    name: "設計レビュー",
    category: "インフラ/サーバ",
    prompt: "あなたはインフラ設計のレビュアーです。要件の確認→構成の妥当性→冗長性/拡張性→セキュリティ→コストの順で評価してください。",
  },
  {
    id: "network-diag",
    name: "ネットワーク診断",
    category: "ネットワーク",
    prompt: "あなたはネットワークエンジニアです。症状の確認→物理層/データリンク層/ネットワーク層の順で切り分け→診断コマンド→解決手順を提示してください。",
  },
  {
    id: "security-review",
    name: "セキュリティ監査",
    category: "セキュリティ",
    prompt: "あなたはセキュリティ監査のエキスパートです。脅威モデリング→攻撃ベクトル分析→推奨対策→優先度付けの順で、CVSSスコアを添えて答えてください。",
  },
  {
    id: "cloud-cost",
    name: "コスト最適化",
    category: "クラウド/Azure",
    prompt: "あなたはクラウドコスト最適化の専門家です。現状分析→無駄の特定→最適化施策→費用対効果の順で、具体的な削減額を示して答えてください。",
  },
  {
    id: "dev-cicd",
    name: "CI/CD改善",
    category: "開発/CI",
    prompt: "あなたはDevOpsエンジニアです。現状のボトルネック特定→改善提案→実装手順→効果測定方法の順で、ビルド時間やデプロイ頻度の目標値を示してください。",
  },
  {
    id: "middleware-tuning",
    name: "ミドルウェアチューニング",
    category: "OS/ミドルウェア",
    prompt: "あなたはミドルウェアチューニングの専門家です。現状のメトリクス確認→ボトルネック特定→チューニングパラメータ提案→検証方法の順で答えてください。",
  },
  {
    id: "custom",
    name: "カスタム",
    category: "カスタム",
    prompt: "",
  },
];

const LS_PRESETS = "exitai.presets";

export function loadPresets(): Preset[] {
  try {
    const saved = localStorage.getItem(LS_PRESETS);
    if (saved) {
      const custom = JSON.parse(saved) as Preset[];
      return [...DEFAULT_PRESETS, ...custom];
    }
  } catch {}
  return DEFAULT_PRESETS;
}

export function savePreset(preset: Preset) {
  try {
    const current = loadPresets().filter(p => !DEFAULT_PRESETS.some(d => d.id === p.id));
    const updated = [...current, preset];
    localStorage.setItem(LS_PRESETS, JSON.stringify(updated));
  } catch {}
}

export function deletePreset(id: string) {
  try {
    const current = loadPresets().filter(p => !DEFAULT_PRESETS.some(d => d.id === p.id));
    const updated = current.filter(p => p.id !== id);
    localStorage.setItem(LS_PRESETS, JSON.stringify(updated));
  } catch {}
}
