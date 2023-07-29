import Markdown from "markdown-it";
import highlight from "highlight.js";

const mdOptions: Markdown.Options = {
  linkify: true,
  typographer: true,
  breaks: true,
  langPrefix: "language-",
  // 代码高亮
  highlight(str, lang) {
    console.log('thisssssssssssss: ', this);
    console.log('mdmdmdmdmd:', md, md===this);
    
    
    if (lang && highlight.getLanguage(lang)) {
      console.log('highlight: ', str,'-----',lang);
      try {
        return (
          '<pre class="hljs"><code>' +
          highlight.highlight(lang, str, true).value +
          "</code></pre>"
        );
      } catch (__) {}
    }
    console.log('no lang!!!!', str);
    // return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    // even though not 'lang', we should return the default highlight code, escapeHtml函数对html进行转义
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`; // testing
    // return ''
    },
};

export const md = new Markdown(mdOptions);
