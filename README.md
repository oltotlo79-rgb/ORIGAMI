# OriDesign

OriDesign は、ツリー法と本来の格子型箱ひだに対応する、ローカルファーストの折り紙設計 Web/PWA です。対応範囲内の入力について、厚さゼロの数値モデル上で連続折り経路と面の非貫通を検証した展開図を扱うことを目標としています。

M0 の開発基盤、M0F用ハーネス、M0F-0A/0Bの基準規約・候補契約・数値kernel、M0F-1Aの決定的候補実験runner、M0F-2の配置前提候補、M0F-3A/3Bのexact-rational面再構築／独立監査候補、およびexact静的3D交差／単一ヒンジ必要イベント候補まで実装済みです。

M0F-2では、幅付き順序木の閉じた検証、木の全枝から格子量子化入力への1対1変換、exact-rational正方格子候補の列挙、枝寸法の独立再計算、4方向格子substrate、用紙全体と余り帯のexact分割を実装しています。全葉ペアの整数経路要求、未割当の有限格子変数・枝寸法・葉ペア入力を束ねるCSP問題記述、制約適用前の探索空間をBigIntで数える監査、必要条件と一般packingを区別する候補意味契約、割当済み葉のEuclidean必要条件評価、その必要条件だけを使う上限付き候補探索も追加しています。問題記述は全候補再列挙なしの独立validatorでも検査でき、専用Workerでメインスレッド外に構築できます。必要条件探索と独立DFS再検証も別々のWorkerで実行し、メインスレッドには探索fallbackを置きません。量子化、問題構築、二段探索・再検証の各Workerは、Chromium、Edge、Firefoxで成功・中断・開始前中断を検査します。これらはglobal metric選択、polygon/river配置、一般packing solver、CP生成ではありません。

標準FOLD JSONを専用Workerへtransferする経路、生成側geometryを再利用しないprojective BigInt面複体audit、source-set hash付き保存evidence、11種のmutation suite、保存成果物を再実行するface専用subgateも追加しています。静的3D符号のexact projective-rational基盤と閉三角形2枚の静的交差分類に加え、caller-supplied stable IDを持つ最大64三角形・2,016 unordered pairのraw census、producer classifierや共有3D kernelをimportしないexact barycentric独立pair audit、および全期待pair・incidence・counterをgeometryから再構築する独立whole-census auditも候補実装しました。64/2,016は防御上限でありSupportProfileではありません。classifierとcensusのclosed parserは、hostile property key由来の診断path segmentを128 code unitsに制限します。censusの共有頂点ラベルはmesh topologyを決めず、auditの`consistent`も候補recordとの静的一致だけを表します。合法接触と貫通の区別、自己交差の最終判定、時間区間上のCCD、collision-freeや`verified`の主張は行いません。現在は正方格子上のpolygon/river配置と箱ひだ経路、canonical/holdout fixtureの登録、連続経路、CCD、目標・積層の比較実験へ進む段階です。製品機能はM0FがGOになった後に開始します。現時点の画面や試作結果を「折り可能性検証済み」とみなすことはできません。

非線形剛体運動については、局所三角形の任意の `SO(3)` 回転と、区間端点間で線形に動く原点を包含するexact swept AABBを候補実装しました。閉AABB間に厳密な軸方向gapがある場合だけ、指定した1 primitive pair・1 dyadic time slabの局部分離証明を返します。境界一致とAABB重複は候補のまま残し、未対応motion familyや算術上限到達は`indeterminate`です。さらに、最大64 primitive・2,016 unordered pairを決定順で全件保持するbounded censusも候補実装し、各AABBを入力geometryから再構成して依存classifierの偽boundsを拒否します。これはbroad phaseであり、実際の非線形vertex-face/edge-edge CCD、合法接触、完全なface/time coverage、自己交差なし、collision-free、`verified`の主張ではありません。

単一ヒンジの非half-turn遷移については、exact tangent-half-angle経路、全vertex-face／edge-edge必要イベント多項式、区間根分離と共通細分、グローバルイベント境界、各open cellのexact静的サンプルまで候補実装しています。全境界の有限root occurrenceをcanonical順で走査し、vertex-face featureとnonparallel／parallel／collinear edge-edge featureをexactに全件分類します。各行は中央のroot censusを複製せずcompact evidenceだけを保持し、各境界の左右サンプルについては全triangle pairの静的strata差分も保持します。さらに定義多項式を隣接open-cellのexact sampleで評価し、符号がcell全体で一定であることとinterior rootのmultiplicity parityを検査します。恒等ゼロのpersistent eventはroot census・partition・共通細分間で同一性をexactに結合し、関連triangle pairを各canonical open-cell sampleで記録します。symmetric fixtureでは5本のpersistent edge-edge行で関連pair categoryがcrossingからdisjointへ変化するため、恒等ゼロだけでは静的strata不変性を示せません。これらは向き付きスカラー多項式の履歴とpair-level標本であり、物理的collision eventへの重複統合や事象固有のfeature containment、幾何学的な接近／離反ではありません。persistent eventの追加細分、open-cell内のstrata不変性、接近／離反、合法接触、完全CCD、collision-free、`verified`は未確立です。

