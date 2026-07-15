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
      'この画面はM0のアプリシェルです。未検証の機能を製品機能として先行公開しないため、設計操作UIは配置していません。',
    footer: 'ローカル計算を前提とした、外部通信のない静的アプリとして準備中です。',
  },
  diagnostic: {
    label: 'M0F 研究診断 / 候補契約',
    title: '製品引き継ぎ準備状況（候補診断）',
    statusIncomplete: '引き継ぎ準備：未完了（診断）',
    statusUnavailable: '候補診断：表示不能',
    unavailableValue: '表示不能',
    boundary:
      'これは、このビルドに同梱したM0F研究用入力の候補診断です。設計・生成・検証の製品機能ではなく、最終GO / NO-GO判定でもありません。',
    metricsLabel: 'M0F研究診断の集計',
    blockingAreas: 'ブロック中の証拠領域',
    unmetGoConditions: '未充足（未評価）のGO条件',
    unmetDeliverables: '未充足（未評価）の必須成果物',
    missingFixtures: '未登録の正準fixture規則',
    productStartBlocked: '製品実装開始：未承認',
    finalDecisionNotRecorded: '最終判断は未記録です。',
    claimBoundary:
      '候補診断（scientificClaim: false）であり、折り可能性の検証結果や科学的主張ではありません。製品実装開始は、記録済みの最終GOとブロッカー0件が揃うまで承認されません。',
    runnerTitle: '同梱候補診断をブラウザ内で実行',
    runnerDescription:
      '同梱入力を再評価するだけの診断操作です。fixture repositoryの再走査、外部通信、保存、製品状態の変更は行いません。',
    runButton: '候補診断を実行',
    runIdle: 'ブラウザ内での再評価はまだ実行していません。',
    runComplete: 'ブラウザ内評価が完了しました。',
    runResultSummary: (blockingAreaCount: number, finalDecision: 'not-recorded') =>
      `ブロック領域 ${String(blockingAreaCount)} 件、最終判断 ${finalDecision}、製品実装開始 未承認です。`,
    runUnavailable: '候補診断を実行できませんでした。',
    runUnavailableDescription: '最終判断は未記録のままで、製品実装開始も承認されません。',
  },
  candidateFoldPreview: {
    label: 'M0F 候補FOLD / 読み取り専用',
    title: '同梱候補FOLD JSONプレビュー',
    boundary:
      '固定の同梱NOFACES入力から生成する、非永続・読み取り専用のM0F候補FOLD JSONです。製品CP/FOLD出力ではなく、保存・download・copy機能もありません。',
    limitations:
      'contractStatus: candidate / scientificClaim: false。折り可能性、連続折り経路、衝突自由、積層順序、M0F GO、製品機能を証明しません。artifact schemaId、artifact hash、raw入力bytes、完全metadata、製品stable ID、PathCertificateは含みません。',
    showButton: '候補JSONを表示',
    runningButton: '候補JSONを生成中…',
    idle: '候補JSONはまだ表示していません。',
    running: '固定の同梱入力を候補flowで再評価しています。',
    complete: (vertexCount: number, edgeCount: number, faceCount: number) =>
      `読み取り専用の候補JSONを表示しました（頂点 ${String(vertexCount)}、辺 ${String(edgeCount)}、面 ${String(faceCount)}）。`,
    unavailable: '候補JSONを表示できませんでした。製品実装開始は未承認のままです。',
    jsonLabel: '同梱候補FOLD JSON',
  },
} as const;
