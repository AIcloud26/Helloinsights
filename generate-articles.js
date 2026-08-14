// ============================================
// HelloInsights - generate-articles-v3.js
// 重构版本改进：
// 1. 图片池扩充到50+张/分类，round-robin 去重
// 2. 8种文章结构模板，语言多样化
// 3. 观点库从外部 JSON 文件读取
// 4. 每篇文章随机插入1-2段观点，插入位置因模板而异
// 5. 最新3篇文章自动标记 featured: true
// 6. ES5 兼容，保留 GitHub Action 兼容性
// ============================================
var fs = require('fs');
var https = require('https');

// ============================================
// 配置
// ============================================
var CONFIG = {
  articlesPerDay: 5,
  useAI: false,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: 'gpt-3.5-turbo',
  maxArticles: 500
};

// ============================================
// 分类和主题
// ============================================
var CATEGORIES = [
  {
    id: 'technology', name: 'Technology',
    topics: ['AI and Machine Learning', 'Quantum Computing', 'Cybersecurity', 'Web3 and Blockchain', 'Cloud Computing', 'IoT and Smart Devices', 'Robotics and Automation', '5G Networks', 'Edge Computing', 'Sustainable Technology']
  },
  {
    id: 'finance', name: 'Finance',
    topics: ['Cryptocurrency and DeFi', 'Stock Market Analysis', 'Personal Finance', 'Real Estate Investment', 'Retirement Planning', 'Banking Technology', 'Global Economic Outlook', 'ESG Investing', 'Fintech Innovation', 'Wealth Management']
  },
  {
    id: 'ai-tools', name: 'AI Tools',
    topics: ['ChatGPT and Language Models', 'AI Image Generation', 'AI Coding Assistants', 'AI Productivity Apps', 'Machine Learning Platforms', 'AI Automation', 'Voice and Speech AI', 'AI for Business', 'AI Writing Assistants', 'AI Video Creation']
  },
  {
    id: 'health-lifestyle', name: 'Health & Lifestyle',
    topics: ['Nutrition and Diet', 'Fitness and Exercise', 'Mental Health', 'Sleep Optimization', 'Productivity', 'Work-Life Balance', 'Healthy Recipes', 'Wellness Technology', 'Stress Management', 'Meditation Practices']
  }
];