`REF-FOLD-NOFACES`は、正準manifestへ昇格させず、project-authored candidate bundleとして実体化しました。FOLD source、再構築・別audit記録、source-set hash付きaudit evidence、11件のmutation suite/resultを8個のSHA-256 binding済みartifactとclosed ledgerに保存し、再生成byte一致まで検査します。これは再現可能なface候補証拠であり、ToleranceProfile、科学的`verified`、global M0F `GO`を意味しません。

`NEG-FOLD-UNSUPPORTED-*`もcanonical manifest外のexact-negative candidate bundleとして実体化しました。multi-frame、initial 3D、3D座標、nonManifold／nonOrientable／selfIntersecting／cuts／joins、C/Jを10個の独立sourceに分け、既存FOLD adapterが返す完全なcode/path順序を再実行します。ここでのexact-negativeはclosed adapterによる決定的拒否だけを意味し、一般FOLD invalidity、非平面の独立検出、非折り可能性の科学的証明ではありません。

`NEG-TREE-*`はcanonical manifest外の12件のexact-negative ordered-tree parser候補として実体化しました。4葉starと20葉境界の2 controlを先に受理確認し、各sourceの完全な差分pathとordered issue code/path、13 payloadのSHA-256/provenance、全生成byte一致を検査します。これは現在のparser境界の回帰証拠だけであり、SupportProfile、ToleranceProfile、tree methodの実現性、CP妥当性、折り可能性、global M0F `GO`を意味しません。21葉例は実装済み上限だけを分離し、葉不足を独立に網羅しません。

`NEG-TOPOLOGY-*`はcanonical manifest外の5件のartifact-contract topology parser候補です。保存済みの2 controlを先に受理し、未分割交差、重複辺、面積ゼロ面、連結円環の穴、3面入射辺について、control差分と完全なordered issue code/pathを再実行します。これは現在のartifact contract回帰だけであり、planarizer／面再構築の完全性、一般的な穴・manifold判定、CP妥当性、構成可能性、折り可能性、科学的検証、global M0F `GO`を意味しません。

`NEG-LAYER-CYCLE`もcanonical manifest外のartifact-contract parser候補です。保存済みのaccepted FOLD controlに、終端時刻で既存関係と逆向きの層関係を1件だけ追加し、完全な差分pathと単一の`layer-cycle` issueを再実行します。これは宣言済み層関係のDAG検査だけであり、物理的な積層順序、時間的に分離した上下反転、接触完全性、経路連続性、衝突自由、科学的検証、global M0F `GO`を意味しません。

`NEG-ORDER-REVERSAL`もcanonical manifest外のartifact-contract parser候補です。保存済みのaccepted FOLD controlからcoplanar-overlap contactを`[0,1]`へ拡張し、始点に逆向き、終点に既存向きの層関係を置くことで、時間的に非重複でも一つの連続接触中に上下が反転する宣言を単一の`layer-order-reversal` issueで拒否します。これは宣言済みcontact／layer relationの整合検査だけであり、接触の推定や完全性、物理的な積層順序、経路連続性、CCD、衝突自由、科学的検証、global M0F `GO`を意味しません。

