# Casper 决赛演示视频双语台本

目标时长：4 分 40 秒。

语言安排：成片全程使用英文配音。本文档中的中文内容仅用于理解、排练和操作指导，
不应出现在最终提交视频中。

## 为什么这套台本符合决赛要求

官方评审标准包括：技术实现、创新性、有意义的 Agentic AI、现实应用价值、用户体验、
Casper Testnet 智能合约、上线计划和长期生态影响。这套台本会为每项标准提供可见证据，
同时避免把视频录成逐个介绍按钮的功能清单。

视频的核心叙事是：

```text
off-chain RWA evidence
  -> explainable multi-agent underwriting
  -> Casper risk credential
  -> deterministic vault policy
  -> bounded capital intent
  -> Casper execution evidence and audit receipt
```

## 录制前准备

1. 主录制使用公开评委入口：`https://rwa.chenyuzhanglabs.com`。
2. 打开页面后点击 **Reset demo**，刷新一次，确认顶部 Benchmark 显示 `100%`。
3. 本地 `CASPER_MODE=mock` 版本仅作为断网或公共站点临时不可用时的录制备份。
4. 浏览器缩放保持 100%，使用 1080p、30 fps 录制。
5. 关闭通知和无关标签页，绝不能展示 `.env`、`.secrets`、钱包私钥或助记词。
6. 提前准备好 `demo-assets/synthetic-invoice-evidence.json`，确保文件选择器能快速找到。
7. 英文配音速度保持在每分钟 125–135 个单词。
8. 每个关键结果出现后停顿约一秒，让评委有时间阅读。

## 0:00–0:25｜问题与产品定位

### 画面操作

- 从页面第一屏开始。
- 让地址栏中的 `rwa.chenyuzhanglabs.com` 清晰停留约两秒，证明评委无需本地安装即可访问。
- 保持项目名称、`Finals v3`、三个工作流阶段、`Casper Testnet`、九项政策检查和
  Benchmark 同时可见。
- 暂时不要点击，鼠标从项目标题缓慢移动到三个工作流阶段即可。

### 英文台本

> This public judge build runs without local setup. Real-world asset lending needs more than an
> AI-generated score. It needs verifiable evidence,
> explicit authority, and a safe path from analysis to action. RWA Credit Sentinel is a bounded
> autonomous underwriting system on Casper. It converts invoice evidence into a risk credential,
> evaluates nine vault controls, and records a capital intent with a complete audit trail.

### 中文翻译

现实世界资产融资不能只依赖一个 AI 分数，还需要可验证的证据、明确的权限，以及从分析
到执行的安全路径。RWA Credit Sentinel 是构建在 Casper 上的受约束自主承保系统：它把
发票证据转换成风险凭证，执行九项资金政策，并留下完整的资本意图与审计轨迹。

### 评委关注点

现实应用价值、清晰的产品定位，以及聚焦的 RWA/DeFi 问题。

## 0:25–0:58｜真实 Casper Testnet 证据

### 画面操作

- 依次指向 **Finals deploy**、**Risk credential** 和 **Execution intent**。
- 简短指向 Contract hash 和 Package hash。
- 点击 **Verify live contract state**。
- 等待验证面板显示：
  - Risk credential `5/5`
  - Execution intent `8/8`
  - Principal ceiling `$125,000`
- 主录制过程中不需要打开 CSPR.live，除非一键验证发生异常。

### 英文台本

> This is a working Testnet application, not a front-end mock. The finals contract has one
> deployment transaction and two application state transitions. `record_credential` stores the
> underwriting result. `record_execution_intent` stores the decision, authorization, principal
> cap, and intent hash. This live verification reads both contract dictionaries from Casper RPC.
> Five credential fields and eight intent fields match, including the one-hundred-and-twenty-five
> thousand dollar ceiling.

### 中文翻译

这不是只有前端的模拟项目。决赛合约已经部署，并发生了两次真实业务状态变化：
`record_credential` 保存承保结果，`record_execution_intent` 保存决策、权限、本金上限
和意图哈希。一键验证会通过 Casper RPC 读取两个合约字典，并确认 5 个凭证字段和 8 个
执行字段全部一致。

### 评委关注点

可运行的智能合约、真实产生交易的链上行为，以及独立可复核的状态读取。

## 0:58–1:22｜证据上传与完整性边界

### 画面操作

- 滚动到 **Evidence intake**。
- 点击 **Add evidence files**。
- 选择 `demo-assets/synthetic-invoice-evidence.json`。
- 等待页面显示 `1 file hashed server-side`。
- 指向生成的 SHA-256 和 `Commercial claims remain unverified`。
- 点击 **Load sample**，恢复决赛使用的确定性四文件样本。
- 指向 `4 documents` 和可选的公开引用 URL，不要逐个修改所有输入框。

### 英文台本