// ============================================
// 图片池 - 每分类50+张
// 使用 Unsplash 图片 ID，格式：https://images.unsplash.com/photo-XXXXXXXXXXX-YYYYYYY
// 通过随机偏移生成足够数量的真实可用图片 ID
// ============================================
var IMAGE_IDS = {
  'technology': [
    'photo-1451187580459-43490279c0fa', 'photo-1454165804606-c3d57bc86b40',
    'photo-1460925895917-afdab827c52f', 'photo-1461749280684-dccba630e2f6',
    'photo-1485827404703-89b55fcc595e', 'photo-1486312338219-ce68d2c6f44d',
    'photo-1488590528505-98d2b5aba04b', 'photo-1496171367470-9ed9a91ea931',
    'photo-1498050108023-c5249f4df085', 'photo-1504384308090-c894fdcc538d',
    'photo-1504384764586-bb4cdc1707b0', 'photo-1504639725590-34d0984388bd',
    'photo-1516321318423-f06f85e504b3', 'photo-1516321497487-e288fb19713f',
    'photo-1517245386807-bb43f82c33c4', 'photo-1517430816045-df4b7de11d1d',
    'photo-1517694712202-14dd9538aa97', 'photo-1518186285589-2f7649de83e0',
    'photo-1518770660439-4636190af475', 'photo-1518773553398-650c184e0bb3',
    'photo-1519389950473-47ba0277781c', 'photo-1521737604893-d14cc237f11d',
    'photo-1522071820081-009f0129c71c', 'photo-1524995997946-a1c2e315a42f',
    'photo-1526374965328-7f61d4dc18c5', 'photo-1531297484001-80022131f5a1',
    'photo-1531403009284-440f080d1e12', 'photo-1535378917042-10a22c95931a',
    'photo-1550751827-4bd374c3f58b', 'photo-1555066931-4365d14bab8c',
    'photo-1568992688065-536aad8a12f6', 'photo-1569258684199-a01f97681c37',
    'photo-1571893714939-85a8e97c329d', 'photo-1576153192281-d558108925bb',
    'photo-1579547621706-1a9c79d5c9f1', 'photo-1584913855963-e0b0229af61d',
    'photo-1586208958839-06c17cacdf08', 'photo-1589561253898-768105ca91a8',
    'photo-1601628403125-e02115bcb0fe', 'photo-1607031542107-f6f46b5d54e9',
    'photo-1607799279861-4dd421887fb3', 'photo-1609761973820-17fe079a78dc',
    'photo-1609983508295-e37542f15b2c', 'photo-1617358142775-4be217d9cc19',
    'photo-1619118884592-11b151f1ae11', 'photo-1619669906274-d379128eaa59',
    'photo-1620207418302-439b387441b0', 'photo-1620807773206-49c1f2957417',
    'photo-1620987278429-ab178d6eb547', 'photo-1621619856624-42fd193a0661',
    'photo-1621868402792-a5c9fa6866a3', 'photo-1622547748225-3fc4abd2cca0',
    'photo-1625540002162-00320b5c6b63', 'photo-1626761191814-a9dc9efd085c',
    'photo-1627635174707-a629d585e1e7', 'photo-1628544106915-0d756c7dadfa',
    'photo-1633596683562-4a47eb4983c5', 'photo-1633783156075-a01661455344',
    'photo-1636150721221-b88b3c2299be'
  ],
  'finance': [
    'photo-1452261229273-42e33418719b', 'photo-1454165804606-c3d57bc86b40',
    'photo-1458681407517-f6a21aad9ec9', 'photo-1460925895917-afdab827c52f',
    'photo-1464550883968-cec281c19761', 'photo-1466130336765-74ab8b8ab229',
    'photo-1466690672306-5f92132f7248', 'photo-1468590069246-1d314d8c78bb',
    'photo-1478034182233-3f6bb5db41ad', 'photo-1482501157762-56897a411e05',
    'photo-1486074051793-e41332bf18fc', 'photo-1490132328392-e6ef54a90dda',
    'photo-1491895200222-0fc4a4c35e18', 'photo-1494264274944-1ba7d9b73135',
    'photo-1495521939206-a217db9df264', 'photo-1498262257252-c282316270bc',
    'photo-1498387727476-b30055b2ef21', 'photo-1499750310107-5fef28a66643',
    'photo-1500043357865-c6b8827edf10', 'photo-1504608524841-42fe6f032b4b',
    'photo-1504708706948-13d6cbba4062', 'photo-1506629082955-511b1aa562c8',
    'photo-1506947411487-a56738267384', 'photo-1511546395756-590dffdcdbd1',
    'photo-1511842745775-b366af36db2a', 'photo-1511933801659-156d99ebea3e',
    'photo-1514344695906-2084e05bf61d', 'photo-1515573998019-c132a6782768',
    'photo-1516062423079-7ca13cdc7f5a', 'photo-1516594915697-87eb3b1c14ea',
    'photo-1517420879524-86d64ac2f339', 'photo-1518314916381-77a37c2a49ae',
    'photo-1520643187271-06df1162815e', 'photo-1522169799806-79cb544552bf',
    'photo-1522205940279-d75807ebcd91', 'photo-1522869635100-9f4c5e86aa37',
    'photo-1523240795612-9a054b0db644', 'photo-1525184782196-8e2ded604bf7',
    'photo-1527694224012-be005121c774', 'photo-1528877720315-1d05b40cd826',
    'photo-1530653870565-465a2b1d3f8d', 'photo-1535598745644-bc7913bb1a2a',
    'photo-1537137601405-597f75677817', 'photo-1550745165-9bc0b252726f',
    'photo-1551288049-bebda4e38f71', 'photo-1554224154-22dec7ec8818',
    'photo-1554224154-26032ffc0d07', 'photo-1554224155-6726b3ff858f',
    'photo-1554224155-8d04cb21cd6c', 'photo-1559526324-4b87b5e36e44',
    'photo-1563013544-824ae1b704d3', 'photo-1563986768494-4dee2763ff3f',
    'photo-1563986768609-322da13575f3', 'photo-1571902943202-507ec2618e8f',
    'photo-1579532537598-459ecdaf39cc', 'photo-1579621970563-ebec7560ff3e',
    'photo-1579621970795-87facc2f976d', 'photo-1586528116311-ad8dd3c8310d',
    'photo-1590283603385-17ffb3a7f29f', 'photo-1604594849809-dfedbc827105',
    'photo-1611974789855-9c2a0a7236a3', 'photo-1633158829585-23ba8f7c8caf',
    'photo-1642790106117-e829e14a795f'
  ],
  'ai-tools': [
    'photo-1452261229273-42e33418719b', 'photo-1454165804606-c3d57bc86b40',
    'photo-1458681407517-f6a21aad9ec9', 'photo-1460925895917-afdab827c52f',
    'photo-1464550883968-cec281c19761', 'photo-1466130336765-74ab8b8ab229',
    'photo-1466690672306-5f92132f7248', 'photo-1468590069246-1d314d8c78bb',
    'photo-1478034182233-3f6bb5db41ad', 'photo-1482501157762-56897a411e05',
    'photo-1486074051793-e41332bf18fc', 'photo-1490132328392-e6ef54a90dda',
    'photo-1491895200222-0fc4a4c35e18', 'photo-1494264274944-1ba7d9b73135',
    'photo-1495521939206-a217db9df264', 'photo-1498262257252-c282316270bc',
    'photo-1498387727476-b30055b2ef21', 'photo-1499750310107-5fef28a66643',
    'photo-1500043357865-c6b8827edf10', 'photo-1504608524841-42fe6f032b4b',
    'photo-1504708706948-13d6cbba4062', 'photo-1506629082955-511b1aa562c8',
    'photo-1550745165-9bc0b252726f', 'photo-1551288049-bebda4e38f71',
    'photo-1554224154-22dec7ec8818', 'photo-1554224154-26032ffc0d07',
    'photo-1554224155-6726b3ff858f', 'photo-1554224155-8d04cb21cd6c',
    'photo-1559526324-4b87b5e36e44', 'photo-1563013544-824ae1b704d3',
    'photo-1563986768494-4dee2763ff3f', 'photo-1563986768609-322da13575f3',
    'photo-1571902943202-507ec2618e8f', 'photo-1579532537598-459ecdaf39cc',
    'photo-1579621970563-ebec7560ff3e', 'photo-1579621970795-87facc2f976d',
    'photo-1586528116311-ad8dd3c8310d', 'photo-1590283603385-17ffb3a7f29f',
    'photo-1604594849809-dfedbc827105', 'photo-1611974789855-9c2a0a7236a3',
    'photo-1633158829585-23ba8f7c8caf', 'photo-1642790106117-e829e14a795f',
    'photo-1643269130443-0b347cc2b315', 'photo-1643828029679-92c0d7ef9ab8',
    'photo-1644620990884-0e6e8743f71a', 'photo-1654521957182-f0277b65005a',
    'photo-1658937364065-60f3f6818724', 'photo-1666120565037-d56d71cdef3a',
    'photo-1668417008465-da390a5d0add', 'photo-1676299081847-824916de030a',
    'photo-1676513727408-631151da9fc1', 'photo-1682687982501-1e58ab814714'
  ],
  'health-lifestyle': [
    'photo-1426647430637-b5f17a0c82b4', 'photo-1429091967365-492aaa5accfe',
    'photo-1434682881908-b43d0467b798', 'photo-1444401045234-4a2ab1f645c0',
    'photo-1446133132410-19df4d6610a1', 'photo-1473090826765-d54ac2fdc1eb',
    'photo-1473557656032-3c55d06303d7', 'photo-1478358161113-b0e11994a36b',
    'photo-1482876555840-f31c5ebbff1c', 'photo-1484980972926-edee96e0960d',
    'photo-1490126296131-3de6bd234be6', 'photo-1490645935967-10de6ba17061',
    'photo-1490716792627-4e9601dfc808', 'photo-1491982883790-ead7c97a047e',
    'photo-1494390248081-4e521a5940db', 'photo-1495034274615-d0823166a302',
    'photo-1495914510314-ba3164b1321f', 'photo-1498373419901-52eba931dc4f',
    'photo-1498837167922-ddd27525d352', 'photo-1498982261566-1c28c9cf4c02',
    'photo-1499209974431-9dddcece7f88', 'photo-1499996860823-5214fcc65f8f',
    'photo-1501876725168-00c445821c9e', 'photo-1504868584819-f8e8b4b6d7e3',
    'photo-1505373877841-8d25f7d46678', 'photo-1506126613408-eca07ce68773',
    'photo-1506863530036-1efeddceb993', 'photo-1510557880182-3d4d3cba35a5',
    'photo-1511649475669-e288648b2339', 'photo-1511884642898-4c92249e20b6',
    'photo-1511988617509-a57c8a288659', 'photo-1512221472476-7e439affc029',
    'photo-1512621776951-a57141f2eefd', 'photo-1515378791036-0648a3ef77b2',
    'photo-1515621061946-eff1c2a352bd', 'photo-1516110833967-0b5716ca1387',
    'photo-1516756587022-7891ad56a8cd', 'photo-1517732747537-877644b96f8b',
    'photo-1517836357463-d25dfeac3438', 'photo-1518611012118-696072aa579a',
    'photo-1520078452277-0832598937e5', 'photo-1521729839347-131a32f9abcb',
    'photo-1522202176988-66273c2fd55f', 'photo-1522771739844-6a9f6d5f14af',
    'photo-1523206489230-c012c64b2b48', 'photo-1523821741446-edb2b68bb7a0',
    'photo-1527234639945-70d78416bd7d', 'photo-1527977966376-1c8408f9f108',
    'photo-1529119513315-c7c361862fc7', 'photo-1530026405186-ed1f139313f8',
    'photo-1534414671319-4fc58cc112e1', 'photo-1536193533103-5bb31b6fb667',
    'photo-1540189549336-e6e99c3679fe', 'photo-1541711589646-e1f6cb5a78d8',
    'photo-1543269664-56d93c1b41a6', 'photo-1544367567-0f2fcb009e0b',
    'photo-1546069901-ba9599a7e63c', 'photo-1549060279-7e168fcee0c2',
    'photo-1551601651-2a8555f1a136', 'photo-1565299624946-b28f40a0ae38',
    'photo-1565958011703-44f9829ba187', 'photo-1571019613454-1cb2f99b2d8b',
    'photo-1574680096145-d05b474e2155'
  ]
};

