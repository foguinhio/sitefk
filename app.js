const SITE_CONTENT = window.SITE_CONTENT || {};

const getPurchaseUrl = () => SITE_CONTENT.book?.purchaseUrl || "";

function setPurchaseLinks() {
  const links = document.querySelectorAll("[data-purchase-link]");
  const purchaseUrl = getPurchaseUrl();

  links.forEach((link) => {
    const isEnabled = Boolean(purchaseUrl && purchaseUrl.trim());
    link.setAttribute("aria-disabled", isEnabled ? "false" : "true");
    link.href = isEnabled ? purchaseUrl : "#livro";
    link.title = isEnabled ? "Comprar o livro" : "Link de compra ainda não configurado";
    if (isEnabled) {
      link.removeAttribute("tabindex");
    } else {
      link.setAttribute("tabindex", "0");
    }
  });

  const hint = document.querySelector("[data-purchase-hint]");
  if (hint) {
    hint.textContent = purchaseUrl ? "Compra disponível em link configurado." : "Link de compra ainda não informado.";
  }
}

function setInstagramLinks() {
  const instagramUrl = SITE_CONTENT.author?.instagramUrl || "https://www.instagram.com/foguinhomariano/";
  document.querySelectorAll("[data-instagram-link]").forEach((link) => {
    link.href = instagramUrl;
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

function setYear() {
  const yearNode = document.querySelector("[data-year]");
  if (yearNode) yearNode.textContent = new Date().getFullYear();
}

function makeExpandable(container, visibleCount, id, buttonClass = "read-more-button") {
  if (!container || container.children.length <= visibleCount) return;

  const nodes = Array.from(container.children);
  const preview = document.createElement("div");
  preview.className = "expandable-preview";
  const details = document.createElement("div");
  details.className = "expandable-details";
  details.id = id;
  details.hidden = true;

  nodes.forEach((node, index) => {
    (index < visibleCount ? preview : details).append(node);
  });

  const button = document.createElement("button");
  button.className = buttonClass;
  button.type = "button";
  button.textContent = "Continuar a leitura ↓";
  button.setAttribute("aria-controls", id);
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    details.hidden = expanded;
    button.textContent = expanded ? "Continuar a leitura ↓" : "Recolher texto ↑";
  });

  container.append(preview, details, button);
}

function setBookContent() {
  const synopsis = SITE_CONTENT.book?.synopsis || [];
  const excerpt = SITE_CONTENT.book?.excerpt || "O primeiro trecho autoral será publicado aqui.";
  const title = SITE_CONTENT.book?.title || "TÍTULO DO LIVRO";

  const titleNode = document.querySelector("#book-title");
  if (titleNode) {
    titleNode.textContent = title.replace(/\s+/g, " ").trim() || "TÍTULO DO LIVRO";
  }

  const synopsisNode = document.querySelector(".book-copy__description");
  if (synopsisNode) {
    const paragraphs = Array.isArray(synopsis) ? synopsis : [synopsis];
    synopsisNode.replaceChildren();
    paragraphs.forEach((paragraph) => {
      const text = typeof paragraph === "string" ? paragraph : paragraph?.text;
      if (typeof text !== "string" || !text.trim()) return;

      const element = document.createElement(paragraph?.emphasis ? "strong" : "p");
      const bookTitle = title.trim();
      const titleIndex = text.toLocaleLowerCase("pt-BR").indexOf(bookTitle.toLocaleLowerCase("pt-BR"));

      if (titleIndex === -1) {
        element.textContent = text;
      } else {
        element.append(
          text.slice(0, titleIndex),
          Object.assign(document.createElement("em"), { textContent: text.slice(titleIndex, titleIndex + bookTitle.length) }),
          text.slice(titleIndex + bookTitle.length)
        );
      }
      synopsisNode.append(element);
    });
    makeExpandable(synopsisNode, 1, "sinopse-completa");
  }

  const excerptNode = document.querySelector(".book-excerpt p");
  if (excerptNode) excerptNode.textContent = excerpt;
}

function setupBiographyDisclosure() {
  makeExpandable(document.querySelector(".author-biography"), 2, "biografia-completa");
}

function addTextElement(parent, tagName, text, className) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function addMessage(log, text, kind) {
  const message = document.createElement("p");
  message.className = `chat-message chat-message--${kind}`;
  message.textContent = text;
  log.append(message);
  log.scrollTop = log.scrollHeight;
}

function appendComments(list, comments) {
  comments = comments.filter((comment) => comment && typeof comment === "object");
  list.replaceChildren();
  if (!comments.length) {
    addTextElement(list, "p", "Ainda não há comentários aprovados. Seja o primeiro a participar.", "conversation-empty");
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("li");
    addTextElement(item, "strong", typeof comment.name === "string" ? comment.name : "Leitor", "comment-author");
    addTextElement(item, "p", typeof comment.message === "string" ? comment.message : "", "comment-message");
    list.append(item);
  });
}

