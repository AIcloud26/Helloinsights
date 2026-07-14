const fs = require('fs');
const https = require('https');

// ============================================
// 配置
// ============================================
const CONFIG = {
  articlesPerDay: 3,
  maxArticles: 50,
  useAI: false,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: 'gpt-3.5-turbo'
};

// ============================================
// 分类和主题
// ============================================
const CATEGORIES = [
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
// 图片
// ============================================
const IMAGE_IDS = {
  'technology':    ['photo-1518770660439-4636190af475', 'photo-1526374965328-7f61d4dc18c5', 'photo-1531297484001-80022131f5a1', 'photo-1550751827-4bd374c3f58b', 'photo-1485827404703-89b55fcc595e'],
  'finance':       ['photo-1611974789855-9c2a0a7236a3', 'photo-1554224155-6726b3ff858f', 'photo-1579621970563-ebec7560ff3e', 'photo-1553729459-efe14ef6055d', 'photo-1639762681485-074b7f938ba0'],
  'ai-tools':      ['photo-1677442136019-21780ecad995', 'photo-1676299081847-824916de030a', 'photo-1488229297570-58520851e68c', 'photo-1555949963-aa79dcee981c'],
  'health-lifestyle': ['photo-1490645935967-10de6ba17061', 'photo-1571019613454-1cb2f99b2d8b', 'photo-1506126613408-eca07ce68773', 'photo-1512438248247-f0f2a5a8b7f0']
};

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getImageUrl(cat) {
  var ids = IMAGE_IDS[cat] || IMAGE_IDS['technology'];
  return 'https://images.unsplash.com/' + randomChoice(ids) + '?w=600&h=400&fit=crop';
}
function getImageUrlLarge(cat) {
  var ids = IMAGE_IDS[cat] || IMAGE_IDS['technology'];
  return 'https://images.unsplash.com/' + randomChoice(ids) + '?w=1200&h=600&fit=crop';
}

// ============================================
// 标题和摘要模板
// ============================================
const TITLE_TEMPLATES = {
  'technology': [
    'Breaking: {topic} Is Reshaping the Tech Industry',
    'The Future of {topic}: What to Expect in 2025',
    'How {topic} Is Transforming Our Digital World',
    '{topic}: A Complete Guide for Tech Enthusiasts',
    'Why {topic} Matters More Than Ever in 2025',
    'Expert Insights: The Rise of {topic}'
  ],
  'finance': [
    'Market Watch: {topic} Trends to Watch',
    'Smart Money: Understanding {topic} in 2025',
    'How {topic} Is Changing the Financial Landscape',
    '{topic}: What Investors Need to Know',
    'Wealth Building: The Role of {topic}',
    'Navigating {topic}: A Beginner\'s Guide'
  ],
  'ai-tools': [
    'Tool Review: Best {topic} Solutions in 2025',
    'How {topic} Can Boost Your Productivity',
    '{topic} Explained: A Complete Beginner\'s Guide',
    'The Rise of {topic}: What It Means for You',
    'Top {topic} Tools Worth Your Attention',
    'Mastering {topic}: Tips and Best Practices'
  ],
  'health-lifestyle': [
    'Science-Backed: How {topic} Improves Wellbeing',
    'The Ultimate Guide to {topic} for Beginners',
    '{topic}: The Trend Taking 2025 by Storm',
    'Why {topic} Should Be Part of Your Routine',
    'Expert Tips on {topic} for Better Living',
    'The Complete {topic} Handbook'
  ]
};

const EXCERPT_TEMPLATES = [
  'Discover how {topic} is revolutionizing the industry and what it means for you.',
  'Expert analysis on the latest {topic} trends and their impact on everyday life.',
  'A comprehensive look at {topic} and why it matters in today\'s world.',
  'Everything you need to know about {topic} to stay ahead of the curve.',
  'Breaking down {topic}: insights, trends, and practical applications.'
];

// ============================================
// 段落模板库 — 每个分类 5 段，每段 120-150 字
// ============================================
const PARAGRAPH_TEMPLATES = {
  'technology': [
    // P1: 开篇引入
    'The rapid advancement of {topic} has captured the attention of industry leaders, researchers, and technology enthusiasts worldwide. Over the past year, we have witnessed unprecedented developments that are fundamentally changing how businesses operate and how individuals interact with digital systems. From startup incubators in Silicon Valley to enterprise boardrooms across the globe, {topic} has emerged as a central topic of discussion. Companies are investing heavily in research and development, pouring billions of dollars into infrastructure and talent acquisition to stay competitive in this fast-evolving landscape.',
    // P2: 技术深度
    'At the core of {topic} lies a sophisticated interplay of algorithms, data processing capabilities, and computational power that continues to push the boundaries of what is technically feasible. Experts note that recent breakthroughs have addressed several long-standing challenges that previously limited adoption and scalability. New frameworks and protocols are being developed at an accelerated pace, enabling more efficient implementation and integration with existing systems. This technological maturation is making {topic} increasingly accessible to organizations of all sizes, not just tech giants with unlimited resources.',
    // P3: 实际应用
    'The practical applications of {topic} are already transforming multiple industries in meaningful ways. In healthcare, it is enabling faster diagnosis and more personalized treatment plans. In the financial sector, it is streamlining operations and improving risk assessment capabilities. Educational institutions are leveraging these advances to create more engaging and adaptive learning experiences. Meanwhile, the manufacturing and logistics sectors are seeing significant improvements in efficiency and cost reduction. These real-world deployments demonstrate that {topic} has moved far beyond the realm of theoretical research into tangible, value-creating applications.',
    // P4: 市场数据
    'Market analysts project that the global market related to {topic} will experience substantial growth over the next five years, with compound annual growth rates exceeding expectations set just two years ago. Venture capital funding in this space has reached record levels, with several startups achieving unicorn status in remarkably short timeframes. Major technology corporations have announced strategic acquisitions and partnerships aimed at strengthening their positions in this domain. Government initiatives and regulatory frameworks are also evolving to keep pace with the rapid development, creating both opportunities and compliance considerations for businesses operating in this space.',
    // P5: 未来展望
    'Looking ahead, the trajectory of {topic} suggests even more transformative changes on the horizon. Researchers are exploring next-generation approaches that could multiply current capabilities by orders of magnitude. Industry consortia are working on standardization efforts that will facilitate interoperability and broader adoption. As the technology continues to mature, experts anticipate that it will become an integral part of our digital infrastructure, as fundamental as the internet itself. Organizations that begin building their capabilities now will be best positioned to capitalize on the opportunities that emerge as {topic} continues to evolve and mature.'
  ],
  'finance': [
    // P1
    'The landscape of {topic} has undergone significant transformation in recent years, driven by shifting market dynamics, regulatory changes, and evolving investor expectations. Financial professionals and analysts are closely monitoring these developments as they reshape traditional approaches to wealth management and investment strategy. The convergence of technology and finance has created new opportunities and challenges that require sophisticated understanding and adaptive strategies. Market participants are increasingly recognizing that success in {topic} demands both deep domain expertise and the ability to navigate an ever-changing regulatory and economic environment.',
    // P2
    'Current market data reveals compelling trends in {topic} that warrant careful attention from both institutional and retail investors. Performance metrics across key indicators suggest a fundamental shift in how markets are pricing risk and opportunity in this segment. Analyst reports from major financial institutions highlight the growing importance of data-driven decision-making and quantitative analysis in navigating these markets. The integration of advanced analytics and artificial intelligence is enabling more precise forecasting and risk management, giving early adopters a significant competitive advantage in identifying and capitalizing on emerging opportunities within {topic}.',
    // P3
    'For individual investors and financial planners, understanding {topic} is becoming increasingly essential for building resilient and diversified portfolios. The traditional boundaries between asset classes are blurring, creating both opportunities for enhanced returns and new sources of risk that must be carefully managed. Financial advisors are recommending that clients allocate strategic portions of their portfolios to instruments and strategies related to {topic}, while maintaining appropriate risk controls and diversification. Educational resources and professional guidance in this area are expanding rapidly, making it more accessible for informed investors to participate meaningfully in these evolving markets.',
    // P4
    'The regulatory environment surrounding {topic} continues to evolve, with policymakers balancing the need for innovation with investor protection and systemic stability. Recent regulatory developments in major financial centers have established clearer frameworks for participation, reducing uncertainty and encouraging institutional involvement. Compliance requirements are becoming more standardized across jurisdictions, facilitating cross-border investment and collaboration. Industry associations and self-regulatory organizations are playing an increasingly active role in establishing best practices and ethical standards, contributing to the overall maturation and credibility of markets related to {topic}.',
    // P5
    'The future outlook for {topic} remains broadly positive, with most experts projecting sustained growth and increasing mainstream adoption over the medium to long term. Emerging markets are beginning to play a more significant role, bringing new participants and perspectives to what was previously dominated by developed market institutions. Technological innovation continues to lower barriers to entry and improve transparency, making these markets more efficient and accessible. As the global economy continues to evolve, {topic} is likely to become an increasingly important component of the financial system, offering both challenges and opportunities for those prepared to navigate its complexities.'
  ],
  'ai-tools': [
    // P1
    'The explosion of {topic} has fundamentally changed how professionals and consumers interact with artificial intelligence technology. What was once the domain of specialized researchers and large technology companies is now accessible to anyone with an internet connection and a willingness to explore. The democratization of AI tools is creating a new wave of innovation, as diverse perspectives and use cases emerge from communities that previously had no access to these capabilities. This accessibility revolution is not just about technology—it is about empowering individuals and small teams to accomplish tasks that previously required significant resources and specialized expertise.',
    // P2
    'The technical capabilities of modern {topic} have advanced dramatically, with improvements in accuracy, speed, and versatility that were difficult to predict even a year ago. Natural language processing, computer vision, and generative models have reached levels of sophistication that enable practical applications across virtually every industry. The integration of these capabilities into user-friendly interfaces has removed much of the technical complexity that previously limited adoption. Developers and platform providers are competing intensely to offer the best combination of features, pricing, and ease of use, driving rapid innovation and improvement across the entire {topic} ecosystem.',
    // P3
    'Businesses across all sectors are discovering practical applications for {topic} that deliver measurable improvements in productivity, quality, and customer experience. Marketing teams are using these tools to generate content at unprecedented scale while maintaining brand consistency. Customer service operations are being transformed by intelligent automation that can handle complex inquiries with human-like understanding. Creative professionals are finding that AI tools augment rather than replace their skills, enabling them to explore ideas and iterate on designs more rapidly than ever before. The key to successful implementation lies in understanding the strengths and limitations of these tools and integrating them thoughtfully into existing workflows.',
    // P4
    'The market for {topic} is experiencing explosive growth, with new entrants launching regularly and established players expanding their offerings. Pricing models are evolving to make these tools more accessible, with free tiers and pay-as-you-go options enabling experimentation without significant upfront investment. The competitive landscape is driving rapid feature development and improvement, benefiting users who can choose from an increasingly diverse range of options. Enterprise adoption is accelerating as organizations recognize the strategic importance of AI capabilities and invest in building internal expertise and infrastructure to support widespread deployment of {topic} across their operations.',
    // P5
    'Looking forward, the evolution of {topic} is expected to continue at an accelerated pace, with several key trends shaping the next phase of development. Multimodal capabilities that combine text, image, audio, and video processing are becoming standard features rather than specialized offerings. The focus is shifting from raw capability to reliability, safety, and responsible deployment, as organizations and regulators demand higher standards for AI systems. Integration with existing enterprise software and workflows will be critical for mainstream adoption, and we are seeing significant progress in this area. The organizations and individuals who invest in understanding and effectively utilizing {topic} today will be best positioned to thrive in an increasingly AI-augmented future.'
  ],
  'health-lifestyle': [
    // P1
    'Growing scientific research into {topic} has revealed significant connections between daily habits, environmental factors, and long-term health outcomes that are reshaping our understanding of wellbeing. Health professionals and researchers are increasingly emphasizing the importance of evidence-based approaches to {topic}, moving beyond trends and fads to focus on sustainable practices supported by rigorous scientific study. This shift toward evidence-based wellness is empowering individuals to make more informed decisions about their health and lifestyle choices, leading to better outcomes and greater satisfaction with their personal wellness journeys.',
    // P2
    'The latest research findings on {topic} offer practical insights that can be integrated into daily routines with minimal disruption. Studies published in peer-reviewed journals demonstrate measurable benefits across multiple health indicators, including improved energy levels, better sleep quality, enhanced cognitive function, and reduced stress markers. What makes these findings particularly valuable is their applicability across diverse populations and lifestyles, suggesting that the benefits of {topic} are not limited to specific demographics or circumstances. Health practitioners are increasingly incorporating these evidence-based recommendations into their guidance for patients seeking to improve their overall wellbeing.',
    // P3
    'Implementing changes related to {topic} does not require dramatic lifestyle overhauls or expensive interventions. Research consistently shows that small, consistent adjustments often produce more sustainable results than radical changes that are difficult to maintain over time. Experts recommend starting with one or two specific practices and building gradually, allowing new habits to become natural parts of daily life. The key is finding approaches that align with individual preferences, schedules, and circumstances, creating a personalized wellness strategy that feels achievable and rewarding rather than burdensome or restrictive.',
    // P4
    'The wellness industry surrounding {topic} has expanded significantly, offering a wide range of products, services, and digital tools designed to support health goals. While this abundance of options can be overwhelming, it also means that individuals have unprecedented access to resources that can help them achieve their wellness objectives. Digital health platforms, wearable devices, and mobile applications are making it easier than ever to track progress, receive personalized recommendations, and stay motivated. The challenge lies in navigating this landscape critically, distinguishing between evidence-based solutions and marketing claims, and choosing approaches that genuinely support long-term health and wellbeing.',
    // P5
    'The future of {topic} looks promising, with ongoing research continuing to uncover new insights and more effective approaches to health and wellness. Advances in personalized medicine and nutritional science are enabling increasingly tailored recommendations that account for individual genetic profiles, microbiome composition, and lifestyle factors. The integration of technology with traditional wellness practices is creating new possibilities for monitoring, optimization, and prevention. As our understanding of the complex interactions between lifestyle, environment, and health continues to deepen, {topic} will undoubtedly remain at the forefront of efforts to help people live longer, healthier, and more fulfilling lives.'
  ]
};

// ============================================
// 内容生成
// ============================================
function generateContent(topic) {
  var paragraphs = [];
  // 随机选 4-5 段
  var count = randomInt(4, 5);
  var indices = [];
  while (indices.length < count) {
    var idx = randomInt(0, 4);
    if (indices.indexOf(idx) === -1) indices.push(idx);
  }
  indices.sort(function(a, b) { return a - b; });
  for (var i = 0; i < indices.length; i++) {
    var tpl = PARAGRAPH_TEMPLATES['technology'][indices[i]];
    // 用实际主题替换 {topic}
    paragraphs.push('<p>' + tpl.replace(/\{topic\}/g, topic) + '</p>');
  }
  return paragraphs.join('\n');
}

// 根据分类选择对应的段落模板
function generateArticleContent(category, topic) {
  var paragraphs = [];
  var count = randomInt(4, 5);
  var indices = [];
  while (indices.length < count) {
    var idx = randomInt(0, 4);
    if (indices.indexOf(idx) === -1) indices.push(idx);
  }
  indices.sort(function(a, b) { return a - b; });
  for (var i = 0; i < indices.length; i++) {
    var tpl = PARAGRAPH_TEMPLATES[category][indices[i]];
    paragraphs.push('<p>' + tpl.replace(/\{topic\}/g, topic) + '</p>');
  }
  return paragraphs.join('\n');
}

function generateFromTemplate(category) {
  var catInfo = CATEGORIES.find(function(c) { return c.id === category; });
  var topic = randomChoice(catInfo.topics);
  var titles = TITLE_TEMPLATES[category] || TITLE_TEMPLATES['technology'];
  var title = randomChoice(titles).replace('{topic}', topic);
  var excerpt = randomChoice(EXCERPT_TEMPLATES).replace('{topic}', topic.toLowerCase());
  var content = generateArticleContent(category, topic);
  return { title: title, excerpt: excerpt, topic: topic, content: content };
}

// ============================================
// AI 生成（保留原有逻辑，加上 content）
// ============================================
async function generateWithAI(category) {
  if (!CONFIG.openaiApiKey) return generateFromTemplate(category);
  var catInfo = CATEGORIES.find(function(c) { return c.id === category; });
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
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CONFIG.openaiApiKey }
    };
    var req = https.request(options, function(res) {
      var body = '';
      res.on('data', function(chunk) { body += chunk; });
      res.on('end', function() {
        try {
          var resp = JSON.parse(body);
          var content = resp.choices[0].message.content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
          var parsed = JSON.parse(content);
          resolve({ title: parsed.title.substring(0, 100), excerpt: parsed.excerpt.substring(0, 200), topic: topic, content: parsed.content });
        } catch(e) { resolve(generateFromTemplate(category)); }
      });
    });
    req.on('error', function() { resolve(generateFromTemplate(category)); });
    req.setTimeout(30000, function() { req.destroy(); resolve(generateFromTemplate(category)); });
    req.write(data);
    req.end();
  });
}