// ============================================
// 标题模板
// ============================================
var TITLE_TEMPLATES = {
  'technology': [
    'The Future of {topic}: Trends to Watch',
    '{topic}: What Experts Are Saying',
    'How {topic} Is Reshaping Industries',
    'Breaking Down {topic}: A Comprehensive Guide',
    '{topic}: The Next Big Thing in Tech',
    'Understanding {topic}: Key Insights',
    '{topic} Innovation: What You Need to Know',
    'The Rise of {topic}: Analysis and Predictions',
    'Why {topic} Matters More Than Ever',
    '{topic}: Challenges and Opportunities Ahead'
  ],
  'finance': [
    '{topic}: What Investors Need to Know',
    'Market Watch: {topic} Trends to Watch',
    'The Role of {topic} in Modern Finance',
    'How {topic} Is Changing the Financial Landscape',
    '{topic}: A Strategic Guide for 2026',
    'Smart Money: Understanding {topic}',
    'Wealth Building: The Role of {topic}',
    '{topic}: Risks and Rewards Explained',
    'The Impact of {topic} on Global Markets',
    '{topic}: Expert Analysis and Forecast'
  ],
  'ai-tools': [
    'Top {topic} Tools You Should Try',
    '{topic}: Revolutionizing the Way We Work',
    'The Best {topic} Platforms Reviewed',
    'How {topic} Is Transforming Productivity',
    '{topic}: A Complete Buyer\'s Guide',
    'Comparing the Leading {topic} Solutions',
    '{topic}: From Hype to Practical Application',
    'Why {topic} Is a Game-Changer for Business',
    '{topic}: Features, Pricing, and Alternatives',
    'The Rise of {topic}: What You Need to Know'
  ],
  'health-lifestyle': [
    '{topic}: Science-Backed Benefits',
    'How {topic} Can Improve Your Life',
    'The Ultimate Guide to {topic}',
    '{topic}: Tips from Health Experts',
    'Why {topic} Should Be Part of Your Routine',
    '{topic}: Myths vs. Reality',
    'The Connection Between {topic} and Wellness',
    '{topic}: What the Research Shows',
    'Simple Ways to Incorporate {topic} Daily',
    '{topic}: A Modern Approach to Health'
  ]
};

// ============================================
// 摘要模板
// ============================================
var EXCERPT_TEMPLATES = [
  'Everything you need to know about {topic} to stay ahead of the curve.',
  'Expert analysis on the latest {topic} trends and their impact on everyday life.',
  'Breaking down {topic}: insights, trends, and practical applications.',
  'Discover how {topic} is revolutionizing the industry and what it means for you.',
  'A deep dive into {topic}: what the data shows and why it matters.',
  'Practical insights and fresh perspectives on the evolving world of {topic}.',
  'What the latest research tells us about {topic} and where it is heading.',
  'Navigating {topic}: key developments, real-world examples, and actionable takeaways.'
];

