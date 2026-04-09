# Login e Segurança: Módulo de Autenticação

Para garantir alto nível corporativo ao Business Intelligence, desenvolveremos uma tela rica de autenticação. Essa tela blindará o painel e os dados e passará uma forte impressão visual nos primeiros segundos de acesso.

## Proposed Changes

### Estrutura e Estado (`App.jsx`)
- **Gestão de Sessão**: Injeção da raiz local de estado `const [isAuthenticated, setIsAuthenticated] = useState(false);`. Assim que o site iniciar, o Dashboard inteiro ficará "preso" e oculto atrás do componente de login.
- **LogOut Funcional**: O botão "Sair" (LogOut) posicionado no rodapé da barra lateral passará a ser interativo, destituindo o state `isAuthenticated` para `false` e retornando imediatamente à área conectável.
- **View do Login**: Criação de um container com Glassmorphism (efeito vidro) no centro da tela. 
  - Usará o logo principal da Riosul como topo;
  - Campos Premium: `E-mail Corporativo` e `Senha`, blindados com visuais focais e ícones em linha (Lucide React Icons);
  - Um checklist falso de "Lembrar de mim" e um hiperlink "Esqueceu sua senha?".
  - Botão estendido e forte de "Autenticar Sistema" que ativa a renderização do painel global.

### Design e Estilização (`index.css`)
- **Arquitetura Flex/Grid de Login**: Definir uma class container (`.login-overlay`) que ocupe `100vw` e `100vh`, desenhando um fundo radial escurecido sobrepondo todo o DOM original.
- **Micro-interações**: Adicionar hover-effects no Form Input e animação *Fade-In* para que a entrada na tela não seja dura, combinando com o sistema de cascata dos KPIs já criado anteriormente.

## Estratégia de Mock
Nesta versão, a autenticação não validará contra bancos de dados reais. Servirá como um *Mockup Flow* impecável onde qualquer par de caracteres preenchidos garantirá a ativação do botão principal para testar toda a navegação e apresentação.

## Verificação
- [ ] Validar comportamento da página isolada sem carregar os dados raw do painel e causar memory leak antes do esperado (Lazy logic).
- [ ] Checar interatividade do botão "Sair".
- [ ] Confirmar compatibilidade visual na responsividade (Celulares visualizarem perfeitamente o Box de login ocupando a tela verticalmente).
