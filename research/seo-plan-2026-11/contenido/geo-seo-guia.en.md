---
title: GEO SEO complete guide to showing up in AI answers
metaTitle: GEO SEO guide to getting cited by ChatGPT and Google
metaDescription: What GEO SEO is, where it overlaps with classic SEO and where it doesn't, how AI crawlers read your site and what I fix first so AI answers cite you.
excerpt: GEO SEO is about getting ChatGPT, Perplexity and Google's AI Overviews to cite your content in their answers. I explain how it works, which part is plain technical SEO and which part is new, in the order I work on it.
---
More and more questions end in an answer written by an AI, and that answer shows two or three links at most. If your page isn't one of them, you don't exist for that person, even if you rank on the first page of Google. GEO SEO is about exactly that: getting generative engines to read your content, understand it and cite it.

I've spent years doing [technical SEO](/blog/tech-seo/technical-seo-guide) and building the sites I optimize, so I'm writing this guide from that angle. I'll walk you through what GEO is, which part of the work you already know if you do SEO properly, what actually changes and the order I tackle it in when I review a site. I'll also tell you where I think there's hype, because this topic has plenty.

## What GEO SEO is

GEO stands for Generative Engine Optimization. A generative engine is any system that answers a question with text written by a language model and that searches and reads web pages to write that answer. Today the most visible ones are ChatGPT with search, Perplexity, Microsoft Copilot, Gemini, and Google's AI Overviews and AI Mode.

The term came out of academia. In 2023 a group of researchers from Princeton, Georgia Tech, the Allen Institute for AI and IIT Delhi published a paper called "GEO: Generative Engine Optimization". They built a benchmark with thousands of queries and measured which changes to a page's text made a generative engine show it more often in its answers. Some methods raised visibility by up to 40% in their tests. The ones that worked best were adding citations to sources, including concrete statistics and adding direct quotes from experts. Stuffing in more keywords barely moved anything.

That 40% figure gets passed around everywhere without context, so here's mine: it's a lab result, with simulated engines and the authors' own set of queries. I treat it as a direction, not a promise. What I do find valuable in the paper is the pattern, because it matches what I see in practice: models cite what they can verify and extract, not whatever repeats the keyword.

You'll see other names for the same thing or something very close to it, like AEO (answer engine optimization), LLMO or "SEO for AI". The label isn't worth fighting over. In my [AI SEO service](/servicios/ai-seo-geo) I use GEO because it's the term most people search for and because it describes the goal well, which is to be the source the model cites.

## How an AI decides which pages to cite

To optimize something you need to understand how it works, at least roughly. Generative engines that cite sources follow a similar process, which the technical literature calls RAG (retrieval augmented generation).

1. A person types a question, often long and conversational.
2. The system rewrites it into one or several searches. Google calls this "query fan-out" in AI Mode: one question branches into several subqueries that run in parallel.
3. Those searches retrieve pages from an index. It might be Google's index, Bing's or the engine's own, like the one OpenAI builds with its search crawler.
4. It splits those pages into chunks and picks the ones that best answer each subquery.
5. The model writes the answer using those chunks and links some of them as sources.

Three practical consequences follow. First, if your page isn't in the index that engine uses, there's no GEO to do, which is why basic technical SEO still rules. Second, the model doesn't read your page top to bottom like a human. It reads loose chunks, so each passage has to make sense on its own. Third, you compete for subqueries, not for a keyword: a single user question can bring you in through an angle you never planned for.

## How GEO and SEO overlap and where they differ

The question I get most is whether GEO replaces SEO. It doesn't. It adds to it, and most of the work overlaps. Here's how I sum it up:

- What doesn't change: crawling, indexing, speed, internal links, domain authority and useful content. If you fail there, you fail at both.
- What gains weight: paragraph-level structure, verifiable data, clarity about who is writing and how fresh the content is.
- What's genuinely new: other crawlers to understand and allow, other metrics (mentions and citations instead of rankings) and competition decided per chunk, not per URL.

There's one point I like to stress because it changes how I prioritize. In classic SEO a page can rank well with mediocre text if it has authority and links. In a generated answer, the model picks the passage that answers best, and a clear paragraph from a small site can beat a confusing paragraph from a big publisher. That opens a real door for specialist sites, and it's the reason I spend time on this.

## The technical foundation AI needs to read you

This is where a technical background pays off, because a good share of the GEO problems I find aren't about content. They're about access.

### AI crawlers and robots.txt

Each company runs its own bots, and it's worth knowing them by name because they do different jobs:

- OpenAI uses GPTBot to collect training data, OAI-SearchBot for ChatGPT's search index and ChatGPT-User when a user asks it to open a page.
- Anthropic uses ClaudeBot for training, Claude-SearchBot for search and Claude-User for user requests.
- Perplexity uses PerplexityBot for its index and Perplexity-User for visits a user triggers.
- Google has no separate bot for AI Overviews. Those answers come from Googlebot's index. The Google-Extended token in robots.txt controls whether Google uses your content to train and ground Gemini, but it doesn't affect your presence in search or in AI Overviews.

The important decision is separating training from search. You can block GPTBot if you don't want your content training models and still allow OAI-SearchBot so you can be cited in ChatGPT. What I often see is the opposite: a security plugin or a Cloudflare rule that blocks anything that sounds like AI, and the site vanishes from ChatGPT without anyone deciding it should. Before I touch content, I check the robots.txt and the firewall rules.

```
# Allow the bots that cite in search
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

# Block training only, if that's your call
User-agent: GPTBot
Disallow: /
```

### JavaScript and rendering

This one is personal because I build sites in Next.js. Googlebot renders JavaScript, late but it does. Most AI crawlers don't. An analysis Vercel published in late 2024 about traffic on its network showed that OpenAI's and Anthropic's bots download JavaScript files but don't execute them. If your content renders in the browser, your page is empty for those bots.

The fix is the same one I've been recommending for SEO for years: the HTML the server returns should already contain the text. Server rendering or static generation, depending on the case. If you're not sure which fits, my guide on [SSR vs CSR for SEO](/blog/tech-seo/ssr-vs-csr-seo) explains how I decide, and the one on [JavaScript SEO](/blog/tech-seo/javascript-seo) covers how to check what a bot sees. The quick test I run is to request the page with curl and look for a sentence from the body of the article in the response. If it isn't there, you have a GEO problem even if Google indexes you fine.

### Speed and indexing

Engines that search live have little time to fetch pages. A server that takes several seconds to respond, or a page that throws intermittent errors, loses to a source that answers fast. None of these companies publishes a threshold, so I won't make one up, but the criterion is the same as for [Core Web Vitals](/blog/tech-seo/core-web-vitals-guide): low TTFB and lightweight HTML.

And the obvious thing people forget: if Google or Bing don't index the page, engines that rely on those indexes won't find it either. ChatGPT, for instance, combines its own index with results from search providers. Checking coverage in [Google Search Console](/blog/tech-seo/guia-google-search-console) and Bing Webmaster Tools is still step one.

### Structured data

Structured data isn't a shortcut to getting cited, and I'm wary of anyone who sells it that way. What it does is make explicit what the text says implicitly: who the author is, when the page was published and updated, which organization is behind it and what the page is about. For a system deciding whether a source is trustworthy, those signals help disambiguate. I use Article with author and dates, Organization or Person depending on the site, and FAQPage only when the page actually shows questions and answers.

## The llms.txt file

llms.txt is a Markdown text file at the root of a site that gives a language model a summary of what's on your site and where the important parts are. Jeremy Howard proposed it in September 2024, and it isn't an official standard of anyone's.

On this site I keep a hand-written llms.txt and llms-full.txt with about fifteen stable URLs. I maintain them because they cost little and because some agents and coding tools do read them. But I won't tell you they move rankings: people from Google have said publicly that their search engine doesn't use it, and I don't know of solid data showing that ChatGPT or Perplexity take it into account when citing.

If you want the full detail, with the format, a real example and when it's worth it, I cover it in my [llms.txt guide](/blog/tech-seo/llms-txt-guia).

## How to write content AI can cite

Once technical access is sorted, the work moves to the text. My working rule is simple: every section should survive being copied on its own into an answer and still make sense.

### Answer first

I put the answer in the first two sentences of each section and expand afterwards. If someone asks "what is GEO SEO", the first paragraph under that heading has to answer it with a full definition, with no "as we saw earlier" or pronouns pointing elsewhere on the page. It's the same thing I used to do for Google's featured snippets, except now it applies to every section, not just the main one.

### Self-contained passages

A chunk that says "this improves performance" is useless out of context. One that says "server rendering improves LCP because the browser receives fully built HTML" works. I repeat the subject instead of using pronouns, call things by their names and avoid paragraphs that depend on the previous one to make sense. It reads slightly more repetitive for a human reading straight through, and I accept that so each passage stands on its own.

### Data with a source and a date