// ============================================
// 8种结构模板
// 每种模板定义：段落数、开头方式、过渡风格、观点插入位置
// ============================================
var STRUCTURE_TEMPLATES = {
  'classic-analysis': {
    name: '经典分析',
    paragraphs: 5,
    openings: [
      'The field of {topic} has shifted dramatically in recent years, driven by new market forces and evolving user expectations.',
      'When we look back at how {topic} has developed, the pace of change stands out as truly remarkable.',
      'Few areas have generated as much sustained interest as {topic}, and with good reason.'
    ],
    transitions: [
      'To understand what is happening, it helps to start with the broader context.',
      'Consider the numbers first.',
      'Look beneath the surface, and a more nuanced picture emerges.',
      'These trends point toward a larger structural shift.'
    ],
    insightPositions: [1, 3]
  },
  'case-driven': {
    name: '案例驱动',
    paragraphs: 4,
    openings: [
      'The story of {topic} is best told through the companies and people already living it.',
      'Numbers only get you so far. To grasp {topic}, you need to see it in action.',
      'If you want to understand where {topic} is going, look at what early adopters are doing right now.'
    ],
    transitions: [
      'Take one company as an example.',
      'A different picture emerges from a smaller, more focused player.',
      'These are not isolated examples.',
      'The pattern repeats across industries.'
    ],
    insightPositions: [1]
  },
  'data-first': {
    name: '数据先行',
    paragraphs: 5,
    openings: [
      'The data on {topic} tells a story that opinions alone cannot.',
      'Hard numbers about {topic} paint a clearer picture than most commentary suggests.',
      'Recent data releases on {topic} deserve a closer look than they typically receive.'
    ],
    transitions: [
      'Let us start with the headline figures.',
      'Dig one layer deeper and the trend becomes more interesting.',
      'Not all of the data points in the same direction.',
      'What explains this divergence?'
    ],
    insightPositions: [1, 2]
  },
  'question-led': {
    name: '问题引入',
    paragraphs: 5,
    openings: [
      'What exactly is {topic}, and why does it keep popping up in every conversation?',
      'Is {topic} genuinely transformative, or is it just the latest buzzword?',
      'If {topic} is so important, why is it still so poorly understood?'
    ],
    transitions: [
      'The short answer: it is complicated.',
      'To answer that, we first need to define our terms.',
      'Part of the confusion comes from how broadly the term is used.',
      'Here is where the picture gets interesting.'
    ],
    insightPositions: [2, 4]
  },
  'comparative': {
    name: '对比型',
    paragraphs: 5,
    openings: [
      'When people debate {topic}, they usually frame it as an either/or question. The reality is more interesting.',
      'Comparing {topic} with its predecessors reveals both what is new and what is surprisingly familiar.',
      'To put {topic} in perspective, it helps to look at it alongside what came before.'
    ],
    transitions: [
      'On one side of the argument, you have the enthusiasts.',
      'On the other side, the skeptics raise valid concerns too.',
      'The truth probably sits somewhere in between.',
      'Looking at both sides reveals a more nuanced reality.'
    ],
    insightPositions: [2]
  },
  'trend-forecast': {
    name: '趋势预测',
    paragraphs: 5,
    openings: [
      'Where is {topic} heading next? The signals are already visible for those paying attention.',
      'Predicting the future of {topic} is never easy, but the current direction of travel is clear enough.',
      'Several converging forces are about to push {topic} into its next phase.'
    ],
    transitions: [
      'The first trend to watch is already well underway.',
      'A second, less obvious shift is happening just below the surface.',
      'Then there is the wild card factor that few are talking about.',
      'Putting these pieces together, the picture looks something like this.'
    ],
    insightPositions: [2, 4]
  },
  'practical-guide': {
    name: '实操指南',
    paragraphs: 4,
    openings: [
      'Reading about {topic} is one thing. Actually getting started is another.',
      'For anyone ready to dive into {topic}, here is what the people already doing it recommend.',
      'If you have been curious about {topic} but unsure where to begin, you are not alone.'
    ],
    transitions: [
      'Start with the basics and build from there.',
      'Once you have the foundation, you can experiment with more advanced approaches.',
      'The biggest mistakes people make are usually avoidable.',
      'The key is consistency, not perfection.'
    ],
    insightPositions: [2]
  },
  'expert-conversation': {
    name: '专家访谈',
    paragraphs: 5,
    openings: [
      'We sat down with practitioners and researchers working at the forefront of {topic} to get an unfiltered view.',
      'To really understand {topic}, you need to talk to the people building it, studying it, and living it every day.',
      'The most interesting thinking about {topic} often happens off the record. Here is what we can share.'
    ],
    transitions: [
      'One perspective comes from the research side.',
      'Practitioners in the field see things differently.',
      'Even within the community, there is real disagreement.',
      'When you step back, the common ground is clearer.'
    ],
    insightPositions: [1, 3]
  }
};

var TEMPLATE_NAMES = Object.keys(STRUCTURE_TEMPLATES);

