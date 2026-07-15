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
} as const;
