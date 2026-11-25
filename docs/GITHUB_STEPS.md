# GitHub and submission steps

My public repository: https://github.com/MaryBalemba618/ITAI2376-Deep-Learning-Portfolio

The repository has already been created. The creation instructions below document the setup and can be used for a future course repository.

## Create the public repository

1. Sign in to your GitHub account at https://github.com.
2. Select the plus menu, then New repository.
3. Enter `ITAI2376-Deep-Learning-Portfolio` as the repository name.
4. Add this description: `My ITAI2376 learning journey, class assignments, diffusion midterm and LearnPath final project.`
5. Choose Public so the professor can open the link.
6. Leave the README, .gitignore and license initialization options empty because this package already contains its own files.
7. Select Create repository.

## Upload the prepared folders

1. Extract the portfolio ZIP on your computer.
2. Open the extracted repository folder. Upload its contents, rather than the ZIP itself.
3. On the new repository page, select uploading an existing file. On an existing repository, choose Add file, then Upload files.
4. Drag in the folders and root files. Keep `modules`, `references`, `assets`, `reflections`, `docs` and `presentation` at the repository root.
5. Use this commit message: `Add my ITAI2376 course portfolio`.
6. Commit to the main branch. For many files, upload one module folder per commit or use the CLI method below.
7. Open the README and check each module link.

## GitHub CLI alternative

Install Git and GitHub CLI from their official sources first. Open a terminal inside the extracted repository folder, then run:

```bash
gh auth login
git init -b main
git add .
git commit -m "Add my ITAI2376 course portfolio"
gh repo create ITAI2376-Deep-Learning-Portfolio --public --source=. --remote=origin --push
gh repo view --web
```

If Git asks for your identity before committing, set your GitHub display name and the verified or private noreply email shown in your own GitHub email settings. Never put your password or a token in the repository.

## Add the real link to the presentation

After GitHub creates the repository, copy its URL from the repository page. Put that exact URL on slides 1 and 10. The portfolio now uses the real repository link. For future updates, export the ten slides as `Pf_MaryBalemba_ITAI2376.pdf`, and save the editable PowerPoint as `Pf_MaryBalemba_ITAI2376.pptx`. Upload both to `presentation/`.

In PowerPoint, choose File, then Export or Save As, then PDF. Export all ten slides. Open the PDF and check that the repository and resource links work. The saved online presentation can also export to PowerPoint through its download menu.

## Submit

Submit `Pf_MaryBalemba_ITAI2376.pdf` and paste the actual GitHub repository URL into the submission box. A suitable message is:

`This is my ITAI2376 portfolio. I included my class assignments, diffusion midterm and LearnPath final project. My presentation explains what I learned and links to the organized repository.`

Confirm the current due date in Canvas. If submitting a public repository, open the link in a signed-out browser to check instructor access. Use the actual repository URL shown above.