// ============================================
// 段落内容库 - 按分类提供多样化的段落素材
// 每种模板会从中选取并重组
// ============================================
var PARAGRAPH_POOL = {
  'technology': [
    'The {topic} landscape has shifted dramatically in recent years, driven by new market forces, evolving standards, and changing user habits. Teams that once treated it as a side project now build their entire strategies around it. The change is not just technological — it is organizational. Companies are restructuring teams, rewriting job descriptions, and rethinking long-held assumptions about how software gets built and deployed.',
    'Look at the numbers, and the scale of the shift becomes undeniable. Spending on {topic} initiatives has more than doubled across mid-sized and large organizations over the past three years. What was once a discretionary budget line is now a core operating expense. Decision-makers increasingly view proficiency in {topic} not as a nice-to-have skill but as a baseline requirement for staying competitive.',
    'Beneath the hype cycles and product launches, something more structural is happening. The boundaries between {topic} and adjacent fields are blurring. Practices that developed independently are now converging. This integration creates new capabilities but also new kinds of complexity. Teams that were previously siloed now need to work together in ways they were never designed to.',
    'The regulatory picture is evolving too. Policymakers who once watched from the sidelines are now actively drafting rules for {topic}. The pace of rulemaking varies dramatically by region — some jurisdictions favor light-touch guidance, others prefer more prescriptive frameworks. For organizations operating across borders, this patchwork creates real compliance challenges. Keeping up requires dedicated resources and constant vigilance.',
    'Looking ahead, the trajectory points toward broader adoption and deeper integration. What is now considered advanced will soon be standard practice. What is now on the cutting edge will eventually become common sense. The organizations that invest early and build genuine expertise will have the advantage. Latecomers will eventually catch up in terms of tools, but the knowledge gap will take longer to close.',
    'Real-world results tell a more nuanced story than the marketing brochures suggest. Companies implementing {topic} report both meaningful wins and unexpected setbacks. Some projects deliver beyond expectations; others stall due to organizational resistance or underestimated complexity. Success correlates less with which tools you pick and more with how you roll them out, train your people, and measure progress.',
    'The talent market tells its own story of {topic}\'s ascent. Demand for specialists has outpaced supply, creating a seller\'s market for qualified candidates. Salaries have climbed, and employers are offering increasingly creative perks and remote arrangements. For people entering the field, the opportunities are abundant. But the rapid growth also means standards are uneven, and employers must work harder to verify actual expertise.',
    'Open source communities have been central to {topic}\'s development. Shared tools, public benchmarks, and collaborative frameworks have accelerated progress across the board. Companies that once kept everything proprietary increasingly recognize the value of contributing back. This culture of openness has lowered barriers to entry, allowing smaller players to compete with established giants on a more level playing field.'
  ],
  'finance': [
    'The {topic} landscape has shifted dramatically in recent years, driven by new market forces, evolving regulations, and changing investor expectations. What was once a niche corner of finance has moved closer to the center of the conversation. Both retail and institutional participants are paying closer attention, and the quality of analysis has improved accordingly.',
    'Current market data reveals a pattern that deserves closer examination. Performance across key indicators suggests a fundamental re-evaluation is underway, not just a temporary swing. The drivers are different from previous cycles — structural changes, not just sentiment, are at work. Understanding the distinction matters because it determines how investors should position themselves.',
    'For individual investors, the rise of {topic} raises practical questions about portfolio construction, risk management, and time horizon. Conventional advice was built for a different era, and some of it no longer applies cleanly. But the core principles — diversification, cost control, discipline — remain as relevant as ever. The challenge is applying those principles to a rapidly changing environment.',
    'Regulatory developments continue to shape the trajectory of {topic}. Policymakers are walking a difficult line between fostering innovation and protecting consumers. The approach differs across jurisdictions, creating a patchwork of rules that adds complexity for participants operating globally. Clarity, when it comes, tends to unlock significant capital from players who were waiting on the sidelines.',
    'The outlook for {topic} remains broadly positive among most observers, though with healthy disagreement about the pace and path forward. Structural tailwinds — demographic shifts, technological change, global economic rebalancing — support continued growth over the medium term. But short-term volatility should be expected, and investors without the stomach for it should think carefully before committing capital.',
    'The story of {topic} cannot be told without understanding how everyday people interact with it. From retirement accounts to checking accounts to investment apps, the consumer experience has been transformed. What used to require visiting a branch or calling a broker now happens in seconds on a phone. That accessibility is a double-edged sword: it empowers people but also exposes them to risks they may not fully understand.',
    'Institutional attitudes toward {topic} have shifted faster than almost anyone predicted. Pension funds, endowments, and insurance companies that once dismissed the category are now making meaningful allocations. Their entry brings stability, deeper liquidity, and higher standards for reporting and compliance. It also changes the market dynamics that early participants took for granted.',
    'The infrastructure supporting {topic} has matured rapidly. Custody, settlement, reporting, analytics — the plumbing of the financial system is being rebuilt piece by piece. Better infrastructure attracts more participants, which in turn funds better infrastructure. It is a virtuous cycle that has played out in every previous wave of financial innovation, and {topic} appears to be following the same script.'
  ],
  'ai-tools': [
    'The {topic} category has evolved at a pace that surprises even seasoned industry observers. What started as a collection of experimental tools has become a genuine category with established leaders, emerging challengers, and real-money economics. Teams across marketing, engineering, design, and operations now incorporate these tools into their daily workflows, often in ways barely noticeable from the outside.',
    'Usage data reveals a more complex picture than the headline hype suggests. Adoption is broad but uneven. Some functions have embraced {topic} tools wholeheartedly; others remain cautious or skeptical. The difference often comes down to leadership buy-in, workflow integration, and measurable business impact. Tools that show clear ROI get expanded; tools that are impressive but impractical get quietly abandoned.',
    'For people just getting started with {topic}, the range of options can feel overwhelming. Free tiers let anyone experiment, but knowing which tool is right for which job takes experience. The most effective users tend not to chase every new release; they build a small toolkit of tools they know well and apply them thoughtfully. Mastery beats variety almost every time.',
    'The business models around {topic} are still being figured out. Subscription, usage-based pricing, freemium, enterprise licensing — all are being tried, and no clear winner has emerged yet. What works for consumer use cases may not work for enterprise. What works for early adopters may fail with the mainstream. Companies are iterating quickly, and the pricing landscape will likely look different a year from now.',
    'Looking forward, the trajectory of {topic} points toward deeper integration and more specialized applications. General-purpose tools will continue to exist, but the biggest opportunities may be in tools built for specific industries, specific roles, or specific workflows. The companies that survive the current crowded phase will be the ones that find defensible niches and build real product moats.',
    'The quality bar keeps rising. What would have impressed users two years ago now feels basic. Each new model generation sets a new baseline, and users quickly adjust their expectations downward. This creates pressure on tool makers to keep innovating rather than resting on their laurels. For users, it means the value proposition keeps improving as long as they keep learning.',
    'Privacy and security remain the top concerns for enterprise buyers evaluating {topic} tools. No company wants its proprietary data leaking into a public model. This concern has created demand for private deployments, on-premises options, and tools built with data governance in mind. The vendors that take these concerns seriously — and can prove it — will capture the largest enterprise deals.',
    'Perhaps the most underappreciated effect of {topic} tools is how they change the nature of work itself. When routine tasks get automated, people shift toward judgment, taste, and strategic thinking. The bar for what counts as a skilled professional keeps rising. Those who learn to work alongside these tools effectively will find their careers enhanced, not threatened.'
  ],
  'health-lifestyle': [
    'The conversation around {topic} has shifted from fringe wellness blogs into the mainstream of health advice. What was once dismissed as alternative or experimental is increasingly backed by solid research. Nutritionists, doctors, and public health experts now routinely include {topic} in their recommendations, though with the usual caveats about individual variation and moderation.',
    'Research on {topic} has expanded considerably, painting a clearer picture of both its benefits and its limitations. Some claims hold up well under scrutiny; others turn out to be overstated or context-dependent. The science is rarely as simple as the headlines suggest. People who go deeper than clickbait articles tend to come away with a more balanced and ultimately more useful understanding.',
    'For most people, the biggest barrier to {topic} is not lack of information — it is lack of consistency. Knowing what to do is easy; actually doing it every day is the hard part. This is where behavioral strategies, social support, and environmental design make a real difference. People who set themselves up for success through small environmental changes do better than those who rely on willpower alone.',
    'The connection between {topic} and mental health has become one of the most active areas of research. What was once considered a purely physical practice is now understood to have measurable effects on mood, anxiety, and cognitive function. The pathways are both direct — biochemical changes in the body — and indirect — improved self-esteem and a sense of agency. Both matter.',
    'Long-term, the evidence suggests that {topic} contributes to better aging outcomes — not immortality, but more years of healthy, independent living. The difference shows up in chronic disease rates, mobility measures, and cognitive performance. It is never too late to start, but starting earlier clearly compounds the benefits. Small habits maintained over decades add up to enormous differences in quality of life.',
    'Technology is changing how people engage with {topic}, for better and worse. Apps, wearables, and online communities provide access, motivation, and accountability that previous generations could only dream of. But they also create new sources of comparison, guilt, and misinformation. The most health-literate users are selective about which tools they adopt and how much they let those tools shape their self-image.',
    'One of the most important realizations about {topic} is that there is no single right way to do it. Different people respond differently based on genetics, lifestyle, preferences, and health history. The best approach is the one that fits your life and that you can sustain. Perfectionism is actually counterproductive — consistency with a good-enough routine beats occasional bursts of intensity every time.',
    'The social side of {topic} matters more than most people admit. Doing things with others — joining a class, finding a workout buddy, cooking with friends — dramatically improves adherence. Humans are social creatures, and our habits are socially contagious. Surrounding yourself with people who make healthy choices makes it easier for you to make healthy choices too. It is not cheating; it is strategy.'
  ]
};

