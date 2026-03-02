

## Plano: Descrição dos Produtos + Troca de Tema

### 1. Página de detalhes do produto (descrição)

Ao clicar em um produto (no `ProductCard`), o usuario sera levado a uma pagina de detalhes onde podera ver:
- Imagem grande do produto (com galeria se houver multiplas)
- Nome, categoria, avaliacao
- Preco (com preco original riscado se houver promo)
- Descricao completa do produto
- Botao "Comprar"

**Arquivos envolvidos:**
- Criar `src/pages/ProductDetailPage.tsx` -- pagina de detalhes
- Editar `src/App.tsx` -- adicionar rota `/products/:id`
- Editar `src/components/ProductCard.tsx` -- tornar o card clicavel com `useNavigate` para `/products/:id`

O hook `useProduct(id)` ja existe em `useProducts.ts` e retorna um produto mapeado.

### 2. Troca de tema (dark/light)

O projeto ja tem variaveis CSS para `.dark` definidas em `index.css` e usa `next-themes` como dependencia. Basta integrar o `ThemeProvider` e adicionar um botao de toggle.

**Arquivos envolvidos:**
- Criar `src/components/ThemeProvider.tsx` -- wrapper usando `next-themes`
- Editar `src/App.tsx` -- envolver a app com `ThemeProvider`
- Editar `src/pages/SettingsPage.tsx` -- adicionar toggle de tema (Sun/Moon) com `useTheme()`
- Editar `src/components/Navbar.tsx` -- adicionar botao de troca de tema rapido na navbar

### Detalhes Tecnicos

**ProductDetailPage:**
- Usa `useParams()` do react-router para pegar o `id`
- Usa `useProduct(id)` ja existente
- Layout responsivo com imagem a esquerda, info a direita
- Botao voltar para `/products`

**ThemeProvider:**
- Usa `ThemeProvider` do `next-themes` com `attribute="class"`, `defaultTheme="dark"`, `storageKey="dsg-theme"`
- Toggle usa `useTheme()` para alternar entre `light` e `dark`

**SettingsPage:**
- Secao "Aparencia" com botoes para selecionar Light/Dark/System

