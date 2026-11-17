---
title: What llms.txt is and when it's worth creating one
metaTitle: llms.txt what it is and how to create one
metaDescription: What the llms.txt file is, what format it uses, who actually reads it and when it's worth creating one. With the llms.txt I maintain on my own site as an example.
excerpt: llms.txt is a Markdown file that summarizes your site for a language model. I explain the format, who actually uses it, why Google ignores it and how I built the one on my own site.
---
llms.txt is a Markdown text file you place at the root of your domain, at yoursite.com/llms.txt, to give a language model a summary of your site and a curated list of the pages that matter. It's an open proposal, not a standard, and it's one of the [GEO SEO](/blog/tech-seo/geo-seo-guia) tasks that generates the most noise relative to its real effect.

I maintain one on my own site and it's part of my AI SEO service, so I'll tell you what it is, how to write it and, above all, what you can and can't expect from it.

## Where llms.txt comes from

Jeremy Howard, co-founder of Answer.AI and fast.ai, published the proposal in September 2024. The problem he wanted to solve is concrete: a model trying to read a website runs into menus, scripts, cookie banners and heavy HTML, and it has a limited context window on top of that. A plain file with the essentials saves it that work.

The idea was born with technical documentation in mind. If you ask a coding assistant to use a library, a clean index of the docs helps far more than crawling a hundred pages with repeated navigation. That's why documentation platforms were the first to adopt it, and some generate it automatically.

## The file format

The proposal defines a simple structure, in this order:

1. An H1 title with the name of the project or site. It's the only required element.
2. A blockquote with a short summary of what the site is.
3. Optional paragraphs or lists with extra context.
4. Sections with H2 headings, each with a list of Markdown links and a short note after each link.
5. An optional section called "Optional" with links a model can skip if it's short on space.

A minimal example looks like this:

```
# Site name

> One or two sentences saying what the site is and who it's for.

## Guides

- [Technical SEO guide](https://yoursite.com/technical-seo-guide): fundamentals for developers.
- [Audit checklist](https://yoursite.com/checklist): template-based review list.

## Optional

- [Blog archive](https://yoursite.com/blog): every article.
```

Alongside llms.txt there's a parallel convention, llms-full.txt, which holds the full text of the pages in a single file instead of links. It makes sense for documentation, where an agent wants to read everything at once. On a general content site it usually ends up too long.

## The llms.txt on this site

On juan-tech.com I serve a /llms.txt and a /llms-full.txt. Here are the decisions I made, because I think they work as a reference:

- I wrote it by hand instead of generating it from the database. It's about fifteen stable URLs: main pages, services and sections. A dump of the whole sitemap already exists at /sitemap.xml, and repeating it helps nobody.
- The summary says in two sentences who I am and what I do, and it clarifies that the site is bilingual, with Spanish unprefixed and English under /en.
- Each link carries a one-line note explaining what's on that page, written so a model understands when it's worth opening.

One detail taught me something. For a while the route served a placeholder text I had left when wiring up the feature, with internal project names in it. It was public and indexable. I fixed it as a matter of hygiene, not because I expected it to move any ranking, and that's the attitude I recommend for this file.

## Who actually reads llms.txt

This is the most exaggerated part, so I'll take it piece by piece.

Google doesn't use it in its search engine. People from Google's search team have said so publicly more than once, and its documentation on AI features in Search doesn't ask for any special file to appear in AI Overviews or AI Mode. If someone sells you an llms.txt to climb in Google, be skeptical.

OpenAI, Anthropic and Perplexity haven't published that their search engines use llms.txt to decide what to cite. They may read it in some cases, but I don't know of solid data showing it, and I won't claim something I can't check.

Where it does have real use is in tools someone explicitly points at a site: coding assistants, agents browsing on a user's behalf and servers that expose documentation to a code editor. In that context the file saves tokens and improves the answer, which is why it's close to a de facto standard in API documentation.

If you want to check your own case, look at your server logs for requests to /llms.txt. On most content sites I review, visits to that file are few and come mostly from tools and curious people, not from search crawlers.

## When it's worth creating one

My criteria:

- It's worth it if you have technical documentation, an API or a product for developers. Coding agents use it there and the benefit is direct.
- It's worth it if it costs you little to maintain, for example if your site has a handful of key pages that rarely change. Half an hour of work and a review every so often.
- It's not worth it if you do it instead of fixing what actually blocks your AI visibility: bots blocked in robots.txt, content that only appears with JavaScript or pages nobody can cite because they don't answer anything concrete.
- It's also not worth generating an automatic one with thousands of URLs. That loses exactly what makes it useful, which is curation.

What moves the needle most for getting cited is still the text. In my guide on [AI-citable content](/blog/tech-seo/citabilidad-contenido-ia) I explain how I rewrite a section so a model can extract and cite it without losing the meaning.

## How to create your llms.txt step by step

1. List the pages that best explain your business or project. Ten to twenty is enough for most sites.
2. Write the summary in two or three sentences with concrete facts: what you do, who for and which languages the site is in.
3. Group the links into H2 sections and write a one-line note for each.
4. Save the file as UTF-8 plain text and publish it at the domain root. In Next.js I serve it from a route handler that returns the content with Content-Type text/plain, and the text lives in the CMS so I can edit it without deploying.
5. Open yoursite.com/llms.txt in the browser and check it responds with a 200 and no odd redirects.
6. Schedule a review every few months, or whenever your main pages change. An llms.txt full of broken links is worse than not having one.

You don't need to link it from the sitemap or declare it in robots.txt. Anyone looking for it will request it at the conventional path.

## What llms.txt doesn't do

- It doesn't block or allow crawlers. That's still the job of robots.txt and your firewall.
- It doesn't replace the sitemap, which is what search engines use to discover URLs.
- It doesn't improve your Google rankings.
- It doesn't guarantee ChatGPT or Perplexity will cite you.

It won't tell you whether you're being cited either. For that you need to measure the traffic coming from AI assistants and track a fixed set of questions, which I explain in my guide to [measuring AI citations](/blog/tech-seo/medir-citas-ia).

:::faq llms.txt frequently asked questions
?? Is llms.txt an official standard?
No. It's an open proposal published at llmstxt.org in September 2024. No search engine or AI company has adopted it as a requirement.
?? Does Google use llms.txt?
Not in its search engine. Google doesn't ask for any special file to appear in AI Overviews or AI Mode, and members of its search team have said publicly that they don't use it.
?? What's the difference between llms.txt and llms-full.txt?
llms.txt is an index with links and short notes. llms-full.txt gathers the full text of the pages in a single file, useful mostly for technical documentation.
?? Can an llms.txt hurt my SEO?
No, as long as it doesn't expose internal information or content you don't want public. It's just another public file anyone can read.
:::

If you want me to review how AI engines read your site, llms.txt included but without stopping there, my [AI SEO service](/servicios/ai-seo-geo) starts with bot access and content structure, which is where the real blockers usually are.

Keep reading with my guide to [measuring AI citations](/blog/tech-seo/medir-citas-ia), with the method I use to know whether a change worked.