> Evidence remains off-chain. I can submit bounded JSON, CSV, text, or PDF files. The server
> recomputes SHA-two-fifty-six hashes and builds a canonical manifest. This proves content
> integrity, not commercial truth. For a reproducible walkthrough, I now restore the synthetic
> four-document invoice pack.

### 中文翻译

原始证据保留在链下。系统支持受大小限制的 JSON、CSV、TXT 和 PDF，并由服务器重新计算
SHA-256，组成标准证据清单。哈希只能证明内容没有被替换，不能证明商业陈述本身真实。
为了保证评委可以复现，随后恢复四文件合成样本。

### 评委关注点

诚实的安全边界、可用的证据流程、隐私意识和用户体验。

## 1:22–2:02｜四个承保 Agent 与风险凭证

### 画面操作

- 让以下默认申请信息停留约两秒：
  - Invoice asset
  - `$125,000`
  - 30-day maturity
  - Acme Manufacturing
- 点击 **Run underwriting agents**。
- 凭证区域出现后，按照以下顺序指向：
  - Risk score `80`, `eligible`, and confidence
  - Factor scores
  - Report hash and evidence hash
  - Four document hashes and manifest hash
  - `Bounded agent runtime`
  - `Decision authority: server-policy`
  - `Private key access: none`

### 英文台本

> The first four agents have separate responsibilities. Data Agent normalizes the request. Risk
> Agent scores maturity, evidence coverage, exposure, and identity completeness. Verification
> Agent binds every document hash into the report. Decision Agent issues a structured credential.
> The result is an eligible score of eighty with an explainable factor breakdown. The provenance
> panel confirms that policy authority stays on the server and private keys are never available
> to the model.

### 中文翻译

前四个 Agent 各自承担独立职责：Data Agent 标准化请求；Risk Agent 评估期限、证据覆盖、
敞口和身份完整性；Verification Agent 把文件哈希绑定到报告；Decision Agent 生成结构化
凭证。最终得到 80 分的可解释结果。权限仍由服务器政策控制，模型永远接触不到私钥。

### 评委关注点

有意义的多 Agent 分工、可解释性、技术架构和可问责的自主性。

## 2:02–2:48｜批准受约束的资金动作

### 画面操作

- 保持 **autonomous** 模式。
- 指向服务器锁定的 Vault Policy。
- 使用默认参数点击 **Evaluate capital action**。
- 按以下顺序展示：
  - **Approve intent**
  - `$125,000`
  - `policy key`
  - `9/9 passed`
  - The nine hard and soft checks
  - Credential, Policy, Capital, and Execution Agent trace

### 英文台本

> The next four agents convert the credential into a bounded financial action. Credential Agent
> verifies the Casper-linked report. Policy Agent evaluates nine locked hard and soft controls.
> Capital Agent calculates the maximum principal. Execution Agent assigns authority. With the
> default case, all nine controls pass. The system approves a one-hundred-and-twenty-five-thousand
> dollar intent under policy-key authorization. This is constrained autonomy: agents can act only
> inside explicit capital and risk limits.

### 中文翻译

后四个 Agent 把凭证转换为受约束的资金动作：Credential Agent 验证 Casper 凭证；
Policy Agent 执行九项硬性和软性条件；Capital Agent 计算最高本金；Execution Agent
分配权限。默认情况下九项全部通过，系统批准 12.5 万美元，并分配政策密钥权限。这里
展示的是“受约束的自主性”，不是 AI 任意控制资金。

### 评委关注点

Agent 自主行动、确定性安全限制、资金控制和完整 DeFi 工作流。

## 2:48–3:13｜软失败转入人工多签

### 画面操作

- 把 **Advance rate** 从 `68` 改为 `85`。
- 点击 **Evaluate capital action**。
- 指向：
  - **Route to review**
  - `reviewer multisig`
  - `8/9 passed`
  - Failed check: `Advance rate ceiling`

### 英文台本

> Now I raise the advance rate from sixty-eight to eighty-five percent. This violates a soft
> boundary. The request is not silently rejected or automatically executed. It is routed to
> reviewer multisig, and the exact failed control remains visible.

### 中文翻译

把融资比例从 68% 提高到 85%，超过软性上限。系统既不会悄悄拒绝，也不会继续自动执行，
而是转入人工多签，并明确展示失败的是 Advance Rate 条件。

### 评委关注点

人工监督、安全的异常处理和可解释决策。

## 3:13–3:33｜硬失败阻断全部资金

### 画面操作

- 关闭 **Credential verified**。
- 点击 **Evaluate capital action**。
- 指向：
  - **Block execution**
  - `$0`
  - Authorization `none`
  - Credential hard failure

### 英文台本

> Next, I remove credential verification. This is a hard failure. Execution authority becomes
> none and the principal cap falls to zero. The trace shows exactly which agent stopped the
> action and why.