The original GEO paper and what I see in answers agree: models prefer verifiable claims. A figure with its source and date has a better chance of being cited than a vague opinion. That doesn't mean inventing statistics, which is the worst thing you can do because a model can cross-check them. It means that if you have your own data, from your projects, your tests or your industry, you publish it clearly.

### Structure that can be extracted

Headings that say what they contain, lists when the content is a list, tables when you compare things and numbered steps when you explain a process. None of this is new, but it weighs more in GEO because the system cuts your page into pieces and the structure tells it where each idea starts and ends.

I go deeper into all of this, with before and after examples, in my guide on [AI-citable content](/blog/tech-seo/citabilidad-contenido-ia).

## Authority and mentions off your site

Models don't only read your website. They also learned from what others say about you, and when they search live they find forums, comparisons, directories and third-party articles. Ask ChatGPT for "the best tools for X" and the answer is usually assembled from lists and reviews published on other sites.

For GEO that means brand mentions matter, even without a link. Showing up in your niche's comparisons, in threads where people ask for recommendations and in industry media all adds up. It's off-page SEO with a different goal: you're not only after the link, you want your name tied to the right topic in many different places.

And the author matters. An article signed by someone with a verifiable track record on the topic, backed by an author page, fits what Google describes as E-E-A-T. I sign everything I publish with my name and link my profile for that reason.

## How to measure GEO

This is the least mature part of the field, and I'd rather say so plainly. There's no "ChatGPT ranking" equivalent to Google positions. What you can measure is three things:

- Traffic arriving from AI assistants, which shows up in GA4 as referrals from domains like chatgpt.com or perplexity.ai. ChatGPT also adds the utm_source=chatgpt.com parameter to many of the links it shows.
- Mentions and citations in answers for a fixed set of questions, checked by hand or with prompt tracking tools.
- Indirect signals, like growth in branded searches in Search Console.

One detail confuses a lot of people: clicks from Google's AI Overviews and AI Mode count inside normal web traffic in Search Console. Google doesn't split them into a separate report, so you won't see them as their own source.

How I set up that tracking step by step, with the GA4 filter and the fixed-prompt method, is in my guide to [measuring AI citations](/blog/tech-seo/medir-citas-ia).

## Common GEO mistakes I see

- Blocking every AI bot by default, without separating training from search.
- Publishing content behind JavaScript that crawlers don't execute.
- Writing for the keyword instead of answering the question, with long intros that take three paragraphs to say anything.
- Buying "AI visibility" tools before checking that bots can get into the site.
- Mass-producing AI content hoping another AI will cite it. Models already have that information. What they lack is first-hand experience, new data and judgment.
- Treating llms.txt as the whole solution, when it's an optional file Google doesn't use.

## Where I start when I review a site

This is the order I follow, from what blocks the most to what fine-tunes:

1. Access: robots.txt, firewall or CDN rules and server logs to see which AI bots arrive and what response code they get.
2. Rendering: I confirm the main text is in the server HTML and doesn't depend on JavaScript.
3. Indexing: coverage in Google and Bing for the pages that matter.
4. Baseline measurement: an AI traffic segment in GA4 and a list of 20 to 50 real business questions to track every month.
5. Content: I rewrite the pages that already get traffic or that answer those questions first, with the answer up front and self-contained passages.
6. Authorship signals and structured data.
7. Off-site presence, which is the slowest part and the one that depends most on the business.

The first three steps are almost always one or two weeks of technical work. What comes after is ongoing, just like SEO.

:::faq GEO SEO frequently asked questions
?? Does GEO SEO replace traditional SEO?
No. GEO builds on SEO: if your page isn't crawled and indexed, no generative engine will cite it. GEO adds a layer of work on text structure, AI bot access and citation tracking.
?? How long does GEO take to show results?
Technical fixes, like unblocking a crawler or serving content in the HTML, can show up within weeks once the bots come back. Content and authority changes take longer and depend on the niche, so I don't promise fixed timelines.
?? Do I need an llms.txt to show up in ChatGPT?
No. ChatGPT and Perplexity cite pages without an llms.txt all the time. It's an optional file that's cheap to maintain, but it doesn't replace bot access or well-structured content.
?? Can I block AI training without disappearing from answers?
Largely, yes. OpenAI, Anthropic and Perplexity use different bots for training and for search, so you can block some and allow others in your robots.txt. At Google, Google-Extended controls use for Gemini without affecting your presence in search or AI Overviews.
:::

If you'd rather I review it on your site, my [AI SEO service](/servicios/ai-seo-geo) starts with bot access and how citable your current pages are, and I leave you a prioritized plan so ChatGPT, Perplexity and Google have reasons to cite you.
