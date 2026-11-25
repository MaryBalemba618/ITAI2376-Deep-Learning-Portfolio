# My portfolio presentation notes

Mary Balemba
ITAI2376

## Slide 1

This portfolio brings together the work I submitted during ITAI2376. I started with framework comparisons and neural network explanations, worked through a diffusion notebook, and developed LearnPath for my final project. Each module includes the original file and a reflection. My public repository is https://github.com/MaryBalemba618/ITAI2376-Deep-Learning-Portfolio. Source: Mary Balemba’s submitted coursework and saved notebook outputs.

## Slide 2

My folders follow the topics in the supplied work. The numbers are portfolio organization, rather than official Canvas module numbers. The README links to original submissions, results and setup instructions. I preserved both Arrival presentation versions and the submitted filenames. The earlier L09 notebook stays separate from the executed midterm. Source: Mary Balemba’s submitted coursework and saved notebook outputs.

## Slide 3

In A02b, I compared the frameworks by ease of use, training style and deployment support. I did not establish that either framework is always faster. A fair performance comparison would hold the task, hardware and model configuration constant. The submitted article describes a handwritten-digit demonstration, but the supplied portfolio files do not include measured framework benchmark outputs. Sources: A02b_Loneteam_MaryBalemba_ITA2376.docx; TensorFlow quickstart https://www.tensorflow.org/tutorials/quickstart/beginner; PyTorch quickstart https://docs.pytorch.org/tutorials/beginner/basics/quickstart_tutorial.html.

## Slide 4

My CNN Cheetah was a classroom explanation and proposed recognition activity. I described an animal classifier but did not train one. The example helped me connect image input, filters, feature maps and predictions. I would keep duplicate or related photos out of different data splits and inspect mistakes before trusting high output scores. The cheetah analogy does not establish that CNNs always run faster. Source: A03_ LoneTeam_MaryBalemba_ITAI2376.docx. Technical reference cited in that assignment: https://www.tensorflow.org/tutorials/images/cnn.

## Slide 5

In A04, I explained gradient descent for an 11-year-old. A very small learning rate can take many updates, while a large one can overshoot or destabilize training. Real neural networks adjust many parameters, so the mountain is an analogy rather than a literal map of a training run. This communication lesson influenced LearnPath’s short explanations. Sources: A04_Lonegroup_MaryBalemba_ITAI2376.pptx; Grant Sanderson (3Blue1Brown), 2017, Gradient descent, how neural networks learn, https://www.3blue1brown.com/lessons/gradient-descent/ and https://www.youtube.com/watch?v=IHZwWFHWa-w. No video footage is reproduced.

## Slide 6

The chart uses the 30 epoch values saved in cell 12 of MD_Notebook_Mary_Balemba_ITAI.ipynb.ipynb. I did not retrain the model while preparing the portfolio. Epoch 30 training MSE is 0.0713 and validation MSE is 0.0725. The lowest logged validation MSE is 0.0709 at epoch 25. Cell 14 loads the best checkpoint before generation. Cell 19 reports mean CLIP cosine similarity 0.284233421087265 over five samples. These scores do not establish real-world image quality or downstream accuracy. The saved run includes DataLoader worker cleanup warnings and still reaches epoch 30. Dataset: Fashion-MNIST, https://github.com/zalandoresearch/fashion-mnist. Background: Ho, Jain and Abbeel (2020), https://arxiv.org/abs/2006.11239.

## Slide 7

These are the actual PNG outputs embedded in my submitted notebook. The upper image shows generated clothing samples from cell 14. The lower image shows reverse-diffusion snapshots from cell 16. I used a class-conditioned U-Net and inspected the images instead of relying only on the noise loss. I have not claimed a particular denoising step as the first recognizable sandal because the written report leaves that observation unfinished. The output images are preserved rather than recreated. Fashion-MNIST dataset: Xiao, Rasul and Vollgraf, https://github.com/zalandoresearch/fashion-mnist. Dataset notice: Copyright 2017 Zalando SE, MIT. Full notice appears in the repository references/FASHION_MNIST_LICENSE.txt. Notebook starting example: reconstructed supplied classroom text, as disclosed in the notebook.

## Slide 8

My A05 report connects Arrival with ambiguity, grounding and low-resource language analysis. The film provides an analogy, rather than evidence that its characters used a particular NLP architecture. The Bender and Koller paper helped me distinguish language form from meaning. I also proposed keeping source context and competing interpretations for review. Sources: A05_TeamName_MaryBalemba_ITAI2376_Report(1).docx and the two supplied A05 slide versions; Villeneuve (2016), Arrival, https://www.paramountpictures.com/movies/arrival; Bender and Koller (2020), https://aclanthology.org/2020.acl-main.463/. No film stills, footage or screenplay passages are reproduced.

## Slide 9

LearnPath is my Option 4 Interactive Learning Companion. Google Colab provides the classroom version. The browser version uses curated lessons, a restricted expression checker and local progress storage. A contextual bandit selects explanation styles, while a separate practice estimate adjusts difficulty. The screenshot shows the actual published hosting site, not a verified custom-domain session. The provider reports active routing, while overall domain and HTTPS validation remain pending on November 25, 2026. Python checks passed 37 tests and 240 generated cases. Browser checks passed 16 tests including 300 generated cases. Policy comparison results use synthetic probabilities and do not establish human learning gains. No final custom-domain MP4 or physical-device study is claimed. Source: modules/06-learnpath-final/source/evidence; exact published screenshot URL: https://learnpath-python-practice.manics28b.chatgpt.site/#practice.

## Slide 10

My strongest improvement was learning to connect an explanation with evidence. Framework comparisons helped me choose tools. The CNN and gradient descent activities helped me communicate concepts. The diffusion notebook helped me inspect actual results, and Arrival reminded me to question uncertain meaning. LearnPath gave me a place to apply these lessons. Before presenting it as an investment opportunity, I need reviewed content, user feedback and stronger evaluation. The primary resources, video link and media credits are listed in references/README.md. My public repository is https://github.com/MaryBalemba618/ITAI2376-Deep-Learning-Portfolio. Source: reflections/learning-journey.md and submitted coursework.