// ============================================
// 观点库 - 从外部JSON文件加载
// ============================================
var INSIGHTS = {};

function loadInsights(category) {
  if (INSIGHTS[category]) return INSIGHTS[category];
  var filePath = __dirname + '/insights-' + category + '.json';
  try {
    var raw = fs.readFileSync(filePath, 'utf8');
    INSIGHTS[category] = JSON.parse(raw);
    console.log('   Loaded ' + INSIGHTS[category].length + ' insights for ' + category);
  } catch (e) {
    console.log('   Warning: Could not load insights for ' + category + ': ' + e.message);
    INSIGHTS[category] = [];
  }
  return INSIGHTS[category];
}

// ============================================
// 辅助函数
// ============================================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  var result = arr.slice();
  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

function generateArticleDate() {
  var now = new Date();
  return now.toISOString().split('T')[0];
}

// ============================================
// 图片URL生成 - round-robin 策略
// 使用 index 追踪当前图片位置，同一批次内尽量不重复
// 当图片池耗尽时循环复用
// ============================================
function createImageAllocator(category, usedImageIndices) {
  // Dedup protection: ensure unique IDs even if array has duplicates
  var rawIds = IMAGE_IDS[category] || IMAGE_IDS['technology'];
  var seen = {};
  var ids = [];
  for (var i = 0; i < rawIds.length; i++) {
    if (!seen[rawIds[i]]) {
      seen[rawIds[i]] = true;
      ids.push(rawIds[i]);
    }
  }
  var poolSize = ids.length;
  // 当前起始位置：从已有使用记录后开始
  var currentIndex = usedImageIndices[category] || 0;
  
  return {
    next: function() {
      var id = ids[currentIndex % poolSize];
      currentIndex = (currentIndex + 1) % poolSize;
      usedImageIndices[category] = currentIndex;
      return 'https://images.unsplash.com/' + id + '?w=800&h=450&fit=crop&fm=webp&q=80';
    },
    getIndex: function() {
      return currentIndex;
    }
  };
}

