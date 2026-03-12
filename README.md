# Didactic Carnival

## CS Misconceptions Quiz

An interactive quiz site targeting common Computer Science misconceptions, located in the `cs-quiz/` directory.

### Local development

```bash
# Serve the repository root over HTTP (required — fetch() won't work over file://)
python3 -m http.server 8000
# Then open http://localhost:8000/cs-quiz/
```

Any static HTTP server works: VS Code Live Server, `npx serve`, `npx http-server`, etc.

No build step or `npm install` needed — it's pure HTML/CSS/JS.

### How to add questions

1. Open `cs-quiz/data/questions.json`.
2. Add a new object to the JSON array. Required fields:

```json
{
  "id":           "unique-id",
  "topic":        "One of the 7 topic strings",
  "prompt":       "The question text",
  "type":         "multiple-choice | multi-select | short-answer",
  "options":      ["A", "B", "C", "D"],
  "correct":      1,
  "explanation":  "Full explanation shown after answering",
  "misconception":"The common misconception this targets",
  "difficulty":   "easy | medium | hard",
  "references":   ["https://optional-link"]
}
```

- For `multiple-choice`: `correct` is the 0-based index of the right option.
- For `multi-select`: `correct` is an array of 0-based indices.
- For `short-answer`: `correct` is an array of keywords; the answer is accepted when ≥ half the keywords appear.
- `options` can be omitted for `short-answer`.
- Valid topic values: `"Big-O Complexity"`, `"Recursion vs Iteration"`, `"P vs NP"`, `"Memory: Stack & Heap"`, `"Concurrency vs Parallelism"`, `"Hash Tables"`, `"OOP vs Functional"`.
- To add a **new topic**, add a new string — the UI will automatically create a pack card for it. Optionally add an icon to `TOPIC_ICONS` and a colour to `topicClass()` in `cs-quiz/js/questions.js`.

### Deploy to GitHub Pages

1. In the repository settings, go to **Pages**.
2. Set Source → **Deploy from a branch**, branch `main`, folder `/` (root).
3. The quiz will be live at `https://<owner>.github.io/<repo>/cs-quiz/`.

No base-path changes are needed — all paths are relative.

---

Didactic Carnival is a small collection of HTML posts and creative pieces by emyllis. The repository contains an index and a set of dated HTML pages (weekly posts) along with standalone pages such as `spiritual_arcade.html`.

Repository contents
- index.html — entry page / landing
- 2025-11-16.html, 2025-11-23.html, 2025-11-30.html, 2025-12-07.html — dated posts
- spiritual_arcade.html — standalone page or project
- README.md — this file

Quickstart — view the site locally
1. Clone the repository:
   git clone https://github.com/emyllis/didactic-carnival.git
2. Open `index.html` (or any of the `.html` files) in your browser:
   - double-click the file, or
   - serve the directory with a local web server (e.g., `python -m http.server`) and visit http://localhost:8000

Quickstart — GitHub Pages
- If you want the repository served on the web, enable GitHub Pages in the repository settings (use the `main` branch root). Once enabled, the HTML files will be available at the Pages URL.

Contributing
- Suggestions, fixes, or new posts are welcome.
- Open an issue to discuss larger changes or file a pull request with your proposed edits.
- If adding new HTML posts, follow the existing naming pattern (YYYY-MM-DD.html) and update `index.html` if you want it linked from the landing page.

Maintainer / author
- Repository owner: @emyllis

License
- No license file is included in this repository. If you want others to reuse or contribute under specific terms, add a LICENSE file (e.g., MIT, Apache-2.0).

Notes
- This repository currently holds HTML files intended for direct viewing. If you’d like a static site generator workflow (Jekyll, Hugo, etc.) or automated publishing, open an issue describing the desired setup and I or other contributors can propose a change.
