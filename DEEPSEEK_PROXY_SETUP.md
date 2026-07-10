# DeepSeek proxy setup

The portfolio is hosted on GitHub Pages, so it cannot keep a DeepSeek API key secret by itself. Use the serverless proxy in `api/deepseek-chat.js` and store the key as a backend environment variable.

## Vercel deployment

1. Import this repository into Vercel.
2. Add these environment variables in Vercel Project Settings:
   - `DEEPSEEK_API_KEY`: your DeepSeek API key
   - `ALLOWED_ORIGIN`: `https://1635338825-prog.github.io`
   - `DEEPSEEK_MODEL`: `deepseek-chat`
   - `DEEPSEEK_BASE_URL`: `https://api.deepseek.com/v1`
3. Deploy the project.
4. Copy the production function URL, for example:
   `https://your-project.vercel.app/api/deepseek-chat`
5. Put that URL into `DEFAULT_ASSISTANT_CONFIG.proxyUrl` in `index.html`, then commit and push.

After that, visitors on the GitHub Pages portfolio will call the proxy, and the proxy will call DeepSeek with the server-side key.