// ============================================
// 内容生成 - 基于8种结构模板
// ============================================
function generateArticleContent(category, topic, templateName) {
  var template = STRUCTURE_TEMPLATES[templateName] || STRUCTURE_TEMPLATES['classic-analysis'];
  var pool = PARAGRAPH_POOL[category] || PARAGRAPH_POOL['technology'];
  var paragraphs = [];
  
  // 从段落池中随机选取指定数量的段落
  var shuffledPool = shuffleArray(pool);
  var bodyParagraphs = shuffledPool.slice(0, template.paragraphs - 1);
  
  // 首段用模板的 opening 作为引导句 + 第一段正文
  var opening = randomChoice(template.openings).replace(/\{topic\}/g, topic);
  var firstBody = bodyParagraphs[0].replace(/\{topic\}/g, topic);
  paragraphs.push('<p>' + opening + ' ' + firstBody + '</p>');
  
  // 中间段落：在段落前插入过渡句
  for (var i = 1; i < bodyParagraphs.length; i++) {
    var transition = randomChoice(template.transitions).replace(/\{topic\}/g, topic);
    var body = bodyParagraphs[i].replace(/\{topic\}/g, topic);
    paragraphs.push('<p>' + transition + ' ' + body + '</p>');
  }
  
  // 观点插入 - 按模板指定位置插入
  var insights = loadInsights(category);
  if (insights.length > 0) {
    var insightCount = randomInt(1, 2);
    var insightIndices = [];
    while (insightIndices.length < insightCount) {
      var idx = randomInt(0, insights.length - 1);
      if (insightIndices.indexOf(idx) === -1) insightIndices.push(idx);
    }
    
    // 使用模板的推荐插入位置，如果插入位置超过段落数则调整
    var positions = template.insightPositions.slice();
    for (var k = 0; k < insightCount; k++) {
      var pos = (k < positions.length) ? positions[k] : randomInt(1, paragraphs.length - 1);
      if (pos >= paragraphs.length) pos = Math.max(1, paragraphs.length - 1);
      if (pos < 1) pos = 1;
      
      var insightHtml = insights[insightIndices[k]].replace(/\{topic\}/g, topic);
      paragraphs.splice(pos, 0, insightHtml);
    }
  }
  
  return paragraphs.join('\n');
}

// ============================================
// 基于模板生成文章
// ============================================
function generateFromTemplate(category) {
  var catInfo = null;
  for (var c = 0; c < CATEGORIES.length; c++) {
    if (CATEGORIES[c].id === category) {
      catInfo = CATEGORIES[c];
      break;
    }
  }
  if (!catInfo) catInfo = CATEGORIES[0];
  
  var topic = randomChoice(catInfo.topics);
  var titles = TITLE_TEMPLATES[category] || TITLE_TEMPLATES['technology'];
  var title = randomChoice(titles).replace(/\{topic\}/g, topic);
  var excerpt = randomChoice(EXCERPT_TEMPLATES).replace(/\{topic\}/g, topic.toLowerCase());
  
  // 随机选一种结构模板
  var templateName = randomChoice(TEMPLATE_NAMES);
  var content = generateArticleContent(category, topic, templateName);
  
  return { 
    title: title, 
    excerpt: excerpt, 
    topic: topic, 
    content: content,
    template: templateName
  };
}

