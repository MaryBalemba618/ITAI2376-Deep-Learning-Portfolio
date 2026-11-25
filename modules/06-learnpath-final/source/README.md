# LearnPath final project

Group name: LearnPath  
Participant and submitting student: Mary Balemba  
Course: ITAI2376  
Project choice: Option 4 Interactive Learning Companion  
Development environment: Google Colab

LearnPath is my beginner Python learning companion. It gives a short lesson, creates an exercise, checks an expression, gives hints, and keeps track of practice. The difficulty changes with first-attempt performance. A contextual bandit uses feedback to choose between worked examples, analogies, and guided steps.

The classroom version is in `colab/`. The public browser version is in `website/`. They follow the same main tutoring idea, but their storage and interfaces are different. The Colab version uses Python, SQLite and notebook widgets. The website uses HTML, CSS, JavaScript and browser storage. The public website does not depend on a Colab session staying open.

Requested website address: https://learnpathcode.online  
Current published app: https://learnpath-python-practice.manics28b.chatgpt.site

The requested domain has been added to hosting. At the latest check it still opened the existing GoDaddy page, so DNS verification and the final custom-domain recording remain to be completed. The domain setup document lists the exact records.

## Run the classroom version

1. Open Google Colab and upload `FN_Notebook_MaryBalemba_LearnPath_ITAI2376.ipynb`.
2. Run the cells from the top. The notebook contains the Python source files.
3. Keep optional Gemini off for the first run. A CPU runtime is sufficient.
4. Enter a nickname and a supported topic. Try a wrong answer, request a hint, then correct the expression.
5. Save a checkpoint or enable the optional Drive setting before ending the session.

To run the Python code locally, open the `colab` folder and use:

```bash
python -m pip install -r requirements.txt
python evaluate.py
python -m unittest discover -s tests -v
```

## Run the browser version

Open the published website, choose a topic, and enter one expression. No account, API key or Colab setup is needed for that version.

For local review, open the `website` folder and serve its static files:

```bash
python -m http.server 8000 --directory dist
```

Then open `http://localhost:8000` in a browser. To run the website engine checks with Node.js:

```bash
node --test tests/*.test.js
```

No npm packages are needed by the website. It requests original lesson content from `dist/lessons.json`. Its stylesheet also requests Google Fonts, with a local font fallback if they do not load.

## What the tutor supports

The four topics are arithmetic, conditions, iteration with `range`, and lists. Each topic has three difficulty levels. The checker supports whole numbers, booleans, given variables, short lists, integer arithmetic, comparisons, conditional expressions, `sum`, `len`, and bounded `range` calls. It does not run full scripts, arbitrary Python, imports, files or network commands.

Example valid answers include `a + b`, `score >= pass_mark`, `sum(range(n))`, and `sum(items) // len(items)`. The correct expression depends on the task shown.

## How feedback changes the next lesson

A first valid answer gives +1 when correct or -0.5 when incorrect, with a 0.1 hint penalty. Each exercise updates the explanation policy only once. A correct retry finishes the task without replacing the first-attempt evidence. In the browser version, revealing the example solution also prevents that exercise from adding first-try mastery.

The mastery rule is `new = 0.7 * old + 0.3 * score`. The correct first-attempt score is reduced for hints. Scores below 0.4 select level 1, scores from 0.4 to below 0.75 select level 2, and scores at or above 0.75 select level 3. These are practice estimates, not formal grades.

The explanation policy explores styles it has not tried. After that it explores with probability 0.15 and otherwise chooses a style with a high average reward. The next-topic suggestion is the topic with the lowest practice estimate. The learner can choose another topic.

## Storage and privacy

The Colab version stores profiles and task history in SQLite. The website stores one profile in the current browser. A nickname is a profile label, not authentication. People using the same browser profile can access its saved practice. There is no central student database or automatic cross-device syncing.

Use Export progress and Import progress to move browser practice to another device. Imported data is checked before use and replaces the current browser profile after confirmation. Browser data can be lost if it is cleared or blocked. Keep an export when needed.

Optional Gemini rewriting is included only in the Colab code. It is off by default. It changes explanation prose, not assessment or rewards. The public website uses original curated lessons and does not call a language model. Never place API keys in code or recordings.

## Testing and evidence

The final checks were rerun on November 25, 2026. The Python suite passed 37 tests and 240 generated exercise cases. The website engine passed 16 tests, including an independent 300-case exercise check. Raw logs and results are in `evidence/`.

Live browser checks confirmed topic selection, incorrect feedback, a hint, a correct retry, rejected file-access syntax, and the progress page on the published platform address. Prior phone-width checks were completed at 390 pixels. Testing on physical Android and iOS devices and a real-student outcome study have not been completed.

The 30-seed policy comparison uses assumed fixed success probabilities. Its results test the policy under those assumptions; they do not prove improved student learning.

## Submission files

The submission contains the proposal PDF, report PDF, complete source ZIP, self-contained Colab notebook, user guide, test evidence, requirement checklist, domain setup instructions and a timed demonstration script. The final MP4 must be recorded from the working custom domain after DNS validation. The earlier captioned output walkthrough is not the requested live website recording.

All required submission filenames use `FN_TypeOfDeliverable_MaryBalemba_LearnPath_ITAI2376`.

## References and original work

The project explanations, lessons, task templates and diagrams were written for LearnPath. Technical references are credited in the report and `REFERENCES.md`. No movie clips, music, stock photographs or copied articles are included. Third-party tools and externally loaded fonts remain subject to their own licenses. This package does not claim that third-party software is copyright-free.
