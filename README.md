# My ITAI2376 Deep Learning Portfolio

**Mary Balemba**
ITAI2376: Deep Learning in Artificial Intelligence
November 25, 2026

This portfolio shows how my understanding developed during the course. I started by comparing frameworks and explaining neural network concepts. I then worked through diffusion model training and used what I learned to build LearnPath, my final learning companion project.

Public GitHub repository: https://github.com/MaryBalemba618/ITAI2376-Deep-Learning-Portfolio

## Start here

- [Portfolio presentation](presentation/)
- [My learning reflection](reflections/learning-journey.md)
- [Articles videos and references](references/README.md)
- [GitHub setup and submission steps](docs/GITHUB_STEPS.md)
- [Credits and reuse information](ATTRIBUTION.md)

## Course modules

| Folder | Assignment and focus | What I learned |
| --- | --- | --- |
| [01-frameworks](modules/01-frameworks/) | A02b: TensorFlow and PyTorch | Tool choices should follow project needs and actual evidence. |
| [02-neural-network-zoo](modules/02-neural-network-zoo/) | A03: CNN Cheetah | Network structure affects the patterns a model can learn. |
| [03-gradient-descent](modules/03-gradient-descent/) | A04: A lesson for an 11-year-old | Loss, gradients and the learning rate explain parameter updates. |
| [04-arrival-nlp](modules/04-arrival-nlp/) | A05: Arrival analysis | Meaning depends on context and enough supporting evidence. |
| [05-diffusion-midterm](modules/05-diffusion-midterm/) | Diffusion report and executed notebook | Noise prediction, validation and generated samples need different checks. |
| [06-learnpath-final](modules/06-learnpath-final/) | Option 4: LearnPath | I can combine feedback, safe checking and progress tracking in an app. |

The folder numbers organize the portfolio by topic. They do not claim to reproduce official Canvas module numbers.

## Project evidence

The midterm notebook records 30 training epochs, with a final training noise MSE of 0.0713 and validation noise MSE of 0.0725. The lowest logged validation MSE is 0.0709 at epoch 25. Its mean CLIP cosine similarity is 0.284233 across five generated samples. These are saved notebook results, rather than a new portfolio training run.

LearnPath's evidence records 37 passing Python tests and 240 generated exercise cases. The browser suite records 16 passing tests including 300 generated cases. Its learner-policy comparison uses synthetic fixed probabilities, so I do not claim measured benefits for real students.

## Trying LearnPath

Requested domain: https://learnpathcode.online
The HTTPS connection still reports pending validation at the portfolio check. The working hosting address and exact status are in [LearnPath deployment status](modules/06-learnpath-final/STATUS.md).

To run the website locally, start a Python HTTP server from its website folder as explained in the [project README](modules/06-learnpath-final/README.md). To use Colab, upload the final notebook and run its cells in order.

## File notes

Original assignments keep their submitted filenames, including course-code typos, duplicate extensions and two Arrival presentation versions. I organized them without changing their contents. The additional L09 reference notebook has no saved run outputs. See [inventory.csv](docs/inventory.csv) for original-file hashes.

The portfolio deck contains ten slides, following the main deliverable instruction. The suggested outline also mentions 3–5 slides. I chose the explicit ten-slide course summary.

No final custom-domain MP4 is included because secure domain verification remains pending. The demo script stays with the final-project documents. Physical mobile-device checks and a real learner study also remain future work.