// ============================================
// 生成文章
// ============================================
async function generateArticle(existingIds) {
  var category = randomChoice(CATEGORIES);
  var id;
  do { id = randomInt(100, 99999); } while (existingIds.indexOf(id) !== -1);

  var generated;
  if (CONFIG.useAI && CONFIG.openaiApiKey) {
    generated = await generateWithAI(category.id);
  } else {
    generated = generateFromTemplate(category.id);
  }

  return {
    id: id,
    category: category.id,
    title: generated.title,
    excerpt: generated.excerpt,
    content: generated.content,
    image: getImageUrl(category.id),
    readTime: randomInt(3, 8) + ' min read'
  };
}

// ============================================
// 主程序
// ============================================
async function main() {
  console.log('\n🚀 HelloInsights Article Generator');
  console.log('================================');
  console.log('📝 Mode: ' + (CONFIG.useAI ? 'AI-powered' : 'Template-based'));
  console.log('📊 Generating ' + CONFIG.articlesPerDay + ' new articles\n');

  var existingArticles = [];
  var existingIds = [];
  try {
    var data = fs.readFileSync('articles.json', 'utf8');
    var json = JSON.parse(data);
    existingArticles = json.articles || [];
    existingIds = existingArticles.map(function(a) { return a.id; });
    console.log(' Found ' + existingArticles.length + ' existing articles\n');
  } catch(e) {
    console.log('📝 No existing articles, starting fresh\n');
  }

  console.log('✨ Generating new articles...\n');

  var newArticles = [];
  for (var i = 0; i < CONFIG.articlesPerDay; i++) {
    var article = await generateArticle(existingIds);
    newArticles.push(article);
    existingIds.push(article.id);
    console.log('   ' + (i + 1) + '. [' + article.category + '] ' + article.title);
  }

  var allArticles = newArticles.concat(existingArticles);
  var finalArticles = allArticles.slice(0, CONFIG.maxArticles);

  // 写入 articles.json（含完整内容，供 article.html 详情页使用）
  var fullOutput = {
    articles: finalArticles,
    metadata: {
      lastUpdated: new Date().toISOString(),
      totalArticles: finalArticles.length,
      newToday: newArticles.length,
      generator: CONFIG.useAI ? 'AI (OpenAI)' : 'Template'
    }
  };
  fs.writeFileSync('articles.json', JSON.stringify(fullOutput, null, 2));

  // 写入 articles-list.json（仅摘要，供首页/分类页/搜索使用）
  var listOutput = {
    articles: finalArticles.map(function(a) {
      return { id: a.id, category: a.category, title: a.title, excerpt: a.excerpt, image: a.image, readTime: a.readTime };
    }),
    metadata: fullOutput.metadata
  };
  fs.writeFileSync('articles-list.json', JSON.stringify(listOutput, null, 2));

  console.log('\n✅ Done!');
  console.log('   New: ' + newArticles.length + ' articles');
  console.log('   Total: ' + finalArticles.length + ' articles');
  console.log('   Output: articles.json (full) + articles-list.json (list)\n');
}

main().catch(function(error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
