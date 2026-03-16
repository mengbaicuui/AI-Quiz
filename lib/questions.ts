export interface Question {
  type: 'radio' | 'checkbox' | 'textarea';
  question: string;
  options?: string[];
  answer?: string | string[];
  id?: string;
  points: number;
  /** 简答题的参考答案，提交后展示给学生 */
  referenceAnswer?: string;
  /** 选择题的解析，错题时展示 */
  explanation?: string;
}

export interface QuestionGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
}


// ═══════════════════════════════════════════════════════
// 第1组：RAG 选择题（7 单选 + 3 多选）
// ═══════════════════════════════════════════════════════
const group1Questions: Question[] = [

  // ── Q1：父文档检索的核心矛盾 ──
  {
    type: 'radio',
    question:
      '一家企业正在构建内部知识库 RAG 系统。文档平均长度为 5000 tokens。团队发现：\n' +
      '• 使用 200 token 的小 chunk 时，向量检索命中率高，但生成的回答经常信息不完整，缺少上下文\n' +
      '• 使用 2000 token 的大 chunk 时，回答信息更完整，但检索时引入大量无关内容，导致 LLM 产生幻觉\n\n' +
      '为了同时获得高检索精度和完整的上下文信息，应该采用哪种策略？',
    options: [
      'A. 将 chunk size 设为 200 token 并将 TopK 从 3 提高到 20，用更多小 chunk 拼出完整上下文',
      'B. 采用父文档检索（Parent Document Retrieval）：用小 chunk 做向量匹配，命中后返回其所属的大 chunk 作为 LLM 上下文',
      'C. 将 chunk size 统一为 1000 token 作为折中方案',
      'D. 放弃向量检索，改用 BM25 全文检索以获得更精确的关键词匹配'
    ],
    answer: 'B',
    points: 1,
    explanation: '父文档检索用小 chunk 做向量匹配保证检索精度，命中后返回其所属大 chunk 作为上下文，兼顾检索精度与上下文完整性。',
  },

  // ── Q2：RAG Triad 诊断 ──
  {
    type: 'radio',
    question:
      '一个 RAG 系统上线后，评估团队发现以下指标表现：\n' +
      '• Context Precision（上下文精度）：0.92 — 检索到的文档与问题高度相关\n' +
      '• Answer Relevance（答案相关性）：0.88 — 答案与问题高度相关\n' +
      '• Groundedness（忠实度）：0.35 — 答案中大量内容无法在检索到的上下文中找到依据\n\n' +
      '基于 RAG Triad 框架分析，这种指标组合最可能指向什么问题？',
    options: [
      'A. 检索器召回率不足，遗漏了关键文档，导致 LLM 被迫编造内容',
      'B. LLM 产生了幻觉（Hallucination）——检索到了正确文档，但模型没有忠实地基于上下文生成，而是依赖自身参数知识编造了看似合理的内容',
      'C. Embedding 模型质量差，导致语义匹配不准确',
      'D. Chunk size 过大，包含太多噪声信息干扰了 LLM 的理解'
    ],
    answer: 'B',
    points: 1,
    explanation: 'Groundedness 低说明答案无法在检索上下文中找到依据，属于生成层幻觉——模型未忠实基于上下文而是自行编造。',
  },

  // ── Q3：HyDE 原理 ──
  {
    type: 'radio',
    question:
      '某客服 RAG 系统中，用户经常用口语化的短句提问（如"退货怎么搞"），而知识库中的文档是正式的政策条款（如"退换货政策：消费者在收到商品之日起七日内..."）。团队发现直接用用户 query 做向量检索时，Recall@5 只有 0.3。\n\n' +
      '为了提升检索质量，团队决定采用 HyDE（Hypothetical Document Embeddings）。以下对 HyDE 工作原理的描述，哪个是正确的？',
    options: [
      'A. HyDE 先用 LLM 将口语化 query 改写为正式语言，然后用改写后的文本做关键词检索',
      'B. HyDE 先让 LLM 生成一个假设性的回答文档，然后用这个假设文档的 embedding 去检索，使检索向量更接近知识库文档的语义空间',
      'C. HyDE 用 LLM 对 query 做实体提取，然后用提取的实体做精确匹配检索',
      'D. HyDE 先用 LLM 对知识库文档做摘要，缩小文档和 query 之间的语义鸿沟'
    ],
    answer: 'B',
    points: 1,
    explanation: 'HyDE 让 LLM 生成假设性答案文档，用其 embedding 去检索，使向量更接近知识库文档语义空间，缓解 query 与文档间的语义鸿沟。',
  },

  // ── Q4：混合检索架构设计（多选） ──
  {
    type: 'checkbox',
    question:
      '一家金融机构正在构建合规文档 RAG 系统。文档中既包含大量专业术语（如"EBITDA"、"Basel III"），也包含语义丰富的分析段落。团队发现：\n' +
      '• 纯向量检索：能找到语义相关的段落，但经常漏掉包含精确术语的条款\n' +
      '• 纯 BM25：能精确匹配术语，但无法理解同义表达（如"盈利能力"≈"EBITDA"）\n\n' +
      '为了同时覆盖精确术语匹配和语义理解，以下哪些组件应该纳入检索架构？（选择三个）',
    options: [
      'A. BM25 稀疏检索作为精确术语匹配通道',
      'B. 向量检索（Dense Retrieval）作为语义匹配通道',
      'C. Cross-Encoder 重排序器（Reranker），对 BM25 + 向量检索的合并结果进行精排',
      'D. 将 LLM 的 temperature 设为 0 以减少幻觉',
      'E. 将所有文档翻译成英文以统一语义空间'
    ],
    answer: ['A', 'B', 'C'],
    points: 1,
    explanation: 'BM25 负责精确术语匹配，向量检索负责语义，Reranker 对两路结果合并精排；D/E 与检索架构无直接关系。',
  },

  // ── Q5：GraphRAG 社区发现 ──
  {
    type: 'radio',
    question:
      '在使用 Microsoft GraphRAG 构建企业知识图谱时，系统会在索引阶段执行"社区发现（Community Detection）"算法，将实体和关系聚类成多个社区，并为每个社区生成摘要。\n\n' +
      '以下哪个选项最准确地解释了 GraphRAG 为什么要做社区发现？',
    options: [
      'A. 社区发现的目的是减少图数据库的存储空间，将相似实体合并去重',
      'B. 社区发现是为了在检索时能获取同一主题/领域下的完整上下文——通过社区摘要，即使用户的问题没有精确匹配到某个实体，也能通过匹配社区级摘要获得该主题下的全局知识',
      'C. 社区发现仅用于数据可视化，帮助运维人员理解图谱结构，不参与实际检索',
      'D. 社区发现是为了限制图遍历的深度，防止检索路径过长导致延迟增加'
    ],
    answer: 'B',
    points: 1,
    explanation: '社区发现将图划分为主题社区并生成摘要，检索时可通过社区级摘要获取该主题下的全局知识。',
  },

  // ── Q6：Chunking 策略选择 ──
  {
    type: 'radio',
    question:
      '一家律师事务所正在为其法律合同 RAG 系统选择 Chunking 策略。合同文档具有以下特点：\n' +
      '• 条款之间存在强引用关系（如"根据第3.2条的规定..."）\n' +
      '• 每个条款内部语义自洽，但条款之间长度差异很大（从 50 字到 2000 字不等）\n' +
      '• 上下文完整性对法律解释至关重要\n\n' +
      '以下哪种 Chunking 策略最适合该场景？',
    options: [
      'A. 固定长度切分（每 500 token 一个 chunk），简单高效',
      'B. 基于语义的递归切分（RecursiveCharacterTextSplitter），按换行 → 句号 → 逗号层层回退',
      'C. 基于文档结构的切分，以条款编号为边界，保持每个条款作为独立 chunk，并在 metadata 中保存条款编号和引用关系',
      'D. 不做切分，将整个合同作为一个 chunk 送入 LLM'
    ],
    answer: 'C',
    points: 1,
    explanation: '按条款边界切分保持条款完整，便于保留 metadata 与引用关系，满足法律文档的上下文完整性需求。',
  },

  // ── Q7：检索评估指标选择 ──
  {
    type: 'radio',
    question:
      '一个医疗知识 RAG 系统正在评估检索质量。评估需求如下：\n' +
      '• 每个问题通常有多个相关文档（如一种疾病的诊断标准、治疗方案、用药指南可能分布在不同文档中）\n' +
      '• 不仅要考虑"是否检索到了相关文档"，还要考虑相关文档的排名位置\n' +
      '• 排在前面的相关文档应获得更高权重\n\n' +
      '以下哪个评估指标最符合上述需求？',
    options: [
      'A. Recall@K — 只关注是否检索到了所有相关文档，不考虑排名位置',
      'B. MRR（Mean Reciprocal Rank）— 只关注第一个相关文档的排名位置',
      'C. nDCG@K（Normalized Discounted Cumulative Gain）— 综合考虑多个相关文档的排名位置，排名越靠前权重越高',
      'D. Precision@K — 只关注 TopK 结果中相关文档的比例，不考虑排名顺序'
    ],
    answer: 'C',
    points: 1,
    explanation: 'nDCG@K 综合考虑多个相关文档的排名位置，排名越靠前权重越高，符合多相关文档且重视排名的需求。',
  },

  // ── Q8：Self-RAG 机制 ──
  {
    type: 'radio',
    question:
      '研究团队正在评估是否将 Self-RAG 架构应用于一个需要高准确性的科研文献问答系统。以下对 Self-RAG 核心机制的描述，哪个是准确的？',
    options: [
      'A. Self-RAG 在每次用户查询时都执行检索，然后用 LLM 评估检索结果的质量，质量不达标则丢弃检索结果',
      'B. Self-RAG 训练模型生成特殊的反思标记（reflection tokens），使模型能自主判断：(1) 是否需要检索、(2) 检索到的文档是否相关、(3) 生成的内容是否有检索支撑，从而实现按需检索和自我纠正',
      'C. Self-RAG 是一种纯后处理方法，先用普通 RAG 生成答案，再用另一个 LLM 检查答案是否正确',
      'D. Self-RAG 通过让用户手动标注检索质量来持续改进检索器'
    ],
    answer: 'B',
    points: 1,
    explanation: 'Self-RAG 通过训练模型生成反思标记，自主判断是否需要检索、结果是否相关、生成是否有依据，实现按需检索与自我纠正。',
  },

  // ── Q9：企业 RAG 版本/权限/时效性（多选） ──
  {
    type: 'checkbox',
    question:
      '一家跨国物流公司的 RAG 系统面临以下问题：\n' +
      '• 运价政策 v5 已发布但尚未生效，销售人员查询时系统仍返回旧版 v4 的条款\n' +
      '• 不同事业部的员工在 RAG 回答中看到了对方事业部的内部文件\n' +
      '• 文档更新后，缓存仍返回旧版本的答案\n\n' +
      '为系统性解决这些问题，以下哪些设计是必要的？（选择四个）',
    options: [
      'A. 为文档打上 effective_from / expires_at 时间标签，检索时做时间感知过滤，只返回当前时刻有效的文档版本',
      'B. 在检索阶段引入基于用户角色/事业部的 ACL（访问控制列表）过滤，确保用户只能检索到有权限查看的文档',
      'C. 缓存的 key 必须包含 userId、roles、doc_version 等维度，新版本生效时主动失效旧缓存',
      'D. 建立事件驱动的增量同步机制（如 Webhook），文档更新后自动触发向量库的 Upsert/软删除',
      'E. 将 TopK 从 3 提高到 20，这样自然能覆盖到最新文档',
      'F. 对基础模型进行微调，将最新政策直接写入模型参数中'
    ],
    answer: ['A', 'B', 'C', 'D'],
    points: 1,
    explanation: '版本需时间标签；权限需 ACL 过滤；缓存需含用户/角色/版本维度；文档更新需增量同步。E/F 无法系统性解决。',
  },

  // ── Q10：Bad case 分层定位（多选） ──
  {
    type: 'checkbox',
    question:
      '一个 RAG 系统上线后收到用户反馈："我问的是2024年最新的退货政策，但系统给出的答案完全是编造的，知识库里根本没有这个内容。"\n\n' +
      '作为 RAG 工程师，你需要分层定位问题。以下哪些是正确的诊断步骤和分析思路？（选择三个）',
    options: [
      'A. 第一步检查检索层：查看实际检索到的 TopK 文档是否包含 2024 年退货政策，如果检索结果中没有相关文档，说明问题出在检索阶段（可能是索引未更新、query 与文档语义不匹配、或文档根本不存在）',
      'B. 第一步直接调高 temperature 参数让 LLM 生成更多样化的回答，增加命中正确答案的概率',
      'C. 如果检索结果包含正确文档但 LLM 回答仍然错误，说明问题出在生成层——可能是 LLM 幻觉、上下文过长导致关键信息被淹没、或 prompt 设计不当',
      'D. 如果检索结果中压根不存在 2024 年退货政策文档，需要进一步确认：该文档是否已被正确索引？是否在 chunking 时被切碎导致语义丢失？还是知识库本身就缺少这份文档？',
      'E. 不需要诊断，直接对 LLM 进行全量微调就能解决所有幻觉问题'
    ],
    answer: ['A', 'C', 'D'],
    points: 1,
    explanation: '先查检索层 TopK 是否含相关文档；有则问题在生成层（幻觉/prompt）；无则排查索引、chunk、知识库完整性。B/E 不是正确诊断思路。',
  },
];