function getLocalComments(publicationId) {
  const stored = window.localStorage.getItem(`confissoes-comments:${publicationId}`);
  if (!stored) return [];

  const comments = JSON.parse(stored);
  if (!Array.isArray(comments)) throw new Error("Os comentários salvos neste navegador têm um formato inválido.");
  return comments.filter((comment) => comment && typeof comment === "object");
}

function createConversation(publication) {
  const section = document.createElement("section");
  section.className = "publication-conversation";
  section.setAttribute("aria-labelledby", `conversation-${publication.id}`);
  addTextElement(section, "h3", "Converse sobre este texto", "conversation-title").id = `conversation-${publication.id}`;

  const columns = document.createElement("div");
  columns.className = "conversation-columns";
  section.append(columns);

  const assistantPanel = document.createElement("div");
  assistantPanel.className = "conversation-panel";
  addTextElement(assistantPanel, "p", "CHAT SOBRE O TEXTO", "eyebrow");
  addTextElement(assistantPanel, "h4", "Pergunte ao texto.");
  const assistantUrl = SITE_CONTENT.integrations?.assistantApiUrl || "";
  const chatLog = document.createElement("div");
  chatLog.className = "chat-log";
  chatLog.setAttribute("role", "log");
  chatLog.setAttribute("aria-live", "polite");
  chatLog.setAttribute("aria-label", `Conversa sobre ${publication.title}`);
  addMessage(
    chatLog,
    assistantUrl
      ? `Pode perguntar sobre “${publication.title}”.`
      : "O assistente ainda não está conectado. A integração de IA será ativada após configurar um backend seguro.",
    "notice"
  );
  assistantPanel.append(chatLog);

  const chatForm = document.createElement("form");
  chatForm.className = "conversation-form";
  const chatInput = document.createElement("input");
  chatInput.type = "text";
  chatInput.name = "message";
  chatInput.placeholder = "Escreva sua pergunta";
  chatInput.setAttribute("aria-label", `Pergunta sobre ${publication.title}`);
  chatInput.maxLength = 1000;
  chatInput.required = true;
  chatInput.disabled = !assistantUrl;
  const chatSubmit = document.createElement("button");
  chatSubmit.className = "conversation-submit";
  chatSubmit.type = "submit";
  chatSubmit.textContent = "Enviar";
  chatSubmit.disabled = !assistantUrl;
  chatForm.append(chatInput, chatSubmit);
  assistantPanel.append(chatForm);
  addTextElement(assistantPanel, "p", assistantUrl ? "Respostas geradas pelo serviço de IA conectado." : "Integração pendente: configure integrations.assistantApiUrl em content.js.", "integration-note");
  columns.append(assistantPanel);

  const commentsPanel = document.createElement("div");
  commentsPanel.className = "conversation-panel";
  addTextElement(commentsPanel, "p", "CONVERSA ENTRE LEITORES", "eyebrow");
  addTextElement(commentsPanel, "h4", "Deixe seu comentário.");
  const commentsList = document.createElement("ul");
  commentsList.className = "comments-list";
  commentsList.setAttribute("aria-live", "polite");
  appendComments(commentsList, []);
  commentsPanel.append(commentsList);

  const commentsUrl = SITE_CONTENT.integrations?.commentsApiUrl || "";
  const commentForm = document.createElement("form");
  commentForm.className = "comment-form";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.name = "name";
  nameInput.placeholder = "Seu nome";
  nameInput.setAttribute("aria-label", "Seu nome");
  nameInput.maxLength = 80;
  nameInput.required = true;
  const commentInput = document.createElement("textarea");
  commentInput.name = "message";
  commentInput.placeholder = "Escreva um comentário";
  commentInput.setAttribute("aria-label", "Seu comentário");
  commentInput.maxLength = 2000;
  commentInput.rows = 3;
  commentInput.required = true;
  const commentSubmit = document.createElement("button");
  commentSubmit.className = "conversation-submit";
  commentSubmit.type = "submit";
  commentSubmit.textContent = commentsUrl ? "Enviar para moderação" : "Adicionar comentário";
  commentForm.append(nameInput, commentInput, commentSubmit);
  commentsPanel.append(commentForm);

  const commentStatus = addTextElement(
    commentsPanel,
    "p",
    "Comentários enviados ficam sujeitos à moderação.",
    "integration-note"
  );
  if (!commentsUrl) {
    commentStatus.textContent = "Comentários ficam salvos somente neste navegador. Para compartilhar entre leitores, é preciso conectar um serviço de comentários.";
  }
  commentStatus.setAttribute("role", "status");
  commentStatus.setAttribute("aria-live", "polite");
  columns.append(commentsPanel);

  if (assistantUrl) {
    const chatHistory = [];
    chatForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;
      addMessage(chatLog, message, "user");
      chatHistory.push({ role: "user", content: message });
      chatInput.value = "";
      chatInput.disabled = true;
      chatSubmit.disabled = true;
      try {
        const response = await fetch(`${assistantUrl.replace(/\/$/, "")}/publications/${encodeURIComponent(publication.id)}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history: chatHistory.slice(-10),
            publication: {
              id: publication.id,
              title: publication.title,
              body: Array.isArray(publication.body)
                ? publication.body.map((block) => typeof block === "string" ? block : block.text || "").join("\n\n")
                : publication.body || ""
            }
          })
        });
        if (!response.ok) throw new Error(`Chat API respondeu ${response.status}.`);
        const result = await response.json();
        if (typeof result.reply !== "string" || !result.reply.trim()) throw new Error("A resposta da API não contém o campo reply.");
        chatHistory.push({ role: "assistant", content: result.reply });
        addMessage(chatLog, result.reply, "assistant");
      } catch (error) {
        addMessage(chatLog, "Não foi possível obter uma resposta agora. Tente novamente.", "notice");
        console.error("Falha ao consultar o assistente da publicação.", error);
      } finally {
        chatInput.disabled = false;
        chatSubmit.disabled = false;
        chatInput.focus();
      }
    });
  }

  if (commentsUrl) {
    fetch(`${commentsUrl.replace(/\/$/, "")}/publications/${encodeURIComponent(publication.id)}/comments`)
      .then((response) => {
        if (!response.ok) throw new Error(`Comments API respondeu ${response.status}.`);
        return response.json();
      })
      .then((result) => {
        if (!Array.isArray(result.comments)) throw new Error("A resposta da API não contém uma lista comments.");
        appendComments(commentsList, result.comments);
      })
      .catch((error) => {
        commentStatus.textContent = "Não foi possível carregar os comentários. Tente novamente mais tarde.";
        console.error("Falha ao carregar comentários da publicação.", error);
      });

    commentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(commentForm);
      const submitButton = commentForm.querySelector("button");
      submitButton.disabled = true;
      try {
        const response = await fetch(`${commentsUrl.replace(/\/$/, "")}/publications/${encodeURIComponent(publication.id)}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: String(formData.get("name") || "").trim(),
            message: String(formData.get("message") || "").trim()
          })
        });
        if (!response.ok) throw new Error(`Comments API respondeu ${response.status}.`);
        commentForm.reset();
        commentStatus.textContent = "Comentário enviado para moderação.";
      } catch (error) {
        commentStatus.textContent = "Não foi possível enviar seu comentário. Tente novamente.";
        console.error("Falha ao enviar comentário da publicação.", error);
      } finally {
        submitButton.disabled = false;
      }
    });
  } else {
    try {
      appendComments(commentsList, getLocalComments(publication.id));
    } catch (error) {
      commentStatus.textContent = "Não foi possível carregar os comentários salvos neste navegador.";
      console.error("Falha ao ler comentários locais.", error);
    }

    commentForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      const message = commentInput.value.trim();
      if (!name || !message) return;

      const submitButton = commentForm.querySelector("button");
      submitButton.disabled = true;
      try {
        const comments = [
          ...getLocalComments(publication.id),
          { name, message, date: new Date().toISOString() }
        ].slice(-100);
        window.localStorage.setItem(`confissoes-comments:${publication.id}`, JSON.stringify(comments));
        appendComments(commentsList, comments);
        commentForm.reset();
        commentStatus.textContent = "Comentário salvo neste navegador.";
      } catch (error) {
        commentStatus.textContent = "Não foi possível salvar o comentário neste navegador.";
        console.error("Falha ao salvar comentário local.", error);
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  return section;
}

function renderTexts() {
  const root = document.querySelector("[data-texts]");
  if (!root) return;

  const texts = Array.isArray(SITE_CONTENT.texts)
    ? SITE_CONTENT.texts.filter((publication) => publication && typeof publication.id === "string" && publication.id && typeof publication.title === "string" && publication.title)
    : [];
  if (!texts.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    addTextElement(empty, "span", "01 / ∅", "empty-state__index");
    addTextElement(empty, "span", "✳", "empty-state__symbol").setAttribute("aria-hidden", "true");
    const copy = document.createElement("div");
    addTextElement(copy, "p", "PÁGINA EM ABERTO", "eyebrow");
    const title = document.createElement("h3");
    title.append("O primeiro texto", document.createElement("br"), "vem a seguir.");
    empty.append(copy);
    copy.append(title);
    addTextElement(copy, "p", "Os textos originais serão publicados aqui. Nenhum texto de demonstração foi atribuído ao autor.");
    const link = document.createElement("a");
    link.className = "text-link";
    link.href = "#instagram";
    link.append("Acompanhe as novidades ", Object.assign(document.createElement("span"), { textContent: "↗", ariaHidden: "true" }));
    empty.append(link);
    root.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  texts.forEach((publication) => {
    const article = document.createElement("article");
    article.className = publication.featured ? "publication-card publication-card--featured" : "publication-card";
    article.id = `texto-${publication.id}`;
    const blocks = Array.isArray(publication.body)
      ? publication.body
      : (typeof publication.body === "string" ? publication.body : "").split(/\n{2,}/).filter(Boolean);
    const firstParagraphIndex = blocks.findIndex((block) => {
      const type = typeof block === "string" ? "paragraph" : block.type || "paragraph";
      const text = typeof block === "string" ? block : block.text;
      return type === "paragraph" && typeof text === "string" && text.trim();
    });
    const lead = publication.lead || (firstParagraphIndex >= 0
      ? typeof blocks[firstParagraphIndex] === "string"
        ? blocks[firstParagraphIndex]
        : blocks[firstParagraphIndex].text
      : "");
    const header = document.createElement("header");
    header.className = "publication-header";
    if (publication.image) {
      const image = document.createElement("img");
      image.className = "publication-header__image";
      image.src = publication.image;
      image.alt = publication.imageAlt || "";
      image.width = 105;
      image.height = 188;
      image.loading = "lazy";
      image.decoding = "async";
      header.append(image);
    }
    const heading = document.createElement("div");
    heading.className = "publication-header__content";
    addTextElement(heading, "p", publication.category || "TEXTO ORIGINAL", "eyebrow");
    addTextElement(heading, "h3", publication.title);
    if (publication.date) addTextElement(heading, "p", publication.date, "publication-date");
    header.append(heading);
    article.append(header);
    if (lead) addTextElement(article, "p", lead, "publication-lead");

    const body = document.createElement("div");
    body.className = "publication-body";
    blocks.forEach((block, index) => {
      if (!publication.lead && index === firstParagraphIndex) return;
      const type = typeof block === "string" ? "paragraph" : block.type || "paragraph";
      const text = typeof block === "string" ? block : block.text;
      if (typeof text !== "string" || !text.trim()) return;

      if (type === "heading") {
        addTextElement(body, "h4", text, "publication-body__heading");
      } else if (type === "reflection") {
        addTextElement(body, "blockquote", text, "publication-reflection");
      } else if (type === "instagram") {
        const link = document.createElement("a");
        link.className = "publication-instagram-link";
        link.href = block.url || SITE_CONTENT.author?.instagramUrl || "https://www.instagram.com/foguinhomariano/";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = text;
        body.append(link);
      } else {
        addTextElement(body, "p", text);
      }
    });
    const continueButton = document.createElement("button");
    continueButton.className = "publication-continue";
    continueButton.type = "button";
    continueButton.setAttribute("aria-expanded", "false");
    continueButton.textContent = "Continuar a leitura ↓";

    const details = document.createElement("div");
    details.className = "publication-details";
    details.hidden = true;
    const readingLayout = document.createElement("div");
    readingLayout.className = "publication-reading-layout";
    const readingImage = header.querySelector(".publication-header__image")?.cloneNode();
    if (readingImage) {
      readingImage.className = "publication-reading-image";
      readingImage.alt = "";
      readingImage.setAttribute("aria-hidden", "true");
      readingImage.loading = "lazy";
      readingLayout.append(readingImage);
    }
    readingLayout.append(body);
    details.append(readingLayout, createConversation(publication));
    continueButton.setAttribute("aria-controls", `leitura-${publication.id}`);
    details.id = `leitura-${publication.id}`;
    continueButton.addEventListener("click", () => {
      const expanded = continueButton.getAttribute("aria-expanded") === "true";
      continueButton.setAttribute("aria-expanded", String(!expanded));
      details.hidden = expanded;
      article.classList.toggle("publication-card--reading", !expanded);
      continueButton.textContent = expanded ? "Continuar a leitura ↓" : "Recolher reflexão ↑";
    });
    article.append(continueButton, details);
    fragment.append(article);
  });
  root.replaceChildren(fragment);
}

function renderQuotes() {
  const root = document.querySelector("[data-quotes]");
  if (!root) return;

  const quotes = Array.isArray(SITE_CONTENT.quotes)
    ? SITE_CONTENT.quotes.filter((quote) => quote && typeof quote.text === "string" && quote.text)
    : [];
  if (quotes.length === 0) {
    root.innerHTML = `
      <div class="quote-empty">
        <span class="quote-empty__mark" aria-hidden="true">“</span>
        <p>As citações autorais serão reunidas aqui. Os controles de copiar e compartilhar aparecem junto de cada frase publicada.</p>
        <span class="eyebrow">ESPAÇO RESERVADO PARA A VOZ DO AUTOR</span>
      </div>
    `;
    return;
  }

  let activeQuote = 0;
  const card = document.createElement("article");
  card.className = "quote-card";
  card.setAttribute("aria-live", "polite");

  const quoteText = addTextElement(card, "p", "", "quote-card__text");
  const meta = document.createElement("div");
  meta.className = "quote-card__meta";
  const source = addTextElement(meta, "span", "");
  card.append(meta);
  const actions = document.createElement("div");
  actions.className = "quote-card__actions";
  [["Copiar", "data-copy-quote"], ["Compartilhar", "data-share-quote"]].forEach(([label, attribute]) => {
    const button = document.createElement("button");
    button.className = "quote-card__button";
    button.type = "button";
    button.textContent = label;
    button.setAttribute(attribute, "");
    actions.append(button);
  });
  card.append(actions);
  const controls = document.createElement("div");
  controls.className = "quote-carousel__controls";
  controls.hidden = quotes.length < 2;
  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.setAttribute("aria-label", "Ver frase anterior");
  previousButton.textContent = "←";
  const count = addTextElement(controls, "span", "", "quote-carousel__count");
  count.setAttribute("aria-live", "polite");
  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.setAttribute("aria-label", "Ver próxima frase");
  nextButton.textContent = "→";
  controls.prepend(previousButton);
  controls.append(nextButton);
  card.append(controls);

  const renderActiveQuote = () => {
    const quote = quotes[activeQuote];
    card.setAttribute("aria-label", `Frase ${activeQuote + 1} de ${quotes.length}`);
    quoteText.textContent = `“${quote.text}”`;
    source.textContent = quote.source || "";
    source.hidden = !quote.source;
    card.querySelector("[data-copy-quote]").setAttribute("data-copy-quote", quote.text);
    card.querySelector("[data-share-quote]").setAttribute("data-share-quote", quote.text);
    count.textContent = `${activeQuote + 1} / ${quotes.length}`;
  };

  const moveQuote = (direction) => {
    activeQuote = (activeQuote + direction + quotes.length) % quotes.length;
    renderActiveQuote();
  };

  previousButton.addEventListener("click", () => moveQuote(-1));
  nextButton.addEventListener("click", () => moveQuote(1));
  root.replaceChildren(card);
  renderActiveQuote();

  root.querySelectorAll("[data-copy-quote]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy-quote") || "";
      const status = document.querySelector("[data-quote-status]");
      try {
        await navigator.clipboard.writeText(value);
        if (status) status.textContent = "Citação copiada para a área de transferência.";
      } catch (error) {
        if (status) status.textContent = "Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.";
      }
    });
  });

  root.querySelectorAll("[data-share-quote]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-share-quote") || "";
      const status = document.querySelector("[data-quote-status]");
      const shareText = `${value} — ${SITE_CONTENT.author?.name || "Foguinho Mariano"}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Confissões do Foguinho",
            text: shareText,
            url: window.location.href
          });
          if (status) status.textContent = "Citação compartilhada.";
          return;
        } catch (error) {
          if (status) status.textContent = "Compartilhamento cancelado.";
          return;
        }
      }

      try {
        await navigator.clipboard.writeText(shareText);
        if (status) status.textContent = "Mensagem pronta para compartilhar.";
      } catch (error) {
        if (status) status.textContent = "Compartilhamento não disponível no navegador atual.";
      }
    });
  });
}

function initNavigation() {
  const dialog = document.querySelector(".mobile-menu");
  const toggle = document.querySelector(".menu-toggle");
  const close = document.querySelector(".menu-close");

  if (!dialog || !toggle) return;

  const lockBody = (shouldLock) => {
    document.body.classList.toggle("menu-open", shouldLock);
  };

  const openMenu = () => {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
    toggle.setAttribute("aria-expanded", "true");
    lockBody(true);
  };

  const closeMenu = () => {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    }
    dialog.removeAttribute("open");
    toggle.setAttribute("aria-expanded", "false");
    lockBody(false);
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (close) close.addEventListener("click", closeMenu);

  dialog.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.open) {
      closeMenu();
    }
  });
}

function init() {
  setPurchaseLinks();
  setInstagramLinks();
  setYear();
  setBookContent();
  setupBiographyDisclosure();
  renderTexts();
  renderQuotes();
  initNavigation();
}

document.addEventListener("DOMContentLoaded", init);
