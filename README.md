# Confissões do Foguinho

Site estático em HTML, CSS e JavaScript, publicado pelo GitHub Pages.

## Visualizar o site

Abra `index.html` no navegador. Para testar como um site local, abra a pasta no VS Code e use uma extensão de servidor estático, como Live Server.

## Atualizar o conteúdo

Edite `content.js`:

- `book.purchaseUrl`: endereço de compra do livro. Enquanto estiver vazio, os botões de compra permanecem desativados.
- `author`: nome e endereço do Instagram.
- `texts`: reflexões e publicações.
- `quotes`: citações exibidas no carrossel.

As imagens usadas pelo site ficam em `assets/`.

## Publicar no GitHub Pages

No repositório, abra **Settings → Pages**, escolha **Deploy from a branch**, selecione a branch `main` e a pasta `/(root)`. O GitHub publicará o `index.html` e os demais arquivos estáticos.

O endereço esperado para este repositório é <https://foguinhio.github.io/sitefk/>.

## Comentários e chatbot

Sem um serviço de backend configurado, os comentários ficam salvos apenas no navegador de cada visitante e o chatbot permanece desativado. Não coloque chaves de API no JavaScript público do site.