`NEG-LAYER-CONTACT-COVERAGE`もcanonical manifest外のartifact-contract parser候補です。保存済みcontrolはcoplanar-overlap contactと同方向layer relationをともに`[0,1]`で宣言し、negativeはrelation始端だけを`0.25`へ変えて、完全な1-path差分と単一`incomplete-layer-contact-coverage` issueを再実行します。これはvalidな宣言participantのclosed interval unionだけであり、物理接触の推定・完全性・合法性、物理的な積層順序、上下反転証拠、経路連続性、CCD、衝突自由、certificate hash、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-EMPTY-SEGMENTS`もcanonical manifest外のartifact-contract parser候補です。保存済みaccepted bounded-interpolation controlから唯一のpath segmentを削除し、完全な1-path削除差分と`segments`配列parentの単一`invalid-array` issueを再実行します。これはpath candidateが少なくとも1 segmentを持つ現parser境界だけであり、時間coverage、representationの選定・完全性、angle／bound／端点／物理経路semantics、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、衝突自由、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-UNSUPPORTED-REPRESENTATION-KIND`もcanonical manifest外のartifact-contract parser候補です。保存済みaccepted bounded-interpolation controlのmotion kindだけを`bounded-interpolation`から未対応の`spline`へ変え、完全な1-path差分と同じleafの単一`invalid-enum` issueを再実行します。これはpath representation kindの列挙境界だけであり、representation選定・完全性、時間coverage、angle／bound／端点／物理経路semantics、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、衝突自由、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-REPRESENTATION-VERSION-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。保存済みaccepted bounded-interpolation controlの`pathCandidate.representationVersion`だけを`1`から`2`へ変え、完全な1-path差分と同じleafの単一`invalid-literal` issueを再実行します。これはrepresentation versionの固定値境界だけであり、representation選定・完全性、時間coverage、angle／bound／端点／物理経路semantics、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、衝突自由、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-BOUNDED-FINITE-KNOT-TIMES`もcanonical manifest外のartifact-contract parser候補です。保存済みaccepted single-segment bounded-interpolation controlのknot times `[0,0.5,1]`へJSON `null`をindex 3として追加し、完全な1-path追加差分と同じleafの単一`non-finite-number` issueを再実行します。有効な3 knotは残るためcardinality、厳密増加、endpoint coverageの二次issueが出ないことも固定します。これは保存された宣言knot timeにfinite binary64 numberを要求する現parser境界だけであり、時間単位・parameterization・sampling、cardinality、knot順序、coverage、物理的angle／path semantics、representation選定、crease-map completeness、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-BOUNDED-FINITE-ANGLES`もcanonical manifest外のartifact-contract parser候補です。同じaccepted controlの`e-hinge` angle row `[0,pi/2,pi]`でangle index 0だけをJSON `null`へ置換し、完全な1-path差分と同じleafの単一`non-finite-number` issueを再実行します。array長とcrease ID集合を保ち、finite検査失敗時はcontainment推論を行わないためcardinality、map、angle containmentの二次issueが出ないことも固定します。これは保存された宣言angle値にfinite binary64 numberを要求する現parser境界だけであり、finite knot、radian規約、物理的angle schedule／bound、保守的bound、kinematic feasibility、endpoint／物理経路semantics、representation選定、crease-map completeness、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-BOUNDED-FINITE-INTERVAL-ANGLE-BOUNDS`もcanonical manifest外のartifact-contract parser候補です。同じaccepted controlの`e-hinge` interval angle bounds `[[0,pi/2],[pi/2,pi]]`で最初のlower-bound coordinateだけをJSON `null`へ置換し、完全な1-path差分と同じleafの単一`non-finite-number` issueを再実行します。bound row長、interval cardinality、crease ID集合を保ち、finite tuple検査失敗時はcontainment推論を行わないためcardinality、map、angle containmentの二次issueが出ないことも固定します。これは保存された宣言interval angle bound値にfinite binary64 numberを要求する現parser境界だけであり、finite knot／angle、radian規約、物理的angle schedule／bound、保守的bound、kinematic feasibility、endpoint／物理経路semantics、representation選定、crease-map completeness、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-BOUNDED-INTERVAL-ANGLE-BOUND-TUPLE-CARDINALITY-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。同じaccepted controlの`e-hinge` interval angle bounds `[[0,pi/2],[pi/2,pi]]`で最初のbound tupleに有限の第3座標`pi`をindex 2として追加し、完全な1-path追加と親rowの単一`invalid-tuple` issue（`must contain exactly 2 finite numbers`）を再実行します。outer bound row長、interval count、crease ID集合を保ち、tuple cardinality検査失敗時はfinite-coordinate、bound-map、containment推論へ進まないため二次issueが出ないことも固定します。これはinner bound tupleのexact size 2を要求する現parser境界だけであり、値の有限性、angle／knot、outer bound／knot interval cardinality、ordering、containment、radian規約、物理的angle schedule／bound、保守的bound、kinematic feasibility、endpoint／物理経路semantics、representation選定、crease-map completeness、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-REPRESENTATION-STATUS-ESCALATION`もcanonical manifest外のartifact-contract parser候補です。保存済みaccepted bounded-interpolation controlの`pathCandidate.representationStatus`だけを`candidate`から`verified`へ変え、完全な1-path差分と同じleafの単一`claim-boundary` issueを再実行します。これは未検証のpath宣言を`candidate`に留める現parser境界だけであり、representationの選定・完全性、angle／bound／時間／端点／物理経路semantics、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、衝突自由、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-ENDPOINT-DISCONTINUITY`もcanonical manifest外のartifact-contract parser候補です。保存済みのaccepted 2-segment FOLD controlは共有端点で`pi/2`を一致させ、negativeは第2 segmentの開始角だけを宣言bound内の`3*pi/4`へ変え、完全な1-path差分と単一の`path-endpoint-discontinuity` issueを再実行します。これはvalidなbounded-interpolation宣言のexact一致だけであり、canonical `NEG-PATH-MUTATION-*`全体、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash、CCD、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-ENDPOINT-MAP-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。保存済みのaccepted 3-face／2-hinge design controlでは隣接する2つのbounded-interpolation segmentが同じ2-edge angle／bound mapを宣言し、negativeは第2 segmentだけから`e-hinge-far`行を両mapで除去します。完全な2-path差分と単一の`path-endpoint-map-mismatch` issueを再実行しますが、これは隣接する局所valid宣言mapの比較だけです。物理的hinge drift、mesh／crease-map completeness、endpoint／物理経路連続性、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-MOTION-MAP-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。同じaccepted 3-face／2-hinge design controlから、第1 bounded-interpolation segmentの`e-hinge-far` bound行だけを削除し、angle map 2行とbound map 1行の宣言ID集合不一致を作ります。完全な1-path削除差分と単一の`motion-map-mismatch` issueを再実行し、invalid segmentから隣接endpoint二次issueが出ないことも固定します。これは宣言angle／bound row ID集合の一致だけであり、物理的hinge drift、mesh／crease-map completeness、物理的／保守的angle bound、endpoint／物理経路連続性、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-COVERAGE-*`もcanonical manifest外のartifact-contract parser候補です。同一のaccepted 2-segment bounded-interpolation FOLD controlから、始端prefix欠落、segment間gap、終端suffix欠落、motion knot始端gapの4 negativeを作り、完全なcontrol差分と各単一`incomplete-time-coverage` issueを再実行します。これは宣言JSONの時間coverageだけであり、canonical path mutation family全体、endpoint／物理経路連続性、piecewise-polynomial coverage、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-NON-MONOTONIC-KNOT-TIME`もcanonical manifest外のartifact-contract parser候補です。accepted single-segment bounded-interpolation controlのknot times `[0,0.5,1]`から中央値だけを`0`へ置換し、完全な1-path差分と単一`non-monotonic-time` issueを再実行します。endpoint、angle／knotとbound／intervalの要素数、map、angle containmentを変えず、二次path issueが出ないことも固定します。これは宣言knot timeの厳密増加だけであり、時間単位・parameterization・sampling、物理的angle schedule／bound、kinematic feasibility、endpoint／物理経路連続性、representation選定、crease-map completeness、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-ANGLE-OUTSIDE-BOUND`もcanonical manifest外のartifact-contract parser候補です。保存済みのaccepted single-segment bounded-interpolation FOLD controlは3 knotで角度`[0,pi/2,pi]`と2つの区間boundを宣言し、negativeは中央角だけを`3*pi/4`へ変えて、第1 boundだけから外れる完全な1-path差分と単一`angle-outside-bound` issueを再実行します。これは宣言値のliteral containmentだけであり、物理的angle bound、radian規約、保守的bound、kinematic feasibility、endpoint／物理経路連続性、crease-map completeness、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-ANGLE-KNOT-CARDINALITY-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment controlの3 knot／3 angleから終端angleだけを削除し、完全な1-path削除差分と単一`parallel-array-mismatch` issueを再実行します。`motion-map-mismatch`、`angle-outside-bound`、coverage、endpointの二次issueが出ないことも固定します。これは宣言angle rowと局所knot arrayの要素数一致だけであり、bound／knot-interval cardinality、radian規約、物理的angle schedule／bound、kinematic feasibility、endpoint／物理経路連続性、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-DUPLICATE-ANGLE-CREASE`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment bounded-interpolation controlのangle mapへ、既存`e-hinge`行のvalid cloneをindex 1として追加し、完全な1-path追加差分と単一`duplicate-reference` issueを再実行します。set上はangle／interval-bound mapが一致したままなので`motion-map-mismatch`等の二次issueが出ないことも固定します。これは宣言angle row内のcrease参照一意性だけであり、interval-bound rowの一意性、angle／knotとbound／knot-interval cardinality、motion／crease-map completeness、angle containment、knot順序、時間coverage、endpoint、representation、物理角度・経路、piecewise-polynomial semantics、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-BOUND-KNOT-INTERVAL-CARDINALITY-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment controlの3 knot／2 interval boundから終端boundだけを削除し、完全な1-path削除差分と単一`parallel-array-mismatch` issueを再実行します。map、angle containment、coverage、endpointの二次issueが出ないことも固定します。これは宣言bound rowと局所knot interval数の一致だけであり、兄弟angle／knot cardinality、radian規約、物理的／保守的bound、kinematic feasibility、endpoint／物理経路連続性、crease-map completeness、piecewise-polynomial、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-DUPLICATE-INTERVAL-BOUND-CREASE`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment bounded-interpolation controlのinterval-bound mapへ、既存`e-hinge`行のvalid cloneをindex 1として追加し、完全な1-path追加差分と単一`duplicate-reference` issueを再実行します。set上はangle／interval-bound mapが一致したままなので`motion-map-mismatch`等の二次issueが出ないことも固定します。これは宣言interval-bound row内のcrease参照一意性だけであり、angle rowの一意性、angle／knotとbound／knot-interval cardinality、motion／crease-map completeness、angle containment、knot順序、時間coverage、endpoint、representation、物理角度・経路、piecewise-polynomial semantics、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-NON-INTERIOR-MOTION-EDGE`もcanonical manifest外のartifact-contract parser候補です。accepted single-segment controlのangle／bound両motion mapが参照する内側ヒンジ`e-hinge`を、既存の境界辺`e-top-left`へ置換し、完全な2-path差分と順序付き2件の`missing-reference` issueを再実行します。map集合を一致させたまま`motion-map-mismatch`、angle containment、coverage、endpointの二次issueが出ないことも固定します。これは宣言motion rowを内側crease参照へ制限する現parser境界だけであり、物理的hinge drift検出、edge role推論、assignment physics、crease-map／representation completeness、angle／bound cardinality、物理角度・経路連続性、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-DEGREE-OUT-OF-RANGE`もcanonical manifest外のartifact-contract parser候補です。accepted 2-segment degree-1 piecewise-polynomial controlの第1 degreeだけを`0`へ置換し、完全な1-path差分と単一`out-of-range` issueを再実行します。invalid degreeでは係数行長の推論を行わないため、`coefficient-degree-mismatch`等の二次issueが出ないことも固定します。これは正のsafe-integerを要求する現parser述語のうちdegree `0`の下限例だけであり、fractional／unsafe-integer入力全域の網羅、representation選定、polynomial basis、係数順序・意味・区間対応、derivative semantics／validation、polynomial endpoint、時間coverage、物理角度・経路、crease／motion-map completeness、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-COEFFICIENT-DEGREE-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。accepted single-segment piecewise-polynomial design controlのdegree 1／係数行`[0,pi]`から終端係数だけを削除し、完全な1-path削除差分と単一`coefficient-degree-mismatch` issueを再実行します。`motion-map-mismatch`等の二次issueが出ないことも固定します。これは宣言係数行長と宣言degreeの一致だけであり、representation選定、polynomial basis凍結、係数順序・意味・区間対応、derivative semantics／validation、polynomial endpoint推論、物理角度・経路、crease-map completeness、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-EMPTY-COEFFICIENT-ROWS`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment degree-1 piecewise-polynomial controlの`e-hinge` coefficient entryから唯一の係数行`[0,pi]`を削除し、完全な1-path削除差分と単一parent `invalid-array` issueを再実行します。edge IDは残るためcoefficient／derivative-bound setが一致し、`coefficient-degree-mismatch`や`motion-map-mismatch`等の二次issueが出ないことも固定します。これは宣言coefficient entryが1行以上を持つことだけであり、係数行とdegreeのcardinality、coefficient／derivative-bound rowの参照一意性、motion／crease-map completeness、representation選定、polynomial basis、係数順序・意味・区間対応、derivative semantics、endpoint、時間coverage、物理角度・経路、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-NON-FINITE-COEFFICIENT`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment degree-1 piecewise-polynomial controlの`e-hinge`係数行`[0,pi]`で終端係数だけをJSON `null`へ置換し、完全な1-path差分と同じleafの単一`non-finite-number` issueを再実行します。row長、edge ID集合、derivative boundsは保たれるためcardinalityやmotion-map等の二次issueが出ないことも固定します。これは保存された宣言coefficient値にfinite binary64 numberを要求する現parser境界だけであり、coefficient row非空性、degree cardinality、row参照一意性、motion／crease-map completeness、representation選定、polynomial basis、係数順序・意味・区間対応、derivative semantics、endpoint、時間coverage、物理角度・経路、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-DUPLICATE-COEFFICIENT-CREASE`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment degree-1 piecewise-polynomial controlのcoefficient mapへ、既存`e-hinge`行のvalid cloneをindex 1として追加し、完全な1-path追加差分と単一`duplicate-reference` issueを再実行します。set上はcoefficient／derivative mapが一致したままなので`motion-map-mismatch`等の二次issueが出ないことも固定します。これは宣言coefficient row内のcrease参照一意性だけであり、derivative-bound rowの一意性、coefficient／degree cardinality、motion／crease-map completeness、representation選定、polynomial basis、係数順序・意味・区間対応、derivative semantics、endpoint、時間coverage、物理角度・経路、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-DUPLICATE-DERIVATIVE-BOUND-CREASE`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment degree-1 piecewise-polynomial controlのderivative-bound mapへ、既存`e-hinge`行のvalid cloneをindex 1として追加し、完全な1-path追加差分と単一`duplicate-reference` issueを再実行します。set上はcoefficient／derivative mapが一致したままなので`motion-map-mismatch`等の二次issueが出ないことも固定します。これは宣言derivative-bound row内のcrease参照一意性だけであり、coefficient rowの一意性、coefficient／degree cardinality、motion／crease-map completeness、representation選定、polynomial basis、係数順序・意味・区間対応、derivative semantics／validation／保守性、endpoint、時間coverage、物理角度・経路、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-DERIVATIVE-BOUNDS-INVERTED`もcanonical manifest外のartifact-contract parser候補です。同じaccepted single-segment degree-1 piecewise-polynomial design controlの`e-hinge` derivative bounds `[0,pi]`からlowerだけを`2*pi`へ置換し、完全な1-path差分と単一`invalid-bounds` issueを再実行します。二次path issueが出ないことも固定します。これは宣言derivative lower／upperの大小関係だけであり、derivative semantics・保守性・単位、representation選定、polynomial basis、係数順序・意味・区間対応、polynomial endpoint、物理角度・経路、crease-map completeness、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-POLYNOMIAL-MOTION-MAP-MISMATCH`もcanonical manifest外のartifact-contract parser候補です。accepted single-segment degree-1 piecewise-polynomial two-hinge controlから`e-hinge-far` derivative-bound rowだけを削除し、完全な1-path削除差分と単一`motion-map-mismatch` issueを再実行します。二次path issueが出ないことも固定します。これは同一polynomial motion内の係数row ID集合とderivative-bound row ID集合の一致だけであり、物理hinge drift、mesh crease-map completeness、derivative semantics・保守性、polynomial basis・係数意味、endpoint、representation選定、剛体性、面等長、ヒンジ幾何、certificate hash／真正性、contact、CCD、collision freedom、foldability、SupportProfile、ToleranceProfile、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-PATH-MUTATION-MIXED-REPRESENTATION`もcanonical manifest外のartifact-contract parser候補です。accepted controlの2つの連続するvalid bounded-interpolation segmentのうち、第2 motionだけを局所validなdegree-1 piecewise-polynomialへ置換し、完全な7-path差分と単一`mixed-path-representation` issueを再実行します。bounded endpoint二次issueが出ないことも固定します。これは1 path内の宣言representation kind統一だけであり、representation選定、どちらかのbasis凍結、polynomial係数／derivative bound／endpoint／cross-representation semantics、interval proof、endpoint／物理経路連続性、剛体性、面等長、ヒンジ幾何、certificate hash、contact、CCD、canonical family全体、科学的検証、global M0F `GO`を意味しません。

`NEG-SUPPORT-CATALOG-*`はcanonical `NEG-SUPPORT-BOUNDARY-*`とは別の、candidate catalog claim-boundary parser候補です。保存済みの未選択catalogをcontrolとし、premature frozen status、profile hash、selected値、evidence statusなどの単一改変を完全なissue順序で拒否します。これは未確定候補をSupportProfileとして偽装させない回帰境界であり、frozen SupportProfile、実入力の対応可否、termination保証、canonical coverage、科学的検証、global M0F `GO`を意味しません。

## 必要環境

- Node.js `^20.19.0 || >=22.12.0`（CI は Node.js 22 系）
- npm 10 以上
- Windows 10/11 上の最新版 Chrome、Edge、Firefox を正式対象とする予定

## セットアップ

```powershell
npm ci
npm run dev
```

依存関係を初めて固定する担当者は `npm install` で `package-lock.json` を生成し、その後は `npm ci` を使用してください。

GitHub Pages のビルドでは、リポジトリ名を含むベースパスを `BASE_PATH` 環境変数で渡します。ローカルでは `/` が既定です。

Viteは通常`@vitejs/plugin-react-swc`を使用します。OS policyなどでSWC native bindingを読み込めない場合は、警告を出してVite標準のJSX変換へfallbackします。この場合もbuildと実行は継続しますが、開発中のReact Fast Refreshは無効です。

## コマンド

| コマンド                                                                      | 用途                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------- |
| `npm run dev`                                                                 | Vite 開発サーバー                               |
| `npm run build`                                                               | 型検査後に静的ビルド                            |
| `npm run preview`                                                             | ビルド成果物のローカル確認                      |
| `npm run typecheck`                                                           | TypeScript project references の型検査          |
| `npm run lint`                                                                | ESLint と Prettier の検査                       |
| `npm run format`                                                              | Prettier による整形                             |
| `npm test` / `npm run test:unit`                                              | Vitest のユニットテスト                         |
| `npm run test:coverage`                                                       | 数理・ドメイン層のカバレッジ計測                |
| `npm run test:e2e`                                                            | Playwright E2E                                  |
| `npm run test:golden`                                                         | golden/certificate テスト                       |
| `npm run test:perf`                                                           | 固定 fixture のベンチマーク                     |
| `npm run m0f:test`                                                            | M0F 試作のテスト                                |
| `npm run m0f:validate`                                                        | M0F fixture manifest の検証                     |
| `npm run m0f:list`                                                            | 登録済みfixtureの一覧                           |
| `npm run m0f:smoke`                                                           | M0F ハーネスの smoke 検証                       |
| `npm run m0f:catalog-gate`                                                    | 必須 fixture ID 群の完備性検査                  |
| `npm run m0f:gate`                                                            | 最終 M0F 証拠ゲート（完成まで失敗終了）         |
| `npm run m0f:bench`                                                           | M0F 試作のベンチマーク                          |
| `npm run m0f:box-grid-candidates`                                             | 箱ひだ正方形grid量子化候補を列挙                |
| `npm run m0f:box-grid-lattice`                                                | 候補からexactな4方向格子基盤を生成              |
| `npm run m0f:box-grid-paper-partition`                                        | 用紙全体のgrid・余り帯候補をexact分割           |
| `npm run m0f:ordered-tree`                                                    | 内部枝幅を含む順序付き木候補を検査              |
| `npm run m0f:ordered-tree-grid-quantization`                                  | 順序付き木を格子量子化入力へ1対1変換            |
| `npm run m0f:ordered-tree-grid-candidates`                                    | 木からexactな格子量子化候補まで列挙             |
| `npm run m0f:ordered-tree-path-demands`                                       | 全葉ペアの整数木経路・内部枝幅を構築            |
| `npm run m0f:polygon-river-packing-problem`                                   | 有限配置問題の未解決入力骨格を構築              |
| `npm run m0f:polygon-river-search-space`                                      | 未制約の有限探索空間をexact監査                 |
| `npm run m0f:euclidean-necessary-filter`                                      | 割当済み葉の必要条件だけをexact評価             |
| `npm run m0f:euclidean-necessary-witness-search`                              | 必要条件を通る格子割当を上限付き探索            |
| `npm run m0f:experiment`                                                      | 固定seedの候補数値kernel比較実験                |
| `npm run m0f:experiment -- --square-grid-quantization`                        | 正方格子候補をhash付き実験記録へ保存            |
| `npm run m0f:faces`                                                           | exact-rational面再構築の固定候補実験            |
| `npm run m0f:face-audit`                                                      | 別実装による面複体auditの固定候補実験           |
| `npm run m0f:face-evidence`                                                   | 保存・再監査可能なface候補証拠を出力            |
| `npm run m0f:face-mutations`                                                  | face改変suite 11件の候補結果を出力              |
| `npm run m0f:face-subgate`                                                    | face段階だけを再実行してfail-closed判定         |
| `npm run m0f:ref-fold-nofaces-candidate`                                      | 非canonical face候補bundleを再実行              |
| `npm run m0f:neg-fold-unsupported-candidate`                                  | FOLD非対応候補10件を厳密に再実行                |
| `npm run m0f:neg-tree-candidate`                                              | 順序木parser負例12件を厳密に再実行              |
| `npm run m0f:neg-topology-candidate`                                          | topology parser負例5件を厳密に再実行            |
| `npm run m0f:neg-layer-cycle-candidate`                                       | 層循環parser負例を厳密に再実行                  |
| `npm run m0f:neg-order-reversal-candidate`                                    | 連続接触中の上下反転負例を厳密に再実行          |
| `npm run m0f:neg-layer-contact-coverage-candidate`                            | 接触中の層宣言coverage負例を厳密に再実行        |
| `npm run m0f:neg-path-empty-segments-candidate`                               | path segment空配列を厳密に再実行                |
| `npm run m0f:neg-path-unsupported-representation-kind-candidate`              | 未対応path representation kindを厳密に再実行    |
| `npm run m0f:neg-path-representation-version-mismatch-candidate`              | path representation version不一致を厳密に再実行 |
| `npm run m0f:neg-path-representation-status-escalation-candidate`             | path表現status不正昇格を厳密に再実行            |
| `npm run m0f:neg-path-endpoint-continuity-candidate`                          | path端点宣言不連続を厳密に再実行                |
| `npm run m0f:neg-path-endpoint-map-mismatch-candidate`                        | path端点crease map不一致を厳密に再実行          |
| `npm run m0f:neg-path-motion-map-mismatch-candidate`                          | path内angle／bound map不一致を厳密に再実行      |
| `npm run m0f:neg-path-time-coverage-candidate`                                | path時間coverageの4境界を厳密に再実行           |
| `npm run m0f:neg-path-non-monotonic-knot-time-candidate`                      | path knot time非単調性を厳密に再実行            |
| `npm run m0f:neg-path-angle-bound-candidate`                                  | path角度bound逸脱を厳密に再実行                 |
| `npm run m0f:neg-path-angle-knot-cardinality-candidate`                       | path angle／knot要素数不一致を厳密に再実行      |
| `npm run m0f:neg-path-duplicate-angle-crease-candidate`                       | path angle crease重複を厳密に再実行             |
| `npm run m0f:neg-path-bound-knot-interval-cardinality-candidate`              | path bound／knot interval要素数不一致を再実行   |
| `npm run m0f:neg-path-duplicate-interval-bound-crease-candidate`              | path interval-bound crease重複を厳密に再実行    |
| `npm run m0f:neg-path-non-interior-motion-edge-candidate`                     | motion mapの非内側crease参照を厳密に再実行      |
| `npm run m0f:neg-path-polynomial-degree-range-candidate`                      | polynomial degree下限違反を厳密に再実行         |
| `npm run m0f:neg-path-polynomial-coefficient-degree-candidate`                | polynomial係数行／degree不一致を厳密に再実行    |
| `npm run m0f:neg-path-polynomial-empty-coefficient-rows-candidate`            | polynomial係数行空配列を厳密に再実行            |
| `npm run m0f:neg-path-polynomial-non-finite-coefficient-candidate`            | polynomial非finite係数を厳密に再実行            |
| `npm run m0f:neg-path-polynomial-duplicate-coefficient-crease-candidate`      | polynomial係数crease重複を厳密に再実行          |
| `npm run m0f:neg-path-polynomial-duplicate-derivative-bound-crease-candidate` | polynomial微分境界crease重複を厳密に再実行      |
| `npm run m0f:neg-path-polynomial-derivative-bounds-candidate`                 | polynomial derivative bound逆転を厳密に再実行   |
| `npm run m0f:neg-path-polynomial-motion-map-mismatch-candidate`               | polynomial motion map不一致を厳密に再実行       |
| `npm run m0f:neg-path-mixed-representation-candidate`                         | path内representation混在を厳密に再実行          |
| `npm run m0f:neg-support-catalog-candidate`                                   | Support候補claim境界を厳密に再実行              |
| `npm run test:e2e:m0f-worker`                                                 | 実module Workerの転送・中断smoke測定            |
| `npm run test:e2e:m0f-worker:matrix`                                          | Chromium・Edge・Firefoxで同じ測定               |
| `npm run licenses:check`                                                      | SPDX ライセンス allowlist 検査                  |

直接依存のバージョンは `package.json` で固定し、推移依存を `package-lock.json` で再現可能にします。許可する依存ライセンスは `MIT`、`0BSD`、`BSD-2-Clause`、`BSD-3-Clause`、`Apache-2.0`、`ISC` のみです。

この厳密な範囲を守るため、build/lint系の版と`argparse`の推移依存を固定しています。理由、制約、更新手順は[ADR-0002](docs/decisions/ADR-0002_M0ツールチェーンとライセンス固定.md)を参照してください。

## 仕様

- [要件定義書 v1.1](docs/01_要件定義書_v1.1.md)
- [技術設計書](docs/02_技術設計書.md)
- [画面仕様書](docs/03_画面仕様書.md)
- [開発計画](docs/04_開発計画_マイルストーン.md)
- [M0F 実現性検証仕様書](docs/05_実現性検証仕様書.md)
- [受入テスト仕様書](docs/06_受入テスト仕様書.md)
- [開発規約](CLAUDE.md)

## データと通信

設計データはローカルファイルと IndexedDB に保存します。静的アセット取得と PWA 更新確認を除き、プロジェクトデータ、利用状況、クラッシュ情報を外部へ送信しません。

## ライセンス

本ソフトウェアは [MIT License](LICENSE) で公開します。
