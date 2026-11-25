# LearnPath Google Colab version

Group: LearnPath | Participant and submitting student: Mary Balemba | Course: ITAI2376

This is the Python classroom version of my Option 4 learning companion. It uses a lesson document tool, a bounded expression checker, SQLite learner memory and a contextual bandit for explanation selection.

Open the named notebook in Google Colab and run its cells from the top. The notebook extracts these source files. Leave optional Gemini off for the first run. A CPU runtime is sufficient. Use a nickname and keep a checkpoint before leaving the session.

For local use, run python -m pip install -r requirements.txt and python evaluate.py. The core and evaluation use Python standard-library tools; ipywidgets supplies the notebook interface.

The separate website version lets people practice without Colab. Its requested domain is https://learnpathcode.online and the currently working platform address is https://learnpath-python-practice.manics28b.chatgpt.site . Domain DNS verification is pending at this documentation check.

Python storage uses SQLite. The website uses browser storage. They do not automatically sync. Optional model rewriting exists only in the notebook and does not grade answers. Store optional keys in Colab Secrets, never in source or recordings.

See the main README, final report, domain setup guide and testing evidence in the submission for the full explanation. The current Python tests pass 37 behavior checks and 240 exercise cases. Simulation outputs are not evidence of learning gains for real students.
