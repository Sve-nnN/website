---
title: AI-citable content and how to write so AI cites you
metaTitle: AI-citable content how to write so AI engines cite you
metaDescription: How I write sections that ChatGPT, Perplexity and Google can extract and cite: answer first, passages that stand alone, data with a source and a before and after example.
excerpt: AI engines don't cite pages, they cite chunks. I show you how I rewrite a section so it stands on its own, answers in the first sentences and carries data a model can verify, with a before and after example.
---
Content is citable by AI when a generative engine can take a chunk of your page, understand it without the rest of the article and use it as a source in its answer. That's the definition I work with, and almost everything I'm about to tell you follows from it. It's the content side of [GEO SEO](/blog/tech-seo/geo-seo-guia), what's left once you've made sure bots can get in and read your HTML.

## Why AI cites chunks and not pages

ChatGPT with search, Perplexity and Google's AI Overviews follow a similar process. They rewrite the question into several searches, retrieve pages, split them into chunks and pick the ones that best answer each part of the question. Then the model writes the answer and links some sources.

That has a direct consequence for whoever writes: your article competes paragraph by paragraph. A page that's excellent as a whole may never show up if none of its chunks answers anything clearly. And the reverse holds too: a small site with one precise paragraph can win the citation over a big publisher with confusing text. I think that's the best news in this whole topic for specialist sites.

## What makes a passage citable

After rewriting a fair amount of content with this goal, I boil it down to five traits. They aren't a secret formula. They're good technical writing applied with discipline.

### The answer comes first

The first sentence or two of each section answer the question its heading raises. Context, nuance and examples come after. If the heading is "What is SEO cannibalization", the first sentence defines SEO cannibalization. It doesn't open with "In the world of SEO there are many problems", which is the kind of intro a model throws away.

### The passage stands on its own

Every paragraph has to work if you copy it off the page. To get there I repeat the subject instead of using pronouns that point backwards, avoid phrases like "as we saw earlier" or "this technique" without saying which one, and name tools, versions and figures explicitly. For a human reader it gets a little repetitive. I accept that.

### There's data that can be verified

In 2023 researchers from Princeton, Georgia Tech, the Allen Institute for AI and IIT Delhi published the academic paper that gave GEO its name. They found that adding source citations, statistics and direct expert quotes increased a page's visibility in generated answers. Adding more keywords barely helped. It matches what I see: a figure with a source and a date gets cited more than a vague opinion.

The trap is making things up. A model can cross-check a number against other sources, and a false figure costs you credibility with exactly the system you were trying to convince. I use my own data when I have it and cite the original source when I don't.

### The structure shows where each idea starts and ends

Descriptive headings, lists for enumerations, numbered steps for processes and tables for comparisons. The system that cuts your page into chunks relies on that structure, and a 400-word wall of text with no breaks makes it hard to tell which part answers what.

### There's someone behind it who knows the topic

A passage carries more weight when it comes from a page with an identifiable author, a visible update date and demonstrable experience on the topic. I sign what I write with my name and share cases from my own work, because that's exactly what a model can't get anywhere else.

## A before and after example

Take a typical section from a technical SEO article. This is how I often find it:

> Nowadays, speed is an increasingly relevant factor. That's why it's important to take it into account. This metric in particular can make a big difference in user experience, as mentioned earlier, and also in rankings.

Out of context that paragraph says nothing: you don't know which metric, what difference or for whom. Here's how I rewrite it:

> LCP (Largest Contentful Paint) measures how long the largest visible element on the page takes to render, usually the main image or the headline. Google considers an LCP of 2.5 seconds or less at the 75th percentile of visits to be good. If your LCP is over that threshold, the first things I check are server response time and whether the main image loads with high priority.

The new version defines the term, gives the threshold with its measurement criterion and ends with a concrete action. Any of its three sentences could be cited in an answer and would still be correct.

## How I review an existing page

When I audit a site's citability I don't rewrite everything. I follow this process:

1. I pick the pages that already get traffic or that answer real business questions. I pull them from Search Console and from the questions people ask the sales team.
2. I write down the specific question each section answers. If I can't phrase it, the section is probably unnecessary or mixing topics.
3. I read only the first paragraph of each section and ask whether it answers that question without reading anything else.
4. I look for orphan pronouns, references to other parts of the page and claims with no data behind them.
5. I rewrite, publish and note the date so I can measure later.

That last step matters. Without a change date you can't connect an improvement in citations to what you did. How I set up that tracking is in my guide to [measuring AI citations](/blog/tech-seo/medir-citas-ia).

## The technical side that also affects citability

Perfect text is useless if the bot can't see it. There are three technical things I always check alongside the content:

- That the text is in the HTML the server returns. Several AI crawlers, including OpenAI's and Anthropic's, don't execute JavaScript, so content that renders in the browser doesn't exist for them. I explain it in detail in [SSR vs CSR for SEO](/blog/tech-seo/ssr-vs-csr-seo).
- That AI search bots aren't blocked in robots.txt or the firewall.
- That the page has [structured data](/blog/tech-seo/structured-data-seo) consistent with what it shows: author, dates and content type.

[llms.txt](/blog/tech-seo/llms-txt-guia) comes up a lot in these conversations. It's an optional index of your site for language models, mostly useful for technical documentation, but it doesn't replace any of the above.

## Mistakes that keep you from being cited

- Long intros that take three paragraphs to say what the article is about.
- Clever headings that don't say what's underneath, like "The best kept secret".
- Paragraphs that mix two or three different ideas.
- Absolute claims with no data or source.
- Mass-produced content that repeats what the model already knows. What it doesn't have is your experience, your data and your examples, and that's what's worth publishing.

:::faq AI-citable content frequently asked questions
?? Does writing for AI make the text worse for people?
In my experience, no. Answering first, naming things precisely and giving concrete data also make it a better read for humans. The only trade-off is repeating the subject a bit more between paragraphs.
?? Do I have to rewrite my whole blog?
No. Start with the pages that already have traffic or that answer questions that matter for your business, measure the effect and then decide whether to keep going.
?? Does marking up questions with FAQPage help?
Only if the page shows those questions and answers visibly. The markup helps clarify structure, but it doesn't replace text that answers well.
:::

If you want me to review how citable your content is and leave you a prioritized list of pages, my [AI SEO service](/servicios/ai-seo-geo) covers that audit together with the technical side of bot access.
