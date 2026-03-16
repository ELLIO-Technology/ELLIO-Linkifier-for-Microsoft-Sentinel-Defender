"use strict";

const URL_PATTERN = /https:\/\/platform\.ellio\.tech\/dashboard\/[^\s<>"'`,;)}\]]+/g;

function linkifyTextNode(node) {
  const text = node.nodeValue;
  if (!URL_PATTERN.test(text)) return;

  URL_PATTERN.lastIndex = 0;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match;

  while ((match = URL_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const link = document.createElement("a");
    link.href = match[0];
    link.textContent = match[0];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    fragment.appendChild(link);

    lastIndex = URL_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  node.parentNode.replaceChild(fragment, node);
}

function walk(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentNode;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "A" || tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA" || tag === "INPUT") {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.nodeValue && URL_PATTERN.test(node.nodeValue)) {
        URL_PATTERN.lastIndex = 0;
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(linkifyTextNode);
}

walk(document.body);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentNode;
        if (parent && parent.tagName !== "A" && parent.tagName !== "SCRIPT" && parent.tagName !== "STYLE") {
          if (node.nodeValue && URL_PATTERN.test(node.nodeValue)) {
            URL_PATTERN.lastIndex = 0;
            linkifyTextNode(node);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        walk(node);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
