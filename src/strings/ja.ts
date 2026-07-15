export const ja = {
  meta: {
    appName: 'OriDesign',
    documentTitle: 'OriDesign — M0 / M0F 準備中',
  },
  accessibility: {
    skipToMain: '本文へ移動',
  },
  shell: {
    headerLabel: 'アプリケーションヘッダー',
    phaseStatus: 'M0 / M0F 準備中',
    eyebrow: '折り紙設計のための検証基盤',
    title: 'OriDesign',
    summary:
      '現在は、静的Webアプリの基盤と、折り可能性を検証するための実現性ゲートを整備している段階です。',
    gateLabel: '次のゲート',
    gateTitle: 'M0F 実現性検証',
    gateDescription:
      '本来の箱ひだ、連続折り経路、自己衝突判定、積層順序を検証し、Go判定後に製品機能の実装へ進みます。',
    noticeTitle: '設計機能はまだ利用できません',
    noticeDescription:
      'この画面はM0の空アプリシェルです。未検証の機能を製品機能として先行公開しないため、操作UIは配置していません。',
    footer: 'ローカル計算を前提とした、外部通信のない静的アプリとして準備中です。',
  },
  diagnostic: {
    label: 'M0F 研究診断 / 候補契約',
    title: '製品移行 readiness',
    statusNotReady: 'NOT READY',
    boundary:
      'これはM0F研究診断の読み取り専用表示です。設計・生成・検証の製品機能ではなく、最終GO / NO-GO判定でもありません。',
    metricsLabel: 'M0F研究診断の集計',
    blockingAreas: 'ブロック中の証拠領域',
    unmetGoConditions: '未達のGO条件',
    unmetDeliverables: '未提出の必須成果物',
    missingFixtures: '不足中の正準fixture規則',
    productStartBlocked: '製品実装開始：未承認',
    finalDecisionNotRecorded: '最終判断は未記録です。',
    detailsSummary: 'ブロック領域を確認',
    notEvaluated: '未評価',
    claimBoundary:
      '候補診断（scientificClaim: false）。この表示だけから折り可能性や安全性を主張できません。',
    areaLabels: {
      'support-profile': 'SupportProfile',
      'terminal-evidence-and-no-solution': '終端証拠とno-solution',
      'generation-and-fixture-evidence': '生成・fixture証拠',
      'face-path-contact-and-layer-certificates': '面・経路・接触・積層certificate',
      'independent-verifier-and-mutations': '独立verifierとmutation',
      'tolerance-profile': 'ToleranceProfile',
      'browser-runtime-and-benchmarks': 'ブラウザruntimeとbenchmark',
      'license-and-provenance': 'licenseとprovenance',
      'product-contract-and-documentation': '製品contractと文書',
      'go-decision-record': 'GO判断記録',
    },
  },
} as const;
