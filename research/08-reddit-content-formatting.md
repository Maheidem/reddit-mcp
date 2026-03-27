---
title: "Reddit Content Formatting — Markdown, Rich Text JSON, and Content Limits"
date: 2026-03-27
researcher: researcher-4
status: completed
confidence: high
scope: Reddit markdown flavor, RTJSON format, character limits, URL handling, inline media in comments
---

# Reddit Content Formatting — Markdown, Rich Text JSON, and Content Limits

## Executive Summary

For an MCP server that helps LLMs create Reddit content, understanding Reddit's formatting system is critical. Reddit supports two content input modes: **Markdown** (via the `text`/`selftext` parameter) and **Rich Text JSON** (via the `richtext_json` parameter). This document comprehensively covers both formats, all content length limits, URL handling behavior, and inline media capabilities.

**Key recommendations for MCP implementation:**

1. **Always use Markdown** — it's well-documented, portable, and works on all Reddit surfaces
2. RTJSON spec is unpublished — only use it if you need image embeds in text posts
3. Character limits vary by content type and Premium status — validate before submission
4. Reddit auto-links `r/subreddit` and `u/user` patterns — no special handling needed
5. Inline images in comments have limited support — most communities don't enable it

---

## 1. Reddit Markdown Flavor (Snudown)

Reddit uses **Snudown**, a custom fork of the Sundown Markdown parser (the same base as old GitHub-Flavored Markdown). It has several Reddit-specific extensions and some notable differences from standard CommonMark.

### 1.1 Snudown Default Extension Flags

