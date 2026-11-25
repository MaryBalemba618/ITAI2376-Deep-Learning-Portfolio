# LearnPath final project

Mary Balemba
Option 4: Interactive Learning Companion
Development environment: Google Colab

## My reflection

LearnPath brought my course learning into a project that someone else can try. I built a beginner Python practice flow with lessons, exercise checking and feedback. A contextual bandit chooses explanation styles from feedback, while a separate practice estimate adjusts difficulty. I learned to check wrong answers, retries and invalid inputs as carefully as correct answers. I also learned that publishing a website includes DNS and HTTPS work. My next step is a reviewed learner study before claiming that the app improves learning.

## Project files

- [Complete source and setup](source/README.md)
- [Browser app](source/website/dist/)
- [Colab notebook](submissions/FN_Notebook_MaryBalemba_LearnPath_ITAI2376.ipynb)
- [Proposal](submissions/FN_Proposal_MaryBalemba_LearnPath_ITAI2376.pdf)
- [Final report](submissions/FN_Report_MaryBalemba_LearnPath_ITAI2376.pdf)
- [User guide](submissions/FN_Guide_MaryBalemba_LearnPath_ITAI2376.pdf)
- [Verification evidence](source/evidence/final-verification.json)
- [Current deployment status](STATUS.md)

The Python suite passed 37 tests and 240 generated exercise cases. The browser engine passed 16 tests, including 300 generated cases. These checks show software behavior. They do not establish student learning gains.

## Local practice website

```bash
cd source/website
python -m http.server 8000 --directory dist
```

Open http://localhost:8000. To check the browser engine, run `node --test tests/*.test.js` from that same website folder.

## Colab

Upload the notebook above to https://colab.research.google.com and run its cells from the top. Keep the optional model API disabled for the first run. The website uses curated lessons and needs no API key.