### 中文翻译

关闭凭证验证会触发硬性失败。执行权限变为 `none`，本金上限立即归零，Agent 轨迹会说明
是谁阻止了操作以及原因。

### 评委关注点

Fail-safe 机制，以及对未经验证的 AI 行为进行阻断。

## 3:33–4:08｜标准执行意图与审计回执

### 画面操作

- 依次点击 **Reset demo**、**Run underwriting agents**、**Evaluate capital action**，恢复批准
  案例。录制时快速完成这三个操作，后期剪掉等待时间。
- 指向 Intent ID、Asset、Decision、Authorization 和 Failed checks。
- 在 mock 模式下点击 **Anchor execution intent**。
- 展示 `Intent anchored`、Intent hash 和 `Local deterministic adapter`。
- 点击 **Decision receipt**，展示文件已下载即可，不要打开并滚动完整 JSON。
- 时间允许时，再简短指向顶部已发布的 **Execution intent** Testnet 链接。

### 英文台本

> Each outcome becomes a canonical execution intent with its asset, decision, authorization,
> failed checks, policy snapshot, and intent hash. In this safe local session, anchoring uses a
> deterministic adapter. The published Testnet transaction above proves the live contract path.
> The decision receipt exports the evidence boundary, eight-agent provenance, all nine checks,
> chain evidence, limitations, and its own receipt hash.

### 中文翻译

每个结果都会形成标准执行意图，包含资产、决策、权限、失败项、政策快照和意图哈希。
当前安全演示使用本地确定性适配器；顶部已发布的 Testnet 交易证明真实合约路径。决策
回执会导出证据边界、八 Agent 轨迹、九项检查、链上证据、限制说明和回执自身哈希。

### 评委关注点

可审计性、可复现性、实现完整度和真实 Casper 证据。

## 4:08–4:40｜基准测试、落地计划与结尾

### 画面操作

- 滚动到最后的 Benchmark 区域。
- 依次指向：
  - `30` cases
  - `100%` decision agreement
  - `100%` invalid credentials blocked
  - `9` covered policy failure modes
- 最后可以停留在 Benchmark，也可以回到标题区域作为干净的结束画面。

### 英文台本

> The benchmark covers thirty approve, review, and block scenarios, all nine policy failure
> modes, and blocks every invalid credential. It measures policy consistency, not predictive
> credit accuracy. The next step is a public Testnet pilot, followed by issuer allowlisting,
> multisig roles, external evidence adapters, an independent audit, and a capped receivables
> pool. RWA Credit Sentinel makes Casper the verifiable control layer between off-chain RWA
> intelligence and on-chain capital action.

### 中文翻译

30 个基准案例覆盖批准、人工复核和阻断，以及全部九种政策失败模式，无效凭证阻断率为
100%。这衡量的是政策一致性，不是假装已经证明信用预测准确率。下一步是公开 Testnet
试点，随后增加发行方白名单、多签角色、外部证据接口、独立审计和受额度限制的应收账款
资金池。项目最终希望让 Casper 成为链下 RWA 智能与链上资金动作之间的可验证控制层。

### 评委关注点

可量化的安全性、诚实的评估边界、上线计划和长期 Casper 生态价值。

## 英文发音提示

- RWA：逐个字母读，`R-W-A`
- DeFi：`dee-fye`
- Casper：`CAS-per`
- RPC：逐个字母读，`R-P-C`
- SHA-256：`S-H-A two fifty-six`
- Multisig：`multi-sig`
- Testnet：`test-net`
- Hash：`hash`

## 剪辑规则

- 全片使用同一个英文声音，条件允许时增加英文字幕。
- 剪掉加载等待、文件选择器导航和过长滚动。
- 产品出现前不要添加营销动画。
- 评委阅读结果时保持鼠标静止。
- 不要宣称哈希能够证明商业内容真实。
- 不要宣称原型已经移动或托管真实资金。
- 使用 `execution intent`，不要说 `loan settlement`。
- 使用 `public evidence references`，不要说 `uploaded private contracts`。
- 最终视频保持在 4 分 20 秒到 5 分钟之间。

## 最终录制检查表

- [ ] 前五秒出现项目名称和 `Finals v3`。
- [ ] Casper 实时验证展示 `5/5`、`8/8` 和 `$125,000`。
- [ ] 文件上传展示服务器生成的哈希和“不能证明商业真实性”的边界。
- [ ] 说出前四个承保 Agent 的名称。
- [ ] 说出后四个执行 Agent 的名称。
- [ ] 批准、人工复核和阻断三个结果全部可见。
- [ ] 执行意图和决策回执可见。
- [ ] 30 案例 Benchmark 可见。
- [ ] 结尾说明 Casper 为什么不可替代。
- [ ] 没有出现秘密、私钥、`.env` 或钱包弹窗。
