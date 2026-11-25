# Results from my saved notebook

These results come from outputs already saved in my submitted notebook. Portfolio preparation did not retrain the model.

- Runtime output: CUDA.
- Data split: 48,000 training and 12,000 validation examples from the training dataset.
- Epochs: 30. Batch size: 64. Learning rate: 0.001. Diffusion steps: 300.
- Epoch 1: training noise MSE 0.1153, validation noise MSE 0.0963.
- Epoch 30: training noise MSE 0.0713, validation noise MSE 0.0725.
- Lowest logged validation noise MSE: 0.0709 at epoch 25. The generation cell loads the best validation checkpoint.
- Mean CLIP cosine similarity over five generated samples: 0.284233. This is a similarity score, rather than a classification accuracy or a percentage.

The saved notebook includes DataLoader worker shutdown warnings. The epoch log still reaches 30/30. For a fresh run with those warnings, try num_workers=0 in the two DataLoader definitions and rerun from the imports.

The written midterm report leaves two observations unfinished. I preserved the submitted file as received and used complete notebook outputs for this portfolio summary. I still need broader sample checks and a separate test evaluation before making stronger claims about image quality.
