---
title: "Building Your Portfolio Site with Hugo and GitHub"
date: 2023-11-21
draft: false
github_link: "https://github.com/0aaryan/0aaryan.github.io"
author: "Aryan Arora"
tags:
  - Software Development
  - Hugo
  - GitHub Pages
  - CI/CD
  - GitHub Actions
  - How to Think Like a Computer Science Student
image: /images/blog-images/1/1.png
description: "Learn how to build a stunning portfolio site using Hugo, connect it with GitHub, and automate updates with GitHub Actions."
toc: true
---

## Introduction

Welcome to the first part of our "How to Think Like a Computer Science Student" series! Today, we'll learn how to create a professional portfolio site using Hugo, a powerful static site generator, and automating the deployment process with GitHub Actions.

### Why Hugo?
![Hugo Logo](/images/blog-images/1/hugo_logo.png)

Meet Hugo, a fast and flexible static site generator written in Go. Its simplicity and flexibility make it an excellent choice for building a lightweight and highly customizable portfolio site.

### Step 1: Choosing a Theme
<!-- ![[hugo_themes.png]] -->
![Hugo Themes](/images/blog-images/1/hugo_themes.png)

Let's kick things off by selecting the perfect theme for our portfolio. We'll use the [Hugo Profile Theme](https://github.com/gurusabarish/hugo-profile) by Gurusabarish. Why start from scratch when you can leverage open-source templates?

**Action:** Clone or download the theme from the [GitHub repository](https://github.com/gurusabarish/hugo-profile.git).

```bash
git clone https://github.com/gurusabarish/hugo-profile.git themes/hugo-profile
```

### Step 2: Setting Up Your Site

Now, let's set up your site and run it locally. Follow these detailed steps:

#### 2.1 Create a Project Folder

Open your terminal and create a dedicated folder for your portfolio site:

```bash
mkdir portfolio-site
cd portfolio-site
```

#### 2.2 Clone the Theme

Clone the Hugo Profile Theme into the `themes` directory within your project:

```bash
git clone https://github.com/gurusabarish/hugo-profile.git themes/hugo-profile
```

#### 2.3 Copy ExampleSite Content

Navigate into the theme's `exampleSite` directory and copy its content to your project's root:

```bash
cp -r themes/hugo-profile/exampleSite/* .
```

#### 2.4 Run Hugo Server Locally

Now, run the Hugo server to view your site locally and see real-time changes:

```bash
hugo server -D
```

Visit `http://localhost:1313/` in your browser to preview your site.

#### 2.5 Make Adjustments

Explore the `config.toml` file in your project's root to customize settings like your name, bio, and social media links. Modify content in the `content/` directory to personalize your portfolio.

### Step 3: Creating a GitHub Repository
<!-- ![[github_logo.png]] -->
![GitHub Logo](/images/blog-images/1/github_logo.png)

Before deploying, let's create a GitHub repository for your project. Go to [GitHub](https://github.com/) and click the "New" button. Fill in the repository name and add a brief description.

### Step 4: Pushing Code to GitHub

After creating the repository, push your local code to GitHub:

```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### Step 5: GitHub Actions for Continuous Integration
<!-- ![[github_actions_logo.png]] -->
![GitHub Actions Logo](/images/blog-images/1/github_actions_logo.png)

In this step, we'll set up GitHub Actions to automatically build and deploy your Hugo site whenever you push changes to the main branch.

#### 5.1 Create GitHub Actions Folder

1. Open your terminal.

2. Navigate to your project's root directory:

    ```bash
    cd /path/to/your/project
    ```

3. Create a folder named `.github/workflows` if it doesn't exist:

    ```bash
    mkdir -p .github/workflows
    ```

#### 5.2 Create GitHub Actions File

4. Change into the new directory:

    ```bash
    cd .github/workflows
    ```

5. Create a new file named `hugo.yaml`. You can do this manually or use your code editor.

6. Copy and paste the following code into `hugo.yaml`:

    ```yaml
    name: Deploy Hugo site to Pages

    on:
      push:
        branches:
          - main
      workflow_dispatch:

    permissions:
      contents: read
      pages: write
      id-token: write

    concurrency:
      group: "pages"
      cancel-in-progress: false

    defaults:
      run:
        shell: bash

    jobs:
      build:
        runs-on: ubuntu-latest
        env:
          HUGO_VERSION: 0.118.2
        steps:
          - name: Install Hugo CLI
            run: |
              wget -O ${{ runner.temp }}/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
              && sudo dpkg -i ${{ runner.temp }}/hugo.deb          
          - name: Checkout
            uses: actions/checkout@v3
            with:
              submodules: recursive
              fetch-depth: 0
          - name: Setup Pages
            id: pages
            uses: actions/configure-pages@v3
          - name: Build with Hugo
            env:
              HUGO_ENVIRONMENT: production
              HUGO_ENV: production
            run: |
              hugo \
                --gc \
                --minify \
                --baseURL "${{ steps.pages.outputs.base_url }}/"          
          - name: Upload artifact
            uses: actions/upload-pages-artifact@v1
            with:
              path: ./public

      deploy:
        environment:
          name: github-pages
          url: ${{ steps.deployment.outputs.page_url }}
        runs-on: ubuntu-latest
        needs: build
        steps:
          - name: Deploy to GitHub Pages
            id: deployment
            uses: actions/deploy-pages@v2
    ```

#### 5.3 Save and Commit

7. Save the `hugo.yaml` file.

8. Commit and push the changes to your GitHub repository:

    ```bash
    git add .github/workflows/hugo.yaml
    git commit -m "Add GitHub Actions workflow for Hugo"
    git push origin main
    ```

This workflow file automates the process of building and deploying your Hugo site whenever changes are pushed to the main branch. It installs Hugo, builds the site, and deploys it to GitHub Pages.

### What's Coming Next?

In the upcoming blog, we'll explore how to automatically update your projects on the portfolio, obtain a free domain

 using the GitHub Student Developer Pack, and secure your site with an SSL certificate. Stay tuned for an exciting continuation of our journey into creating a stellar portfolio site! 🚀