// ============================================
// AI 生成
// ============================================
function generateWithAI(category) {
  if (!CONFIG.openaiApiKey) {
    var fallback = generateFromTemplate(category);
    return Promise.resolve(fallback);
  }
  
  var catInfo = null;
  for (var c = 0; c < CATEGORIES.length; c++) {
    if (CATEGORIES[c].id === category) {
      catInfo = CATEGORIES[c];
      break;
    }
  }
  if (!catInfo) catInfo = CATEGORIES[0];
  
  var topic = randomChoice(catInfo.topics);
  var prompt = 'Generate a blog article (500-800 words) about ' + topic + ' in the ' + catInfo.name + ' category.\n\nReturn ONLY valid JSON:\n{"title": "...", "excerpt": "...", "content": "<p>...</p><p>...</p>"}';
  
  return new Promise(function(resolve) {
    var data = JSON.stringify({
      model: CONFIG.openaiModel,
      messages: [
        { role: 'system', content: 'You are a professional writer. Return ONLY valid JSON, no markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1200
    });
    var options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + CONFIG.openaiApiKey 
      }
    };
    var req = https.request(options, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() {
        try {
          var resp = JSON.parse(body);
          var content = resp.choices[0].message.content
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/\s*```$/i, '')
            .replace(/^```/i, '')
            .replace(/\s*```$/i, '');
          var parsed = JSON.parse(content);
          resolve({ 
            title: parsed.title.substring(0, 100), 
            excerpt: parsed.excerpt.substring(0, 200), 
            topic: topic, 
            content: parsed.content 
          });
        } catch(e) { 
          resolve(generateFromTemplate(category)); 
        }
      });
    });
    req.on('error', function() { resolve(generateFromTemplate(category)); });
    req.setTimeout(30000, function() { req.destroy(); resolve(generateFromTemplate(category)); });
    req.write(data);
    req.end();
  });
}

// ============================================
// 生成单篇文章
// ============================================
function generateArticle(existingIds, imageAllocators, categoryId) {
  var category = categoryId;
  if (!category) {
    category = randomChoice(CATEGORIES).id;
  }
  
  var id;
  do { 
    id = randomInt(10000, 99999); 
  } while (existingIds.indexOf(id) !== -1);
  
  var allocator = imageAllocators[category];
  if (!allocator) {
    allocator = createImageAllocator(category, {});
  }
  
  var imageUrl = allocator.next();
  
  var generated;
  if (CONFIG.useAI && CONFIG.openaiApiKey) {
    return generateWithAI(category).then(function(gen) {
      return {
        id: id,
        category: category,
        title: gen.title,
        excerpt: gen.excerpt,
        content: gen.content,
        image: imageUrl,
        date: generateArticleDate(),
        featured: false
      };
    });
  } else {
    generated = generateFromTemplate(category);
    return Promise.resolve({
      id: id,
      category: category,
      title: generated.title,
      excerpt: generated.excerpt,
      content: generated.content,
      image: imageUrl,
      date: generateArticleDate(),
      featured: false
    });
  }
}

// ============================================
// 主程序
// ============================================
function main() {
  console.log('\n🚀 HelloInsights Article Generator v3');
  console.log('====================================');
  console.log('📝 Mode: ' + (CONFIG.useAI ? 'AI-powered' : 'Template-based'));
  console.log('📊 Generating ' + CONFIG.articlesPerDay + ' new articles');
  console.log('🧩 Structure templates: ' + TEMPLATE_NAMES.length + ' types\n');
  
  // 预加载观点库
  console.log('📚 Loading insight libraries...');
  CATEGORIES.forEach(function(cat) {
    loadInsights(cat.id);
  });
  console.log('');
  
  // 读取已有文章
  var existingArticles = [];
  var existingIds = [];
  try {
    CATEGORIES.forEach(function(cat) {
      var catFile = 'articles-' + cat.id + '.json';
      if (fs.existsSync(catFile)) {
        var data = fs.readFileSync(catFile, 'utf8');
        var json = JSON.parse(data);
        var arts = json.articles || [];
        arts.forEach(function(a) {
          existingArticles.push(a);
          existingIds.push(a.id);
        });
      }
    });
    console.log('📁 Found ' + existingArticles.length + ' existing articles\n');
  } catch(e) {
    console.log('📝 No existing articles, starting fresh\n');
  }
  
  // 计算每个分类已用图片数（用于 round-robin 起点）
  var usedImageIndices = {};
  existingArticles.forEach(function(a) {
    if (!usedImageIndices[a.category]) {
      usedImageIndices[a.category] = 0;
    }
    usedImageIndices[a.category]++;
  });
  
  console.log('🖼️  Image pool usage per category:');
  CATEGORIES.forEach(function(cat) {
    var poolSize = (IMAGE_IDS[cat.id] || []).length;
    var used = usedImageIndices[cat.id] || 0;
    console.log('   ' + cat.id + ': ' + used + ' used / ' + poolSize + ' total');
  });
  console.log('');
  
  // 创建每个分类的图片分配器（round-robin）
  var imageAllocators = {};
  CATEGORIES.forEach(function(cat) {
    imageAllocators[cat.id] = createImageAllocator(cat.id, usedImageIndices);
  });
  
  console.log('✨ Generating new articles...\n');
  
  // 每篇文章依次生成（为了图片 round-robin 顺序分配）
  var newArticles = [];
  var promiseChain = Promise.resolve();
  
  for (var i = 0; i < CONFIG.articlesPerDay; i++) {
    (function(index) {
      promiseChain = promiseChain.then(function() {
        return generateArticle(existingIds, imageAllocators, null).then(function(article) {
          newArticles.push(article);
          existingIds.push(article.id);
          console.log('   ' + (index + 1) + '. [' + article.category + '] ' + article.title + ' (' + article.date + ')');
        });
      });
    })(i);
  }
  
  return promiseChain.then(function() {
    // 合并所有文章
    var allArticles = newArticles.concat(existingArticles);
    
    // 按日期降序排序（最新在前）
    allArticles.sort(function(a, b) {
      return b.date.localeCompare(a.date);
    });
    
    // 限制最大数量
    var finalArticles = allArticles.slice(0, CONFIG.maxArticles);
    
    // 给最新3篇标记 featured: true，其余 false
    for (var f = 0; f < finalArticles.length; f++) {
      finalArticles[f].featured = (f < 3);
    }
    
    var metadata = {
      lastUpdated: new Date().toISOString(),
      totalArticles: finalArticles.length,
      newToday: newArticles.length,
      generator: CONFIG.useAI ? 'AI (OpenAI)' : 'Template v3',
      templates: TEMPLATE_NAMES.length + ' structure types'
    };
    
    var version = Date.now();
    
    // ============================================
    // 1. 写入 articles-index.json
    // ============================================
    var articlesMap = {};
    finalArticles.forEach(function(a) { 
      articlesMap[String(a.id)] = a.category; 
    });
    var indexOutput = {
      v: version,
      articles: articlesMap,
      ids: finalArticles.map(function(a) { return a.id; })
    };
    fs.writeFileSync('articles-index.json', JSON.stringify(indexOutput, null, 2));
    console.log('\n✅ articles-index.json written (v=' + version + ', ' + finalArticles.length + ' articles)');
    
    // ============================================
    // 2. 写入 4 个分类文件
    //    每篇文章包含 id, category, title, excerpt, image, date, content, featured
    // ============================================
    CATEGORIES.forEach(function(cat) {
      var catArticles = finalArticles.filter(function(a) { return a.category === cat.id; });
      catArticles.sort(function(a, b) { return b.date.localeCompare(a.date); });
      
      var catOutput = {
        articles: catArticles.map(function(a) {
          return {
            id: a.id,
            category: a.category,
            title: a.title,
            excerpt: a.excerpt,
            image: a.image,
            date: a.date,
            content: a.content,
            featured: a.featured
          };
        }),
        metadata: metadata
      };
      
      var filename = 'articles-' + cat.id + '.json';
      fs.writeFileSync(filename, JSON.stringify(catOutput, null, 2));
      console.log('✅ ' + filename + ' written (' + catArticles.length + ' articles)');
    });
    
    console.log('\n✅ Done!');
    console.log('   New: ' + newArticles.length + ' articles');
    console.log('   Total: ' + finalArticles.length + ' articles');
    console.log('   Sort: by date descending (newest first)');
    console.log('   Featured: latest 3 articles marked as featured');
    console.log('   Images: round-robin allocation from 50+ pool');
    console.log('   Output: articles-index.json + 4 category files\n');
  });
}

main().catch(function(error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
