---
title: How to measure whether AI cites your site
metaTitle: How to measure AI citations with GA4 and fixed prompts
metaDescription: How I measure whether ChatGPT, Perplexity and Google cite a site: AI assistant traffic in GA4, a fixed list of questions, bot logs and what can't be measured yet.
excerpt: There's no ChatGPT ranking, but you can measure whether AI cites you. I explain the system I build, with an AI channel in GA4, a fixed list of questions, server logs and the limitations worth knowing.
---
Measuring whether AI cites your site means answering three questions: how many people arrive from assistants like ChatGPT or Perplexity, which answers you show up in when someone asks about your topic and whether those assistants' bots can read your pages. No tool gives you all three in a single number, so I build a system out of simple pieces. It's the measurement side of [GEO SEO](/blog/tech-seo/geo-seo-guia), and without it there's no way to know whether a change worked.

Let me get the main limitation out of the way: there's no ChatGPT ranking like Google positions. Answers change with the person, the previous conversation, the moment and the model. What you measure are trends and samples, not exact positions.

## AI assistant traffic in GA4

This is the most concrete measurement because these are real visits. When someone clicks a link inside an answer from ChatGPT, Perplexity, Copilot, Gemini or Claude, the visit reaches your site with the assistant's domain as its source, as long as the browser sends that information.

In GA4 I create a custom channel group with an AI channel that captures those sources. The condition I use is that the session source matches a regular expression like this one:

```
.*(chatgpt\.com|chat\.openai\.com|perplexity\.ai|copilot\.microsoft\.com|gemini\.google\.com|claude\.ai|deepseek\.com|meta\.ai).*
```

That channel has to sit above "Referral" in the group's order, because GA4 assigns each session to the first channel whose condition it meets. If you leave it below, those visits stay classified as ordinary referrals.

One helpful detail: ChatGPT adds utm_source=chatgpt.com to many of the links it shows in its answers, so you can identify those visits even when the referrer is missing.

What this measurement doesn't see:

- People who read the answer and don't click, who are the majority.
- Visits that arrive without a referrer, for example from some desktop or mobile apps, which GA4 files under direct traffic.
- Clicks from Google's AI Overviews and AI Mode, which count as normal Google organic traffic.

That's why I don't rely on this number alone. I use it to see the trend and which pages receive that traffic, which are often quite different from the pages with the most organic traffic.

## What Search Console shows and what it doesn't

Google includes impressions and clicks from AI Overviews and AI Mode inside the web performance report in Search Console, mixed in with everything else. There's no filter to separate them.

What I do is watch two indirect signals in [Search Console](/blog/tech-seo/guia-google-search-console):

- Pages with rising impressions and falling clicks for informational queries. That pattern often lines up with an AI Overview appearing for that search.
- The trend in branded searches. If people read your name in an AI answer and then search for you, you see it here even though the first contact left no trace.

Neither proves a citation on its own. I use them as context to interpret the rest.

## A fixed list of questions

To know whether you show up in answers, you have to ask. I build a list of 20 to 50 real questions about the business, the kind a client would ask, and I check it at the same frequency on the same engines.

The rules I follow so the comparison means something:

1. The questions don't change from one check to the next. If you change the questions, you no longer know whether your visibility improved or the measurement changed.
2. I mix generic industry questions, comparison questions ("what options are there for...") and questions where your brand should show up no matter what.
3. I ask in fresh sessions, with no history or personalization, and note the engine and the date.
4. For each answer I record three things: whether it mentions the brand, whether it links any page of the site and which competitors appear.

With that you get two simple percentages: the share of questions where you're mentioned and the share where you're cited with a link. They aren't the same. An assistant can name your brand without linking you, or link one of your pages without naming you in the text.

You can do it by hand in a spreadsheet to start. If the list grows, there are prompt tracking tools that automate it, and some SEO suites now include AI visibility reports. Before paying for one, I recommend doing it by hand for a month: you'll understand much better what you're measuring and which swings are noise.

## Server logs

Logs tell you whether AI bots reach your pages and what response they get. It's the most technical measurement and the one fewest people check.

I filter by user agent for the bots I care about: OAI-SearchBot and ChatGPT-User from OpenAI, PerplexityBot and Perplexity-User, Claude-SearchBot and Claude-User from Anthropic, plus GPTBot and ClaudeBot if I want to see training crawls. That answers concrete questions:

- Do AI search bots visit the pages that matter to me?
- Do they get a 200, or do they hit a 403 because of a firewall rule?
- After a content change, how long until they come back?

Visits from ChatGPT-User and Perplexity-User are especially interesting because a user triggers them in the moment. A rise in those requests tells you your pages are making it into answers, even if nobody clicks afterwards.

If your site runs through Cloudflare or another CDN, check its bot rules too. It's common to find a blanket AI bot block turned on by default that nobody consciously decided on.

## How I put it all together in a monthly report

Once a month I review the four sources and cross them:

1. Sessions in the GA4 AI channel, by landing page and by assistant.
2. Mention and citation rates on the fixed question list, compared with the previous month.
3. AI bot requests in the logs, with their response codes.
4. Branded searches in Search Console.

Next to that I note what I changed that month: rewritten pages, robots.txt tweaks, new content. Without that column the numbers explain nothing. With it I can say, for example, that a rewritten page started getting cited in Perplexity three weeks later, and decide whether it's worth doing the same elsewhere.

I also cross-check conversions. AI traffic is usually smaller in volume, but it arrives with a question already worked through, so it's worth comparing its conversion rate with organic before deciding how much effort to put in.

## What still can't be measured well

- How many times you appear in answers without a click. No assistant publishes impressions across the board.
- Your position within the answer, which changes from one query to the next.
- The effect of things like [llms.txt](/blog/tech-seo/llms-txt-guia), because there's no public data on which engines use it to cite.

I'd rather put it this way than sell you an "AI visibility index" as if it were an exact metric. The tools that calculate one rely on sampling, and using them is fine as long as you know they're an approximation.

:::faq Measuring AI citations frequently asked questions
?? Does GA4 detect ChatGPT traffic automatically?
It doesn't separate it well by default. The most reliable approach is a custom channel with a regular expression that captures the assistants' domains, placed before Referral in the channel group.
?? Can I see AI Overview clicks in Search Console?
Not separately. Google includes them in normal web performance, mixed in with classic results.
?? How often should I check the question list?
Once a month is enough for me to see trends without chasing daily noise. If you've just made a big change, you can recheck the affected questions after two or three weeks.
:::

If you want me to set up this measurement system on your site and use it to prioritize what to change, it's part of my [AI SEO service](/servicios/ai-seo-geo).

Keep reading with my [llms.txt guide](/blog/tech-seo/llms-txt-guia), covering what that file does and what it doesn't.
