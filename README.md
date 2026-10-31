<div align="center">

<img src="docs/images/icone.png" width="96" alt="Ícone do Source View Pro">

# Source View Pro

**O `view-source:` do Google Chrome com cara de Visual Studio Code.**

Destaque de sintaxe para HTML, CSS e JavaScript · Temas claro e escuro · Fonte Source Code Pro

![Manifest V3](https://img.shields.io/badge/Manifest-V3-1e1e1e?style=flat-square&logo=googlechrome&logoColor=white)
![Versão](https://img.shields.io/badge/vers%C3%A3o-1.0.0-0e639c?style=flat-square)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-569cd6?style=flat-square)
![Sem dependências](https://img.shields.io/badge/depend%C3%AAncias-zero-6a9955?style=flat-square)

</div>

---

## Sobre

O visualizador de código-fonte nativo do Chrome mostra o HTML com poucas cores, fonte pequena e nenhuma opção de tema. O **Source View Pro** substitui essa tela por um visualizador inspirado no editor Visual Studio Code: cores fiéis aos temas **Dark+** e **Light+**, fonte **Source Code Pro**, números de linha clicáveis e links navegáveis.

Basta usar o Chrome como sempre — `Ctrl+U` ou `view-source:` na barra de endereço — e o código já abre formatado.

## Capturas de tela

### Tema escuro (Dark+)
![Tema escuro](docs/images/tema-escuro.png)

### Tema claro (Light+)
![Tema claro](docs/images/tema-claro.png)

### Linha destacada e fonte ampliada
![Linha destacada](docs/images/linha-destacada.png)

## Recursos

- **Destaque de sintaxe completo**: tags, atributos, valores, comentários, entidades e `DOCTYPE`; o CSS dentro de `<style>` e o JavaScript dentro de `<script>` também recebem cores próprias.
- **Temas Escuro, Claro e Auto**: o modo Auto acompanha o tema do sistema operacional.
- **Fonte Source Code Pro embutida**: funciona offline, sem carregar nada de servidores externos.
- **Interceptação automática do `view-source:`**: pode ser ligada ou desligada pela própria barra do visualizador.
- **Números de linha clicáveis**: destacam a linha e geram um link direto (`#L42`).
- **Links navegáveis**: valores de `href` e `src` abrem o código daquele arquivo (CSS, JS, outra página).
- **Detecção de linguagem**: arquivos `.css`, `.js` e `.json` abertos diretamente também são coloridos.
- **Controles práticos**: tamanho da fonte, quebra de linha, copiar todo o código e abrir a página original.
- **Preferências sincronizadas** com a sua conta do Chrome.
- **Leve e sem dependências**: tokenizador próprio, escrito em JavaScript puro.

## Instalação

> A extensão ainda não está publicada na Chrome Web Store. A instalação é feita em modo desenvolvedor, o que leva menos de um minuto.

1. Baixe o projeto: clique em **Code → Download ZIP** nesta página (ou use `git clone`) e descompacte numa pasta fixa.

   ```bash
   git clone https://github.com/SEU-USUARIO/source-view-pro.git
   ```

   > Não mova nem apague essa pasta depois: o Chrome carrega a extensão diretamente dela.

2. Abra `chrome://extensions` na barra de endereço.
3. Ative o **Modo do desenvolvedor** (chave no canto superior direito).
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto (a que contém o `manifest.json`).
5. *(Opcional)* Fixe a extensão na barra pelo ícone de quebra-cabeça 🧩.
6. *(Opcional)* Para ver arquivos locais (`file://`), abra **Detalhes** da extensão e ative **Permitir acesso a URLs de arquivo**.

Funciona também no Microsoft Edge, Brave, Opera e outros navegadores baseados em Chromium (em `edge://extensions`, `brave://extensions` etc.).

## Como usar

| Ação | Como fazer |
|---|---|
| Ver o código da página atual | `Ctrl+U`, ícone da extensão ou `Alt+Shift+U` |
| Ver o código de qualquer URL | Digite `view-source:https://site.com` |
| Ver o código de um link | Botão direito no link → **Ver código-fonte do link** |
| Alternar quebra de linha | Botão **Quebrar linhas** ou `Alt+Z` |
| Destacar uma linha | Clique no número da linha |
| Voltar ao visualizador nativo | Desmarque **Substituir view-source:** |

O atalho `Alt+Shift+U` pode ser alterado em `chrome://extensions/shortcuts`.

## Como funciona

O Chrome não permite que extensões injetem scripts em páginas `view-source:`. Por isso, o Source View Pro observa as abas e, quando uma delas navega para `view-source:<url>`, redireciona para a página interna da extensão (`viewer.html`). Essa página baixa o HTML original com `fetch` (mantendo os cookies da sessão), aplica o destaque de sintaxe e renderiza o resultado em blocos, para não travar a aba em páginas muito grandes.

```
Ctrl+U / view-source:URL
          │
          ▼
  background.js  ──►  viewer.html?url=URL
                            │
                            ├─ fetch(URL)
                            ├─ highlight.js  (HTML → CSS → JS)
                            └─ renderização por linhas
```

## Estrutura do projeto

```
source-view-pro/
├── manifest.json      Configuração da extensão (Manifest V3)
├── background.js      Interceptação, ícone, atalho e menu de contexto
├── viewer.html        Página do visualizador
├── viewer.js          Carregamento, controles e preferências
├── viewer.css         Temas Dark+ / Light+ e fonte
├── highlight.js       Tokenizador de HTML, CSS e JavaScript
├── theme-boot.js      Aplica o tema antes da primeira pintura
├── fonts/             Source Code Pro (woff2) + licença OFL
├── icons/             Ícones 16, 32, 48 e 128 px
└── docs/images/       Capturas de tela desta documentação
```

## Personalização

Todas as cores ficam em variáveis CSS no início de `viewer.css`. Para mudar a cor das tags no tema escuro, por exemplo:

```css
:root[data-theme="dark"] {
  --t-tag: #569cd6;   /* altere aqui */
}
```

| Variável | Elemento |
|---|---|
| `--t-tag` | Nome da tag |
| `--t-attr` | Nome do atributo |
| `--t-value` | Valores e strings |
| `--t-comment` | Comentários |
| `--t-keyword` / `--t-control` | Palavras-chave JS / controle de fluxo e `@regras` |
| `--t-func` | Funções |
| `--t-selector` / `--t-prop` | Seletores e propriedades CSS |

Depois de editar, clique em **↻** no card da extensão em `chrome://extensions`.

## Privacidade

O Source View Pro não coleta, armazena nem envia dados. O código-fonte é baixado diretamente do site que você está visitando e processado localmente no navegador. As únicas informações salvas são as preferências de exibição (tema, fonte, quebra de linha), guardadas no `chrome.storage` da sua conta.

| Permissão | Por que é necessária |
|---|---|
| `tabs` | Detectar quando uma aba abre `view-source:` |
| `storage` | Salvar as preferências |
| `contextMenus` | Itens no menu do botão direito |
| `<all_urls>` | Baixar o código-fonte do site visitado |

## Roadmap

- [ ] Botão **Formatar** para indentar HTML minificado
- [ ] Busca com destaque de resultados
- [ ] Recolher/expandir blocos de tags
- [ ] Publicação na Chrome Web Store

## Desenvolvedor

**Douglas Rick** — [Criartweb](https://github.com/SEU-USUARIO)

Sugestões e problemas: abra uma [issue](../../issues).

## Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE).

A fonte **Source Code Pro** é © Adobe, distribuída sob a [SIL Open Font License 1.1](fonts/OFL.txt). As cores são inspiradas nos temas padrão do Visual Studio Code; este projeto não tem vínculo com a Microsoft.