From [snudown.c source code](https://github.com/reddit/snudown/blob/master/snudown.c):

| Flag                       | Effect                                                                  |
| -------------------------- | ----------------------------------------------------------------------- |
| `MKDEXT_NO_INTRA_EMPHASIS` | `foo_bar_baz` does NOT italicize `bar` (prevents emphasis within words) |
| `MKDEXT_SUPERSCRIPT`       | `^word` and `^(multi word)` create superscript                          |
| `MKDEXT_AUTOLINK`          | Bare URLs automatically become clickable links                          |
| `MKDEXT_STRIKETHROUGH`     | `~~text~~` creates strikethrough                                        |
| `MKDEXT_TABLES`            | Pipe-delimited table syntax (max 64 columns)                            |
| `MKDEXT_FENCED_CODE`       | Triple-backtick code blocks                                             |

### 1.2 Complete Syntax Reference

#### Standard Markdown (Supported)

| Feature                   | Syntax                        | Notes                               |
| ------------------------- | ----------------------------- | ----------------------------------- |
| **Bold**                  | `**text**` or `__text__`      | Both work                           |
| **Italic**                | `*text*` or `_text_`          | Both work                           |
| **Bold + Italic**         | `***text***`                  | Combined                            |
| **Strikethrough**         | `~~text~~`                    | Reddit extension                    |
| **Inline code**           | `` `code` ``                  | Standard                            |
| **Code block (indented)** | 4 spaces indent               | Standard                            |
| **Code block (fenced)**   | ` ```code``` `                | No syntax highlighting              |
| **Headings**              | `# H1` through `###### H6`    | Standard                            |
| **Blockquote**            | `> text`                      | Nestable with `>>`                  |
| **Ordered list**          | `1. item`                     | **Must start with 1**; can use `1)` |
| **Unordered list**        | `* item` or `- item`          | No `+` support                      |
| **Horizontal rule**       | `---` or `***` or `___`       | Standard                            |
| **Link**                  | `[text](url)`                 | Spaces allowed in URLs              |
| **Link + title**          | `[text](url "title")`         | Standard                            |
| **Table**                 | Pipe-delimited                | Max 64 columns                      |
| **Line break**            | Two trailing spaces + newline | Or double newline for paragraph     |

#### Reddit-Specific Extensions

| Feature                  | Syntax                          | Output                       | Notes                          |
| ------------------------ | ------------------------------- | ---------------------------- | ------------------------------ |
| **Superscript (word)**   | `normal^superscript`            | normal<sup>superscript</sup> | Single word only               |
| **Superscript (phrase)** | `normal^(multi word)`           | normal<sup>multi word</sup>  | Parenthesized form             |
| **Inline spoiler**       | `>!spoiler text!<`              | Hidden until clicked         | Must have `!` adjacent to text |
| **Block spoiler**        | `>! spoiler block`              | Entire blockquote hidden     | Note: space after `>!`         |
| **Subreddit link**       | `r/subreddit` or `/r/subreddit` | Auto-linked                  | No markdown needed             |
| **User link**            | `u/username` or `/u/username`   | Auto-linked                  | No markdown needed             |
| **Multireddit link**     | `/r/sub/m/multi`                | Auto-linked                  | Automatic                      |
| **Wiki link**            | `/r/sub/w/page`                 | Auto-linked                  | Automatic                      |
| **Escape superscript**   | `\^not super`                   | Literal caret                | Backslash escaping             |
| **Escape strikethrough** | `\~~not struck~~`               | Literal tildes               | Backslash escaping             |

#### NOT Supported

| Feature                    | Standard Markdown? |                Reddit Status                 |
| -------------------------- | :----------------: | :------------------------------------------: |
| Images `![alt](url)`       |        Yes         |       **Not rendered** (Markdown mode)       |
| Syntax highlighting        |        GFM         |       **Not supported** in code blocks       |
| Footnotes                  |     Extension      |              **Not supported**               |
| Definition lists           |     Extension      |              **Not supported**               |
| Task lists `- [ ]`         |        GFM         |              **Not supported**               |
| Highlight/mark             |     Extension      |              **Not supported**               |
| Subscript                  |     Extension      | **Not supported** (only in rich text editor) |
| Underline                  |     Extension      | **Not supported** (only in rich text editor) |
| HTML tags                  |      Standard      |             **Stripped/ignored**             |
| Custom heading IDs         |     Extension      |      **Not supported** (auto-generated)      |
| Emoji shortcodes `:emoji:` |     Extension      |              **Not supported**               |

### 1.3 Key Quirks and Edge Cases

1. **No intra-word emphasis**: `foo_bar_baz` renders literally, NOT as foo*bar*baz. This is by design (`MKDEXT_NO_INTRA_EMPHASIS`).

2. **Line breaks require intent**: A single newline is ignored. Use two spaces + newline for a `<br>`, or a blank line for a new paragraph.

3. **Table column limit**: Tables with more than 64 columns render as plain paragraphs instead of tables.

4. **Ordered lists must start at 1**: Unlike standard Markdown, Reddit does not support starting at arbitrary numbers.

5. **No plus-sign lists**: `+ item` does NOT create a list (only `*` and `-` work).

6. **Spoiler whitespace sensitivity**: `>!text!<` works, but `>! text !<` may not render consistently across all Reddit clients.

7. **Nested superscript**: `^(^(nested))` works but can be fragile.

8. **Autolinks**: Bare URLs like `https://example.com` are automatically linked — no need for `[text](url)` syntax.

9. **Old Reddit vs. New Reddit**: Snudown is the parser for old Reddit. New Reddit (Shreddit) uses a different rendering pipeline but accepts the same Markdown input.

**Sources:**

- [Reddit/Snudown source (GitHub)](https://github.com/reddit/snudown)
- [Snudown test cases](https://github.com/reddit/snudown/blob/master/test_snudown.py)
- [Snudown extension flags](https://github.com/reddit/snudown/blob/master/snudown.c)
- [Reddit Markdown Guide (markdownguide.org)](https://www.markdownguide.org/tools/reddit/)
- [Reddit Formatting Guide](https://support.reddithelp.com/hc/en-us/articles/360043033952-Formatting-Guide)

---

## 2. Rich Text JSON (RTJSON) Format

### 2.1 Overview

Reddit's Fancy Pants editor (the default WYSIWYG editor on new Reddit) uses a proprietary JSON format called **RTJSON** ("Rich Text JSON"). The specification is **unpublished**, but the structure has been reverse-engineered from the Devvit SDK and API responses.

### 2.2 Top-Level Structure

```json
{
  "document": [
    { /* node */ },
    { /* node */ },
    ...
  ]
}
```

The `document` array contains an ordered list of block-level nodes.

### 2.3 Node Types (Discovered)

| Node Type       | `e` Value      | Description            | Key Fields                            |
| --------------- | -------------- | ---------------------- | ------------------------------------- |
| Paragraph       | `"par"`        | Standard paragraph     | `c` (children array)                  |
| Heading         | `"h"`          | Heading                | `l` (level 1-6), `c` (children)       |
| Blockquote      | `"blockquote"` | Blockquote             | `c` (children)                        |
| Code Block      | `"code"`       | Fenced code block      | `c` (children)                        |
| List            | `"list"`       | Ordered/unordered list | `o` (ordered bool), `c` (list items)  |
| Table           | `"table"`      | Table                  | `h` (header), `c` (rows)              |
| Image           | `"img"`        | Embedded image         | `id` (mediaId), `c` (caption), `blur` |
| Horizontal Rule | `"hr"`         | Horizontal rule        | (no children)                         |

### 2.4 Inline Element Types

| Element Type  | `e` Value | Description            | Key Fields                                 |
| ------------- | --------- | ---------------------- | ------------------------------------------ |
| Text          | `"text"`  | Plain text             | `t` (text content), `f` (formatting flags) |
| Link          | `"link"`  | Hyperlink              | `u` (URL), `t` (text), `a` (tooltip)       |
| Emoji         | `"emoji"` | Custom subreddit emoji | `a` (emoji name), `u` (emoji URL)          |
| User mention  | `"u/"`    | User reference         | `t` (username)                             |
| Subreddit ref | `"r/"`    | Subreddit reference    | `t` (subreddit name)                       |

### 2.5 Text Formatting Flags

The `f` field on text nodes is an array of formatting ranges:

```json
{ "e": "text", "t": "Hello world", "f": [[1, 0, 5]] }
```

Each flag is a tuple: `[flag_type, start_index, length]`

| Flag Type | Meaning           |
| :-------: | ----------------- |
|     0     | None / plain      |
|     1     | **Bold**          |
|     2     | _Italic_          |
|     4     | ~~Strikethrough~~ |
|     8     | Superscript       |
|    16     | Spoiler           |
|    32     | `Inline code`     |

Flags can be combined via bitwise OR (e.g., `3` = bold+italic).

### 2.6 Complete Example

```json
{
  "document": [
    {
      "e": "h",
      "l": 2,
      "c": [{ "e": "text", "t": "My Heading" }]
    },
    {
      "e": "par",
      "c": [
        { "e": "text", "t": "This is " },
        { "e": "text", "t": "bold", "f": [[1, 0, 4]] },
        { "e": "text", "t": " and " },
        { "e": "link", "u": "https://reddit.com", "t": "a link" },
        { "e": "text", "t": "." }
      ]
    },
    {
      "e": "par",
      "c": [
        { "e": "text", "t": "Check out " },
        { "e": "r/", "t": "programming" },
        { "e": "text", "t": " and " },
        { "e": "u/", "t": "spez" }
      ]
    },
    {
      "e": "img",
      "id": "aBcdeFgh123",
      "c": "A cool image caption"
    }
  ]
}
```

### 2.7 Using RTJSON in the API

**Submission:**

```
POST /api/submit
Body: richtext_json={"document":[...]}&sr=test&title=My Post&kind=self
```

**Comment:**

```
POST /api/comment
Body: richtext_json={"document":[...]}&thing_id=t3_abc123
```

**RichTextBuilder (from Devvit SDK):**

```javascript
const rtjson = new RichTextBuilder()
  .heading({ level: 2 }, (t) => {
    t.link({ text: "Title Link", url: "https://example.com", tooltip: "Click me" });
    t.rawText(" and more text");
  })
  .image({ mediaId: "aBcdeFgh", caption: "A cool image", blur: "spoiler" });

const body = rtjson.build();
// Returns: {"document": [<entries>]}
```

### 2.8 RTJSON vs. Markdown: When to Use What

| Criterion              | Markdown (`text`) | RTJSON (`richtext_json`)  |
| ---------------------- | :---------------: | :-----------------------: |
| Documentation          |  Well-documented  |     Unpublished spec      |
| Portability            | Works everywhere  |  New Reddit / apps only   |
| Image embeds           |   Not possible    | Supported via `img` nodes |
| LLM generation         |       Easy        |  Complex JSON structure   |
| API stability          |      Stable       | May change without notice |
| **MCP recommendation** |   **Use this**    |   Only for image embeds   |

**Sources:**

- [rAPI RichTextBuilder](https://github.com/Littux-Dustux/rAPI)
- [Reddit Formatting Guide](https://support.reddithelp.com/hc/en-us/articles/360043033952-Formatting-Guide)

---

## 3. Rich Text Flair Format

Flair fields (`link_flair_richtext`, `author_flair_richtext`) use a simplified version of the richtext format.

### 3.1 Flair Richtext Structure

The richtext flair is an **array of elements**, each identified by the `e` (element type) field:

**Text element:**

```json
{ "e": "text", "t": "Proud Shitposter" }
```

**Emoji element:**

```json
{ "e": "emoji", "a": ":snoo:", "u": "https://emoji.redditmedia.com/abc123/snoo.png" }
```

**Mixed flair (text + emoji):**

```json
[
  { "e": "emoji", "a": ":verified:", "u": "https://emoji.redditmedia.com/xyz/verified.png" },
  { "e": "text", "t": " Verified User" }
]
```

### 3.2 Field Reference

| Field | Type   | Present On     | Description                           |
| ----- | ------ | -------------- | ------------------------------------- |
| `e`   | string | All elements   | Element type: `"text"` or `"emoji"`   |
| `t`   | string | Text elements  | The literal text content              |
| `a`   | string | Emoji elements | Emoji name/shortcode (e.g., `:snoo:`) |
| `u`   | string | Emoji elements | Full URL to the emoji image           |

### 3.3 Related API Fields

**On posts/submissions:**

- `link_flair_richtext` — Array of richtext elements (for link/post flair)
- `link_flair_text` — Plain text fallback
- `link_flair_type` — `"text"` or `"richtext"`
- `link_flair_background_color` — Hex color (e.g., `"#ff4500"`)
- `link_flair_text_color` — `"dark"` or `"light"`
- `link_flair_css_class` — CSS class name (old Reddit)
- `link_flair_template_id` — UUID of the flair template

**On comments/authors:**

- `author_flair_richtext` — Array of richtext elements (for user flair)
- `author_flair_text` — Plain text fallback
- `author_flair_type` — `"text"` or `"richtext"`
- `author_flair_background_color` — Hex color
- `author_flair_text_color` — `"dark"` or `"light"`
- `author_flair_css_class` — CSS class name
- `author_flair_template_id` — UUID of the flair template

### 3.4 Custom Subreddit Emojis

Subreddits can upload custom emojis that are usable in flair and some text contexts:

| Endpoint                                              | Method | Description                     |
| ----------------------------------------------------- | ------ | ------------------------------- |
| `GET /api/v1/{subreddit}/emojis/all`                  | GET    | List all emojis for a subreddit |
| `POST /api/v1/{subreddit}/emoji.json`                 | POST   | Upload a new emoji              |
| `DELETE /api/v1/{subreddit}/emoji/{name}`             | DELETE | Delete an emoji                 |
| `POST /api/v1/{subreddit}/emoji_permissions`          | POST   | Update emoji permissions        |
| `POST /api/v1/{subreddit}/emoji_asset_upload_s3.json` | POST   | Get S3 upload lease for emoji   |

**Sources:**

- [Snuze API Reference: Subreddit](https://snuze.shaunc.com/docs/api-reference/subreddit/)
- [PRAW Emoji](https://praw.readthedocs.io/en/latest/code_overview/other/emoji.html)
- [PRAW endpoints.py](https://github.com/praw-dev/praw/blob/main/praw/endpoints.py)
- [Reddit Mods: Emojis](https://mods.reddithelp.com/hc/en-us/articles/360010560371-Emojis)

---

## 4. Content Length Limits

### 4.1 Complete Character Limit Reference

| Content Type              |    Limit     |  Premium Limit   | Notes                               |
| ------------------------- | :----------: | :--------------: | ----------------------------------- |
| **Post title**            |  300 chars   |    300 chars     | Required, cannot be empty           |
| **Self post body**        | 40,000 chars | **80,000 chars** | Premium increase as of Oct 28, 2025 |
| **Comment**               | 10,000 chars |   10,000 chars   | Same for all users                  |
| **Direct message**        | 10,000 chars |   10,000 chars   | Via `/api/compose`                  |
| **Chat message**          | ~4,000 chars |   ~4,000 chars   | Via SendBird, approximate           |
| **User flair text**       |   64 chars   |     64 chars     | Per subreddit                       |
| **Post/link flair text**  |   64 chars   |     64 chars     | Set by mods or users                |
| **Username**              |  3-20 chars  |    3-20 chars    | Alphanumeric + underscores          |
| **Display name**          |   30 chars   |     30 chars     | Profile display name                |
| **User bio/About**        |  200 chars   |    200 chars     | Profile bio                         |
| **Subreddit name**        |  3-21 chars  |    3-21 chars    | Alphanumeric + underscores          |
| **Subreddit description** |  500 chars   |    500 chars     | Public description                  |
| **Live thread update**    | ~4,096 chars |   ~4,096 chars   | Markdown supported                  |

### 4.2 API Validation Behavior

When limits are exceeded:

- The API returns an error response (HTTP 200 with JSON error body)
- Error field: `"errors"` array with entries like `["TOO_LONG", "this is too long (max: 300)", "title"]`
- The submission is NOT created

### 4.3 Content Rendering Limits

| Limit             |    Value     | Notes                                      |
| ----------------- | :----------: | ------------------------------------------ |
| Max table columns |      64      | Tables exceeding this render as plain text |
| Max nesting depth |     ~100     | Deeply nested quotes/lists may not render  |
| Max link length   | ~2,000 chars | URL length limit in markdown links         |
| Poll options      |     2-6      | Min 2, max 6 options                       |
| Poll option text  |  ~120 chars  | Per option                                 |
| Poll duration     |   1-7 days   | Integer days only                          |
| Gallery images    |     ~20      | Approximate max images per gallery post    |

### 4.4 MCP Implementation Notes

- **Always validate title length** (300 chars) before submission
- **Warn on body length** approaching 40,000 chars (or 80,000 for Premium)
- **Truncate gracefully** — if content must be shortened, prefer truncating at paragraph or sentence boundaries
- **Count characters, not bytes** — Reddit counts Unicode characters, not UTF-8 bytes
- Flair text should be validated against 64-char limit before setting

**Sources:**

- [TypeCount: Reddit Character Limits](https://typecount.com/blog/reddit-post-character-limit)
- [LetterCounter: Reddit Limits](https://lettercounter.org/blog/reddit-character-limit/)
- [Reddit Changelog Nov 4, 2025](https://support.reddithelp.com/hc/en-us/articles/42961314311700-Changelog-November-4-2025)

---

## 5. URL and Link Handling

### 5.1 Automatic Link Detection

Reddit automatically converts these patterns into clickable links:

| Pattern             | Example                             | Result                |
| ------------------- | ----------------------------------- | --------------------- |
| Bare HTTP/HTTPS URL | `https://example.com`               | Auto-linked           |
| Subreddit reference | `r/programming` or `/r/programming` | Links to subreddit    |
| User reference      | `u/spez` or `/u/spez`               | Links to user profile |
| Multireddit         | `/r/sub/m/multi`                    | Links to multireddit  |
| Wiki page           | `/r/sub/w/page`                     | Links to wiki page    |

### 5.2 URL Preview / Embed Generation

When a link post is submitted, Reddit generates previews using **Embedly** (a third-party service):

| Domain         | Preview Type       | Notes                           |
| -------------- | ------------------ | ------------------------------- |
| **YouTube**    | Video embed        | Inline player with thumbnail    |
| **Imgur**      | Image/album embed  | Direct image display            |
| **Gfycat**     | GIF/video embed    | Inline player                   |
| **Twitter/X**  | Tweet embed        | Card-style preview              |
| **Reddit**     | Post/comment embed | Cross-site embed                |
| **Streamable** | Video embed        | Inline player                   |
| **Twitch**     | Clip/stream embed  | Player embed                    |
| **i.redd.it**  | Direct image       | Full image display              |
| **v.redd.it**  | Video player       | DASH streaming                  |
| **Other URLs** | Open Graph card    | Title + description + thumbnail |

### 5.3 Preview Data in API Responses

Link posts include these embed/preview fields:

```json
{
  "media": {
    "type": "youtube.com",
    "oembed": {
      "provider_url": "https://www.youtube.com/",
      "title": "Video Title",
      "html": "<iframe ...>",
      "thumbnail_url": "https://...",
      "thumbnail_width": 480,
      "thumbnail_height": 360
    }
  },
  "media_embed": {
    "content": "<iframe ...>",
    "width": 600,
    "height": 338
  },
  "preview": {
    "images": [
      {
        "source": { "url": "https://preview.redd.it/...", "width": 1920, "height": 1080 },
        "resolutions": [
          { "url": "https://preview.redd.it/...?width=108", "width": 108, "height": 60 },
          { "url": "https://preview.redd.it/...?width=216", "width": 216, "height": 121 },
          { "url": "https://preview.redd.it/...?width=320", "width": 320, "height": 180 }
        ]
      }
    ]
  },
  "thumbnail": "https://b.thumbs.redditmedia.com/..."
}
```

### 5.4 Reddit's oEmbed Endpoint

Reddit provides its own oEmbed endpoint for embedding Reddit content elsewhere:

```
GET https://www.reddit.com/oembed?url={reddit_permalink}
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | Reddit permalink (comment only, currently) |
| `parent` | boolean | Include parent content |
| `live` | boolean | Enable real-time display of edits |
| `omitscript` | boolean | Exclude JavaScript (for multiple embeds) |

**Limitation:** Currently only supports permalinks to comments, not posts.

### 5.5 URL Encoding Notes

- URLs in `media_metadata` gallery items have HTML-encoded ampersands (`amp;`) — these need to be cleaned: replace `&amp;` with `&`
- Preview URLs use `preview.redd.it` with query parameters for sizing
- The `secure_media` and `secure_media_embed` fields are HTTPS-only versions of `media` and `media_embed`

**Sources:**

- [Reddit oEmbed wiki](https://github.com/reddit-archive/reddit/wiki/oEmbed)
- [Reddit thumbnails (Open Graph)](https://jameshfisher.com/2017/08/16/reddit-oembed-open-graph/)
- [Reddit APIs and embeds](https://joshuatz.com/posts/2019/reddit-apis-and-building-reddit-embeds/)

---

## 6. Inline Media in Comments

### 6.1 Current State

Reddit has added **limited support** for images in comments, but it is NOT universally available.

| Aspect                         | Status                                              |
| ------------------------------ | --------------------------------------------------- |
| **Feature availability**       | Opt-in per subreddit by moderators                  |
| **How users add images**       | Upload via Reddit app/web rich text editor          |
| **Markdown support**           | **No** — `![alt](url)` does NOT work in comments    |
| **API support for submission** | Via `richtext_json` parameter with `img` nodes      |
| **API support for reading**    | Images appear in `media_metadata` field on comments |
| **Old Reddit**                 | Images not displayed (shown as links)               |

### 6.2 How Comment Images Work

When a community enables image comments:

1. Users upload images via the Fancy Pants editor (web) or Reddit app
2. Images are uploaded to Reddit's S3 (same media asset flow as posts)
3. The comment's `richtext_json` includes `img` nodes referencing `media_id`
4. The comment's `media_metadata` field contains the image URL data

### 6.3 Reading Comment Image Data

Comments with images include:

```json
{
  "body": "Check this out [image](https://preview.redd.it/...)",
  "body_html": "<p>Check this out <a href='...'>image</a></p>",
  "media_metadata": {
    "abc123def": {
      "status": "valid",
      "e": "Image",
      "m": "image/png",
      "p": [{ "y": 108, "x": 108, "u": "https://preview.redd.it/...?width=108" }],
      "s": {
        "y": 500,
        "x": 500,
        "u": "https://preview.redd.it/abc123def.png"
      },
      "id": "abc123def"
    }
  }
}
```

### 6.4 Creating Comments with Images via API

To submit a comment with an inline image:

1. Upload the image via `/api/media/asset.json` (same flow as post images)
2. Get the `asset_id` / `media_id`
3. Submit comment with `richtext_json` containing an `img` node:

```json
{
  "document": [
    {
      "e": "par",
      "c": [{ "e": "text", "t": "Check out this image:" }]
    },
    {
      "e": "img",
      "id": "abc123def",
      "c": "Optional caption"
    }
  ]
}
```

**Important:** This only works in subreddits that have enabled image comments. Otherwise, the image node may be stripped or the submission may fail.

### 6.5 MCP Implications

- **Do NOT default to image comments** — most subreddits don't support them
- **Check subreddit settings** before attempting (`/r/{sub}/about` may indicate capabilities)
- **Fallback to text links** — if images aren't supported, link to hosted images instead
- **Use Markdown by default** for comments — only use RTJSON when embedding images

**Sources:**

- [Reddit Help: Images in Comments](https://support.reddithelp.com/hc/en-us/articles/10516331142932-How-do-I-add-images-in-comments)
- [Reddit adds images in comments (Social Media Today)](https://www.socialmediatoday.com/news/reddit-adds-images-in-comments-for-selected-communities/637910/)
- [gallery-dl embedded images discussion](https://github.com/mikf/gallery-dl/discussions/5366)

---

## 7. MCP Implementation Recommendations

### 7.1 Content Generation Guidelines for LLMs

When the MCP server generates or helps format Reddit content:

1. **Always use Markdown** (the `text` parameter), not RTJSON
2. **Validate all content lengths** before API submission
3. **Use Reddit-flavored syntax** for spoilers (`>!text!<`), superscript (`^word`), and strikethrough (`~~text~~`)
4. **Don't use image markdown** (`![alt](url)`) — it doesn't render on Reddit
5. **Let subreddit/user links auto-format** — just write `r/subreddit` or `u/username`
6. **Avoid HTML** — it's stripped by Reddit
7. **Escape special characters** when they should be literal: `\^`, `\~~`, `\>`

### 7.2 Content Validation Checklist

Before submitting any content, the MCP server should validate:

```
[ ] Title: 1-300 characters, not empty
[ ] Body: <= 40,000 characters (or 80,000 for Premium)
[ ] Comment: <= 10,000 characters
[ ] Flair text: <= 64 characters
[ ] Poll options: 2-6 options
[ ] Tables: <= 64 columns
[ ] URLs: Properly encoded, valid scheme (http/https)
[ ] Spoiler syntax: Properly closed (>!...!<)
```

### 7.3 Content Formatting Helper Tools

Consider implementing these MCP tools:

| Tool                      | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `format_reddit_table`     | Generate properly-formatted Reddit markdown tables |
| `format_reddit_spoiler`   | Wrap text in spoiler tags                          |
| `validate_content_length` | Check content against Reddit limits                |
| `escape_reddit_markdown`  | Escape special characters for literal display      |
| `preview_formatting`      | Show how content will render (approximate)         |

---

## 8. References

### Official Documentation

| #   | Source                     | URL                                                             | Reliability |
| --- | -------------------------- | --------------------------------------------------------------- | :---------: |
| 1   | Reddit Formatting Guide    | https://support.reddithelp.com/hc/en-us/articles/360043033952   |     5/5     |
| 2   | Reddit: How to Format      | https://support.reddithelp.com/hc/en-us/articles/205191185      |     5/5     |
| 3   | Reddit: Images in Comments | https://support.reddithelp.com/hc/en-us/articles/10516331142932 |     5/5     |
| 4   | Reddit oEmbed Wiki         | https://github.com/reddit-archive/reddit/wiki/oEmbed            |     4/5     |
| 5   | Reddit Changelog Nov 2025  | https://support.reddithelp.com/hc/en-us/articles/42961314311700 |     5/5     |
| 6   | Reddit Mods: Emojis        | https://mods.reddithelp.com/hc/en-us/articles/360010560371      |     5/5     |

### Source Code

| #   | Source                  | URL                                                           | Reliability |
| --- | ----------------------- | ------------------------------------------------------------- | :---------: |
| 7   | Snudown repository      | https://github.com/reddit/snudown                             |     5/5     |
| 8   | Snudown extension flags | https://github.com/reddit/snudown/blob/master/snudown.c       |     5/5     |
| 9   | Snudown test cases      | https://github.com/reddit/snudown/blob/master/test_snudown.py |     5/5     |
| 10  | PRAW endpoints.py       | https://github.com/praw-dev/praw/blob/main/praw/endpoints.py  |     5/5     |
| 11  | rAPI RichTextBuilder    | https://github.com/Littux-Dustux/rAPI                         |     3/5     |

### Community & Reference

| #   | Source                         | URL                                                                                                   | Reliability |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------- | :---------: |
| 12  | Markdown Guide: Reddit         | https://www.markdownguide.org/tools/reddit/                                                           |     4/5     |
| 13  | TypeCount: Character Limits    | https://typecount.com/blog/reddit-post-character-limit                                                |     4/5     |
| 14  | LetterCounter: Reddit Limits   | https://lettercounter.org/blog/reddit-character-limit/                                                |     4/5     |
| 15  | Snuze API Reference            | https://snuze.shaunc.com/docs/api-reference/subreddit/                                                |     3/5     |
| 16  | Reddit embeds blog             | https://joshuatz.com/posts/2019/reddit-apis-and-building-reddit-embeds/                               |     3/5     |
| 17  | Reddit thumbnails (Open Graph) | https://jameshfisher.com/2017/08/16/reddit-oembed-open-graph/                                         |     3/5     |
| 18  | Images in comments (SMT)       | https://www.socialmediatoday.com/news/reddit-adds-images-in-comments-for-selected-communities/637910/ |     4/5     |
| 19  | gallery-dl embedded images     | https://github.com/mikf/gallery-dl/discussions/5366                                                   |     3/5     |
| 20  | Snudown spoiler tags PR        | https://github.com/reddit/snudown/pull/56                                                             |     4/5     |

---

_Document version: 1.0 | Date: 2026-03-27 | Researcher: researcher-4_
_Total sources cited: 20 with full URLs_