// ═══════════════════════════════════════════════════════
// 第2组：RAG 简答题（10 题）
// ═══════════════════════════════════════════════════════
const group2Questions: Question[] = [

  // ── Q11：Recall@K 与 Context Precision ──
  {
    type: 'textarea',
    question: '在 RAG 系统的检索评估中，Recall@K（召回率）和 Context Precision（上下文精度）往往存在 trade-off 关系。\n\n请解释：\n(1) 这两个指标分别衡量什么？\n(2) 为什么提高 K 值通常会提升 Recall 但降低 Precision？\n(3) 在实际 RAG 应用中，如何平衡两者？给出至少一种具体方法。',
    id: 'shortAnswer_recall_precision',
    points: 2,
    referenceAnswer:
      '① 指标定义：Recall@K 衡量在前 K 个结果中相关文档的覆盖率（是否搜到了）；Context Precision 衡量检索出的结果中相关信息在 TopK 中的排列质量及信噪比（搜到的是否准确且排在前面）。\n' +
      '② Trade-off 原因：增加 K 值能容纳更多候选，从而提高覆盖正确答案的概率（Recall↑）；但同时会引入更多无关噪声，稀释了相关内容的比例，并可能干扰 LLM 的理解（Precision↓）。\n' +
      '③ 平衡方法：1. 引入 Reranker（重排序）：先大范围召回（高 K）保证 Recall，再用交叉编码器精选 TopN 提升 Precision；2. 动态阈值：根据检索分数过滤无关块；3. 混合检索：结合关键词与语义检索，在低 K 情况下提升命中率。',
  },

  // ── Q12：Bad case 分层定位 ──
  {
    type: 'textarea',
    question: '你负责的 RAG 系统收到一个 bad case：用户问"公司差旅报销的标准是什么？"，系统回答了一段看似合理但完全错误的内容。\n\n请描述你完整的分层诊断流程：从哪里开始检查？每一层检查什么？不同检查结果分别指向什么问题？',
    id: 'shortAnswer_bad_case',
    points: 2,
    referenceAnswer:
      '应遵循“由内而外”的排查流程：\n' +
      '1. 检索层检查：确认检索到的 TopK Chunk 是否包含答案所需的正确知识。若不包含，问题出在 Embedding 质量、切分策略或文档缺失。\n' +
      '2. 上下文层检查：若检索到了正确 Chunk，检查其是否因为排名靠后被 Reranker 过滤，或因为上下文过长被截断。\n' +
      '3. 生成层检查：若上下文包含正确知识但回答错误，检查 Prompt 是否存在误导、LLM 指令遵循能力不足、或 Temperature 过高导致幻觉。\n' +
      '4. 数据层检查：核实原始文档本身是否陈旧或存在冲突（如 v4 与 v5 版并存）。',
  },

  // ── Q13：GraphRAG vs LightRAG ──
  {
    type: 'textarea',
    question: 'GraphRAG（Microsoft）和 LightRAG 都是基于知识图谱的 RAG 方案，但它们在索引和检索策略上有本质区别。\n\n请回答：\n(1) GraphRAG 为什么需要做社区发现（Community Detection）？\n(2) LightRAG 为什么可以不需要做社区发现？它用什么替代方案？\n(3) 在什么场景下你会选择 GraphRAG 而不是 LightRAG？',
    id: 'shortAnswer_graph_rag',
    points: 2,
    referenceAnswer:
      '① GraphRAG（MS）：核心在于“预计算”。利用社区发现（Leiden 算法）将全图划分为不同层级的社区并预生成摘要。这解决了“全局性问题”（如：总结这 100 份合同的共同风险），因为它可以直接检索社区摘要而非离散实体。\n' +
      '② LightRAG：核心在于“双层检索”。它不需要繁重的社区发现预计算，而是通过实体、关系及它们在文本中的邻域，构建局部和全局两个维度的索引，实现低成本的增量更新。它用图算法中的邻域扩展替代了静态社区。\n' +
      '③ 选型：若需处理超大规模、需要全局总结性洞察的任务选 GraphRAG；若关注索引更新效率、低延迟以及局部细粒度关系推理选 LightRAG。',
  },

  // ── Q14：HyDE 的优势与局限 ──
  {
    type: 'textarea',
    question: 'HyDE（Hypothetical Document Embeddings）是一种通过生成假设文档来改善检索质量的技术。\n\n请分析：\n(1) HyDE 解决了传统向量检索的什么核心问题？\n(2) HyDE 在什么场景下效果最好？什么场景下效果不好甚至有害？\n(3) HyDE 相比 Query Rewrite 有什么优劣势？',
    id: 'shortAnswer_hyde',
    points: 2,
    referenceAnswer:
      '① 核心问题：解决了 Query（简短、口语）与 Document（长篇、书面）之间的语义鸿沟（Embedding 空间不一致）。\n' +
      '② 适用性：在“零样本（Zero-shot）”或领域极其专业、常规检索难以匹配语义时效果最好。但在 LLM 对该领域完全无知（产生严重幻觉）或用户问题极度精确（如搜特定 ID）时，HyDE 会生成误导性的虚假文档，反而拉低检索精度。\n' +
      '③ 优劣势：相比 Query Rewrite，HyDE 生成的是“类答案”文本，在 Embedding 空间中与目标文档更近；劣势是多了一次 LLM 调用成本，且对 LLM 的基本常识水平有依赖。',
  },

  // ── Q15：Cross-Encoder Reranking ──
  {
    type: 'textarea',
    question: '很多 RAG 系统在向量检索（Bi-Encoder）之后加入 Cross-Encoder 重排序（Reranking）阶段。\n\n请解释：\n(1) Cross-Encoder 与 Bi-Encoder 在架构上有什么区别？为什么 Cross-Encoder 通常更准确？\n(2) 为什么不直接用 Cross-Encoder 做第一阶段检索？\n(3) 在 RAG 流水线中，Reranking 的 TopN → TopK 配置对最终效果有什么影响？',
    id: 'shortAnswer_reranking',
    points: 2,
    referenceAnswer:
      '① 架构区别：Bi-Encoder 将 Q 和 D 独立编码，损失了两者间的细粒度交互信息；Cross-Encoder 将 Q 和 D 同时输入模型，通过 Attention 机制捕获每一个词之间的语义关联，因此建模更准、区分度更高。\n' +
      '② 检索瓶颈：Cross-Encoder 的计算复杂度是 O(N)，必须对每一对 (Q, D) 进行推理，无法像向量检索（O(log N)）那样使用 ANN 索引进行大规模过滤，计算成本极高。\n' +
      '③ 配置影响：TopN（进入精排的数量）决定了 Recall 的上限，若 TopN 太小，即使精排模型再强也无济于事；TopK（最终送入 LLM 的数量）决定了上下文的纯净度，K 过大会引入冗余噪声，干扰生成。',
  },

  // ── Q16：RAG Triad 协同诊断 ──
  {
    type: 'textarea',
    question: 'RAG Triad 由三个指标组成：Context Relevance（上下文相关性）、Groundedness（忠实度）和 Answer Relevance（答案相关性）。\n\n请针对以下三种异常模式，分析各自最可能的根因，并给出对应的优化方向：\n(1) Context Relevance 低，Groundedness 高，Answer Relevance 低\n(2) Context Relevance 高，Groundedness 低，Answer Relevance 高\n(3) Context Relevance 高，Groundedness 高，Answer Relevance 低',
    id: 'shortAnswer_rag_triad',
    points: 2,
    referenceAnswer:
      '① 模式 (1)：检索层完全失败。上下文不相关导致 LLM 虽“老实”但“无米下锅”。优化方向：改进向量模型、优化切分策略、引入混合检索。\n' +
      '② 模式 (2)：生成层幻觉。检索到了对的内容，但模型“自信编造”。优化方向：在 Prompt 中强化“根据已知信息回答，若无则拒绝”的约束，或降低 Temperature，引入 RLC（自我反思）。\n' +
      '③ 模式 (3)：Query 遵循失败。检索和生成都忠实，但模型没有直接回答用户的问题（如答非所问）。优化方向：优化 System Prompt 的角色设定，加强指令微调（SFT），或对生成结果进行相关性判别。',
  },

  // ── Q17：大 Context Window 能否替代 RAG ──
  {
    type: 'textarea',
    question: '随着 LLM 支持的 context window 越来越大（如 Gemini 支持 1M tokens），有人认为可以直接将所有文档塞入上下文，不再需要 RAG 检索。\n\n请分析：\n(1) 大 context window 在哪些场景下确实可以替代 RAG？\n(2) 即使有超长上下文，RAG 仍然必要的理由有哪些？（至少给出三个）\n(3) "Lost in the Middle" 现象是什么？它如何影响超长上下文的实际效果？',
    id: 'shortAnswer_context_window',
    points: 2,
    referenceAnswer:
      '① 替代场景：中短篇幅文档集（如单本小说）、需要强全局逻辑连贯性的深度分析、以及对实时性要求极高的动态上下文。\n' +
      '② 必要理由：1. 成本与延迟：全量输入 Token 消耗呈线性甚至平方级增长；2. 数据动态性：RAG 仅需 Upsert 向量，无需重新构建长上下文；3. 精确度：RAG 减少了无关信息干扰。\n' +
      '③ Lost in the Middle：指模型在处理超长文本时，对开头和结尾信息敏感，而容易忽略中间段落的现象。这证明了即使窗口够大，模型对信息的利用率也会随深度增加而下降，RAG 的“精选”依然有价值。',
  },

  // ── Q18：Corrective RAG (CRAG) 工作流 ──
  {
    type: 'textarea',
    question: 'Corrective RAG（CRAG）在标准 RAG 流程中加入了"检索结果评估与纠正"机制。\n\n请描述：\n(1) CRAG 的完整工作流程（从用户查询到最终回答）\n(2) CRAG 中的检索评估器（Retrieval Evaluator）如何判断检索结果的质量？判断结果有哪几种类别？\n(3) 当检索结果被判定为"不相关"时，CRAG 会采取什么补救措施？',
    id: 'shortAnswer_crag',
    points: 2,
    referenceAnswer:
      '① 流程：Retrieve -> Evaluate -> Action。先检索，由评估器打分；若相关则直接生成；若完全不相关，则触发“Web Search”或其他外部数据源补充；若不确定，则结合检索内容与搜索结果融合生成。\n' +
      '② 评估器：通常是轻量级模型或逻辑，判断结果分为：Correct（正确）、Incorrect（错误）、Ambiguous（模糊）。\n' +
      '③ 补救措施：当判定为 Incorrect 时，完全舍弃检索到的 Chunk，通过搜索引擎（如 Tavily）获取互联网实时信息，确保回答不因知识库缺失而导致幻觉。',
  },

  // ── Q19：Embedding 模型选择 ──
  {
    type: 'textarea',
    question: '选择合适的 Embedding 模型对 RAG 系统的检索质量至关重要。\n\n请分析：\n(1) 评估 Embedding 模型时应关注哪些关键维度？（至少列出四个）\n(2) 通用 Embedding 模型（如 OpenAI text-embedding-3）与领域微调 Embedding 模型各适用于什么场景？\n(3) 如果更换了 Embedding 模型，对现有 RAG 系统有什么影响？需要注意什么？',
    id: 'shortAnswer_embedding',
    points: 2,
    referenceAnswer:
      '① 维度：检索精度（MTEB 榜单表现）、向量维度（影响存储成本）、支持的最大序列长度、多语言支持、推理延迟（QPS）。\n' +
      '② 场景：通用模型（OpenAI/BGE）适合通用语料、多行业混杂场景，维护简单；微调模型适合有大量专有名词（医疗、法律）或特定业务逻辑的垂直领域。\n' +
      '③ 影响：更换模型是“伤筋动骨”的操作。必须全量重新索引所有文档，因为不同模型的向量空间不兼容；同时需重新调整相似度阈值（Cosine Similarity），并在生产环境进行新旧索引的 A/B Test。',
  },

  // ── Q20：Query 歧义处理 ──
  {
    type: 'textarea',
    question: '在实际 RAG 系统中，用户查询往往存在歧义。例如用户问"苹果的最新消息"，可能指 Apple 公司也可能指水果。\n\n请回答：\n(1) RAG 系统中常见的 query 歧义类型有哪些？（至少列出三种）\n(2) 针对歧义 query，有哪些处理策略？（至少说明两种，并分析各自的优缺点）\n(3) 在什么情况下，RAG 系统应该主动向用户追问澄清，而不是猜测用户意图？',
    id: 'shortAnswer_query_ambiguity',
    points: 2,
    referenceAnswer:
      '① 类型：实体多义（如“苹果”）、指代不明（如“它的价格”）、范围缺失（如“最新的政策”——哪个地区？）。\n' +
      '② 策略：1. Multi-Query 扩展：利用 LLM 将歧义词拆解为多个可能的具体问题分别检索，取交集或并集，优点是召回全，缺点是干扰多；2. 对话历史改写：利用 Context 补全指代信息，解决上下文依赖歧义。\n' +
      '③ 主动追问：当多个检索分支的置信度非常接近且互斥时（如问“张三”的简历，系统中有两个不同部门的张三），应停止盲目猜测，通过 Clarification Turn 向用户索要更多约束条件，确保金融或医疗等严肃场景的安全。',
  },
];


// ═══════════════════════════════════════════════════════
// 分组数据
// ═══════════════════════════════════════════════════════
export const questionGroups: QuestionGroup[] = [
  {
    id: 'group1',
    title: 'RAG 选择题',
    description: '场景化选择题，测试对 RAG 核心技术和架构模式的深度理解',
    icon: '🎯',
    questions: group1Questions,
  },
  {
    id: 'group2',
    title: 'RAG 简答题',
    description: '开放式问答，考查对 RAG 系统设计、评估与优化的综合分析能力',
    icon: '✍️',
    questions: group2Questions,
  },
];

// 兼容性：保留原有的 quizData 导出（将所有题目平铺）
export const quizData: Question[] = questionGroups.flatMap(group => group.questions);

// 计算总分
export const totalPoints = quizData.reduce((sum, q) => sum + q.points, 0);

// 计算每组的总分
export const groupPoints = questionGroups.map(group => ({
  groupId: group.id,
  title: group.title,
  points: group.questions.reduce((sum, q) => sum + q.points, 0),
}));
