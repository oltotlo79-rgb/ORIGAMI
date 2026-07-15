# workers boundary

UI threadと計算処理を隔離するWorker entry pointおよびmessage protocolを置く。

- domainの意味判断はsolver/planner/verifierへ委譲する。
- job ID、revision vector、input hash、進捗、完了、error、cancelを欠落させない。
- cancelまたは古い応答で既存の検証済み成果物を上書きしない。
